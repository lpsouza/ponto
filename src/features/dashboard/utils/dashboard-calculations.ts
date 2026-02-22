import type { TimeRecord } from '../../../types/pocketbase-types'
import { calculateTotalDuration } from '../../time_clock/utils/calculations'
import { getLocalDateString, parsePBDate } from '../../../utils/dateUtils'

export interface DailySummary {
    date: string // YYYY-MM-DD
    totalDuration: number // ms
    balance: number // ms (actual - target)
    isBurnoutRisk: boolean
}

export interface DashboardStats {
    totalBalance: number // Total accumulated progress in the period
    dailySummaries: DailySummary[]
    targetDailyMs: number
}

const TARGET_DAILY_HOURS = 8
const BURNOUT_THRESHOLD_HOURS = 10

/**
 * Groups records by day and calculates summaries.
 */
export const calculateDashboardStats = (
    records: TimeRecord[],
    targetHours: number = TARGET_DAILY_HOURS
): DashboardStats => {
    const targetDailyMs = targetHours * 60 * 60 * 1000
    const recordsByDay: Record<string, TimeRecord[]> = {}

    records.forEach(record => {
        const date = getLocalDateString(parsePBDate(record.timestamp))
        if (!recordsByDay[date]) {
            recordsByDay[date] = []
        }
        recordsByDay[date].push(record)
    })

    const dailySummaries: DailySummary[] = Object.keys(recordsByDay)
        .sort()
        .map(date => {
            const dayRecords = recordsByDay[date]
            const totalDuration = calculateTotalDuration(dayRecords)
            const balance = totalDuration - targetDailyMs
            const isBurnoutRisk = totalDuration > BURNOUT_THRESHOLD_HOURS * 60 * 60 * 1000

            return {
                date,
                totalDuration,
                balance,
                isBurnoutRisk
            }
        })

    const totalBalance = dailySummaries.reduce((sum, day) => sum + day.balance, 0)

    return {
        totalBalance,
        dailySummaries,
        targetDailyMs
    }
}
