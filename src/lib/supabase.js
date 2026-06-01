import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    // Unique storage key scoped to this app — prevents the DCW iframe
    // (which also uses this Supabase project) from interfering with
    // VLC's auth state in localStorage
    storageKey: 'vlc-main-auth-v2',
    // Use sessionStorage for the iframe context check
    // (the DCW app runs in an iframe and should NOT share our token)
    storage: window.self === window.top ? window.localStorage : {
      getItem:    () => null,
      setItem:    () => {},
      removeItem: () => {},
    },
  },
})
