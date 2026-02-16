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
    it('returns idle with start action when no records', () => {
        const result = getTrackerState([])
        expect(result.status).toBe('idle')
        expect(result.allowedActions).toEqual(['start'])
    })

    it('returns working with pause/finish after start', () => {
        const records = [makeRecord('start', '2026-02-16T09:00:00Z')]
        const result = getTrackerState(records)
        expect(result.status).toBe('working')
        expect(result.allowedActions).toContain('pause')
        expect(result.allowedActions).toContain('finish')
    })

    it('returns paused with resume/finish after pause', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('pause', '2026-02-16T12:00:00Z'),
        ]
        const result = getTrackerState(records)
        expect(result.status).toBe('paused')
        expect(result.allowedActions).toContain('resume')
        expect(result.allowedActions).toContain('finish')
    })

    it('returns working after resume', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('pause', '2026-02-16T12:00:00Z'),
            makeRecord('resume', '2026-02-16T13:00:00Z'),
        ]
        const result = getTrackerState(records)
        expect(result.status).toBe('working')
    })

    it('returns finished after finish', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('finish', '2026-02-16T18:00:00Z'),
        ]
        const result = getTrackerState(records)
        expect(result.status).toBe('finished')
        expect(result.allowedActions).toEqual(['start'])
    })

    it('sorts by timestamp regardless of array order', () => {
        const records = [
            makeRecord('finish', '2026-02-16T18:00:00Z'),
            makeRecord('start', '2026-02-16T09:00:00Z'),
        ]
        const result = getTrackerState(records)
        expect(result.status).toBe('finished')
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

    it('returns multiple segments with a pause', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('pause', '2026-02-16T12:00:00Z'),
            makeRecord('resume', '2026-02-16T13:00:00Z'),
            makeRecord('finish', '2026-02-16T18:00:00Z'),
        ]
        const segments = getWorkSegments(records)
        expect(segments).toHaveLength(2)
        // First segment: 09:00 - 12:00
        expect(segments[0].start).toEqual(new Date('2026-02-16T09:00:00Z'))
        expect(segments[0].end).toEqual(new Date('2026-02-16T12:00:00Z'))
        // Second segment: 13:00 - 18:00
        expect(segments[1].start).toEqual(new Date('2026-02-16T13:00:00Z'))
        expect(segments[1].end).toEqual(new Date('2026-02-16T18:00:00Z'))
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
})

describe('calculateTotalWorkedMs', () => {
    it('returns 0 for no records', () => {
        expect(calculateTotalWorkedMs([])).toBe(0)
    })

    it('calculates completed segment correctly', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('finish', '2026-02-16T17:00:00Z'), // 8 hours
        ]
        const ms = calculateTotalWorkedMs(records)
        expect(ms).toBe(8 * 60 * 60 * 1000)
    })

    it('calculates active segment using now parameter', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
        ]
        const now = new Date('2026-02-16T11:00:00Z') // 2 hours later
        const ms = calculateTotalWorkedMs(records, now)
        expect(ms).toBe(2 * 60 * 60 * 1000)
    })

    it('excludes paused time from total', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('pause', '2026-02-16T12:00:00Z'), // 3 hours worked
            makeRecord('resume', '2026-02-16T13:00:00Z'), // 1 hour paused
            makeRecord('finish', '2026-02-16T17:00:00Z'), // 4 hours worked
        ]
        const ms = calculateTotalWorkedMs(records)
        // Total: 3h + 4h = 7h
        expect(ms).toBe(7 * 60 * 60 * 1000)
    })

    it('handles manual time edits correctly', () => {
        // Scenario from SPEC: Start timer -> Manually change start time -> Verify total
        const records = [
            makeRecord('start', '2026-02-16T08:45:00Z', { is_manual_entry: true }), // Edited to 15 min earlier
            makeRecord('finish', '2026-02-16T17:00:00Z'),
        ]
        const ms = calculateTotalWorkedMs(records)
        // 8h 15min
        expect(ms).toBe((8 * 60 + 15) * 60 * 1000)
    })

    it('handles multiple pauses correctly', () => {
        const records = [
            makeRecord('start', '2026-02-16T09:00:00Z'),
            makeRecord('pause', '2026-02-16T10:30:00Z'), // 1.5h worked
            makeRecord('resume', '2026-02-16T10:45:00Z'), // 15min pause
            makeRecord('pause', '2026-02-16T12:00:00Z'), // 1.25h worked
            makeRecord('resume', '2026-02-16T13:00:00Z'), // 1h pause
            makeRecord('finish', '2026-02-16T17:00:00Z'), // 4h worked
        ]
        const ms = calculateTotalWorkedMs(records)
        // Total: 1.5 + 1.25 + 4 = 6.75h = 6h45min
        expect(ms).toBe((6 * 60 + 45) * 60 * 1000)
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
        // This will depend on locale; we just verify it returns a non-empty string
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
