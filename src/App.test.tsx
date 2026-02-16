import { render, screen } from '@testing-library/react'
import App from './App'

test('renders headline', () => {
    render(<App />)
    const linkElement = screen.getByText(/Ponto Livre/i)
    expect(linkElement).toBeInTheDocument()
})
