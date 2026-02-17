
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Database } from '../../types/database.types'
import { useAuth } from '../auth/AuthProvider'

export type Company = Database['public']['Tables']['companies']['Row']
export type InsertCompany = Database['public']['Tables']['companies']['Insert']
export type UpdateCompany = Database['public']['Tables']['companies']['Update']

export function useCompanies() {
    const { user } = useAuth()
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)

    const fetchCompanies = async () => {
        if (!user) return

        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name')

        if (error) {
            console.error('Error fetching companies:', error)
        } else {
            setCompanies(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchCompanies()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const createCompany = async (company: Omit<InsertCompany, 'user_id'>) => {
        if (!user) throw new Error('User not authenticated')

        const payload: InsertCompany = { ...company, user_id: user.id }

        const { data, error } = await supabase
            .from('companies')
            // @ts-ignore
            .insert(payload)
            .select()
            .single()

        if (error) {
            console.error('Error creating company:', error)
            throw error
        }

        setCompanies((prev) => [...prev, data])
        return data
    }

    const updateCompany = async (id: string, updates: Omit<UpdateCompany, 'id' | 'user_id'>) => {
        const { data, error } = await supabase
            .from('companies')
            // @ts-ignore
            .update(updates)
            // @ts-ignore
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating company:', error)
            throw error
        }

        setCompanies((prev) => prev.map((c) => (c.id === id ? data : c)))
        return data
    }

    const deleteCompany = async (id: string) => {
        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting company:', error)
            throw error
        }

        setCompanies((prev) => prev.filter((c) => c.id !== id))
    }

    return { companies, loading, createCompany, updateCompany, deleteCompany, refreshCompanies: fetchCompanies }
}
