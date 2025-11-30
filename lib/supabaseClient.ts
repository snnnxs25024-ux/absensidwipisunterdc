import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bfozlypexakqvtfmeydj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmb3pseXBleGFrcXZ0Zm1leWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDczMzEsImV4cCI6MjA4MDA4MzMzMX0.67e0Mfu8IQ9IWd8K7FjLBT7NifuOOZhm9Pkkn5M38zo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);