import type { CompanySettings } from '../types/pocketbase-types'

export const CLT_DEFAULTS: CompanySettings = {
    work_days: [1, 2, 3, 4, 5], // Seg-Sex
    daily_target_ms: 8 * 60 * 60 * 1000, // 8h
    holidays: [],
    multipliers: {
        night: {
            start: '22:00',
            end: '05:00',
            value: 1.1428 // 1 / (52.5/60)
        },
        weekend: 2.0 // 100% extra
    }
}
