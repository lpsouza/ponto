import { useCallback, useEffect, useRef, useState } from 'react'
import { pb } from '../../lib/pocketbase'
import { TimeRecordsRecord } from '../../types/pocketbase.types'
import { useAuth } from '../auth/AuthProvider'
import { TimeRecord, TimeRecordType } from './timeCalculations'

export type InsertTimeRecord = Omit<TimeRecordsRecord, 'id' | 'created' | 'updated'>
export type UpdateTimeRecord = Partial<InsertTimeRecord>

const DEBOUNCE_MS = 1000

/**
 * Hook to manage time records for a specific company on the current date.
 * Implements optimistic UI: local state is updated first, then synced to Supabase.
 */
export function useTimeRecords(companyId: string | null, date: Date = new Date()) {
    const { user } = useAuth()
    const [records, setRecords] = useState<TimeRecord[]>([])
    const [loading, setLoading] = useState(true)
    const lastActionRef = useRef<number>(0)

    const fetchRecords = useCallback(async () => {
        if (!user || !companyId) {
            setRecords([])
            setLoading(false)
            return
        }

        // Fetch records for the specific date
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        try {
            const data = await pb.collection('time_records').getFullList({
                filter: `company_id = "${companyId}" && timestamp >= "${startOfDay.toISOString()}" && timestamp <= "${endOfDay.toISOString()}"`,
                sort: 'timestamp',
            })
            setRecords(data as TimeRecord[])
        } catch (error) {
            console.error('Error fetching time records:', error)
        }
        setLoading(false)
    }, [user, companyId, date])

    useEffect(() => {
        setLoading(true)
        fetchRecords()
    }, [fetchRecords])

    const addRecord = useCallback(async (
        type: TimeRecordType,
        options?: {
            timestamp?: string
            isManual?: boolean
            notes?: string
            location?: string
        }
    ) => {
        if (!user || !companyId) throw new Error('User or company not set')

        // Debounce protection
        const now = Date.now()
        if (now - lastActionRef.current < DEBOUNCE_MS) {
            console.warn('Action debounced')
            return null
        }
        lastActionRef.current = now

        // If no timestamp is provided, use current time if today, or default to noon of selected date?
        // Actually, for "start/stop" buttons, we usually mean "RIGHT NOW".
        // But if we are viewing a past date, "start/stop" might not make sense or should default to that date's context?
        // Let's assume buttons are for "Now" unless manual entry.
        // HOWEVER, the requirement says "Manual Entry form defaults to currently selected date".
        // The buttons (Start/Stop) should probably always be "Now" regardless of view, OR disabled if viewing past.
        // Let's keep "Start/Stop" as "Now" for simplicity, and manual entry for past dates.

        const deviceTime = new Date().toISOString()
        const timestamp = options?.timestamp || deviceTime

        const payload: InsertTimeRecord = {
            user_id: user.id,
            company_id: companyId,
            type,
            timestamp,
            is_manual_entry: options?.isManual || false,
            notes: options?.notes || undefined,
            location: options?.location || undefined,
            device_time: deviceTime,
        }

        // Optimistic: add to local state immediately with a temporary ID
        const optimisticRecord: TimeRecord = {
            id: crypto.randomUUID(),
            user_id: payload.user_id,
            company_id: payload.company_id,
            timestamp: payload.timestamp!,
            type: payload.type,
            is_manual_entry: payload.is_manual_entry!,
            notes: payload.notes ?? undefined,
            location: payload.location ?? undefined,
            device_time: payload.device_time ?? undefined,
            created: deviceTime,
        }

        setRecords((prev) => {
            // Only add optimistically if the date matches the viewed date
            const recDate = new Date(optimisticRecord.timestamp)
            const viewDate = new Date(date)
            const isSameDay = recDate.toDateString() === viewDate.toDateString()

            if (isSameDay) {
                return [...prev, optimisticRecord].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            }
            return prev
        })

        console.log('[DEBUG] Inserting time_record:', payload);

        // Sync to PocketBase
        try {
            const data = await pb.collection('time_records').create<TimeRecord>(payload)

            // Replace optimistic record with server record
            setRecords((prev) =>
                prev.map((r) => (r.id === optimisticRecord.id ? data : r))
            )

            return data
        } catch (error) {
            console.error('Error creating time record:', error)
            // Rollback optimistic update
            setRecords((prev) => prev.filter((r) => r.id !== optimisticRecord.id))
            throw error
        }
    }, [user, companyId, date])

    const updateRecord = useCallback(async (id: string, updates: Omit<UpdateTimeRecord, 'id' | 'user_id'>) => {
        try {
            const data = await pb.collection('time_records').update<TimeRecord>(id, { ...updates, is_manual_entry: true })
            setRecords((prev) => prev.map((r) => (r.id === id ? data : r)))
            return data
        } catch (error) {
            console.error('Error updating time record:', error)
            throw error
        }
    }, [])

    const deleteRecord = useCallback(async (id: string) => {
        // Optimistic removal
        const prev = records
        setRecords((current) => current.filter((r) => r.id !== id))

        try {
            await pb.collection('time_records').delete(id)
        } catch (error) {
            console.error('Error deleting time record:', error)
            setRecords(prev) // Rollback
            throw error
        }
    }, [records])

    return {
        records,
        loading,
        addRecord,
        updateRecord,
        deleteRecord,
        refreshRecords: fetchRecords,
    }
}
