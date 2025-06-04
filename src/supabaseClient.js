import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://klxvvtjqeeebjcskvtvz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtseHZ2dGpxZWVlYmpjc2t2dHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMzYyNjQsImV4cCI6MjA2NDYxMjI2NH0.ITSDOxSTlV9qGj3lu0JIDhQiPlMR9kQapZqIQQD4loY'

export const supabase = createClient(supabaseUrl, supabaseKey)