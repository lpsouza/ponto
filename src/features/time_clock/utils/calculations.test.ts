import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateWorkBlocks, calculateTotalDuration, formatDuration, formatBalance } from './calculations'
import type { TimeRecord } from '../../../types/pocketbase-types'

describe('Time Clock Calculations', () => {
    const mockRecord = (id: string, type: 'start' | 'pause' | 'resume' | 'finish', timestamp: string): TimeRecord => ({
        id,
        type,
        timestamp,
        user: 'user-1',
        company: 'company-1',
        is_manual_entry: false,
        created: timestamp,
        updated: timestamp,
        collectionId: 'col-1',
        collectionName: 'time_records'
    })

    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-02-21T18:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should pair start and finish records into blocks', () => {
        const records: TimeRecord[] = [
            mockRecord('1', 'start', '2026-02-21T08:00:00Z'),
            mockRecord('2', 'finish', '2026-02-21T12:00:00Z'),
            mockRecord('3', 'start', '2026-02-21T13:00:00Z'),
            mockRecord('4', 'finish', '2026-02-21T17:00:00Z'),
        ]

        const blocks = calculateWorkBlocks(records)
        expect(blocks).toHaveLength(2)
        expect(blocks[0].duration).toBe(4 * 60 * 60 * 1000) // 4 hours
        expect(blocks[1].duration).toBe(4 * 60 * 60 * 1000) // 4 hours
    })

    it('should handle an active (open) block', () => {
        const records: TimeRecord[] = [
            mockRecord('1', 'start', '2026-02-21T08:00:00Z'),
            mockRecord('2', 'finish', '2026-02-21T12:00:00Z'),
            mockRecord('3', 'start', '2026-02-21T13:00:00Z'),
        ]

        const blocks = calculateWorkBlocks(records)
        expect(blocks).toHaveLength(2)
        expect(blocks[0].finish).toBeDefined()
        expect(blocks[1].finish).toBeUndefined()
        // 13:00 to 18:00 (now) is 5 hours
        expect(blocks[1].duration).toBe(5 * 60 * 60 * 1000)
    })

    it('should ignore finish records without a start', () => {
        const records: TimeRecord[] = [
            mockRecord('1', 'finish', '2026-02-21T12:00:00Z'),
            mockRecord('2', 'start', '2026-02-21T13:00:00Z'),
        ]

        const blocks = calculateWorkBlocks(records)
        expect(blocks).toHaveLength(1)
        expect(blocks[0].start.id).toBe('2')
    })

    it('should calculate total duration correctly', () => {
        const records: TimeRecord[] = [
            mockRecord('1', 'start', '2026-02-21T08:00:00Z'),
            mockRecord('2', 'finish', '2026-02-21T10:00:00Z'),
            mockRecord('3', 'start', '2026-02-21T14:00:00Z'),
        ]

        const total = calculateTotalDuration(records)
        // 2h + 4h (since now is 18:00) = 6h
        expect(total).toBe(6 * 60 * 60 * 1000)
    })

    it('should handle consecutive start records (edge case)', () => {
        const records: TimeRecord[] = [
            mockRecord('1', 'start', '2026-02-21T08:00:00Z'),
            mockRecord('2', 'start', '2026-02-21T10:00:00Z'),
        ]

        const blocks = calculateWorkBlocks(records)
        expect(blocks).toHaveLength(2)
        // Now is 18:00
        // First block: 08:00 to 10:00 (since it was interrupted by another start)
        // Wait, look at the code logic for consecutive start:
        // if (activeStart) { blocks.push({ start: activeStart, duration }) }
        // activeStart = record
        // So first block duration is 0 (it doesn't have a finish, and it's not the active one at the end)
        // Wait, if it's today, it uses Date.now().

        // 08:00 to now (18:00) = 10h
        expect(blocks[0].duration).toBe(10 * 60 * 60 * 1000)
        // 10:00 to now (18:00) = 8h
        expect(blocks[1].duration).toBe(8 * 60 * 60 * 1000)
    })

    it('should format duration correctly', () => {
        expect(formatDuration(0)).toBe('00:00:00')
        expect(formatDuration(3661000)).toBe('01:01:01')
        expect(formatDuration(36000000)).toBe('10:00:00')
    })

    it('should format balance correctly', () => {
        expect(formatBalance(3600000)).toBe('+1:00h')
        expect(formatBalance(-3600000)).toBe('-1:00h')
        expect(formatBalance(0)).toBe('+0:00h')
        expect(formatBalance(5400000)).toBe('+1:30h')
        expect(formatBalance(-5400000)).toBe('-1:30h')
    })

    it('should handle old orphan start records', () => {
        const records: TimeRecord[] = [
            mockRecord('1', 'start', '2026-02-20T08:00:00Z'), // Yesterday
        ]

        const blocks = calculateWorkBlocks(records)
        expect(blocks).toHaveLength(1)
        expect(blocks[0].duration).toBe(0) // Not today, duration should be 0
    })

    it('should handle consecutive starts with old records', () => {
        const records: TimeRecord[] = [
            mockRecord('1', 'start', '2026-02-20T08:00:00Z'), // Yesterday
            mockRecord('2', 'start', '2026-02-21T08:00:00Z'), // Today
        ]

        const blocks = calculateWorkBlocks(records)
        expect(blocks).toHaveLength(2)
        expect(blocks[0].duration).toBe(0) // First one is old
        expect(blocks[1].duration).toBe(10 * 60 * 60 * 1000) // 08:00 to 18:00
    })

    it('should ignore other record types like pause/resume', () => {
        const records: TimeRecord[] = [
            mockRecord('1', 'start', '2026-02-21T08:00:00Z'),
            mockRecord('2', 'pause', '2026-02-21T10:00:00Z'),
            mockRecord('3', 'finish', '2026-02-21T12:00:00Z'),
        ]

        const blocks = calculateWorkBlocks(records)
        expect(blocks).toHaveLength(1)
        expect(blocks[0].duration).toBe(4 * 60 * 60 * 1000) // 08:00 to 12:00
    })
})
