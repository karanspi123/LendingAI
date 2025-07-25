import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Import AFTER environment variables are loaded
import { testSupabaseConnection } from '../src/app/supabase'

async function runTest() {
  console.log('🧪 Testing Supabase connection...')
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Anon Key (first 20 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local')
    return
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local')
    return
  }
  
  const result = await testSupabaseConnection()
  console.log('Test result:', result)
}

runTest()
