export const CollectionName = {
    Users: 'users',
    Companies: 'companies',
    TimeRecords: 'time_records',
} as const

export type CollectionNameType = typeof CollectionName[keyof typeof CollectionName]

export interface BaseRecord {
    id: string
    created: string
    updated: string
    collectionId: string
    collectionName: string
}

export interface User extends BaseRecord {
    username: string
    email: string
    name: string
    avatar: string
}

export interface CompanySettings {
    work_days: number[] // 0-6 (Sunday-Saturday)
    daily_target_ms: number
    holidays: string[] // ISO dates YYYY-MM-DD
    multipliers: {
        night?: { start: string; end: string; value: number }
        weekend?: number
    }
}

export interface Company extends BaseRecord {
    name: string
    user: string // User ID
    settings?: CompanySettings
}

export interface TimeRecord extends BaseRecord {
    user: string // User ID
    company: string // Company ID
    type: 'start' | 'pause' | 'resume' | 'finish' | 'leave' | 'holiday' | 'compensation'
    timestamp: string // ISO date string
    is_manual_entry: boolean
    notes?: string
    location?: string
    metadata?: any
}


