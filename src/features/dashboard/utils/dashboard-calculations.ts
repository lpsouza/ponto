import type { TimeRecord, CompanySettings } from '../../../types/pocketbase-types'
import { calculateTotalDuration } from '../../time_clock/utils/calculations'
import { getLocalDateString, parsePBDate, shiftDate } from '../../../utils/dateUtils'
import { CLT_DEFAULTS } from '../../../lib/constants'

export interface DailySummary {
    date: string // YYYY-MM-DD
    totalDuration: number // ms
    balance: number // ms (actual - target)
    isBurnoutRisk: boolean
    type: 'work' | 'holiday' | 'leave' | 'compensation' | 'absence'
}

export interface DashboardStats {
    totalBalance: number // Total accumulated progress in the period
    dailySummaries: DailySummary[]
    targetDailyMs: number
}

const BURNOUT_THRESHOLD_HOURS = 10

/**
 * Groups records by day and calculates summaries for ALL days in the given range.
 */
export const calculateDashboardStats = (
    records: TimeRecord[],
    startDate: Date,
    endDate: Date,
    settings: CompanySettings = CLT_DEFAULTS
): DashboardStats => {
    const dailySummaries: DailySummary[] = []
    const recordsByDay: Record<string, TimeRecord[]> = {}

    // Group existing records by day
    records.forEach(record => {
        const date = getLocalDateString(parsePBDate(record.timestamp))
        if (!recordsByDay[date]) recordsByDay[date] = []
        recordsByDay[date].push(record)
    })

    // Iterate through EVERY day in the range
    let current = new Date(startDate)
    current.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    while (current <= end) {
        const dateStr = getLocalDateString(current)
        const dayRecords = recordsByDay[dateStr] || []

        // 1. Determine day type from records
        let dayType: DailySummary['type'] = 'work'
        if (dayRecords.some(r => r.type === 'holiday')) dayType = 'holiday'
        else if (dayRecords.some(r => r.type === 'leave')) dayType = 'leave'
        else if (dayRecords.some(r => r.type === 'compensation')) dayType = 'compensation'
        else if (dayRecords.length === 0) {
            // Check if it's a work day
            const isWorkDay = settings.work_days.includes(current.getDay())
            dayType = isWorkDay ? 'absence' : 'work'
        }

        // 2. Calculate target for the day
        let dailyTarget = settings.daily_target_ms
        if (dayType === 'holiday' || dayType === 'work' && !settings.work_days.includes(current.getDay())) {
            dailyTarget = 0
        }

        // 3. Calculate worked duration
        // For 'leave' (Abonada), the calculation happens inside calculateTotalDuration
        const totalDuration = calculateTotalDuration(dayRecords, settings)

        // 4. Calculate balance
        // If it's a 'compensation' (Folga compensada), the target remains, 
        // and worked is 0, so balance = -target (discounting from bank)
        // If it's an 'absence', same thing.
        const balance = totalDuration - dailyTarget

        const isBurnoutRisk = totalDuration > BURNOUT_THRESHOLD_HOURS * 60 * 60 * 1000

        dailySummaries.push({
            date: dateStr,
            totalDuration,
            balance,
            isBurnoutRisk,
            type: dayType
        })

        current = shiftDate(current, 1)
    }

    const totalBalance = dailySummaries.reduce((sum, day) => sum + day.balance, 0)

    return {
        totalBalance,
        dailySummaries,
        targetDailyMs: settings.daily_target_ms
    }
}
