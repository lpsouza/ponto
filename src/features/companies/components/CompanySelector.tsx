import { useEffect, useState } from 'react'
import { companyService } from '../services/companyService'
import { useStore } from '../../../store/useStore'
import { useAuth } from '../../auth/AuthProvider'
import type { Company } from '../../../types/pocketbase-types'
import { Building2, Plus, Check } from 'lucide-react'
import styles from './CompanySelector.module.css'

export const CompanySelector = () => {
    const { user } = useAuth()
    const { activeCompanyId, setActiveCompanyId, setCurrentCompany, currentCompany } = useStore()
    const [companies, setCompanies] = useState<Company[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (user) {
            loadCompanies()
        }
    }, [user])

    const loadCompanies = async () => {
        try {
            const list = await companyService.getCompanies()
            setCompanies(list)

            // If there's an active ID but companies are loaded, ensure the object is updated
            if (activeCompanyId) {
                const found = list.find(c => c.id === activeCompanyId)
                if (found) setCurrentCompany(found)
            } else if (list.length > 0) {
                // Default to first company if none active
                setActiveCompanyId(list[0].id)
                setCurrentCompany(list[0])
            }
        } catch (error) {
            console.error('Failed to load companies:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSwitch = (company: Company) => {
        setActiveCompanyId(company.id)
        setCurrentCompany(company)
        setIsOpen(false)
    }

    const handleAddCompany = async () => {
        const name = prompt('Nome da Nova Empresa/Contexto:')
        if (name) {
            try {
                const newCompany = await companyService.createCompany(name)
                setCompanies([...companies, newCompany])
                handleSwitch(newCompany)
            } catch (error) {
                alert('Erro ao criar empresa.')
            }
        }
    }

    if (isLoading) return <div className={styles.loading}>Cargando contextos...</div>

    return (
        <div className={styles.container}>
            <button className={styles.trigger} onClick={() => setIsOpen(!isOpen)}>
                <Building2 size={18} />
                <span className={styles.currentName}>
                    {currentCompany?.name || 'Selecionar Contexto'}
                </span>
            </button>

            {isOpen && (
                <>
                    <div className={styles.overlay} onClick={() => setIsOpen(false)} />
                    <ul className={styles.dropdown}>
                        <li className={styles.header}>Meus Contextos</li>
                        {companies.map(company => (
                            <li
                                key={company.id}
                                className={`${styles.item} ${company.id === activeCompanyId ? styles.active : ''}`}
                                onClick={() => handleSwitch(company)}
                            >
                                <span>{company.name}</span>
                                {company.id === activeCompanyId && <Check size={14} className={styles.checkIcon} />}
                            </li>
                        ))}
                        <li className={styles.divider} />
                        <li className={styles.itemAdd} onClick={handleAddCompany}>
                            <Plus size={16} />
                            <span>Novo Contexto</span>
                        </li>
                    </ul>
                </>
            )}
        </div>
    )
}
