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

export interface Company extends BaseRecord {
    name: string
    user: string // User ID
    settings?: any
}

export interface TimeRecord extends BaseRecord {
    user: string // User ID
    company: string // Company ID
    type: 'start' | 'pause' | 'resume' | 'finish'
    timestamp: string // ISO date string
    is_manual_entry: boolean
    notes?: string
    location?: string
}


