import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:         true,   // store session in localStorage
    autoRefreshToken:       true,   // silently refresh JWTs
    detectSessionInUrl:     true,   // handle magic link / OAuth redirects
    // Prevent the tab-to-tab broadcast that was triggering freezes.
    // Each tab manages its own session state independently.
    storageKey:             'vlc-auth',
  },
})
