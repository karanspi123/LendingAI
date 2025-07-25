// src/app/api/extract-text/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { visionService } from '@/lib/vision';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { documentId, fileUrl } = await request.json();
    
    if (!documentId || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId, fileUrl' },
        { status: 400 }
      );
    }

    console.log('Starting text extraction for document:', documentId);

    // Fetch the file from Supabase Storage
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch file from storage');
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Extract text using Google Vision API
    const extractedText = await visionService.extractTextFromBuffer(
      fileBuffer, 
      `document-${documentId}`
    );
    
    // Update document record with extraction results
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_text: extractedText.fullText,
        vision_api_response: {
          confidence: extractedText.confidence,
          processing_time_ms: extractedText.processingTime,
          document_quality: extractedText.documentQuality,
          pages: extractedText.pages,
          detected_languages: extractedText.detectedLanguages,
          extraction_timestamp: new Date().toISOString()
        },
        ocr_confidence: extractedText.confidence,
        processing_status: 'completed',
        processing_time_ms: extractedText.processingTime,
        text_quality_score: extractedText.confidence,
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    const totalTime = Date.now() - startTime;

    console.log(`Text extraction completed in ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      documentId: updatedDocument.id,
      extractedText: extractedText.fullText,
      metadata: {
        confidence: extractedText.confidence,
        pages: extractedText.pages,
        documentQuality: extractedText.documentQuality,
        processingTime: extractedText.processingTime,
        totalTime
      }
    });

  } catch (error) {
    console.error('Text extraction API error:', error);
    
    // Update document status to failed if we have the documentId
    try {
      const body = await request.json();
      if (body.documentId) {
        await supabase
          .from('documents')
          .update({
            processing_status: 'failed',
            error_message: error.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', body.documentId);
      }
    } catch (jsonError) {
      // Request body already consumed, ignore
    }
    
    return NextResponse.json(
      { 
        error: 'Text extraction failed',
        message: error.message,
        processingTime: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}