import { NextRequest, NextResponse } from 'next/server';
import { visionService } from '@/lib/vision';
import { geminiService } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  console.log('🚀 Extract text API called');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string || 'unknown';

    if (!file) {
      console.error('❌ No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`📄 Processing file: ${file.name} (${file.size} bytes, type: ${file.type})`);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (buffer.length > maxSize) {
      console.error(`❌ File too large: ${buffer.length} bytes (max: ${maxSize})`);
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Extract text using enterprise vision service
    console.log('🔍 Starting text extraction...');
    const extractedText = await visionService.extractTextFromBuffer(buffer, file.name);
    
    console.log(`✅ Text extraction completed: ${extractedText.fullText.length} characters extracted using ${extractedText.processingMethod}`);

    // Log warnings if any
    if (extractedText.warnings && extractedText.warnings.length > 0) {
      console.warn('⚠️ Extraction warnings:', extractedText.warnings);
    }

    // Process with Gemini for loan data extraction
    console.log('🤖 Starting AI loan data extraction...');
    const loanData = await geminiService.extractLoanData(
      extractedText.fullText,
      documentType,
      file.name
    );

    console.log('✅ AI extraction completed successfully');

    // Calculate risk assessment
    console.log('📊 Calculating risk assessment...');
    const riskAssessment = geminiService.calculateRiskScore(loanData);

    // Prepare comprehensive response
    const response = {
      success: true,
      extractedText: {
        content: extractedText.fullText,
        pages: extractedText.pages,
        confidence: Math.round(extractedText.confidence * 100) / 100,
        processingTime: extractedText.processingTime,
        documentQuality: extractedText.documentQuality,
        processingMethod: extractedText.processingMethod,
        detectedLanguages: extractedText.detectedLanguages,
        warnings: extractedText.warnings || []
      },
      loanData,
      riskAssessment,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        documentType,
        processedAt: new Date().toISOString(),
        ...extractedText.metadata
      }
    };

    console.log(`🎯 API processing completed successfully in ${extractedText.processingTime}ms`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API Error:', error);
    
    // Determine error type and provide appropriate response
    let statusCode = 500;
    let errorMessage = 'Internal server error during document processing';
    
    if (error.message.includes('File too large')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('Unsupported file type')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('No text detected')) {
      statusCode = 422;
      errorMessage = 'No readable text found in the document. Please ensure the document contains text and is not corrupted.';
    } else if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Document processing timed out. Please try with a smaller file or contact support.';
    } else if (error.message.includes('API key') || error.message.includes('authentication')) {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable. Please try again later.';
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  console.log('🏥 Health check API called');
  
  try {
    const healthStatus = await visionService.getDetailedHealthStatus();
    const capabilities = await visionService.getProcessingCapabilities();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: healthStatus,
      capabilities,
      version: '2.0.0-enterprise'
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
