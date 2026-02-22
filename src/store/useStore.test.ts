import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './useStore'

describe('useStore', () => {
    beforeEach(() => {
        // Reset store before each test
        useStore.setState({
            user: null,
            currentCompany: null,
            activeCompanyId: null
        })
    })

    it('should initialize with default values', () => {
        const state = useStore.getState()
        expect(state.user).toBeNull()
        expect(state.currentCompany).toBeNull()
        expect(state.activeCompanyId).toBeNull()
    })

    it('should set user correctly', () => {
        const mockUser = { id: 'user-1', name: 'John Doe' } as any
        useStore.getState().setUser(mockUser)

        expect(useStore.getState().user).toEqual(mockUser)
    })

    it('should set active company id correctly', () => {
        const companyId = 'comp-123'
        useStore.getState().setActiveCompanyId(companyId)

        expect(useStore.getState().activeCompanyId).toBe(companyId)
    })

    it('should set current company correctly', () => {
        const mockCompany = { id: 'c1', name: 'Company 1' } as any
        useStore.getState().setCurrentCompany(mockCompany)
        expect(useStore.getState().currentCompany).toEqual(mockCompany)
    })

    it('should clear state on logout', () => {
        useStore.setState({
            user: { id: 'u1' } as any,
            currentCompany: { id: 'c1' } as any,
            activeCompanyId: 'c1'
        })

        useStore.getState().logout()

        const state = useStore.getState()
        expect(state.user).toBeNull()
        expect(state.currentCompany).toBeNull()
        expect(state.activeCompanyId).toBeNull()
    })
})
