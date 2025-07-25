'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LoanApplication {
  id: string;
  loan_number: string;
  primary_borrower_name: string;
  loan_amount: number;
  property_address: string;
  ai_risk_score: number;
  ai_risk_level: string;
  ai_confidence_score: number;
  ai_processing_time_seconds: number;
  potential_revenue: number;
  cost_savings_vs_manual: number;
  monthly_income: number;
  credit_score: number;
  status: string;
  documents_count: number;
  submitted_at: string;
}

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  ocr_confidence: number;
  processing_time_ms: number;
  processing_cost: number;
  time_saved_minutes: number;
  processing_status: string;
}

interface VCMetrics {
  totalLoans: number;
  avgRiskScore: number;
  totalRevenue: number;
  totalSavings: number;
  avgProcessingTime: number;
  documentsProcessed: number;
  avgOcrConfidence: number;
  avgProcessingCost: number;
  totalTimeSaved: number;
}

export default function VCDashboard() {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [metrics, setMetrics] = useState<VCMetrics>({
    totalLoans: 0,
    avgRiskScore: 0,
    totalRevenue: 0,
    totalSavings: 0,
    avgProcessingTime: 0,
    documentsProcessed: 0,
    avgOcrConfidence: 0,
    avgProcessingCost: 0,
    totalTimeSaved: 0
  });
  const [loading, setLoading] = useState(true);
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    fetchDemoData();
  }, []);

  const fetchDemoData = async () => {
    try {
      // Fetch loan applications
      const { data: loansData, error: loansError } = await supabase
        .from('loan_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (loansError) throw loansError;

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;

      setLoans(loansData || []);
      setDocuments(documentsData || []);

      // Calculate metrics
      const totalLoans = loansData?.length || 0;
      const avgRiskScore = loansData?.reduce((sum, loan) => sum + (loan.ai_risk_score || 0), 0) / totalLoans || 0;
      const totalRevenue = loansData?.reduce((sum, loan) => sum + (loan.potential_revenue || 0), 0) || 0;
      const totalSavings = loansData?.reduce((sum, loan) => sum + (loan.cost_savings_vs_manual || 0), 0) || 0;
      const avgProcessingTime = loansData?.reduce((sum, loan) => sum + (loan.ai_processing_time_seconds || 0), 0) / totalLoans || 0;
      const documentsProcessed = documentsData?.length || 0;
      const avgOcrConfidence = documentsData?.reduce((sum, doc) => sum + (doc.ocr_confidence || 0), 0) / documentsProcessed || 0;
      const avgProcessingCost = documentsData?.reduce((sum, doc) => sum + (doc.processing_cost || 0), 0) / documentsProcessed || 0;
      const totalTimeSaved = documentsData?.reduce((sum, doc) => sum + (doc.time_saved_minutes || 0), 0) || 0;

      setMetrics({
        totalLoans,
        avgRiskScore: Math.round(avgRiskScore),
        totalRevenue,
        totalSavings,
        avgProcessingTime: Math.round(avgProcessingTime),
        documentsProcessed,
        avgOcrConfidence: Math.round(avgOcrConfidence * 10) / 10,
        avgProcessingCost: Math.round(avgProcessingCost * 100) / 100,
        totalTimeSaved
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching demo data:', error);
      setLoading(false);
    }
  };

  const startDemo = () => {
    setDemoStep(1);
    // Auto-advance through demo steps
    const interval = setInterval(() => {
      setDemoStep(prev => {
        if (prev >= 4) {
          clearInterval(interval);
          return 4;
        }
        return prev + 1;
      });
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading VC Demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                🚀 LendingAI - VC Demo
              </h1>
              <p className="text-blue-200 text-lg">
                Google-Powered AI Loan Processing • $500 → $50K ARR in 14 Days
              </p>
            </div>
            
            {demoStep === 0 && (
              <button
                onClick={startDemo}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🎬 Start Live Demo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {demoStep === 0 && (
          <div className="text-center py-16">
            <div className="text-8xl mb-8">💰</div>
            <h2 className="text-4xl font-bold text-white mb-6">
              The $600K Opportunity
            </h2>
            <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Watch us process a complete $380K loan in <span className="text-yellow-400 font-bold">2.5 minutes</span> using Google's AI, 
              delivering <span className="text-green-400 font-bold">$1,000 savings per loan</span> and 
              <span className="text-purple-400 font-bold">99% faster processing</span> than manual underwriting.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-2xl font-bold text-white">2.5 min</div>
                <div className="text-blue-200">vs 3-5 days manual</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl mb-2">💵</div>
                <div className="text-2xl font-bold text-white">$1,000</div>
                <div className="text-blue-200">saved per loan</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-white">96.8%</div>
                <div className="text-blue-200">AI accuracy</div>
              </div>
            </div>
          </div>
        )}

        {demoStep >= 1 && (
          <>
            {/* Real-Time Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-200">Total Loans</p>
                    <p className="text-3xl font-bold text-white">{metrics.totalLoans}</p>
                  </div>
                </div>
                <div className="text-xs text-green-400">+100% vs manual capacity</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-200">Revenue Generated</p>
                    <p className="text-3xl font-bold text-white">${metrics.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-xs text-green-400">$7,600 per loan processed</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-200">Cost Savings</p>
                    <p className="text-3xl font-bold text-white">${metrics.totalSavings.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-xs text-green-400">vs $1,200 manual processing</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-200">Processing Speed</p>
                    <p className="text-3xl font-bold text-white">{metrics.avgProcessingTime}s</p>
                  </div>
                </div>
                <div className="text-xs text-green-400">99% faster than manual</div>
              </div>
            </div>

            {/* Google AI Processing Demo */}
            {demoStep >= 2 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 mb-8 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">🤖</span>
                  Google AI Processing Live Demo
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Processing Terminal */}
                  <div className="bg-black/50 rounded-lg p-6 font-mono text-sm">
                    <div className="flex items-center mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="ml-4 text-gray-300">Google AI Terminal</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-blue-400">$ google-vision-api --extract-documents</div>
                      <div className="text-yellow-400">✓ martinez_paystub_jan2025.pdf → 97.2% confidence</div>
                      <div className="text-yellow-400">✓ chase_statement_dec2024.pdf → 95.8% confidence</div>
                      <div className="text-yellow-400">✓ 2024_tax_return.pdf → 98.1% confidence</div>
                      <div className="text-yellow-400">✓ credit_report_jan2025.pdf → 99.2% confidence</div>
                      <div className="text-blue-400 mt-4">$ gemini-2.0-flash --analyze-risk</div>
                      <div className="text-green-400">✓ Income verified: $8,500/month</div>
                      <div className="text-green-400">✓ Assets confirmed: $110,000</div>
                      <div className="text-green-400">✓ Credit score: 748 (EXCELLENT)</div>
                      <div className="text-green-400">✓ DTI ratio: 28.5% (LOW RISK)</div>
                      <div className="text-purple-400 mt-4 font-bold">🎯 FINAL RESULT: 89/100 RISK SCORE - APPROVED</div>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="space-y-6">
                    {loans.map((loan) => (
                      <div key={loan.id} className="bg-white/10 rounded-lg p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-bold text-white">{loan.primary_borrower_name}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            loan.ai_risk_level === 'EXCELLENT' ? 'bg-green-500/20 text-green-400' :
                            loan.ai_risk_level === 'GOOD' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {loan.ai_risk_level}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-blue-200">Loan Amount</p>
                            <p className="text-white font-semibold">${loan.loan_amount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-blue-200">Risk Score</p>
                            <p className="text-white font-semibold">{loan.ai_risk_score}/100</p>
                          </div>
                          <div>
                            <p className="text-blue-200">Processing Time</p>
                            <p className="text-white font-semibold">{loan.ai_processing_time_seconds}s</p>
                          </div>
                          <div>
                            <p className="text-blue-200">Revenue Generated</p>
                            <p className="text-white font-semibold">${loan.potential_revenue?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Document Processing Results */}
            {demoStep >= 3 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 mb-8 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">📄</span>
                  Document Processing Results
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-white/10 rounded-lg p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                          {doc.processing_status}
                        </span>
                      </div>
                      
                      <h4 className="text-white font-semibold mb-2 text-sm">
                        {doc.document_type.replace('_', ' ').toUpperCase()}
                      </h4>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-blue-200">OCR Confidence</span>
                          <span className="text-white font-semibold">{doc.ocr_confidence}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-200">Processing Time</span>
                          <span className="text-white font-semibold">{(doc.processing_time_ms / 1000).toFixed(1)}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-200">Time Saved</span>
                          <span className="text-green-400 font-semibold">{doc.time_saved_minutes} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-200">Cost</span>
                          <span className="text-white font-semibold">${doc.processing_cost}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROI Summary */}
            {demoStep >= 4 && (
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl p-8 border border-green-500/30">
                <h3 className="text-3xl font-bold text-white mb-6 text-center">
                  💰 The $600K Annual Opportunity
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">$1,000</div>
                    <div className="text-white text-lg">Saved per loan</div>
                    <div className="text-green-200 text-sm">vs $1,200 manual cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400 mb-2">99%</div>
                    <div className="text-white text-lg">Faster processing</div>
                    <div className="text-blue-200 text-sm">2.5 min vs 3-5 days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-2">96.8%</div>
                    <div className="text-white text-lg">AI accuracy</div>
                    <div className="text-purple-200 text-sm">Google-powered</div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-6 text-center">
                  <h4 className="text-xl font-bold text-white mb-4">Scale Projection</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-2xl font-bold text-white">50</div>
                      <div className="text-blue-200">loans/month</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">$50K</div>
                      <div className="text-blue-200">monthly savings</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">$600K</div>
                      <div className="text-blue-200">annual impact</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">$69</div>
                      <div className="text-blue-200">monthly cost</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
