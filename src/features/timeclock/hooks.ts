import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Database } from '../../types/database.types'
import { useAuth } from '../auth/AuthProvider'
import { TimeRecord, TimeRecordType } from './timeCalculations'

export type InsertTimeRecord = Database['public']['Tables']['time_records']['Insert']
export type UpdateTimeRecord = Database['public']['Tables']['time_records']['Update']

const DEBOUNCE_MS = 1000

/**
 * Hook to manage time records for a specific company on the current date.
 * Implements optimistic UI: local state is updated first, then synced to Supabase.
 */
export function useTimeRecords(companyId: string | null) {
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

        // Fetch today's records for the active company
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
            .from('time_records')
            .select('*')
            .eq('company_id', companyId)
            .gte('timestamp', todayStart.toISOString())
            .lte('timestamp', todayEnd.toISOString())
            .order('timestamp', { ascending: true })

        if (error) {
            console.error('Error fetching time records:', error)
        } else {
            setRecords(data as TimeRecord[])
        }
        setLoading(false)
    }, [user, companyId])

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

        const deviceTime = new Date().toISOString()
        const payload: InsertTimeRecord = {
            user_id: user.id,
            company_id: companyId,
            type,
            timestamp: options?.timestamp || deviceTime,
            is_manual_entry: options?.isManual || false,
            notes: options?.notes || null,
            location: options?.location || null,
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
            notes: payload.notes ?? null,
            location: payload.location ?? null,
            device_time: payload.device_time ?? null,
            created_at: deviceTime,
        }

        setRecords((prev) => [...prev, optimisticRecord])

        console.log('[DEBUG] Inserting time_record:', payload);

        // Sync to Supabase
        const { data, error } = await supabase
            .from('time_records')
            // @ts-ignore
            .insert(payload)
            .select()
            .single()

        if (error) {
            console.error('Error creating time record:', error)
            // Rollback optimistic update
            setRecords((prev) => prev.filter((r) => r.id !== optimisticRecord.id))
            throw error
        }

        // Replace optimistic record with server record
        setRecords((prev) =>
            prev.map((r) => (r.id === optimisticRecord.id ? (data as TimeRecord) : r))
        )

        return data as TimeRecord
    }, [user, companyId])

    const updateRecord = useCallback(async (id: string, updates: Omit<UpdateTimeRecord, 'id' | 'user_id'>) => {
        const { data, error } = await supabase
            .from('time_records')
            // @ts-ignore
            .update({ ...updates, is_manual_entry: true })
            // @ts-ignore
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating time record:', error)
            throw error
        }

        setRecords((prev) => prev.map((r) => (r.id === id ? (data as TimeRecord) : r)))
        return data as TimeRecord
    }, [])

    const deleteRecord = useCallback(async (id: string) => {
        // Optimistic removal
        const prev = records
        setRecords((current) => current.filter((r) => r.id !== id))

        const { error } = await supabase
            .from('time_records')
            .delete()
            .eq('id', id)

        if (error) {
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
