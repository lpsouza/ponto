import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isToday, shiftDate, formatDateForInput, formatTimeForInput, parseDateTime } from './dateUtils'

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
})
