
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    preferences: Json | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    preferences?: Json | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    preferences?: Json | null
                    updated_at?: string | null
                }
            }
            companies: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    settings: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    settings?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    settings?: Json | null
                    created_at?: string
                }
            }
            time_records: {
                Row: {
                    id: string
                    user_id: string
                    company_id: string
                    timestamp: string
                    type: 'start' | 'pause' | 'resume' | 'finish'
                    is_manual_entry: boolean
                    notes: string | null
                    location: string | null
                    device_time: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    company_id: string
                    timestamp?: string
                    type: 'start' | 'pause' | 'resume' | 'finish'
                    is_manual_entry?: boolean
                    notes?: string | null
                    location?: string | null
                    device_time?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    company_id?: string
                    timestamp?: string
                    type?: 'start' | 'pause' | 'resume' | 'finish'
                    is_manual_entry?: boolean
                    notes?: string | null
                    location?: string | null
                    device_time?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
