import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Company } from '../types/pocketbase-types'

interface AppState {
    user: User | null
    currentCompany: Company | null
    activeCompanyId: string | null
    setUser: (user: User | null) => void
    setCurrentCompany: (company: Company | null) => void
    setActiveCompanyId: (id: string | null) => void
    logout: () => void
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            user: null,
            currentCompany: null,
            activeCompanyId: null,
            setUser: (user) => set({ user }),
            setCurrentCompany: (company) => set({ currentCompany: company }),
            setActiveCompanyId: (activeCompanyId) => set({ activeCompanyId }),
            logout: () => set({ user: null, currentCompany: null, activeCompanyId: null }),
        }),
        {
            name: 'ponto-livre-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
