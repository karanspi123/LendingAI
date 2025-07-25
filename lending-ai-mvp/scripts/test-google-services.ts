import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testGoogleServices() {
  console.log('🔍 Testing Google Services setup...\n')
  
  // Check environment variables
  console.log('=== Environment Variables ===')
  console.log('Google Project ID:', process.env.GOOGLE_PROJECT_ID || '❌ Missing')
  console.log('Google API Key (first 20):', process.env.GOOGLE_API_KEY?.substring(0, 20) + '...' || '❌ Missing')
  console.log('Service Account File:', process.env.GOOGLE_APPLICATION_CREDENTIALS || '❌ Missing')
  console.log('')
  
  // Check if service account file exists
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    console.log('✅ Service account JSON file exists')
    
    // Try to read and validate the JSON
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
      console.log('✅ Service account JSON is valid')
      console.log('Service account email:', serviceAccount.client_email)
      console.log('Project ID from service account:', serviceAccount.project_id)
      console.log('')
      
      // Verify project ID matches
      if (serviceAccount.project_id === process.env.GOOGLE_PROJECT_ID) {
        console.log('✅ Project ID matches between .env.local and service account')
      } else {
        console.log('⚠️  Project ID mismatch:')
        console.log('  .env.local:', process.env.GOOGLE_PROJECT_ID)
        console.log('  Service account:', serviceAccount.project_id)
      }
    } catch (error) {
      console.error('❌ Service account JSON is invalid:', error)
    }
  } else {
    console.error('❌ Service account JSON file not found at:', serviceAccountPath)
    console.log('Run this command to create it:')
    console.log(`gcloud iam service-accounts keys create ./google-service-account.json --iam-account=lending-ai-service@${process.env.GOOGLE_PROJECT_ID}.iam.gserviceaccount.com`)
  }
  
  console.log('')
  console.log('=== Testing Google Cloud Vision API ===')
  
  // Test Google Cloud Vision API
  if (process.env.GOOGLE_API_KEY && serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      // Set up Google Cloud credentials
      process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath
      
      const vision = await import('@google-cloud/vision')
      const client = new vision.ImageAnnotatorClient()
      
      console.log('✅ Google Cloud Vision client initialized successfully')
      
      // Test with a simple text detection (you can skip this for now)
      console.log('📝 Vision API client is ready for document processing')
      
    } catch (error) {
      console.error('❌ Failed to initialize Google Cloud Vision:', error.message)
      console.log('You may need to install: npm install @google-cloud/vision')
    }
  } else {
    console.log('⏭️  Skipping Vision API test - missing credentials')
  }
  
  console.log('')
  console.log('=== Testing Google Generative AI ===')
  
  // Test Google Generative AI (Gemini)
  if (process.env.GOOGLE_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
      
      console.log('✅ Google Generative AI client initialized successfully')
      console.log('🤖 Gemini API is ready for loan risk assessment')
      
    } catch (error) {
      console.error('❌ Failed to initialize Google Generative AI:', error.message)
      console.log('You may need to install: npm install @google/generative-ai')
    }
  } else {
    console.log('⏭️  Skipping Generative AI test - missing API key')
  }
  
  console.log('')
  console.log('=== Summary ===')
  
  const hasProjectId = !!process.env.GOOGLE_PROJECT_ID
  const hasApiKey = !!process.env.GOOGLE_API_KEY
  const hasServiceAccount = !!(serviceAccountPath && fs.existsSync(serviceAccountPath))
  
  if (hasProjectId && hasApiKey && hasServiceAccount) {
    console.log('🎉 Google Services setup is complete!')
    console.log('Ready to build document processing and AI features.')
  } else {
    console.log('⚠️  Google Services setup is incomplete:')
    if (!hasProjectId) console.log('  - Missing GOOGLE_PROJECT_ID')
    if (!hasApiKey) console.log('  - Missing GOOGLE_API_KEY')
    if (!hasServiceAccount) console.log('  - Missing service account JSON file')
  }
}

testGoogleServices().catch(console.error)
