import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { TimeRecord } from '../timeclock/timeCalculations'

/**
 * Hook to fetch time records for a given company and date range.
 * Used by the dashboard to compute monthly reports and daily balances.
 */
export function useDashboardRecords(companyId: string | null, year: number, month: number) {
    const { user } = useAuth()
    const [records, setRecords] = useState<TimeRecord[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRecords = useCallback(async () => {
        if (!user || !companyId) {
            setRecords([])
            setLoading(false)
            return
        }

        setLoading(true)

        // Build date range for the month
        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

        const { data, error } = await supabase
            .from('time_records')
            .select('*')
            .eq('company_id', companyId)
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString())
            .order('timestamp', { ascending: true })

        if (error) {
            console.error('Error fetching dashboard records:', error)
        } else {
            setRecords(data as TimeRecord[])
        }

        setLoading(false)
    }, [user, companyId, year, month])

    useEffect(() => {
        fetchRecords()
    }, [fetchRecords])

    return { records, loading, refreshRecords: fetchRecords }
}
