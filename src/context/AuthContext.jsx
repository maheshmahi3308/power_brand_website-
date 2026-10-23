import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);

  // Load session on mount and subscribe to auth changes
  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load profile whenever session changes
  useEffect(() => {
    if (!supabase || !session?.user) {
      setProfile(null);
      return;
    }
    supabase
      .from('profiles')
      .select('full_name, role, phone, updated_at')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(
          data ?? {
            full_name: session.user.email?.split('@')[0] ?? '',
            role: 'customer',
            phone: '',
          }
        );
      });
  }, [session]);

  const signOut = async () => {
    await supabase?.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!supabase || !session?.user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role, phone, updated_at')
      .eq('id', session.user.id)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const value = {
    session,                              // null | Session object
    profile,                             // null | { full_name, role, phone }
    isAdmin: profile?.role === 'admin',  // boolean
    isLoading: session === undefined,    // true while initial auth check runs
    isAuthenticated: Boolean(session),
    user: session?.user ?? null,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
