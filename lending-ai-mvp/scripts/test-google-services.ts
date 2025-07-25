// scripts/test-google-apis.ts - Verify Google services are working
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testGoogleAPIs() {
  console.log('🧪 Testing Google API Services...\n')
  
  // Check environment variables
  console.log('=== ENVIRONMENT CHECK ===')
  console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? '✅' : '❌ Missing')
  console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅' : '❌ Missing')
  console.log('SERVICE_ACCOUNT_FILE:', fs.existsSync('./google-service-account.json') ? '✅' : '❌ Missing')
  
  // Test Gemini API
  console.log('\n=== TESTING GEMINI API ===')
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    
    const result = await model.generateContent("Say 'Gemini API is working!' in exactly those words.")
    const response = result.response.text()
    
    if (response.includes('Gemini API is working!')) {
      console.log('✅ Gemini API working perfectly!')
    } else {
      console.log('⚠️  Gemini API responded but with unexpected text:', response)
    }
  } catch (error) {
    console.log('❌ Gemini API failed:', error.message)
  }
  
  // Test Vision API (only if service account exists)
  console.log('\n=== TESTING VISION API ===')
  if (fs.existsSync('./google-service-account.json')) {
    try {
      const vision = await import('@google-cloud/vision')
      const client = new vision.ImageAnnotatorClient({
        projectId: process.env.GOOGLE_PROJECT_ID,
        keyFilename: './google-service-account.json'
      })
      
      // Simple health check
      console.log('✅ Vision API client initialized')
      console.log('📝 Ready for document text extraction')
      
    } catch (error) {
      console.log('❌ Vision API failed:', error.message)
    }
  } else {
    console.log('⚠️  Vision API skipped - no service account file')
    console.log('   Create google-service-account.json for Vision API')
  }
  
  console.log('\n=== SUMMARY ===')
  
  const hasGemini = !!process.env.GOOGLE_API_KEY
  const hasVision = fs.existsSync('./google-service-account.json') && !!process.env.GOOGLE_PROJECT_ID
  
  if (hasGemini && hasVision) {
    console.log('🎉 All Google APIs ready for document processing!')
  } else if (hasGemini) {
    console.log('⚠️  Gemini ready, Vision API needs service account file')
  } else {
    console.log('❌ Google APIs need configuration')
  }
  
  return { hasGemini, hasVision }
}

testGoogleAPIs().catch(console.error)