import { TimeRecord, getWorkSegments } from '../timeclock/timeCalculations'

/**
 * Default expected daily work hours in milliseconds (8h).
 */
export const DEFAULT_DAILY_HOURS = 8
export const BURNOUT_THRESHOLD_HOURS = 10
const MS_PER_HOUR = 3_600_000

/**
 * Aggregated data for a single day.
 */
export interface DailyData {
    date: string // YYYY-MM-DD
    workedMs: number
    expectedMs: number
    balanceMs: number
    records: TimeRecord[]
}

/**
 * A single cell in the monthly heatmap.
 */
export interface HeatmapCell {
    date: string // YYYY-MM-DD
    workedHours: number
    intensity: number // 0-4 scale for heatmap coloring
}

/**
 * Groups time records by date (YYYY-MM-DD) using the record's local timestamp.
 */
export function groupRecordsByDate(records: TimeRecord[]): Map<string, TimeRecord[]> {
    const groups = new Map<string, TimeRecord[]>()

    for (const record of records) {
        const date = new Date(record.timestamp)
        const key = formatDateKey(date)

        if (!groups.has(key)) {
            groups.set(key, [])
        }
        groups.get(key)!.push(record)
    }

    return groups
}

/**
 * Formats a Date into a YYYY-MM-DD string using local time.
 */
export function formatDateKey(date: Date): string {
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${d}`
}

/**
 * Calculates total worked milliseconds from a set of records for a single day.
 */
export function calculateDayWorkedMs(records: TimeRecord[]): number {
    const segments = getWorkSegments(records)

    return segments.reduce((total, segment) => {
        const end = segment.end ?? new Date()
        return total + (end.getTime() - segment.start.getTime())
    }, 0)
}

/**
 * Calculates the daily balance (worked - expected) in milliseconds.
 */
export function calculateDailyBalance(
    records: TimeRecord[],
    expectedHours: number = DEFAULT_DAILY_HOURS
): DailyData {
    const workedMs = calculateDayWorkedMs(records)
    const expectedMs = expectedHours * MS_PER_HOUR
    const balanceMs = workedMs - expectedMs

    // Derive date from the first record's timestamp
    const date = records.length > 0
        ? formatDateKey(new Date(records[0].timestamp))
        : formatDateKey(new Date())

    return {
        date,
        workedMs,
        expectedMs,
        balanceMs,
        records,
    }
}

/**
 * Determines if the day's work exceeds the burnout threshold.
 */
export function isBurnoutDay(workedMs: number): boolean {
    return workedMs >= BURNOUT_THRESHOLD_HOURS * MS_PER_HOUR
}

/**
 * Counts how many days in a list exceed the burnout threshold.
 */
export function countBurnoutDays(dailyDataList: DailyData[]): number {
    return dailyDataList.filter(d => isBurnoutDay(d.workedMs)).length
}

/**
 * Calculates the net accumulated balance for a period.
 */
export function calculateNetBalance(
    records: TimeRecord[],
    expectedHoursPerDay: number = DEFAULT_DAILY_HOURS
): number {
    const groups = groupRecordsByDate(records)
    let totalBalance = 0

    for (const [, dayRecords] of groups) {
        const daily = calculateDailyBalance(dayRecords, expectedHoursPerDay)
        totalBalance += daily.balanceMs
    }

    return totalBalance
}

/**
 * Gets daily data for each day in a period from a set of records.
 */
export function getDailyDataList(
    records: TimeRecord[],
    expectedHoursPerDay: number = DEFAULT_DAILY_HOURS
): DailyData[] {
    const groups = groupRecordsByDate(records)
    const result: DailyData[] = []

    for (const [, dayRecords] of groups) {
        result.push(calculateDailyBalance(dayRecords, expectedHoursPerDay))
    }

    // Sort by date ascending
    result.sort((a, b) => a.date.localeCompare(b.date))

    return result
}

/**
 * Generates heatmap cells for a given month.
 * Each cell represents a day with its worked hours and intensity level (0-4).
 * Days without records get intensity 0.
 */
export function generateHeatmapData(
    records: TimeRecord[],
    year: number,
    month: number // 0-indexed (0 = January)
): HeatmapCell[] {
    const groups = groupRecordsByDate(records)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: HeatmapCell[] = []

    // Find max worked hours for intensity scaling
    let maxHours = 0
    const workedMap = new Map<string, number>()

    for (const [dateKey, dayRecords] of groups) {
        const workedMs = calculateDayWorkedMs(dayRecords)
        const workedHours = workedMs / MS_PER_HOUR
        workedMap.set(dateKey, workedHours)
        if (workedHours > maxHours) maxHours = workedHours
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        const workedHours = workedMap.get(dateKey) ?? 0
        const intensity = maxHours > 0
            ? Math.min(4, Math.ceil((workedHours / maxHours) * 4))
            : 0

        cells.push({
            date: dateKey,
            workedHours: Math.round(workedHours * 100) / 100,
            intensity: workedHours === 0 ? 0 : intensity,
        })
    }

    return cells
}

/**
 * Formats a balance in milliseconds to a signed string like "+2:30h" or "-1:00h".
 */
export function formatBalance(balanceMs: number): string {
    const sign = balanceMs >= 0 ? '+' : '-'
    const absMs = Math.abs(balanceMs)
    const totalMinutes = Math.floor(absMs / 60_000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${sign}${hours}:${minutes.toString().padStart(2, '0')}h`
}

/**
 * Formats milliseconds to decimal hours string (e.g., "8.50h").
 */
export function formatHoursDecimal(ms: number): string {
    const hours = ms / MS_PER_HOUR
    return `${hours.toFixed(2)}h`
}

/**
 * Generates CSV content from daily data for export.
 * Columns: Date, Worked (hours), Expected (hours), Balance (hours)
 */
export function generateCsvContent(dailyDataList: DailyData[]): string {
    const header = 'Date,Worked (hours),Expected (hours),Balance (hours)'
    const rows = dailyDataList.map(d => {
        const worked = (d.workedMs / MS_PER_HOUR).toFixed(2)
        const expected = (d.expectedMs / MS_PER_HOUR).toFixed(2)
        const balance = (d.balanceMs / MS_PER_HOUR).toFixed(2)
        return `${d.date},${worked},${expected},${balance}`
    })

    return [header, ...rows].join('\n')
}

/**
 * Triggers a browser download of a CSV file.
 */
export function downloadCsv(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}
