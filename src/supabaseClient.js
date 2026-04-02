import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// VULN: Security Misconfiguration — anon key exposed in frontend source
// VULN: No additional security headers configured
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
