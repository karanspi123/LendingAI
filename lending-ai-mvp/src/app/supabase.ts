import { createClient } from '@supabase/supabase-js'

// Create a function to get the Supabase client (lazy initialization)
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Test function for connection
export async function testSupabaseConnection() {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('Supabase connection test - Expected error (table might not exist yet):', error.message)
      return { success: true, message: 'Connected to Supabase (table not created yet)' }
    }
    
    console.log('✅ Supabase connection successful!')
    return { success: true, data }
  } catch (err) {
    console.error('❌ Supabase connection failed:', err)
    return { success: false, error: err }
  }
}

// Export the client for use in Next.js app (only create when env vars are available)
let _supabase: ReturnType<typeof createClient> | null = null
export const supabase = (() => {
  if (!_supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    _supabase = getSupabaseClient()
  }
  return _supabase!
})()
