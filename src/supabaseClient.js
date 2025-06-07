import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://klxvvtjqeeebjcskvtvz.supabase.co'
const supabaseKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Replace with your actual service role key

export const supabase = createClient(supabaseUrl, supabaseKey)