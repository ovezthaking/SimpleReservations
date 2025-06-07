import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://klxvvtjqeeebjcskvtvz.supabase.co'
const supabaseKey = 'YourKeyHere' // Replace with your actual Supabase key

export const supabase = createClient(supabaseUrl, supabaseKey)