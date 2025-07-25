// src/app/api/process-document/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { visionService } from '@/lib/vision';
import { geminiService } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { fileId, gcsUri, fileName, loanId } = await request.json();
    
    if (!gcsUri || !fileName || !loanId) {
      return NextResponse.json(
        { error: 'Missing required fields: gcsUri, fileName, loanId' },
        { status: 400 }
      );
    }

    // Step 1: Extract text with Google Vision
    console.log('Starting Vision API extraction for:', fileName);
    const extractedText = await visionService.extractTextFromGCS(gcsUri);
    
    // Step 2: Classify document type
    const documentType = classifyDocument(fileName, extractedText.fullText);
    
    // Step 3: Process with Gemini AI
    console.log('Starting Gemini AI analysis for document type:', documentType);
    const loanData = await geminiService.extractLoanData(
      extractedText.fullText,
      documentType,
      fileName
    );
    
    // Step 4: Calculate risk assessment
    const riskAssessment = geminiService.calculateRiskScore(loanData);
    
    // Step 5: Update document in database
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_text: extractedText.fullText,
        ocr_confidence: extractedText.confidence,
        processing_status: 'completed',
        processing_time_ms: extractedText.processingTime,
        vision_api_response: {
          confidence: extractedText.confidence,
          pages: extractedText.pages,
          document_quality: extractedText.documentQuality,
          processing_time_ms: extractedText.processingTime
        },
        gemini_analysis: {
          loan_data: loanData,
          risk_assessment: riskAssessment,
          processing_time_ms: Date.now() - startTime
        },
        text_quality_score: extractedText.confidence,
        data_completeness_score: calculateCompletenessScore(loanData),
        processed_at: new Date().toISOString()
      })
      .eq('file_name', fileName)
      .eq('loan_application_id', loanId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    // Step 6: Update loan application with aggregated data
    await updateLoanApplication(loanId, loanData, riskAssessment);

    const totalTime = Date.now() - startTime;

    console.log(`Document processing completed in ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      processing_time: `${(totalTime / 1000).toFixed(2)} seconds`,
      loan_data: loanData,
      risk_assessment: riskAssessment,
      ocr_confidence: extractedText.confidence,
      document_quality: extractedText.documentQuality
    });

  } catch (error) {
    console.error('Document processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Processing failed',
        message: error.message,
        processing_time: `${((Date.now() - startTime) / 1000).toFixed(2)} seconds`
      },
      { status: 500 }
    );
  }
}

function classifyDocument(fileName: string, text: string): string {
  const nameLower = fileName.toLowerCase();
  const textLower = text.toLowerCase();
  
  if (nameLower.includes('paystub') || nameLower.includes('pay_stub') || textLower.includes('pay period')) return 'pay_stub';
  if (nameLower.includes('bank') || textLower.includes('account balance') || textLower.includes('statement')) return 'bank_statement';
  if (nameLower.includes('tax') || textLower.includes('1040') || textLower.includes('form 1040')) return 'tax_return';
  if (nameLower.includes('credit') || textLower.includes('credit score') || textLower.includes('fico')) return 'credit_report';
  if (nameLower.includes('employment') || textLower.includes('employment verification')) return 'employment_letter';
  
  return 'other';
}

function calculateCompletenessScore(loanData: any): number {
  const requiredFields = [
    'borrower_info.primary_name',
    'employment.employer_name',
    'income.total_monthly_income',
    'assets.total_liquid_assets',
    'debts.total_monthly_debts'
  ];
  
  let completedFields = 0;
  
  requiredFields.forEach(field => {
    const fieldParts = field.split('.');
    let value = loanData;
    
    for (const part of fieldParts) {
      value = value?.[part];
    }
    
    if (value !== null && value !== undefined) {
      completedFields++;
    }
  });
  
  return (completedFields / requiredFields.length) * 100;
}

async function updateLoanApplication(loanId: string, loanData: any, riskAssessment: any) {
  try {
    // Get current loan data
    const { data: currentLoan } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('id', loanId)
      .single();

    if (!currentLoan) return;

    // Update loan with new data
    const updateData = {
      ai_risk_score: riskAssessment.overall_risk_score,
      ai_risk_level: riskAssessment.risk_level,
      ai_confidence_score: loanData.data_quality?.confidence_score || 95,
      ai_processing_time_seconds: Math.round((Date.now() - new Date(currentLoan.created_at).getTime()) / 1000),
      debt_to_income_ratio: riskAssessment.dti_ratio,
      monthly_income: loanData.income?.total_monthly_income,
      monthly_debts: loanData.debts?.total_monthly_debts,
      liquid_assets: loanData.assets?.total_liquid_assets,
      credit_score: loanData.credit_info?.credit_score,
      status: 'review',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('loan_applications')
      .update(updateData)
      .eq('id', loanId);

    if (error) {
      console.error('Error updating loan application:', error);
    }

  } catch (error) {
    console.error('Error updating loan application:', error);
  }
}