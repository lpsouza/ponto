import { useCallback, useEffect, useState } from 'react'
import { pb } from '../../lib/pocketbase'
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

        try {
            const data = await pb.collection('time_records').getFullList({
                filter: `company_id = "${companyId}" && timestamp >= "${startDate.toISOString()}" && timestamp <= "${endDate.toISOString()}"`,
                sort: 'timestamp',
            })
            setRecords(data as TimeRecord[])
        } catch (error) {
            console.error('Error fetching dashboard records:', error)
        }

        setLoading(false)
    }, [user, companyId, year, month])

    useEffect(() => {
        fetchRecords()
    }, [fetchRecords])

    return { records, loading, refreshRecords: fetchRecords }
}
