import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTimeClockStore } from './useTimeClockStore'
import { pb } from '../../../lib/pocketbase'
import { useStore } from '../../../store/useStore'

// Mock dependencies
vi.mock('../../../lib/pocketbase', () => ({
    pb: {
        collection: vi.fn()
    }
}))

vi.mock('../../../store/useStore', () => ({
    useStore: {
        getState: vi.fn()
    }
}))

describe('useTimeClockStore', () => {
    const mockCollection = {
        getFullList: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-ignore
        pb.collection.mockReturnValue(mockCollection)

        // Default store state
        // @ts-ignore
        useStore.getState.mockReturnValue({
            user: { id: 'u1' },
            activeCompanyId: 'c1'
        })

        // Reset store state
        useTimeClockStore.setState({
            records: [],
            isLoading: false,
            error: null
        })
    })

    it('should initialize with default values', () => {
        const state = useTimeClockStore.getState()
        expect(state.records).toEqual([])
        expect(state.isLoading).toBe(false)
    })

    it('should clock in successfully', async () => {
        const mockResponse = { id: 'r1', type: 'start', timestamp: '2026-02-21T10:00:00Z' }
        mockCollection.create.mockResolvedValue(mockResponse)

        await useTimeClockStore.getState().clockIn('Work start')

        expect(mockCollection.create).toHaveBeenCalledWith(expect.objectContaining({
            type: 'start',
            notes: 'Work start'
        }))

        const state = useTimeClockStore.getState()
        expect(state.records).toHaveLength(1)
        expect(state.records[0].id).toBe('r1')
    })

    it('should handle fetch errors', async () => {
        mockCollection.getFullList.mockRejectedValue(new Error('Network error'))

        await useTimeClockStore.getState().fetchRecords(new Date())

        const state = useTimeClockStore.getState()
        expect(state.isLoading).toBe(false)
        expect(state.error).toBe('Network error')
    })
})
