import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined) // undefined = not yet checked
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const fetchingRef  = useRef(false)
  const profileRef   = useRef(null)
  const mountedRef   = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    let sessionHandled = false  // prevents double-fetch when both getSession + SIGNED_IN fire

    // 1. Grab current session — this is the only thing that matters on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return
      sessionHandled = true
      setSession(session)
      if (session?.user?.id) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return

        // TOKEN_REFRESHED: silent — profile unchanged
        if (event === 'TOKEN_REFRESHED') return

        // SIGNED_OUT: clear everything
        if (event === 'SIGNED_OUT' || !session) {
          sessionHandled = false
          setSession(null)
          setProfile(null)
          profileRef.current = null
          setLoading(false)
          return
        }

        // SIGNED_IN: skip if getSession() already handled this user
        // This prevents the double-fetch race on cold page load
        if (event === 'SIGNED_IN') {
          if (sessionHandled && profileRef.current?.id === session.user.id) return
        }

        // Only re-fetch if user actually changed
        if (session?.user?.id && session.user.id !== profileRef.current?.id) {
          setSession(session)
          fetchProfile(session.user.id)
        }
      }
    )

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    if (fetchingRef.current) return
    fetchingRef.current = true

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!mountedRef.current) return

      if (data) {
        setProfile(data)
        profileRef.current = data
        return
      }

      // No profile row — build a minimal one from auth user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mountedRef.current) return

      const fallback = {
        id:        userId,
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
        email:     user.email ?? '',
        role:      'student',
        active:    true,
      }

      // Try to persist it
      const { data: saved } = await supabase
        .from('profiles')
        .upsert(fallback)
        .select()
        .maybeSingle()

      const final = saved ?? fallback
      if (mountedRef.current) {
        setProfile(final)
        profileRef.current = final
      }

    } catch (err) {
      console.error('[AuthContext] fetchProfile error:', err)
    } finally {
      if (mountedRef.current) setLoading(false)
      fetchingRef.current = false
    }
  }

  async function signOut() {
    profileRef.current = null
    setProfile(null)
    setSession(null)
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      role:         profile?.role ?? null,
      isAdmin:      profile?.role === 'admin',
      isInstructor: profile?.role === 'instructor' || profile?.role === 'admin',
      isStudent:    !!profile,
      signOut,
      refreshProfile: () => {
        if (session?.user?.id) {
          profileRef.current = null
          fetchProfile(session.user.id)
        }
      },
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
