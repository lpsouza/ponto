import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateDashboardStats } from './dashboard-calculations'
import type { TimeRecord } from '../../../types/pocketbase-types'

describe('calculateDashboardStats', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-03-20T12:00:00Z'))
    })

    it('should group records by day and calculate balance correctly', () => {
        const targetHours = 8

        const records: TimeRecord[] = [
            // Day 1: 9 hours worked (+1h balance)
            {
                id: '1',
                type: 'start',
                timestamp: '2024-03-01T08:00:00Z',
                company: 'c1',
                user: 'u1',
                is_manual_entry: false,
                collectionId: '',
                collectionName: '',
                created: '',
                updated: ''
            },
            {
                id: '2',
                type: 'finish',
                timestamp: '2024-03-01T17:00:00Z',
                company: 'c1',
                user: 'u1',
                is_manual_entry: false,
                collectionId: '',
                collectionName: '',
                created: '',
                updated: ''
            },
            // Day 2: 6 hours worked (-2h balance)
            {
                id: '3',
                type: 'start',
                timestamp: '2024-03-02T09:00:00Z',
                company: 'c1',
                user: 'u1',
                is_manual_entry: false,
                collectionId: '',
                collectionName: '',
                created: '',
                updated: ''
            },
            {
                id: '4',
                type: 'finish',
                timestamp: '2024-03-02T15:00:00Z',
                company: 'c1',
                user: 'u1',
                is_manual_entry: false,
                collectionId: '',
                collectionName: '',
                created: '',
                updated: ''
            }
        ]

        const stats = calculateDashboardStats(records, targetHours)

        expect(stats.dailySummaries).toHaveLength(2)

        // Day 1
        expect(stats.dailySummaries[0].date).toBe('2024-03-01')
        expect(stats.dailySummaries[0].totalDuration).toBe(9 * 60 * 60 * 1000)
        expect(stats.dailySummaries[0].balance).toBe(1 * 60 * 60 * 1000)

        // Day 2
        expect(stats.dailySummaries[1].date).toBe('2024-03-02')
        expect(stats.dailySummaries[1].totalDuration).toBe(6 * 60 * 60 * 1000)
        expect(stats.dailySummaries[1].balance).toBe(-2 * 60 * 60 * 1000)

        // Total
        expect(stats.totalBalance).toBe(-1 * 60 * 60 * 1000)
    })

    it('should identify burnout risk if working > 10h', () => {
        const records: TimeRecord[] = [
            {
                id: '1',
                type: 'start',
                timestamp: '2024-03-01T08:00:00Z',
                company: 'c1',
                user: 'u1',
                is_manual_entry: false,
                collectionId: '',
                collectionName: '',
                created: '',
                updated: ''
            },
            {
                id: '2',
                type: 'finish',
                timestamp: '2024-03-01T19:00:00Z',
                company: 'c1',
                user: 'u1',
                is_manual_entry: false,
                collectionId: '',
                collectionName: '',
                created: '',
                updated: ''
            }
        ]

        const stats = calculateDashboardStats(records, 8)
        expect(stats.dailySummaries[0].isBurnoutRisk).toBe(true)
    })
})
