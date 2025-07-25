import { NextRequest, NextResponse } from 'next/server';
import { supabaseStorageService } from '@/lib/supabase-storage';
import { supabase } from '@/app/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const loanId = formData.get('loanId') as string;
    const documentType = formData.get('documentType') as string;
    const userId = formData.get('userId') as string;

    if (!file || !loanId || !documentType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, loanId, documentType, userId' },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const uploadResult = await supabaseStorageService.uploadDocument(
      file,
      loanId,
      documentType
    );

    // Save document record to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        loan_application_id: loanId,
        document_type: documentType,
        file_name: file.name,
        file_path: uploadResult.fileName,
        file_size: file.size,
        mime_type: file.type,
        processing_status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save document record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: file.name,
        fileSize: file.size,
        uploadTime: uploadResult.uploadTime,
        publicUrl: uploadResult.publicUrl
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', message: error.message },
      { status: 500 }
    );
  }
}
// src/app/api/upload/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { supabaseStorageService } from '@/lib/supabase-storage';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const loanId = formData.get('loanId') as string;
    const documentType = formData.get('documentType') as string;
    const userId = formData.get('userId') as string;

    if (!file || !loanId || !documentType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, loanId, documentType, userId' },
        { status: 400 }
      );
    }

    console.log('Starting file upload:', {
      fileName: file.name,
      fileSize: file.size,
      documentType,
      loanId
    });

    // Upload to Supabase Storage
    const uploadResult = await supabaseStorageService.uploadDocument(
      file,
      loanId,
      documentType
    );

    // Save document record to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        loan_application_id: loanId,
        document_type: documentType as any,
        file_name: file.name,
        file_path: uploadResult.fileName,
        file_size: file.size,
        mime_type: file.type,
        processing_status: 'pending',
        processing_cost: 0.15,
        time_saved_minutes: 180,
        uploaded_by: userId
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save document record', details: dbError.message },
        { status: 500 }
      );
    }

    const totalTime = Date.now() - startTime;

    console.log(`Upload completed in ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: file.name,
        fileSize: file.size,
        uploadTime: uploadResult.uploadTime,
        publicUrl: uploadResult.publicUrl,
        documentType
      },
      uploadTime: totalTime
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        message: error.message,
        uploadTime: Date.now() - startTime 
      },
      { status: 500 }
    );
  }
}