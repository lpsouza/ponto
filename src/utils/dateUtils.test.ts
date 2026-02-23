import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isToday, shiftDate, formatDateForInput, formatTimeForInput, parseDateTime, getLocalDateString, formatForPB, parsePBDate, isWeekend, getMinutesFromTime, calculateTimeOverlap } from './dateUtils'

describe('dateUtils', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-02-21T18:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })
    describe('isToday', () => {
        it('should return true for today', () => {
            expect(isToday(new Date())).toBe(true)
        })

        it('should return false for yesterday', () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            expect(isToday(yesterday)).toBe(false)
        })
    })

    describe('shiftDate', () => {
        it('should shift date forward', () => {
            const base = new Date('2026-02-21T10:00:00Z')
            const shifted = shiftDate(base, 1)
            expect(shifted.toISOString()).toContain('2026-02-22')
        })

        it('should shift date backward', () => {
            const base = new Date('2026-02-21T10:00:00Z')
            const shifted = shiftDate(base, -1)
            expect(shifted.toISOString()).toContain('2026-02-20')
        })
    })

    describe('formatDateForInput', () => {
        it('should return YYYY-MM-DD', () => {
            const date = new Date('2026-02-21T10:00:00Z')
            expect(formatDateForInput(date)).toBe('2026-02-21')
        })
    })

    describe('formatTimeForInput', () => {
        it('should return HH:mm in pt-BR format', () => {
            // Use a date with known local time behavior or mock locale
            const date = new Date(2026, 1, 21, 14, 30) // Feb 21, 2026, 14:30
            expect(formatTimeForInput(date)).toBe('14:30')
        })
    })

    describe('parseDateTime', () => {
        it('should parse date and time into a single Date object', () => {
            const parsed = parseDateTime('2026-02-21', '14:30')
            expect(parsed.getFullYear()).toBe(2026)
            expect(parsed.getMonth()).toBe(1) // February
            expect(parsed.getDate()).toBe(21)
            expect(parsed.getHours()).toBe(14)
            expect(parsed.getMinutes()).toBe(30)
        })
    })

    describe('getLocalDateString', () => {
        it('should return YYYY-MM-DD', () => {
            const date = new Date(2026, 1, 21)
            expect(getLocalDateString(date)).toBe('2026-02-21')
        })
    })

    describe('formatForPB', () => {
        it('should return PocketBase format', () => {
            const date = new Date('2026-02-21T18:00:00Z')
            expect(formatForPB(date)).toBe('2026-02-21 18:00:00.000')
        })
    })

    describe('parsePBDate', () => {
        it('should parse PB format with space', () => {
            const date = parsePBDate('2026-02-21 18:00:00')
            expect(date.toISOString()).toBe('2026-02-21T18:00:00.000Z')
        })

        it('should parse ISO format', () => {
            const date = parsePBDate('2026-02-21T18:00:00Z')
            expect(date.toISOString()).toBe('2026-02-21T18:00:00.000Z')
        })

        it('should return new Date for empty input', () => {
            const date = parsePBDate('')
            expect(date).toBeInstanceOf(Date)
        })
    })

    describe('isWeekend', () => {
        it('should return true for Saturday', () => {
            const saturday = new Date('2026-02-21T10:00:00Z')
            expect(isWeekend(saturday)).toBe(true)
        })

        it('should return true for Sunday', () => {
            const sunday = new Date('2026-02-22T10:00:00Z')
            expect(isWeekend(sunday)).toBe(true)
        })

        it('should return false for Monday', () => {
            const monday = new Date('2026-02-23T10:00:00Z')
            expect(isWeekend(monday)).toBe(false)
        })
    })

    describe('getMinutesFromTime', () => {
        it('should return minutes from start of day', () => {
            expect(getMinutesFromTime('08:30')).toBe(510)
            expect(getMinutesFromTime('14:45')).toBe(885)
            expect(getMinutesFromTime('00:00')).toBe(0)
            expect(getMinutesFromTime('23:59')).toBe(1439)
        })
    })

    describe('calculateTimeOverlap', () => {
        const rangeStart = '08:00'
        const rangeEnd = '18:00'

        it('should calculate partial overlap', () => {
            const start = new Date(2026, 1, 21, 7, 0)
            const end = new Date(2026, 1, 21, 9, 0)
            const overlap = calculateTimeOverlap(start, end, rangeStart, rangeEnd)
            expect(overlap).toBe(60 * 60 * 1000) // 1 hour (08:00 to 09:00)
        })

        it('should calculate full overlap', () => {
            const start = new Date(2026, 1, 21, 9, 0)
            const end = new Date(2026, 1, 21, 17, 0)
            const overlap = calculateTimeOverlap(start, end, rangeStart, rangeEnd)
            expect(overlap).toBe(8 * 60 * 60 * 1000)
        })

        it('should calculate zero overlap', () => {
            const start = new Date(2026, 1, 21, 19, 0)
            const end = new Date(2026, 1, 21, 21, 0)
            const overlap = calculateTimeOverlap(start, end, rangeStart, rangeEnd)
            expect(overlap).toBe(0)
        })

        it('should handle ranges crossing midnight', () => {
            const nightShiftStart = '22:00'
            const nightShiftEnd = '06:00'
            const start = new Date(2026, 1, 21, 23, 0)
            const end = new Date(2026, 1, 22, 1, 0)
            const overlap = calculateTimeOverlap(start, end, nightShiftStart, nightShiftEnd)
            expect(overlap).toBe(2 * 60 * 60 * 1000)
        })

        it('should handle block crossing midnight in normal range', () => {
            const start = new Date(2026, 1, 21, 23, 0)
            const end = new Date(2026, 1, 22, 9, 0)
            const overlap = calculateTimeOverlap(start, end, '08:00', '18:00')
            expect(overlap).toBe(60 * 60 * 1000) // 08:00 to 09:00 on the next day
        })
    })

})

