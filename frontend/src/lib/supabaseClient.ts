import { createClient } from '@supabase/supabase-js';

export const supabase = (() => {
  const winEnv = (typeof window !== 'undefined' && (window as any).__env__) ? (window as any).__env__ : {};

  const SUPABASE_URL = 
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.REACT_APP_SUPABASE_URL ||
    winEnv.REACT_APP_SUPABASE_URL || 
    winEnv.SUPABASE_URL || 
    'https://ojlfhkrobyqmifqbgcyw.supabase.co';
    
  const SUPABASE_ANON = 
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.REACT_APP_SUPABASE_ANON_KEY ||
    winEnv.REACT_APP_SUPABASE_ANON_KEY || 
    winEnv.SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbGZoa3JvYnlxbWlmcWJnY3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NTYwNTYsImV4cCI6MjA2NTEzMjA1Nn0.Y6swVK-tGI0lqpFJ4pgUGD6NaEj-sQIizTvYL2Cf4nY';

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error('Supabase not configured for frontend.');
    const stub = {
      auth: {
        signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
        signUp: async () => ({ error: new Error('Supabase not configured') }),
        signInWithOAuth: async () => ({ error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: new Error('Supabase not configured') }),
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ subscription: { unsubscribe: () => {} } }),
      },
      from: () => ({ select: async () => ({ data: null }), insert: async () => ({ data: null, error: null }) }),
    } as any;
    return stub;
  }

  return createClient(String(SUPABASE_URL), String(SUPABASE_ANON));
})();
