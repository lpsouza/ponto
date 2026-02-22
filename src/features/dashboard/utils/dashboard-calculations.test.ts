import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateDashboardStats } from './dashboard-calculations'
import type { TimeRecord } from '../../../types/pocketbase-types'

describe('calculateDashboardStats', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-03-20T12:00:00Z'))
    })

    it('should group records by day and calculate balance correctly', () => {
        // Use local dates (Months are 0-indexed: 2 = March)
        const startDate = new Date(2024, 2, 1)
        const endDate = new Date(2024, 2, 2)
        const settings = {
            work_days: [1, 2, 3, 4, 5],
            daily_target_ms: 8 * 60 * 60 * 1000,
            holidays: [],
            multipliers: { weekend: 2 }
        }

        const records: TimeRecord[] = [
            // Day 1: 2024-03-01 (Friday) - 9 hours worked (+1h balance)
            {
                id: '1',
                type: 'start',
                timestamp: new Date(2024, 2, 1, 8, 0).toISOString(),
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
                timestamp: new Date(2024, 2, 1, 17, 0).toISOString(),
                company: 'c1',
                user: 'u1',
                is_manual_entry: false,
                collectionId: '',
                collectionName: '',
                created: '',
                updated: ''
            },
            // Day 2: 2024-03-02 (Saturday) - 6 hours worked (+12h balance because weekend extra)
            {
                id: '3',
                type: 'start',
                timestamp: new Date(2024, 2, 2, 9, 0).toISOString(),
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
                timestamp: new Date(2024, 2, 2, 15, 0).toISOString(),
                company: 'c1',
                user: 'u1',
                is_manual_entry: false,
                collectionId: '',
                collectionName: '',
                created: '',
                updated: ''
            }
        ]

        const stats = calculateDashboardStats(records, startDate, endDate, settings)

        expect(stats.dailySummaries).toHaveLength(2)

        // Day 1 (Work day)
        expect(stats.dailySummaries[0].date).toBe('2024-03-01')
        expect(stats.dailySummaries[0].totalDuration).toBe(9 * 60 * 60 * 1000)
        expect(stats.dailySummaries[0].balance).toBe(1 * 60 * 60 * 1000)

        // Day 2 (Weekend - Saturday)
        expect(stats.dailySummaries[1].date).toBe('2024-03-02')
        expect(stats.dailySummaries[1].totalDuration).toBe(12 * 60 * 60 * 1000)
        expect(stats.dailySummaries[1].balance).toBe(12 * 60 * 60 * 1000)

        // Total
        expect(stats.totalBalance).toBe(13 * 60 * 60 * 1000)
    })

    it('should identify burnout risk if working > 10h', () => {
        const startDate = new Date(2024, 2, 1)
        const endDate = new Date(2024, 2, 1)

        const records: TimeRecord[] = [
            {
                id: '1',
                type: 'start',
                timestamp: new Date(2024, 2, 1, 8, 0).toISOString(),
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
                timestamp: new Date(2024, 2, 1, 19, 0).toISOString(),
                company: 'c1',
                user: 'u1',
                is_manual_entry: false,
                collectionId: '',
                collectionName: '',
                created: '',
                updated: ''
            }
        ]

        const stats = calculateDashboardStats(records, startDate, endDate)
        expect(stats.dailySummaries[0].isBurnoutRisk).toBe(true)
    })
})
