import { NextRequest, NextResponse } from 'next/server';
import { visionService } from '@/lib/vision';
import { supabase } from '@/app/supabase';

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
        vision_api_data: {
          confidence: extractedText.confidence,
          processing_time_ms: extractedText.processingTime,
          document_quality: extractedText.documentQuality,
          extraction_timestamp: new Date().toISOString()
        },
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      documentId: updatedDocument.id,
      extractedText: extractedText.fullText,
      metadata: {
        confidence: extractedText.confidence,
        documentQuality: extractedText.documentQuality,
        processingTime: extractedText.processingTime,
        totalTime
      }
    });

  } catch (error) {
    console.error('Text extraction API error:', error);
    
    // Update document status to failed
    if (request.json) {
      const { documentId } = await request.json();
      if (documentId) {
        await supabase
          .from('documents')
          .update({
            processing_status: 'failed',
            processed_at: new Date().toISOString()
          })
          .eq('id', documentId);
      }
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
