'use client';
import { useState } from 'react';

interface FileUploadProps {
  onUploadComplete?: (result: any) => void;
}

interface UploadedDocument {
  file: File;
  documentType: string;
  result?: any;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

const DOCUMENT_TYPES = [
  { value: 'pay_stub', label: 'Pay Stub', required: true },
  { value: 'bank_statement', label: 'Bank Statement', required: true },
  { value: 'tax_return', label: 'Tax Return', required: true },
  { value: 'credit_report', label: 'Credit Report', required: false },
  { value: 'employment_verification', label: 'Employment Verification', required: false },
  { value: 'asset_statement', label: 'Asset Statement', required: false },
];

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const addDocument = (file: File, documentType: string) => {
    // Check if this document type already exists
    const existingIndex = documents.findIndex(doc => doc.documentType === documentType);
    
    const newDocument: UploadedDocument = {
      file,
      documentType,
      status: 'pending'
    };

    if (existingIndex >= 0) {
      // Replace existing document
      const updatedDocs = [...documents];
      updatedDocs[existingIndex] = newDocument;
      setDocuments(updatedDocs);
    } else {
      // Add new document
      setDocuments(prev => [...prev, newDocument]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const processAllDocuments = async () => {
    if (documents.length === 0) return;

    setIsProcessing(true);
    setShowResults(false);
    
    const updatedDocuments = [...documents];
    const extractedData: any[] = [];

    // Process each document
    for (let i = 0; i < updatedDocuments.length; i++) {
      const doc = updatedDocuments[i];
      
      // Update status to processing
      updatedDocuments[i] = { ...doc, status: 'processing' };
      setDocuments([...updatedDocuments]);

      try {
        const formData = new FormData();
        formData.append('file', doc.file);
        formData.append('documentType', doc.documentType);

        const response = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          updatedDocuments[i] = { ...doc, status: 'completed', result };
          extractedData.push({
            documentType: doc.documentType,
            fileName: doc.file.name,
            ...result
          });
        } else {
          updatedDocuments[i] = { ...doc, status: 'error', error: result.error };
        }
      } catch (error) {
        updatedDocuments[i] = { ...doc, status: 'error', error: error.message };
      }

      setDocuments([...updatedDocuments]);
    }

    // Perform comprehensive analysis
    const comprehensiveAnalysis = await performComprehensiveAnalysis(extractedData);
    setFinalAnalysis(comprehensiveAnalysis);
    setShowResults(true);
    setIsProcessing(false);
    
    onUploadComplete?.(comprehensiveAnalysis);
  };

  const performComprehensiveAnalysis = async (extractedData: any[]) => {
    // Combine all loan data from different documents
    const combinedLoanData = {
      borrower_info: {},
      employment: {},
      income: {},
      assets: {},
      debts: {},
      credit_info: {},
      loan_details: {},
      documents_analyzed: extractedData.length,
      document_types: extractedData.map(d => d.documentType)
    };

    let totalConfidence = 0;
    let totalProcessingTime = 0;
    const allRiskFlags: string[] = [];

    // Merge data from all documents
    extractedData.forEach(docData => {
      if (docData.loanData) {
        // Merge each section, prioritizing non-null values
        Object.keys(combinedLoanData).forEach(section => {
          if (docData.loanData[section] && typeof docData.loanData[section] === 'object') {
            combinedLoanData[section] = {
              ...combinedLoanData[section],
              ...docData.loanData[section]
            };
          }
        });

        if (docData.loanData.risk_flags) {
          allRiskFlags.push(...docData.loanData.risk_flags);
        }
      }

      totalConfidence += docData.extractedText?.confidence || 0;
      totalProcessingTime += docData.extractedText?.processingTime || 0;
    });

    // Calculate comprehensive risk assessment
    const comprehensiveRisk = calculateComprehensiveRisk(combinedLoanData, allRiskFlags);

    // Cross-validate data between documents
    const dataValidation = crossValidateDocuments(extractedData);

    return {
      decision: comprehensiveRisk.overall_risk_score >= 70 ? 'APPROVED' : 
                comprehensiveRisk.overall_risk_score >= 50 ? 'CONDITIONAL_APPROVAL' : 'DECLINED',
      combinedLoanData,
      comprehensiveRisk,
      dataValidation,
      processingStats: {
        documentsProcessed: extractedData.length,
        averageConfidence: totalConfidence / extractedData.length,
        totalProcessingTime,
        completedAt: new Date().toISOString()
      },
      individualDocuments: extractedData
    };
  };

  const calculateComprehensiveRisk = (loanData: any, riskFlags: string[]) => {
    let riskScore = 100;
    const riskFactors: any[] = [];

    // DTI Analysis (more comprehensive with multiple income sources)
    if (loanData.income?.total_monthly_income && loanData.debts?.total_monthly_debts) {
      const dtiRatio = (loanData.debts.total_monthly_debts / loanData.income.total_monthly_income) * 100;
      
      if (dtiRatio > 50) {
        riskScore -= 40;
        riskFactors.push({
          category: 'Income',
          factor: `Very high DTI ratio: ${dtiRatio.toFixed(1)}%`,
          impact: 'high',
          points_deducted: 40
        });
      } else if (dtiRatio > 43) {
        riskScore -= 25;
        riskFactors.push({
          category: 'Income',
          factor: `High DTI ratio: ${dtiRatio.toFixed(1)}%`,
          impact: 'high',
          points_deducted: 25
        });
      }
    }

    // Income consistency check across documents
    const payStubIncome = loanData.income?.base_monthly_income;
    const taxReturnIncome = loanData.income?.annual_income ? loanData.income.annual_income / 12 : null;
    
    if (payStubIncome && taxReturnIncome) {
      const incomeDifference = Math.abs(payStubIncome - taxReturnIncome) / payStubIncome;
      if (incomeDifference > 0.15) { // More than 15% difference
        riskScore -= 20;
        riskFactors.push({
          category: 'Income Verification',
          factor: `Income inconsistency between documents: ${(incomeDifference * 100).toFixed(1)}%`,
          impact: 'high',
          points_deducted: 20
        });
      }
    }

    // Asset verification
    if (loanData.assets?.total_liquid_assets < 10000) {
      riskScore -= 15;
      riskFactors.push({
        category: 'Assets',
        factor: 'Low liquid asset reserves',
        impact: 'medium',
        points_deducted: 15
      });
    }

    // Employment stability
    if (loanData.employment?.employment_length) {
      const empLength = loanData.employment.employment_length.toLowerCase();
      if (empLength.includes('month') && !empLength.includes('year')) {
        riskScore -= 15;
        riskFactors.push({
          category: 'Employment',
          factor: `Short employment history: ${loanData.employment.employment_length}`,
          impact: 'medium',
          points_deducted: 15
        });
      }
    }

    // Credit score analysis
    if (loanData.credit_info?.credit_score) {
      const creditScore = loanData.credit_info.credit_score;
      if (creditScore < 620) {
        riskScore -= 30;
        riskFactors.push({
          category: 'Credit',
          factor: `Low credit score: ${creditScore}`,
          impact: 'high',
          points_deducted: 30
        });
      } else if (creditScore < 680) {
        riskScore -= 15;
        riskFactors.push({
          category: 'Credit',
          factor: `Fair credit score: ${creditScore}`,
          impact: 'medium',
          points_deducted: 15
        });
      }
    }

    const finalScore = Math.max(0, Math.min(100, riskScore));
    
    let riskLevel: string;
    if (finalScore >= 85) riskLevel = 'EXCELLENT';
    else if (finalScore >= 70) riskLevel = 'GOOD';
    else if (finalScore >= 60) riskLevel = 'FAIR';
    else if (finalScore >= 50) riskLevel = 'POOR';
    else riskLevel = 'HIGH_RISK';

    return {
      overall_risk_score: finalScore,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      approval_likelihood: finalScore >= 80 ? 95 : finalScore >= 70 ? 80 : finalScore >= 60 ? 60 : 30,
      dti_ratio: loanData.income?.total_monthly_income && loanData.debts?.total_monthly_debts
        ? (loanData.debts.total_monthly_debts / loanData.income.total_monthly_income) * 100
        : null
    };
  };

  const crossValidateDocuments = (extractedData: any[]) => {
    const validationResults = {
      consistencyScore: 100,
      inconsistencies: [],
      missingDocuments: [],
      dataQuality: 'excellent'
    };

    // Check for required documents
    const requiredTypes = DOCUMENT_TYPES.filter(dt => dt.required).map(dt => dt.value);
    const providedTypes = extractedData.map(d => d.documentType);
    
    requiredTypes.forEach(reqType => {
      if (!providedTypes.includes(reqType)) {
        validationResults.missingDocuments.push(reqType);
        validationResults.consistencyScore -= 20;
      }
    });

    // Cross-validate names across documents
    const names = extractedData
      .map(d => d.loanData?.borrower_info?.primary_name)
      .filter(Boolean);
    
    if (names.length > 1) {
      const uniqueNames = [...new Set(names)];
      if (uniqueNames.length > 1) {
        validationResults.inconsistencies.push('Name inconsistency across documents');
        validationResults.consistencyScore -= 15;
      }
    }

    // Determine overall data quality
    if (validationResults.consistencyScore >= 90) validationResults.dataQuality = 'excellent';
    else if (validationResults.consistencyScore >= 80) validationResults.dataQuality = 'good';
    else if (validationResults.consistencyScore >= 70) validationResults.dataQuality = 'fair';
    else validationResults.dataQuality = 'poor';

    return validationResults;
  };

  const getRequiredDocuments = () => {
    return DOCUMENT_TYPES.filter(dt => dt.required);
  };

  const getUploadedRequiredCount = () => {
    const requiredTypes = getRequiredDocuments().map(dt => dt.value);
    return documents.filter(doc => requiredTypes.includes(doc.documentType)).length;
  };

  const canProcess = () => {
    const requiredCount = getRequiredDocuments().length;
    const uploadedRequiredCount = getUploadedRequiredCount();
    return uploadedRequiredCount >= requiredCount && !isProcessing;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Complete Loan Application Analysis</h3>
      
      {/* Document Upload Section */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DOCUMENT_TYPES.map((docType) => {
            const existingDoc = documents.find(doc => doc.documentType === docType.value);
            
            return (
              <div key={docType.value} className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {docType.label}
                    {docType.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {existingDoc && (
                    <div className="flex items-center space-x-2">
                      {existingDoc.status === 'completed' && (
                        <span className="text-green-600 text-sm">✓</span>
                      )}
                      {existingDoc.status === 'processing' && (
                        <span className="text-blue-600 text-sm">⏳</span>
                      )}
                      {existingDoc.status === 'error' && (
                        <span className="text-red-600 text-sm">✗</span>
                      )}
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      addDocument(file, docType.value);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                {existingDoc && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate">
                        {existingDoc.file.name}
                      </span>
                      <button
                        onClick={() => removeDocument(documents.indexOf(existingDoc))}
                        className="text-red-500 hover:text-red-700 text-sm"
                        disabled={isProcessing}
                      >
                        Remove
                      </button>
                    </div>
                    
                    {existingDoc.status === 'error' && (
                      <p className="text-red-600 text-xs mt-1">{existingDoc.error}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Documents Uploaded: {documents.length} 
              (Required: {getUploadedRequiredCount()}/{getRequiredDocuments().length})
            </span>
            <span className="text-sm text-gray-500">
              {documents.filter(d => d.status === 'completed').length} processed
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(getUploadedRequiredCount() / getRequiredDocuments().length) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Process Button */}
        <button
          onClick={processAllDocuments}
          disabled={!canProcess()}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing 
            ? `Processing Documents... (${documents.filter(d => d.status === 'completed').length}/${documents.length})` 
            : `Analyze Complete Loan Application (${documents.length} documents)`
          }
        </button>
      </div>

      {/* Results Section */}
      {showResults && finalAnalysis && (
        <div className="mt-8 space-y-6">
          {/* Final Decision */}
          <div className={`p-6 rounded-lg border-2 ${
            finalAnalysis.decision === 'APPROVED' 
              ? 'bg-green-50 border-green-200' 
              : finalAnalysis.decision === 'CONDITIONAL_APPROVAL'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <h4 className={`text-2xl font-bold mb-2 ${
              finalAnalysis.decision === 'APPROVED' 
                ? 'text-green-800' 
                : finalAnalysis.decision === 'CONDITIONAL_APPROVAL'
                ? 'text-yellow-800'
                : 'text-red-800'
            }`}>
              LOAN DECISION: {finalAnalysis.decision.replace('_', ' ')}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {finalAnalysis.comprehensiveRisk.overall_risk_score}/100
                </div>
                <div className="text-sm text-gray-600">Risk Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {finalAnalysis.comprehensiveRisk.approval_likelihood}%
                </div>
                <div className="text-sm text-gray-600">Approval Likelihood</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {finalAnalysis.processingStats.documentsProcessed}
                </div>
                <div className="text-sm text-gray-600">Documents Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {(finalAnalysis.processingStats.totalProcessingTime / 1000).toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">Total Processing Time</div>
              </div>
            </div>
          </div>

          {/* Key Findings */}
          <div className="bg-white border rounded-lg p-6">
            <h5 className="text-lg font-semibold text-gray-900 mb-4">Key Findings</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h6 className="font-medium text-gray-700 mb-2">Income Analysis</h6>
                <p className="text-sm text-gray-600">
                  Monthly Income: ${finalAnalysis.combinedLoanData.income?.total_monthly_income?.toLocaleString() || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  DTI Ratio: {finalAnalysis.comprehensiveRisk.dti_ratio?.toFixed(1) || 'N/A'}%
                </p>
              </div>
              <div>
                <h6 className="font-medium text-gray-700 mb-2">Assets & Employment</h6>
                <p className="text-sm text-gray-600">
                  Liquid Assets: ${finalAnalysis.combinedLoanData.assets?.total_liquid_assets?.toLocaleString() || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  Employment: {finalAnalysis.combinedLoanData.employment?.employment_length || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          {finalAnalysis.comprehensiveRisk.risk_factors.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors</h5>
              <div className="space-y-2">
                {finalAnalysis.comprehensiveRisk.risk_factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-gray-700">{factor.factor}</span>
                      <span className="text-sm text-gray-500 ml-2">({factor.category})</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      factor.impact === 'high' ? 'bg-red-100 text-red-800' :
                      factor.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      -{factor.points_deducted} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Validation */}
          <div className="bg-white border rounded-lg p-6">
            <h5 className="text-lg font-semibold text-gray-900 mb-4">Data Validation</h5>
            <div className="flex items-center justify-between">
              <span>Consistency Score: {finalAnalysis.dataValidation.consistencyScore}/100</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                finalAnalysis.dataValidation.dataQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                finalAnalysis.dataValidation.dataQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                finalAnalysis.dataValidation.dataQuality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {finalAnalysis.dataValidation.dataQuality}
              </span>
            </div>
            
            {finalAnalysis.dataValidation.inconsistencies.length > 0 && (
              <div className="mt-4">
                <h6 className="font-medium text-gray-700 mb-2">Inconsistencies Found:</h6>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {finalAnalysis.dataValidation.inconsistencies.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
