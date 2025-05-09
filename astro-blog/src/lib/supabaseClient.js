import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with the provided credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
