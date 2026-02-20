import { render, screen } from '@testing-library/react'
import { vi, test, expect } from 'vitest'
import App from './App'

// Mock PocketBase client
vi.mock('./lib/pocketbase', () => ({
    pb: {
        authStore: {
            isValid: false,
            model: null,
            record: null,
            onChange: vi.fn(() => vi.fn()),
            clear: vi.fn(),
        },
        collection: vi.fn(() => ({
            authRefresh: vi.fn(),
            getOne: vi.fn(),
        })),
    },
}))

test('renders headline', async () => {
    render(<App />)
    const linkElement = await screen.findByText(/Ponto Livre/i)
    expect(linkElement).toBeInTheDocument()
})
