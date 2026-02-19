import { describe, it, expect } from 'vitest'
import { TimeRecord } from '../timeclock/timeCalculations'
import {
    groupRecordsByDate,
    formatDateKey,
    calculateDayWorkedMs,
    calculateDailyBalance,
    isBurnoutDay,
    countBurnoutDays,
    calculateNetBalance,
    getDailyDataList,
    generateHeatmapData,
    formatBalance,
    formatHoursDecimal,
    generateCsvContent,
    DEFAULT_DAILY_HOURS,
    BURNOUT_THRESHOLD_HOURS,
} from './dashboardCalculations'

// Helper to create a TimeRecord with minimal required fields
function makeRecord(
    type: TimeRecord['type'],
    timestamp: string,
    overrides?: Partial<TimeRecord>
): TimeRecord {
    return {
        id: crypto.randomUUID(),
        user_id: 'user-1',
        company_id: 'company-1',
        timestamp,
        type,
        is_manual_entry: false,
        notes: null,
        location: null,
        device_time: null,
        created_at: timestamp,
        ...overrides,
    }
}

const MS_PER_HOUR = 3_600_000

describe('formatDateKey', () => {
    it('formats a date to YYYY-MM-DD', () => {
        const date = new Date(2026, 1, 16) // Feb 16, 2026
        expect(formatDateKey(date)).toBe('2026-02-16')
    })

    it('pads single-digit month and day', () => {
        const date = new Date(2026, 0, 5) // Jan 5, 2026
        expect(formatDateKey(date)).toBe('2026-01-05')
    })
})

describe('groupRecordsByDate', () => {
    it('returns empty map for no records', () => {
        const groups = groupRecordsByDate([])
        expect(groups.size).toBe(0)
    })

    it('groups records from the same day together', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00'),
            makeRecord('finish', '2026-02-16T18:00:00'),
        ]
        const groups = groupRecordsByDate(records)
        expect(groups.size).toBe(1)
        expect(groups.get('2026-02-16')?.length).toBe(2)
    })

    it('separates records from different days', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00'),
            makeRecord('finish', '2026-02-16T18:00:00'),
            makeRecord('start', '2026-02-17T09:00:00'),
            makeRecord('finish', '2026-02-17T18:00:00'),
        ]
        const groups = groupRecordsByDate(records)
        expect(groups.size).toBe(2)
        expect(groups.has('2026-02-16')).toBe(true)
        expect(groups.has('2026-02-17')).toBe(true)
    })
})

describe('calculateDayWorkedMs', () => {
    it('returns 0 for no records', () => {
        expect(calculateDayWorkedMs([])).toBe(0)
    })

    it('calculates a full day correctly', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00'),
            makeRecord('finish', '2026-02-16T17:00:00'),
        ]
        expect(calculateDayWorkedMs(records)).toBe(8 * MS_PER_HOUR)
    })

    it('sums multiple work blocks', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00'),
            makeRecord('finish', '2026-02-16T12:00:00'),
            makeRecord('start', '2026-02-16T13:00:00'),
            makeRecord('finish', '2026-02-16T17:00:00'),
        ]
        // 3h + 4h = 7h
        expect(calculateDayWorkedMs(records)).toBe(7 * MS_PER_HOUR)
    })
})

describe('calculateDailyBalance', () => {
    it('returns positive balance when working overtime', () => {
        const records = [
            makeRecord('start', '2026-02-16T08:00:00'),
            makeRecord('finish', '2026-02-16T18:00:00'),
        ]
        const result = calculateDailyBalance(records, DEFAULT_DAILY_HOURS)
        // Worked 10h, expected 8h, balance +2h
        expect(result.workedMs).toBe(10 * MS_PER_HOUR)
        expect(result.expectedMs).toBe(8 * MS_PER_HOUR)
        expect(result.balanceMs).toBe(2 * MS_PER_HOUR)
        expect(result.date).toBe('2026-02-16')
    })

    it('returns negative balance when underworking', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00'),
            makeRecord('finish', '2026-02-16T15:00:00'),
        ]
        const result = calculateDailyBalance(records, DEFAULT_DAILY_HOURS)
        // Worked 6h, expected 8h, balance -2h
        expect(result.balanceMs).toBe(-2 * MS_PER_HOUR)
    })

    it('returns zero balance when exact hours met', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00'),
            makeRecord('finish', '2026-02-16T17:00:00'),
        ]
        const result = calculateDailyBalance(records, DEFAULT_DAILY_HOURS)
        expect(result.balanceMs).toBe(0)
    })

    it('respects custom expected hours', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00'),
            makeRecord('finish', '2026-02-16T15:00:00'),
        ]
        const result = calculateDailyBalance(records, 6) // Custom 6h/day
        expect(result.balanceMs).toBe(0) // 6h worked = 6h expected
    })

    it('includes records in the result', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00'),
            makeRecord('finish', '2026-02-16T17:00:00'),
        ]
        const result = calculateDailyBalance(records)
        expect(result.records).toHaveLength(2)
    })
})

describe('isBurnoutDay', () => {
    it('returns false for normal hours', () => {
        expect(isBurnoutDay(8 * MS_PER_HOUR)).toBe(false)
    })

    it('returns true at exactly threshold', () => {
        expect(isBurnoutDay(BURNOUT_THRESHOLD_HOURS * MS_PER_HOUR)).toBe(true)
    })

    it('returns true for exceeding threshold', () => {
        expect(isBurnoutDay(12 * MS_PER_HOUR)).toBe(true)
    })
})

describe('countBurnoutDays', () => {
    it('returns 0 for no data', () => {
        expect(countBurnoutDays([])).toBe(0)
    })

    it('counts burnout days correctly', () => {
        const dailyDataList = [
            { date: '2026-02-16', workedMs: 8 * MS_PER_HOUR, expectedMs: 8 * MS_PER_HOUR, balanceMs: 0, records: [] },
            { date: '2026-02-17', workedMs: 11 * MS_PER_HOUR, expectedMs: 8 * MS_PER_HOUR, balanceMs: 3 * MS_PER_HOUR, records: [] },
            { date: '2026-02-18', workedMs: 10 * MS_PER_HOUR, expectedMs: 8 * MS_PER_HOUR, balanceMs: 2 * MS_PER_HOUR, records: [] },
        ]
        expect(countBurnoutDays(dailyDataList)).toBe(2)
    })
})

describe('calculateNetBalance', () => {
    it('returns 0 for no records', () => {
        expect(calculateNetBalance([])).toBe(0)
    })

    it('calculates accumulated balance across multiple days', () => {
        const records = [
            // Day 1: 10h (balance +2h)
            makeRecord('start', '2026-02-16T08:00:00'),
            makeRecord('finish', '2026-02-16T18:00:00'),
            // Day 2: 6h (balance -2h)
            makeRecord('start', '2026-02-17T09:00:00'),
            makeRecord('finish', '2026-02-17T15:00:00'),
        ]
        // Net: +2h + -2h = 0
        expect(calculateNetBalance(records, DEFAULT_DAILY_HOURS)).toBe(0)
    })

    it('returns positive net balance', () => {
        const records = [
            // Day 1: 10h (balance +2h)
            makeRecord('start', '2026-02-16T08:00:00'),
            makeRecord('finish', '2026-02-16T18:00:00'),
            // Day 2: 9h (balance +1h)
            makeRecord('start', '2026-02-17T08:00:00'),
            makeRecord('finish', '2026-02-17T17:00:00'),
        ]
        // Net: +2h + +1h = +3h
        expect(calculateNetBalance(records, DEFAULT_DAILY_HOURS)).toBe(3 * MS_PER_HOUR)
    })
})

describe('getDailyDataList', () => {
    it('returns empty array for no records', () => {
        expect(getDailyDataList([])).toEqual([])
    })

    it('returns sorted daily data', () => {
        const records = [
            makeRecord('start', '2026-02-17T09:00:00'),
            makeRecord('finish', '2026-02-17T17:00:00'),
            makeRecord('start', '2026-02-16T09:00:00'),
            makeRecord('finish', '2026-02-16T17:00:00'),
        ]
        const data = getDailyDataList(records, DEFAULT_DAILY_HOURS)
        expect(data).toHaveLength(2)
        expect(data[0].date).toBe('2026-02-16')
        expect(data[1].date).toBe('2026-02-17')
    })
})

describe('generateHeatmapData', () => {
    it('returns correct number of cells for a month', () => {
        const cells = generateHeatmapData([], 2026, 1) // February 2026
        expect(cells).toHaveLength(28)
    })

    it('returns all zero intensity for no records', () => {
        const cells = generateHeatmapData([], 2026, 1)
        expect(cells.every(c => c.intensity === 0)).toBe(true)
        expect(cells.every(c => c.workedHours === 0)).toBe(true)
    })

    it('assigns intensity based on worked hours', () => {
        const records = [
            makeRecord('start', '2026-02-16T08:00:00'),
            makeRecord('finish', '2026-02-16T18:00:00'), // 10h
        ]
        const cells = generateHeatmapData(records, 2026, 1) // February
        const feb16 = cells.find(c => c.date === '2026-02-16')
        expect(feb16).toBeDefined()
        expect(feb16!.workedHours).toBe(10)
        expect(feb16!.intensity).toBe(4) // Only day = max intensity
    })

    it('scales intensity across multiple days', () => {
        const records = [
            // Day 1: 10h (max)
            makeRecord('start', '2026-02-16T08:00:00'),
            makeRecord('finish', '2026-02-16T18:00:00'),
            // Day 2: 5h (half)
            makeRecord('start', '2026-02-17T09:00:00'),
            makeRecord('finish', '2026-02-17T14:00:00'),
        ]
        const cells = generateHeatmapData(records, 2026, 1)
        const feb16 = cells.find(c => c.date === '2026-02-16')
        const feb17 = cells.find(c => c.date === '2026-02-17')
        expect(feb16!.intensity).toBe(4) // Max
        expect(feb17!.intensity).toBe(2) // 5/10 * 4 = 2
    })

    it('handles 31-day months', () => {
        const cells = generateHeatmapData([], 2026, 0) // January
        expect(cells).toHaveLength(31)
    })
})

describe('formatBalance', () => {
    it('formats positive balance', () => {
        expect(formatBalance(2 * MS_PER_HOUR)).toBe('+2:00h')
    })

    it('formats negative balance', () => {
        expect(formatBalance(-1.5 * MS_PER_HOUR)).toBe('-1:30h')
    })

    it('formats zero balance', () => {
        expect(formatBalance(0)).toBe('+0:00h')
    })

    it('formats minutes only', () => {
        expect(formatBalance(30 * 60_000)).toBe('+0:30h')
    })

    it('formats large balance', () => {
        expect(formatBalance(12 * MS_PER_HOUR + 45 * 60_000)).toBe('+12:45h')
    })
})

describe('formatHoursDecimal', () => {
    it('formats 8 hours', () => {
        expect(formatHoursDecimal(8 * MS_PER_HOUR)).toBe('8.00h')
    })

    it('formats fractional hours', () => {
        expect(formatHoursDecimal(7.5 * MS_PER_HOUR)).toBe('7.50h')
    })

    it('formats zero', () => {
        expect(formatHoursDecimal(0)).toBe('0.00h')
    })
})

describe('generateCsvContent', () => {
    it('returns header only for empty data', () => {
        const csv = generateCsvContent([])
        expect(csv).toBe('Date,Worked (hours),Expected (hours),Balance (hours)')
    })

    it('generates correct CSV rows', () => {
        const dailyData = [
            {
                date: '2026-02-16',
                workedMs: 10 * MS_PER_HOUR,
                expectedMs: 8 * MS_PER_HOUR,
                balanceMs: 2 * MS_PER_HOUR,
                records: [],
            },
            {
                date: '2026-02-17',
                workedMs: 6 * MS_PER_HOUR,
                expectedMs: 8 * MS_PER_HOUR,
                balanceMs: -2 * MS_PER_HOUR,
                records: [],
            },
        ]
        const csv = generateCsvContent(dailyData)
        const lines = csv.split('\n')
        expect(lines).toHaveLength(3)
        expect(lines[0]).toBe('Date,Worked (hours),Expected (hours),Balance (hours)')
        expect(lines[1]).toBe('2026-02-16,10.00,8.00,2.00')
        expect(lines[2]).toBe('2026-02-17,6.00,8.00,-2.00')
    })
})

describe('company context filtering', () => {
    it('calculates total worked time per company context', () => {
        const companyARecords = [
            makeRecord('start', '2026-02-16T09:00:00', { company_id: 'company-a' }),
            makeRecord('finish', '2026-02-16T17:00:00', { company_id: 'company-a' }),
        ]
        const companyBRecords = [
            makeRecord('start', '2026-02-16T09:00:00', { company_id: 'company-b' }),
            makeRecord('finish', '2026-02-16T15:00:00', { company_id: 'company-b' }),
        ]

        // The hook filters by company_id before passing records here
        // So we verify independent calculation per company
        expect(calculateDayWorkedMs(companyARecords)).toBe(8 * MS_PER_HOUR)
        expect(calculateDayWorkedMs(companyBRecords)).toBe(6 * MS_PER_HOUR)
    })

    it('calculates multiple work blocks correctly per context', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00'),
            makeRecord('finish', '2026-02-16T12:00:00'),   // 3h
            makeRecord('start', '2026-02-16T13:00:00'),
            makeRecord('finish', '2026-02-16T15:00:00'),   // 2h
            makeRecord('start', '2026-02-16T15:30:00'),
            makeRecord('finish', '2026-02-16T18:00:00'),   // 2.5h
        ]
        // Total worked: 3 + 2 + 2.5 = 7.5h
        expect(calculateDayWorkedMs(records)).toBe(7.5 * MS_PER_HOUR)
    })
})
