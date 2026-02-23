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

    it('should fetch records successfully', async () => {
        const mockRecords = [{ id: 'r1', timestamp: '2026-02-21T10:00:00Z' }]
        mockCollection.getFullList.mockResolvedValue(mockRecords)

        await useTimeClockStore.getState().fetchRecords(new Date('2026-02-21'))

        expect(mockCollection.getFullList).toHaveBeenCalled()
        const state = useTimeClockStore.getState()
        expect(state.records).toEqual(mockRecords)
        expect(state.isLoading).toBe(false)
    })

    it('should handle fetch errors', async () => {
        mockCollection.getFullList.mockRejectedValue(new Error('Network error'))

        await useTimeClockStore.getState().fetchRecords(new Date())

        const state = useTimeClockStore.getState()
        expect(state.isLoading).toBe(false)
        expect(state.error).toBe('Network error')
    })

    it('should handle missing user or company when fetching', async () => {
        // @ts-ignore
        useStore.getState.mockReturnValue({ user: null, activeCompanyId: null })

        await useTimeClockStore.getState().fetchRecords(new Date())

        const state = useTimeClockStore.getState()
        expect(state.records).toEqual([])
    })

    it('should clock out successfully', async () => {
        const mockResponse = { id: 'r2', type: 'finish', timestamp: '2026-02-21T18:00:00Z' }
        mockCollection.create.mockResolvedValue(mockResponse)

        await useTimeClockStore.getState().clockOut('Work finish')

        expect(mockCollection.create).toHaveBeenCalledWith(expect.objectContaining({
            type: 'finish',
            notes: 'Work finish'
        }))

        const state = useTimeClockStore.getState()
        expect(state.records.find(r => r.id === 'r2')).toBeDefined()
    })

    it('should add manual entry successfully', async () => {
        const mockData = { type: 'pause' as const, timestamp: '2026-02-21T12:00:00Z' }
        const mockResponse = { ...mockData, id: 'r3', is_manual_entry: true }
        mockCollection.create.mockResolvedValue(mockResponse)

        await useTimeClockStore.getState().addManualEntry(mockData)

        expect(mockCollection.create).toHaveBeenCalledWith(expect.objectContaining({
            ...mockData,
            is_manual_entry: true
        }))
    })

    it('should update a record and keep others unchanged', async () => {
        const mockRecords = [
            { id: 'r1', timestamp: '2026-02-21T10:00:00Z', notes: 'Old' },
            { id: 'r2', timestamp: '2026-02-21T11:00:00Z', notes: 'Other' }
        ]
        useTimeClockStore.setState({ records: mockRecords as any })

        const mockResponse = { id: 'r1', timestamp: '2026-02-21T10:00:00Z', notes: 'Updated' }
        mockCollection.update.mockResolvedValue(mockResponse)

        await useTimeClockStore.getState().updateRecord('r1', { notes: 'Updated' })

        const state = useTimeClockStore.getState()
        expect(state.records.find(r => r.id === 'r1')?.notes).toBe('Updated')
        expect(state.records.find(r => r.id === 'r2')?.notes).toBe('Other')
    })

    it('should delete record successfully', async () => {
        mockCollection.delete.mockResolvedValue(true)
        useTimeClockStore.setState({ records: [{ id: 'r1' } as any] })

        await useTimeClockStore.getState().deleteRecord('r1')

        expect(mockCollection.delete).toHaveBeenCalledWith('r1')
        const state = useTimeClockStore.getState()
        expect(state.records).toHaveLength(0)
    })

    it('should clock in and keep records sorted', async () => {
        useTimeClockStore.setState({ records: [{ id: 'r2', timestamp: '2026-02-21T12:00:00Z' } as any] })
        const mockResponse = { id: 'r1', type: 'start', timestamp: '2026-02-21T10:00:00Z' }
        mockCollection.create.mockResolvedValue(mockResponse)

        await useTimeClockStore.getState().clockIn()

        const state = useTimeClockStore.getState()
        expect(state.records).toHaveLength(2)
        expect(state.records[0].id).toBe('r1') // Should be first due to earlier timestamp
        expect(state.records[1].id).toBe('r2')
    })

    it('should clock out/add manual entry and keep records sorted', async () => {
        useTimeClockStore.setState({ records: [{ id: 'r1', timestamp: '2026-02-21T10:00:00Z' } as any] })

        // Clock out earlier than another record (just for sort testing)
        mockCollection.create.mockResolvedValue({ id: 'r0', timestamp: '2026-02-21T09:00:00Z' })
        await useTimeClockStore.getState().clockOut()
        expect(useTimeClockStore.getState().records[0].id).toBe('r0')

        // Manual record
        mockCollection.create.mockResolvedValue({ id: 'r3', timestamp: '2026-02-21T11:00:00Z' })
        await useTimeClockStore.getState().addManualEntry({ type: 'finish', timestamp: '2026-02-21T11:00:00Z' })
        expect(useTimeClockStore.getState().records[2].id).toBe('r3')
    })

    it('should handle errors in all actions', async () => {
        mockCollection.create.mockRejectedValue(new Error('Create error'))
        await useTimeClockStore.getState().clockIn()
        expect(useTimeClockStore.getState().error).toBe('Create error')

        await useTimeClockStore.getState().clockOut()
        expect(useTimeClockStore.getState().error).toBe('Create error')

        await useTimeClockStore.getState().addManualEntry({} as any)
        expect(useTimeClockStore.getState().error).toBe('Create error')

        mockCollection.update.mockRejectedValue(new Error('Update error'))
        await useTimeClockStore.getState().updateRecord('1', {})
        expect(useTimeClockStore.getState().error).toBe('Update error')

        mockCollection.delete.mockRejectedValue(new Error('Delete error'))
        await useTimeClockStore.getState().deleteRecord('1')
        expect(useTimeClockStore.getState().error).toBe('Delete error')
    })

    it('should handle missing user or company in actions', async () => {
        // @ts-ignore
        useStore.getState.mockReturnValue({ user: null, activeCompanyId: null })

        await useTimeClockStore.getState().clockIn()
        await useTimeClockStore.getState().clockOut()
        await useTimeClockStore.getState().addManualEntry({} as any)

        expect(mockCollection.create).not.toHaveBeenCalled()
    })

    describe('markDayAs', () => {
        const testDate = new Date('2026-02-21T10:00:00Z')

        it('should create a new special record if none exists', async () => {
            mockCollection.getFullList.mockResolvedValue([])
            mockCollection.create.mockResolvedValue({ id: 'new', type: 'holiday' })

            await useTimeClockStore.getState().markDayAs(testDate, 'holiday')

            expect(mockCollection.create).toHaveBeenCalledWith(expect.objectContaining({
                type: 'holiday',
                is_manual_entry: true
            }))
        })

        it('should update existing special record if one exists', async () => {
            const existing = { id: 'ext1', type: 'holiday' }
            useTimeClockStore.setState({ records: [existing as any] })
            mockCollection.getFullList.mockResolvedValue([{ ...existing, type: 'leave' }])

            await useTimeClockStore.getState().markDayAs(testDate, 'leave')

            expect(mockCollection.update).toHaveBeenCalledWith('ext1', { type: 'leave' })
        })

        it('should remove special record if type is work', async () => {
            const existing = { id: 'ext1', type: 'holiday' }
            useTimeClockStore.setState({ records: [existing as any] })
            mockCollection.getFullList.mockResolvedValue([])

            await useTimeClockStore.getState().markDayAs(testDate, 'work')

            expect(mockCollection.delete).toHaveBeenCalledWith('ext1')
        })

        it('should handle errors in markDayAs', async () => {
            mockCollection.create.mockRejectedValue(new Error('Mark error'))
            await useTimeClockStore.getState().markDayAs(testDate, 'holiday')
            expect(useTimeClockStore.getState().error).toBe('Mark error')
        })
    })
})

