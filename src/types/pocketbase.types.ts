import PocketBase, { RecordService } from 'pocketbase';

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface UsersRecord {
    id: string;
    name?: string;
    avatarUrl?: string;
    preferences?: Json;
    created?: string;
    updated?: string;
}

export interface CompaniesRecord {
    id: string;
    user_id: string;
    name: string;
    settings?: Json;
    created?: string;
    updated?: string;
}

export interface TimeRecordsRecord {
    id: string;
    user_id: string;
    company_id: string;
    timestamp: string; // ISO 8601 string
    type: 'start' | 'pause' | 'resume' | 'finish';
    is_manual_entry?: boolean;
    notes?: string;
    location?: string;
    device_time?: string;
    created?: string;
    updated?: string;
}

// Define the TypedPocketBase interface
export interface TypedPocketBase extends PocketBase {
    collection(idOrName: 'users'): RecordService<UsersRecord>;
    collection(idOrName: 'companies'): RecordService<CompaniesRecord>;
    collection(idOrName: 'time_records'): RecordService<TimeRecordsRecord>;
    collection(idOrName: string): RecordService<any>; // Fallback
}
