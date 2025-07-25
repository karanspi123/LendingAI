// scripts/debug-supabase.ts - Run this to debug Supabase connection
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function debugSupabase() {
  console.log('🔍 Debugging Supabase Connection...\n')
  
  // Step 1: Check environment variables
  console.log('=== ENVIRONMENT VARIABLES ===')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('URL format:', process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...')
  }
  
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('Anon key format:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...')
  }
  
  console.log('\n=== TESTING SUPABASE CONNECTION ===')
  
  try {
    // Import after env vars are loaded
    const { createClient } = await import('@supabase/supabase-js')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing from .env.local')
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from .env.local')
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    console.log('✅ Supabase client created successfully')
    
    // Test 1: Basic connection
    console.log('\n--- Test 1: Basic Connection ---')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('❌ Users table test failed:', testError.message)
      
      // Test 2: Try a simpler query
      console.log('\n--- Test 2: Alternative Query ---')
      const { data: altData, error: altError } = await supabase
        .from('loan_applications')
        .select('id')
        .limit(1)
      
      if (altError) {
        console.log('❌ Loan applications test failed:', altError.message)
        
        // Test 3: Check if we can list tables
        console.log('\n--- Test 3: Raw SQL Query ---')
        const { data: sqlData, error: sqlError } = await supabase
          .rpc('get_schema_version')
          .limit(1)
        
        if (sqlError) {
          console.log('❌ SQL test failed:', sqlError.message)
          console.log('\n🔍 This suggests a RLS (Row Level Security) or authentication issue')
        }
      } else {
        console.log('✅ Loan applications table accessible')
        console.log('Data:', altData)
      }
    } else {
      console.log('✅ Users table accessible')
      console.log('Data:', testData)
    }
    
    // Test 4: Check storage
    console.log('\n--- Test 4: Storage Test ---')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.log('❌ Storage test failed:', bucketError.message)
    } else {
      console.log('✅ Storage accessible')
      console.log('Buckets:', buckets?.map(b => b.name) || [])
      
      const loanDocsBucket = buckets?.find(b => b.name === 'loan-documents')
      if (loanDocsBucket) {
        console.log('✅ loan-documents bucket found')
      } else {
        console.log('⚠️  loan-documents bucket not found')
      }
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    
    console.log('\n=== TROUBLESHOOTING GUIDE ===')
    console.log('1. Check your .env.local file has the correct Supabase credentials')
    console.log('2. Get credentials from: Supabase Dashboard → Settings → API')
    console.log('3. Make sure URL starts with https:// and ends with .supabase.co')
    console.log('4. Restart your dev server after changing .env.local')
    console.log('5. Check if RLS policies are blocking access')
  }
}

debugSupabase().catch(console.error)