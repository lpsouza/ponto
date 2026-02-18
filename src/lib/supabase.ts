import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key missing in environment variables.')
}

export const supabase = createClient<Database>(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
        global: {
            // Add a fetch wrapper with timeout to prevent hanging requests
            fetch: (url, options) => {
                const controller = new AbortController()
                const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

                return fetch(url, {
                    ...options,
                    signal: controller.signal,
                }).finally(() => clearTimeout(timeout))
            },
        },
    }
)
