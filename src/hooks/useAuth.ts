import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js'; 
import { supabase } from '../lib/supabaseClient';
import { checkIsUserAdmin } from '../lib/admin-helper';

interface AppUser { 
  id: string;
  email?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true); 
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const updateUserStatesFromSession = async (currentSession: Session | null, isInitialCall: boolean) => {
      const supabaseAuthUser = currentSession?.user;
      let newAppUser: AppUser | null = null;

      if (supabaseAuthUser) {
        newAppUser = { id: supabaseAuthUser.id, email: supabaseAuthUser.email };
      }

      setUser(currentUserState => {
        if (newAppUser === null && currentUserState === null) return currentUserState; 
        if (newAppUser === null && currentUserState !== null) return null; 
        if (newAppUser !== null && currentUserState === null) return newAppUser; 
        if (newAppUser && currentUserState && (newAppUser.id !== currentUserState.id || newAppUser.email !== currentUserState.email)) {
          return newAppUser;
        }
        return currentUserState; 
      });

      let currentAdminStatus = false;
      if (newAppUser) { 
        currentAdminStatus = await checkIsUserAdmin(); 
      }
      
      setIsAdmin(currentIsAdminState => {
        if (currentIsAdminState !== currentAdminStatus) return currentAdminStatus;
        return currentIsAdminState;
      });

      if (isInitialCall) {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      updateUserStatesFromSession(session, true); 
    }).catch(error => {
      console.error("Error fetching initial session:", error);
      updateUserStatesFromSession(null, true); 
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        updateUserStatesFromSession(session, false); 
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); 

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    loading,
    isAdmin,
    signOut,
  };
}

export default useAuth;
