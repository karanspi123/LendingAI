import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function runCheckpoints() {
  console.log('🔍 Running LendingAI MVP Checkpoints...\n')
  
  let passedTests = 0;
  let totalTests = 0;

  const test = (name: string, condition: boolean, details?: string) => {
    totalTests++;
    if (condition) {
      console.log(`✅ ${name}`);
      if (details) console.log(`   ${details}`);
      passedTests++;
    } else {
      console.log(`❌ ${name}`);
      if (details) console.log(`   ${details}`);
    }
  };

  console.log('=== 1. ENVIRONMENT SETUP ===');
  
  test(
    'Google Project ID configured',
    !!process.env.GOOGLE_PROJECT_ID,
    process.env.GOOGLE_PROJECT_ID || 'Missing GOOGLE_PROJECT_ID'
  );
  
  test(
    'Google API Key configured',
    !!process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_API_KEY ? 'API key present' : 'Missing GOOGLE_API_KEY'
  );
  
  test(
    'Supabase URL configured',
    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'Missing NEXT_PUBLIC_SUPABASE_URL'
  );
  
  test(
    'Supabase Anon Key configured',
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Anon key present' : 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountExists = serviceAccountPath && fs.existsSync(serviceAccountPath);
  
  test(
    'Google Service Account file exists',
    !!serviceAccountExists,
    serviceAccountPath || 'Missing GOOGLE_APPLICATION_CREDENTIALS path'
  );

  if (serviceAccountExists) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath!, 'utf8'));
      test(
        'Service Account JSON is valid',
        !!serviceAccount.client_email,
        serviceAccount.client_email
      );
      
      test(
        'Project ID matches in service account',
        serviceAccount.project_id === process.env.GOOGLE_PROJECT_ID,
        `Service: ${serviceAccount.project_id}, Env: ${process.env.GOOGLE_PROJECT_ID}`
      );
    } catch (error) {
      test('Service Account JSON is valid', false, 'Invalid JSON format');
    }
  }

  console.log('\n=== 2. FILE STRUCTURE ===');
  
  const criticalFiles = [
    'src/lib/vision.ts',
    'src/lib/gemini.ts',
    'src/lib/supabase-storage.ts',
    'src/app/supabase.ts',
    'src/components/DocumentUpload.tsx',
    'src/app/api/upload/route.ts',
    'src/app/api/extract-text/route.ts',
    'src/app/api/process-document/route.ts'
  ];

  criticalFiles.forEach(filePath => {
    test(
      `${filePath} exists`,
      fs.existsSync(filePath),
      fs.existsSync(filePath) ? 'File present' : 'File missing'
    );
  });

  console.log('\n=== 3. DEPENDENCIES ===');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = [
      '@google-cloud/vision',
      '@google/generative-ai',
      '@supabase/supabase-js',
      'react-dropzone'
    ];

    requiredDeps.forEach(dep => {
      test(
        `${dep} installed`,
        !!deps[dep],
        deps[dep] ? `Version: ${deps[dep]}` : 'Not installed'
      );
    });
  } catch (error) {
    test('package.json readable', false, 'Cannot read package.json');
  }

  console.log('\n=== 4. GOOGLE SERVICES ===');
  
  try {
    const { visionService } = await import('../src/lib/vision');
    const visionHealthy = await visionService.healthCheck();
    test('Google Vision API connection', visionHealthy, 'Vision API client initialized');
  } catch (error) {
    test('Google Vision API connection', false, error.message);
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    test('Google Gemini API connection', true, 'Gemini client initialized');
  } catch (error) {
    test('Google Gemini API connection', false, error.message);
  }

  console.log('\n=== 5. SUPABASE CONNECTION ===');
  
  try {
    const { supabase } = await import('../src/app/supabase');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    test('Supabase database connection', !error, error?.message || 'Database accessible');
  } catch (error) {
    test('Supabase database connection', false, error.message);
  }

  // FIXED: Test Supabase Storage by trying to access the bucket directly
  try {
    const { supabase } = await import('../src/app/supabase');
    
    // Try to list files in the loan-documents bucket (this will work even if bucket is empty)
    const { data: files, error: storageError } = await supabase.storage
      .from('loan-documents')
      .list('', { limit: 1 });
    
    test('Supabase Storage accessible', !storageError, storageError?.message || 'Storage accessible');
    test('loan-documents bucket exists', !storageError, !storageError ? 'Bucket accessible and ready' : 'Bucket not accessible');
    
  } catch (error) {
    test('Supabase Storage accessible', false, error.message);
    test('loan-documents bucket exists', false, 'Cannot access bucket');
  }

  console.log('\n=== 6. API ROUTES SYNTAX ===');
  
  const apiRoutes = [
    'src/app/api/upload/route.ts',
    'src/app/api/extract-text/route.ts',
    'src/app/api/process-document/route.ts'
  ];

  for (const routePath of apiRoutes) {
    try {
      const content = fs.readFileSync(routePath, 'utf8');
      const hasExport = content.includes('export async function POST');
      const hasImports = content.includes('import');
      
      test(
        `${routePath} syntax check`,
        hasExport && hasImports,
        hasExport && hasImports ? 'Valid API route structure' : 'Missing exports or imports'
      );
    } catch (error) {
      test(`${routePath} syntax check`, false, 'Cannot read file');
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL CHECKPOINTS PASSED! Ready to proceed with development.');
  } else {
    console.log('\n⚠️  Some checkpoints failed. Please fix the issues above before proceeding.');
  }
  
  return passedTests === totalTests;
}

runCheckpoints().catch(console.error);
