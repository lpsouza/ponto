import { createContext, useContext, useEffect, useState } from 'react'
import { pb } from '../../lib/pocketbase'
import { useStore } from '../../store/useStore'
import type { User } from '../../types/pocketbase-types'

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: () => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, setUser, logout: storeLogout } = useStore()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Initial sync with PocketBase auth store
        const syncAuth = () => {
            if (pb.authStore.isValid && pb.authStore.model) {
                setUser(pb.authStore.model as unknown as User)
            } else {
                setUser(null)
            }
            setIsLoading(false)
        }

        syncAuth()

        // Listen for auth state changes
        return pb.authStore.onChange(() => {
            syncAuth()
        })
    }, [setUser])

    const login = async () => {
        try {
            console.log('Buscando métodos de autenticação...');
            const authMethods = await pb.collection('users').listAuthMethods();
            console.log('Métodos disponíveis:', authMethods);

            if (!authMethods.oauth2 || !authMethods.oauth2.enabled || authMethods.oauth2.providers.length === 0) {
                throw new Error('Nenhum provedor de OAuth2 (Google) está habilitado no PocketBase.');
            }

            const googleProvider = authMethods.oauth2.providers.find(p => p.name === 'google');
            if (!googleProvider) {
                throw new Error('Provedor Google não encontrado na lista de métodos permitidos.');
            }

            // Use Google OAuth2
            await pb.collection('users').authWithOAuth2({ provider: 'google' });
        } catch (error) {
            console.error('Login failed:', error);
            alert(error instanceof Error ? error.message : 'Falha na autenticação');
            throw error;
        }
    }

    const logout = () => {
        pb.authStore.clear()
        storeLogout()
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
