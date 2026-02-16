
import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../../lib/supabase'

export function useActiveCompany() {
    const { profile, user, refreshProfile } = useAuth()
    const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (profile?.preferences) {
            const prefs = profile.preferences as { active_company_id?: string }
            setActiveCompanyId(prefs.active_company_id || null)
        }
    }, [profile])


    const setActiveCompany = async (companyId: string) => {
        if (!user || !profile) return

        setLoading(true)

        const newPreferences = {
            ...(profile.preferences as object),
            active_company_id: companyId
        }

        const { error } = await supabase
            .from('profiles')
            // @ts-ignore
            .update({ preferences: newPreferences })
            .eq('id', user.id)

        if (error) {
            console.error('Error updating active company:', error)
        } else {
            // Refresh profile to update global state
            await refreshProfile()
        }
        setLoading(false)
    }

    return { activeCompanyId, setActiveCompany, loading }
}
