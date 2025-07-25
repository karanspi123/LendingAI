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
