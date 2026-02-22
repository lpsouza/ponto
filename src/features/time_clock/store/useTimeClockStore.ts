import type { TimeRecord } from '../../../types/pocketbase-types'
import { create } from 'zustand'
import { pb } from '../../../lib/pocketbase'
import { useStore } from '../../../store/useStore'
import { formatForPB } from '../../../utils/dateUtils'

interface TimeClockState {
    records: TimeRecord[]
    isLoading: boolean
    error: string | null
    fetchRecords: (date: Date) => Promise<void>
    clockIn: (notes?: string) => Promise<void>
    clockOut: (notes?: string) => Promise<void>
    addManualEntry: (data: { type: 'start' | 'pause' | 'resume' | 'finish', timestamp: string, notes?: string, location?: string }) => Promise<void>
    updateRecord: (id: string, data: Partial<TimeRecord>) => Promise<void>
    deleteRecord: (id: string) => Promise<void>
}

export const useTimeClockStore = create<TimeClockState>((set) => ({
    records: [],
    isLoading: false,
    error: null,

    fetchRecords: async (date) => {
        const { activeCompanyId, user } = useStore.getState()
        if (!activeCompanyId || !user) {
            set({ records: [] })
            return
        }

        set({ isLoading: true, error: null })
        try {
            // Create date range for the day in local time
            const startOfDay = new Date(date)
            startOfDay.setHours(0, 0, 0, 0)

            const endOfDay = new Date(date)
            endOfDay.setHours(23, 59, 59, 999)

            const records = await pb.collection('time_records').getFullList<TimeRecord>({
                filter: `company = "${activeCompanyId}" && user = "${user.id}" && timestamp >= "${formatForPB(startOfDay)}" && timestamp <= "${formatForPB(endOfDay)}"`,
                sort: 'timestamp'
            })

            set({ records, isLoading: false })
        } catch (err: any) {
            set({ error: err.message, isLoading: false })
        }
    },

    clockIn: async (notes) => {
        const { activeCompanyId, user } = useStore.getState()
        if (!activeCompanyId || !user) return

        set({ isLoading: true, error: null })
        try {
            const record = await pb.collection('time_records').create<TimeRecord>({
                user: user.id,
                company: activeCompanyId,
                type: 'start',
                timestamp: new Date().toISOString(),
                is_manual_entry: false,
                notes
            })
            set(state => ({
                records: [...state.records, record].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
                isLoading: false
            }))
        } catch (err: any) {
            set({ error: err.message, isLoading: false })
        }
    },

    clockOut: async (notes) => {
        const { activeCompanyId, user } = useStore.getState()
        if (!activeCompanyId || !user) return

        set({ isLoading: true, error: null })
        try {
            const record = await pb.collection('time_records').create<TimeRecord>({
                user: user.id,
                company: activeCompanyId,
                type: 'finish',
                timestamp: new Date().toISOString(),
                is_manual_entry: false,
                notes
            })
            set(state => ({
                records: [...state.records, record].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
                isLoading: false
            }))
        } catch (err: any) {
            set({ error: err.message, isLoading: false })
        }
    },

    addManualEntry: async (data) => {
        const { activeCompanyId, user } = useStore.getState()
        if (!activeCompanyId || !user) return

        set({ isLoading: true, error: null })
        try {
            const record = await pb.collection('time_records').create<TimeRecord>({
                user: user.id,
                company: activeCompanyId,
                ...data,
                is_manual_entry: true
            })
            set(state => ({
                records: [...state.records, record].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
                isLoading: false
            }))
        } catch (err: any) {
            set({ error: err.message, isLoading: false })
        }
    },

    updateRecord: async (id, data) => {
        set({ isLoading: true, error: null })
        try {
            const record = await pb.collection('time_records').update<TimeRecord>(id, data)
            set(state => ({
                records: state.records.map(r => r.id === id ? record : r).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
                isLoading: false
            }))
        } catch (err: any) {
            set({ error: err.message, isLoading: false })
        }
    },

    deleteRecord: async (id) => {
        set({ isLoading: true, error: null })
        try {
            await pb.collection('time_records').delete(id)
            set(state => ({
                records: state.records.filter(r => r.id !== id),
                isLoading: false
            }))
        } catch (err: any) {
            set({ error: err.message, isLoading: false })
        }
    }
}))
