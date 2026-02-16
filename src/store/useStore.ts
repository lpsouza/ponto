import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
    // Define state here
    theme: 'light' | 'dark'
    setTheme: (theme: 'light' | 'dark') => void
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            theme: 'dark', // Default to dark per spec
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'ponto-livre-storage',
        }
    )
)
