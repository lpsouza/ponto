import { render, screen } from '@testing-library/react'
import { vi, test, expect } from 'vitest'
import App from './App'

// Mock Supabase client
vi.mock('./lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        },
    },
}))

test('renders headline', async () => {
    render(<App />)
    const linkElement = await screen.findByText(/Ponto Livre/i)
    expect(linkElement).toBeInTheDocument()
})
