// src/app/test-upload/page.tsx - Real file upload testing
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    setResults(null);

    try {
      console.log('🚀 Starting real file upload test...');
      
      // Step 1: Upload to Supabase Storage
      const fileName = `test-${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('loan-documents')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('✅ File uploaded to storage:', uploadData.path);

      // Step 2: Get public URL
      const { data: urlData } = supabase.storage
        .from('loan-documents')
        .getPublicUrl(fileName);

      console.log('✅ Public URL generated:', urlData.publicUrl);

      // Step 3: Save document record
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          loan_application_id: '550e8400-e29b-41d4-a716-446655440001', // Martinez demo loan
          document_type: classifyDocument(file.name),
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          processing_status: 'pending'
        })
        .select()
        .single();

      if (docError) {
        throw new Error(`Database save failed: ${docError.message}`);
      }

      console.log('✅ Document record created:', docData.id);

      // Step 4: Process with Google Vision + Gemini
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docData.id,
          fileUrl: urlData.publicUrl
        })
      });

      const extractResult = await response.json();

      if (!response.ok) {
        throw new Error(`AI processing failed: ${extractResult.message}`);
      }

      console.log('✅ Google AI processing complete');

      setResults({
        uploadPath: uploadData.path,
        publicUrl: urlData.publicUrl,
        documentId: docData.id,
        extractedText: extractResult.extractedText?.substring(0, 500) + '...',
        confidence: extractResult.metadata?.confidence,
        processingTime: extractResult.metadata?.totalTime
      });

    } catch (err) {
      console.error('❌ Upload test failed:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const classifyDocument = (fileName: string): string => {
    const nameLower = fileName.toLowerCase();
    if (nameLower.includes('paystub') || nameLower.includes('pay')) return 'pay_stub';
    if (nameLower.includes('bank') || nameLower.includes('statement')) return 'bank_statement';
    if (nameLower.includes('tax') || nameLower.includes('1040')) return 'tax_return';
    if (nameLower.includes('credit')) return 'credit_report';
    return 'other';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 Real File Upload Test - Google AI Pipeline
          </h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload a Real Document</h2>
            <p className="text-gray-600 mb-4">
              Test the complete pipeline: Upload → Google Vision API → Gemini AI → Risk Assessment
            </p>
            
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {file && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p><strong>File:</strong> {file.name}</p>
                <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Type:</strong> {classifyDocument(file.name)}</p>
              </div>
            )}
            
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {uploading ? '🔄 Processing with Google AI...' : '🚀 Test Complete Pipeline'}
            </button>
          </div>

          {error && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {results && (
            <div className="space-y-6">
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Pipeline Test Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">📁 File Storage</h4>
                    <p className="text-sm text-gray-600">Path: {results.uploadPath}</p>
                    <p className="text-sm text-gray-600">Document ID: {results.documentId}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">🤖 Google AI Results</h4>
                    <p className="text-sm text-gray-600">OCR Confidence: {results.confidence}%</p>
                    <p className="text-sm text-gray-600">Processing Time: {results.processingTime}ms</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">📄 Extracted Text (Preview)</h4>
                  <div className="bg-white p-4 rounded border max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">{results.extractedText}</pre>
                  </div>
                </div>
                
                <div className="mt-6">
                  <a 
                    href={results.publicUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    🔗 View Uploaded File
                  </a>
                </div>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-4">
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">🔄 Processing Pipeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                    Uploading to Supabase Storage...
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
                    Processing with Google Vision API...
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                    Analyzing with Google Gemini AI...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}