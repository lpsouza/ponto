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
    addManualEntry: (data: { type: 'start' | 'pause' | 'resume' | 'finish' | 'leave' | 'holiday' | 'compensation', timestamp: string, notes?: string, location?: string }) => Promise<void>
    updateRecord: (id: string, data: Partial<TimeRecord>) => Promise<void>
    deleteRecord: (id: string) => Promise<void>
    markDayAs: (date: Date, type: 'holiday' | 'leave' | 'compensation' | 'work') => Promise<void>
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
    },

    markDayAs: async (date, type) => {
        const { activeCompanyId, user } = useStore.getState()
        const { records } = useTimeClockStore.getState()
        if (!activeCompanyId || !user) return

        set({ isLoading: true, error: null })
        try {
            // 1. Find existing special records for this day
            const specialTypes = ['holiday', 'leave', 'compensation']
            const existingSpecial = records.find((r: TimeRecord) => specialTypes.includes(r.type))

            if (type === 'work') {
                // Remove special record if it exists
                if (existingSpecial) {
                    await pb.collection('time_records').delete(existingSpecial.id)
                }
            } else {
                if (existingSpecial) {
                    // Update existing
                    await pb.collection('time_records').update(existingSpecial.id, { type })
                } else {
                    // Create new
                    await pb.collection('time_records').create({
                        user: user.id,
                        company: activeCompanyId,
                        type,
                        timestamp: date.toISOString(),
                        is_manual_entry: true
                    })
                }
            }

            // 2. Refetch records for the day to ensure state consistency
            // We use the same fetchRecords logic but internally
            const startOfDay = new Date(date)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(date)
            endOfDay.setHours(23, 59, 59, 999)

            const updatedRecords = await pb.collection('time_records').getFullList<TimeRecord>({
                filter: `company = "${activeCompanyId}" && user = "${user.id}" && timestamp >= "${formatForPB(startOfDay)}" && timestamp <= "${formatForPB(endOfDay)}"`,
                sort: 'timestamp'
            })

            set({ records: updatedRecords, isLoading: false })
        } catch (err: any) {
            set({ error: err.message, isLoading: false })
        }
    }
}))
