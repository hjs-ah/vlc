import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const fetchingRef = useRef(false)   // prevents concurrent fetches
  const profileRef  = useRef(null)    // tracks latest profile without re-renders

  useEffect(() => {
    // Initial session check — only sets loading=false once
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)

        if (!session) {
          setProfile(null)
          profileRef.current = null
          setLoading(false)
          return
        }

        // TOKEN_REFRESHED fires frequently — only re-fetch profile if
        // we don't already have one for this user
        if (event === 'TOKEN_REFRESHED' && profileRef.current?.id === session.user.id) {
          return  // session refreshed but profile unchanged — do nothing
        }

        // SIGNED_IN or profile missing — fetch it
        if (event === 'SIGNED_IN' || !profileRef.current) {
          await fetchProfile(session.user.id)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    // Guard against concurrent fetches racing each other
    if (fetchingRef.current) return
    fetchingRef.current = true

    // Only show loading spinner on first load, not on background refreshes
    if (!profileRef.current) setLoading(true)

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (data) {
        setProfile(data)
        profileRef.current = data
      } else {
        // No profile row — create minimal fallback
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const fallback = {
            id: userId,
            full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
            email: user.email,
            role: 'student',
            active: true,
          }
          const { data: created } = await supabase
            .from('profiles')
            .upsert(fallback)
            .select()
            .single()
          const final = created ?? fallback
          setProfile(final)
          profileRef.current = final
        }
      }
    } catch (e) {
      console.error('fetchProfile error:', e)
      // Don't leave loading=true on error
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    profileRef.current = null
  }

  const value = {
    session,
    profile,
    loading,
    role:          profile?.role ?? null,
    isAdmin:       profile?.role === 'admin',
    isInstructor:  profile?.role === 'instructor' || profile?.role === 'admin',
    isStudent:     !!profile,
    signOut,
    refreshProfile: () => session && fetchProfile(session.user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
