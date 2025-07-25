'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { storageService } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error';
  progress: number;
  gcsUri?: string;
  publicUrl?: string;
  error?: string;
  uploadTime?: number;
}

export default function DocumentUpload({ loanId, userId }: { loanId: string; userId: string }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      alert(`${rejectedFiles.length} file(s) rejected. Check file type and size limits.`);
    }

    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 25 * 1024 * 1024, // 25MB limit
    multiple: true,
    maxFiles: 20
  });

  const classifyDocument = (fileName: string): string => {
    const nameLower = fileName.toLowerCase();
    
    if (nameLower.includes('paystub') || nameLower.includes('pay_stub')) return 'pay_stub';
    if (nameLower.includes('bank') || nameLower.includes('statement')) return 'bank_statement';
    if (nameLower.includes('tax') || nameLower.includes('1040')) return 'tax_return';
    if (nameLower.includes('credit') || nameLower.includes('fico')) return 'credit_report';
    
    return 'other';
  };

  const uploadFile = async (fileData: UploadedFile) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      // Convert file to buffer
      const arrayBuffer = await fileData.file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      // Upload to Google Cloud Storage
      const uploadResult = await storageService.uploadDocument(
        fileBuffer,
        fileData.file.name,
        {
          loanId,
          originalName: fileData.file.name,
          documentType: classifyDocument(fileData.file.name) as any,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        }
      );

      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { 
              ...f, 
              status: 'uploaded', 
              progress: 100,
              gcsUri: uploadResult.gcsUri,
              publicUrl: uploadResult.publicUrl,
              uploadTime: uploadResult.uploadTime
            }
          : f
      ));

      // Save to Supabase database
      const { data: dbRecord, error: dbError } = await supabase
        .from('documents')
        .insert({
          loan_application_id: loanId,
          file_path: uploadResult.fileName,
          file_name: fileData.file.name,
          file_size: uploadResult.fileSize,
          document_type: classifyDocument(fileData.file.name),
          processing_status: 'pending',
          uploaded_by: userId
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Trigger processing
      await processDocument(fileData.id, uploadResult.gcsUri, fileData.file.name, loanId);

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
    }
  };

  const processDocument = async (fileId: string, gcsUri: string, fileName: string, loanId: string) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'processing' }
          : f
      ));

      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          gcsUri,
          fileName,
          loanId
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'completed' }
          : f
      ));

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
    }
  };

  const uploadAllFiles = async () => {
    setUploading(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    try {
      // Upload files in parallel (max 3 concurrent)
      const uploadPromises = pendingFiles.map(file => uploadFile(file));
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Batch upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Google-styled Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer 
          transition-all duration-300 ease-in-out transform
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:scale-102'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-6">
          <div className="text-8xl opacity-60">
            {isDragActive ? '📥' : '📄'}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {isDragActive ? 'Drop loan documents here' : 'Upload loan documents'}
            </h3>
            <p className="text-gray-600 text-lg">
              Drag & drop files or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-3">
              Supports: PDF, PNG, JPG, DOC, DOCX • Max 25MB each • Up to 20 files
            </p>
          </div>
          
          {!isDragActive && (
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              Choose Files
            </button>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Documents ({files.length})
            </h3>
            
            <div className="flex space-x-3">
              <button
                onClick={uploadAllFiles}
                disabled={!files.some(f => f.status === 'pending') || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {uploading ? 'Processing...' : `Upload All (${files.filter(f => f.status === 'pending').length})`}
              </button>
              
              <button
                onClick={() => setFiles([])}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="grid gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(file.status)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-medium text-gray-900 truncate">
                        {file.file.name}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>•</span>
                        <span className="capitalize">{classifyDocument(file.file.name).replace('_', ' ')}</span>
                        {file.uploadTime && (
                          <>
                            <span>•</span>
                            <span>Uploaded in {(file.uploadTime / 1000).toFixed(1)}s</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      file.status === 'completed' ? 'bg-green-100 text-green-800' :
                      file.status === 'error' ? 'bg-red-100 text-red-800' :
                      file.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      file.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {file.status === 'pending' ? 'Ready' : 
                       file.status === 'uploading' ? 'Uploading' :
                       file.status === 'uploaded' ? 'Processing' :
                       file.status === 'processing' ? 'AI Processing' :
                       file.status === 'completed' ? 'Complete' : 'Error'}
                    </span>
                    
                    {file.status === 'pending' && (
                      <button
                        onClick={() => uploadFile(file)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                {(file.status === 'uploading' || file.status === 'processing') && (
                  <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          file.status === 'uploading' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={{ 
                          width: file.status === 'uploading' ? `${file.progress}%` : '100%',
                          animation: file.status === 'processing' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {file.status === 'uploading' ? `Uploading... ${file.progress}%` : 'AI processing document...'}
                    </p>
                  </div>
                )}
                
                {file.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{file.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
