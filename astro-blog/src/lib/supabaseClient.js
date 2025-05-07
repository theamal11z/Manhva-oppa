import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with the provided credentials
const supabaseUrl = 'https://iwybjtgyldetjzpgpjal.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3eWJqdGd5bGRldGp6cGdwamFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMzEyNjUsImV4cCI6MjA2MDcwNzI2NX0.cD7jQFUwVLqx6ukOyJVR7nPNDLpJtfVuORvnjNaRYgs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to fetch site settings from the database
export async function getSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('settings')
    .eq('id', 'singleton')
    .single();
  
  if (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
  
  return data?.settings || null;
}
