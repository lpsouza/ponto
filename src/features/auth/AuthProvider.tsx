import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { Database } from '../../types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
    session: Session | null
    user: User | null
    profile: Profile | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signOut: () => void
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const initDone = useRef(false)

    const fetchProfile = async (currentUser: User): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error)
                return null
            }

            if (data) {
                return data
            } else {
                return await createProfile(currentUser)
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error)
            return null
        }
    }

    const createProfile = async (currentUser: User): Promise<Profile | null> => {
        const { user_metadata } = currentUser
        const newProfile: Database['public']['Tables']['profiles']['Insert'] = {
            id: currentUser.id,
            full_name: user_metadata.full_name || user_metadata.name || '',
            avatar_url: user_metadata.avatar_url || user_metadata.picture || '',
            preferences: {},
            updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase
            .from('profiles')
            // @ts-ignore
            .insert(newProfile)
            .select()
            .single()

        if (error) {
            console.error('Error creating profile:', error)
            return null
        }
        return data
    }

    // Force clear all auth state and redirect to login
    const forceLogout = () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-')) {
                localStorage.removeItem(key)
            }
        })
        window.location.href = '/login'
    }

    useEffect(() => {
        let mounted = true

        const initialize = async () => {
            try {
                // Use getUser() to VALIDATE the session server-side.
                // This will also trigger a token refresh if needed.
                // Unlike getSession(), getUser() makes an API call that ensures
                // the token is actually valid, not just present in localStorage.
                const { data: { user: validatedUser }, error } = await supabase.auth.getUser()

                if (!mounted) return

                if (error || !validatedUser) {
                    // No valid session — clear stale tokens and show login
                    setSession(null)
                    setUser(null)
                    setProfile(null)
                    setLoading(false)
                    return
                }

                // Get the (now refreshed) session
                const { data: { session: currentSession } } = await supabase.auth.getSession()
                if (!mounted) return

                setSession(currentSession)
                setUser(validatedUser)

                // Now fetch profile with a guaranteed valid token
                const userProfile = await fetchProfile(validatedUser)
                if (!mounted) return

                if (userProfile) {
                    setProfile(userProfile)
                }
            } catch (err) {
                console.error('Auth initialization error:', err)
            } finally {
                if (mounted) {
                    initDone.current = true
                    setLoading(false)
                }
            }
        }

        initialize()

        // Listen for SUBSEQUENT auth changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!mounted) return

            // Skip events during initialization to avoid race conditions
            if (!initDone.current) return

            if (event === 'SIGNED_OUT' || !currentSession) {
                setSession(null)
                setUser(null)
                setProfile(null)
                return
            }

            setSession(currentSession)
            setUser(currentSession.user)

            // On SIGNED_IN (e.g. after OAuth redirect), fetch profile
            if (event === 'SIGNED_IN') {
                const userProfile = await fetchProfile(currentSession.user)
                if (mounted && userProfile) {
                    setProfile(userProfile)
                }
            }

            // TOKEN_REFRESHED doesn't need to re-fetch profile
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        })
        if (error) console.error('Error signing in:', error)
    }

    const signOut = () => {
        supabase.auth.signOut().catch((err) => {
            console.error('Error during signOut request:', err)
        })
        forceLogout()
    }

    const refreshProfile = async () => {
        if (user) {
            const data = await fetchProfile(user)
            if (data) setProfile(data)
        }
    }

    const value = {
        session,
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
