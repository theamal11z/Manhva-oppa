import { supabase } from './supabaseClient';

/**
 * Direct admin check that calls the database function 'is_admin'
 * This is the same function used by the database for RLS policies
 */
export const checkIsUserAdmin = async (): Promise<boolean> => {
  try {
    // Call the is_admin function directly via RPC
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error('Error checking admin status via RPC:', error);
      return false;
    }
    
    console.log('Admin check result from database function:', data);
    return !!data;
  } catch (error) {
    console.error('Exception in admin check:', error);
    return false;
  }
};
