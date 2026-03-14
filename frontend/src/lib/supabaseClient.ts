import { createClient } from '@supabase/supabase-js';

export const supabase = (() => {
  const winEnv = (typeof window !== 'undefined' && (window as any).__env__) ? (window as any).__env__ : {};

  const SUPABASE_URL = 
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.REACT_APP_SUPABASE_URL ||
    winEnv.REACT_APP_SUPABASE_URL || 
    winEnv.SUPABASE_URL ||
    '';
    
  const SUPABASE_ANON = 
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.REACT_APP_SUPABASE_ANON_KEY ||
    winEnv.REACT_APP_SUPABASE_ANON_KEY || 
    winEnv.SUPABASE_ANON_KEY || 
    '';

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error('Supabase not configured for frontend.');
    const stub = {
      auth: {
        signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
        signUp: async () => ({ error: new Error('Supabase not configured') }),
        signInWithOAuth: async () => ({ error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: new Error('Supabase not configured') }),
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null })
            })
          })
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null })
          })
        })
      }),
      channel: () => ({
        on: () => ({
          subscribe: () => ({ unsubscribe: () => {} })
        })
      }),
      removeChannel: () => {}
    } as any;
    return stub;
  }

  return createClient(String(SUPABASE_URL), String(SUPABASE_ANON));
})();
