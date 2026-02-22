import { create } from 'zustand'
import { pb } from '../../../lib/pocketbase'
import { useStore } from '../../../store/useStore'
import type { TimeRecord, Company } from '../../../types/pocketbase-types'
import { calculateDashboardStats } from '../utils/dashboard-calculations'
import type { DashboardStats } from '../utils/dashboard-calculations'
import { formatForPB } from '../../../utils/dateUtils'
import { CLT_DEFAULTS } from '../../../lib/constants'

interface DashboardState {
    stats: DashboardStats | null
    isLoading: boolean
    error: string | null
    fetchPeriodStats: (startDate: Date, endDate: Date) => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
    stats: null,
    isLoading: false,
    error: null,

    fetchPeriodStats: async (startDate, endDate) => {
        const { activeCompanyId, user } = useStore.getState()
        if (!activeCompanyId || !user) {
            set({ stats: null })
            return
        }

        set({ isLoading: true, error: null })
        try {
            // 1. Fetch Company for settings
            const company = await pb.collection('companies').getOne<Company>(activeCompanyId)
            const settings = company.settings || CLT_DEFAULTS

            // 2. Fetch Records
            const records = await pb.collection('time_records').getFullList<TimeRecord>({
                filter: `company = "${activeCompanyId}" && user = "${user.id}" && timestamp >= "${formatForPB(startDate)}" && timestamp <= "${formatForPB(endDate)}"`,
                sort: 'timestamp'
            })

            // 3. Calculate Stats
            const stats = calculateDashboardStats(records, startDate, endDate, settings)
            set({ stats, isLoading: false })
        } catch (err: any) {
            set({ error: err.message, isLoading: false })
        }
    }
}))
