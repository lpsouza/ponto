import { describe, it, expect } from 'vitest'
import {
    getTrackerState,
    getWorkSegments,
    calculateTotalWorkedMs,
    formatDuration,
    formatTime,
    toDatetimeLocalString,
    TimeRecord,
} from './timeCalculations'

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

describe('getTrackerState', () => {
    it('returns idle with entry action when no records', () => {
        const result = getTrackerState([])
        expect(result.status).toBe('idle')
        expect(result.allowedActions).toEqual(['start'])
    })

    it('returns working with exit action after entry', () => {
        const records = [makeRecord('start', '2026-02-16T09:00:00Z')]
        const result = getTrackerState(records)
        expect(result.status).toBe('working')
        expect(result.allowedActions).toEqual(['finish'])
    })

    it('returns idle with entry action after exit', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('finish', '2026-02-16T12:00:00Z'),
        ]
        const result = getTrackerState(records)
        expect(result.status).toBe('idle')
        expect(result.allowedActions).toEqual(['start'])
    })

    it('returns working after multiple blocks when last is entry', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('finish', '2026-02-16T12:00:00Z'),
            makeRecord('start', '2026-02-16T13:00:00Z'),
        ]
        const result = getTrackerState(records)
        expect(result.status).toBe('working')
        expect(result.allowedActions).toEqual(['finish'])
    })

    it('returns idle after multiple completed blocks', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('finish', '2026-02-16T12:00:00Z'),
            makeRecord('start', '2026-02-16T13:00:00Z'),
            makeRecord('finish', '2026-02-16T18:00:00Z'),
        ]
        const result = getTrackerState(records)
        expect(result.status).toBe('idle')
    })

    it('sorts by timestamp regardless of array order', () => {
        const records = [
            makeRecord('finish', '2026-02-16T18:00:00Z'),
            makeRecord('start', '2026-02-16T09:00:00Z'),
        ]
        const result = getTrackerState(records)
        expect(result.status).toBe('idle')
    })
})

describe('getWorkSegments', () => {
    it('returns empty array for no records', () => {
        expect(getWorkSegments([])).toEqual([])
    })

    it('returns a single complete segment', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('finish', '2026-02-16T18:00:00Z'),
        ]
        const segments = getWorkSegments(records)
        expect(segments).toHaveLength(1)
        expect(segments[0].start).toEqual(new Date('2026-02-16T09:00:00Z'))
        expect(segments[0].end).toEqual(new Date('2026-02-16T18:00:00Z'))
    })

    it('returns multiple work blocks', () => {
        const records = [
            makeRecord('start', '2026-02-16T08:00:00Z'),
            makeRecord('finish', '2026-02-16T12:00:00Z'),
            makeRecord('start', '2026-02-16T13:00:00Z'),
            makeRecord('finish', '2026-02-16T15:30:00Z'),
            makeRecord('start', '2026-02-16T16:00:00Z'),
            makeRecord('finish', '2026-02-16T18:00:00Z'),
        ]
        const segments = getWorkSegments(records)
        expect(segments).toHaveLength(3)
        // Block 1: 08:00 - 12:00
        expect(segments[0].start).toEqual(new Date('2026-02-16T08:00:00Z'))
        expect(segments[0].end).toEqual(new Date('2026-02-16T12:00:00Z'))
        // Block 2: 13:00 - 15:30
        expect(segments[1].start).toEqual(new Date('2026-02-16T13:00:00Z'))
        expect(segments[1].end).toEqual(new Date('2026-02-16T15:30:00Z'))
        // Block 3: 16:00 - 18:00
        expect(segments[2].start).toEqual(new Date('2026-02-16T16:00:00Z'))
        expect(segments[2].end).toEqual(new Date('2026-02-16T18:00:00Z'))
    })

    it('returns open segment when currently working', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
        ]
        const segments = getWorkSegments(records)
        expect(segments).toHaveLength(1)
        expect(segments[0].start).toEqual(new Date('2026-02-16T09:00:00Z'))
        expect(segments[0].end).toBeNull()
    })

    it('handles open segment after completed blocks', () => {
        const records = [
            makeRecord('start', '2026-02-16T08:00:00Z'),
            makeRecord('finish', '2026-02-16T12:00:00Z'),
            makeRecord('start', '2026-02-16T13:00:00Z'),
        ]
        const segments = getWorkSegments(records)
        expect(segments).toHaveLength(2)
        expect(segments[0].end).toEqual(new Date('2026-02-16T12:00:00Z'))
        expect(segments[1].start).toEqual(new Date('2026-02-16T13:00:00Z'))
        expect(segments[1].end).toBeNull()
    })
})

describe('calculateTotalWorkedMs', () => {
    it('returns 0 for no records', () => {
        expect(calculateTotalWorkedMs([])).toBe(0)
    })

    it('calculates a single completed block correctly', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('finish', '2026-02-16T17:00:00Z'), // 8 hours
        ]
        const ms = calculateTotalWorkedMs(records)
        expect(ms).toBe(8 * 60 * 60 * 1000)
    })

    it('calculates active block using now parameter', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
        ]
        const now = new Date('2026-02-16T11:00:00Z') // 2 hours later
        const ms = calculateTotalWorkedMs(records, now)
        expect(ms).toBe(2 * 60 * 60 * 1000)
    })

    it('sums multiple work blocks correctly', () => {
        const records = [
            makeRecord('start', '2026-02-16T08:00:00Z'),
            makeRecord('finish', '2026-02-16T12:00:00Z'),   // 4h
            makeRecord('start', '2026-02-16T13:00:00Z'),
            makeRecord('finish', '2026-02-16T15:30:00Z'),   // 2h30
            makeRecord('start', '2026-02-16T16:00:00Z'),
            makeRecord('finish', '2026-02-16T18:00:00Z'),   // 2h
        ]
        const ms = calculateTotalWorkedMs(records)
        // Total: 4h + 2h30 + 2h = 8h30 = 8.5 hours
        expect(ms).toBe(8.5 * 60 * 60 * 1000)
    })

    it('handles manual time edits correctly', () => {
        const records = [
            makeRecord('start', '2026-02-16T08:45:00Z', { is_manual_entry: true }),
            makeRecord('finish', '2026-02-16T17:00:00Z'),
        ]
        const ms = calculateTotalWorkedMs(records)
        // 8h 15min
        expect(ms).toBe((8 * 60 + 15) * 60 * 1000)
    })

    it('handles multiple blocks with active segment', () => {
        const records = [
            makeRecord('start', '2026-02-16T08:00:00Z'),
            makeRecord('finish', '2026-02-16T12:00:00Z'),   // 4h
            makeRecord('start', '2026-02-16T13:00:00Z'),   // active
        ]
        const now = new Date('2026-02-16T15:00:00Z') // 2h into second block
        const ms = calculateTotalWorkedMs(records, now)
        // Total: 4h + 2h = 6h
        expect(ms).toBe(6 * 60 * 60 * 1000)
    })
})

describe('formatDuration', () => {
    it('formats 0 ms', () => {
        expect(formatDuration(0)).toBe('00:00:00')
    })

    it('formats negative ms as 00:00:00', () => {
        expect(formatDuration(-5000)).toBe('00:00:00')
    })

    it('formats seconds', () => {
        expect(formatDuration(45 * 1000)).toBe('00:00:45')
    })

    it('formats minutes and seconds', () => {
        expect(formatDuration((5 * 60 + 30) * 1000)).toBe('00:05:30')
    })

    it('formats hours, minutes and seconds', () => {
        expect(formatDuration((8 * 3600 + 15 * 60 + 30) * 1000)).toBe('08:15:30')
    })

    it('formats double-digit hours', () => {
        expect(formatDuration(12 * 3600 * 1000)).toBe('12:00:00')
    })
})

describe('formatTime', () => {
    it('formats a date to HH:MM', () => {
        const date = new Date('2026-02-16T14:30:00Z')
        const result = formatTime(date)
        expect(result).toBeTruthy()
        expect(result.length).toBeGreaterThanOrEqual(5)
    })
})

describe('toDatetimeLocalString', () => {
    it('formats a date for datetime-local input', () => {
        const date = new Date(2026, 1, 16, 14, 30) // Feb 16, 2026 14:30 local
        const result = toDatetimeLocalString(date)
        expect(result).toBe('2026-02-16T14:30')
    })

    it('pads single-digit months and days', () => {
        const date = new Date(2026, 0, 5, 9, 5) // Jan 5, 2026 09:05 local
        const result = toDatetimeLocalString(date)
        expect(result).toBe('2026-01-05T09:05')
    })
})
