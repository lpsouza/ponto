import React, { createContext, useContext, useEffect, useState } from 'react'
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
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user)
            } else {
                setLoading(false)
            }
        })

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                await fetchProfile(session.user)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchProfile = async (currentUser: User) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error)
            }

            if (data) {
                setProfile(data)
            } else {
                // Profile doesn't exist, create it (Auto-Registration logic)
                await createProfile(currentUser)
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const createProfile = async (currentUser: User) => {
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
        } else {
            setProfile(data)
        }
    }

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        })
        if (error) console.error('Error signing in:', error)
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) console.error('Error signing out:', error)
    }

    const value = {
        session,
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile: async () => {
            if (user) await fetchProfile(user)
        }
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
