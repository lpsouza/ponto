import React, { createContext, useContext, useEffect, useState } from 'react'
import { pb } from '../../lib/pocketbase'
import { UsersRecord } from '../../types/pocketbase.types'

interface AuthContextType {
    user: UsersRecord | null
    profile: UsersRecord | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signOut: () => void
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UsersRecord | null>(pb.authStore.record as UsersRecord | null || pb.authStore.model as UsersRecord | null)
    const [loading, setLoading] = useState(true)

    // Force clear all auth state and redirect to login
    const forceLogout = () => {
        pb.authStore.clear()
        window.location.href = '/login'
    }

    useEffect(() => {
        let mounted = true

        const initialize = async () => {
            try {
                if (pb.authStore.isValid && (pb.authStore.model || pb.authStore.record)) {
                    // Refresh token
                    await pb.collection('users').authRefresh()
                    if (mounted) {
                        setUser((pb.authStore.record || pb.authStore.model) as UsersRecord)
                    }
                } else {
                    pb.authStore.clear()
                    if (mounted) {
                        setUser(null)
                    }
                }
            } catch (err) {
                console.error('Failed to restore auth session:', err)
                pb.authStore.clear()
                if (mounted) setUser(null)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        initialize()

        // Listen for pb.authStore changes
        const unsubscribe = pb.authStore.onChange((_token: string, model: any) => {
            if (mounted) {
                setUser((model as UsersRecord) || null)
            }
        })

        return () => {
            mounted = false
            unsubscribe()
        }
    }, [])

    const signInWithGoogle = async () => {
        try {
            // No PocketBase v0.20+, a maneira recomendada e mais simples em SPA é usar a chamada built-in
            // que cuida do pop-up. Porém, se o provider não existir, a API retorna undefined na listagem.
            const authMethods = await pb.collection('users').listAuthMethods()
            const googleProvider = authMethods.authProviders.find((p: any) => p.name === 'google')

            if (!googleProvider) {
                console.error("Provedor Google não encontrado ou desabilitado no PocketBase admin.")
                alert("O Login com o Google não está configurado ou habilitado no banco de dados local.")
                return
            }

            await pb.collection('users').authWithOAuth2({ provider: 'google' })
            // Once succesful, LoginPage handles the navigation to /dashboard.
        } catch (error) {
            console.error('Error signing in with Google:', error)
        }
    }

    const signOut = () => {
        forceLogout()
    }

    const refreshProfile = async () => {
        const id = pb.authStore.record?.id || pb.authStore.model?.id;
        if (id) {
            try {
                const refreshed = await pb.collection('users').getOne<UsersRecord>(id)
                setUser(refreshed)
            } catch (error) {
                console.error('Error refreshing profile:', error)
            }
        }
    }

    const value = {
        user,
        profile: user,
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
