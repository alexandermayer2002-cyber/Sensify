import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://cmcdmfqawvdyncmoxdfz.supabase.co'
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtY2RtZnFhd3ZkeW5jbW94ZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzMxMTEsImV4cCI6MjA5NDM0OTExMX0.hwWDOdicLRQ6UIhzeupVeCSwygpkJxBMwS0-AwCTxW4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  }
})
