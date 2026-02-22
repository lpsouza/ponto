import { useEffect, useState } from 'react'
import { companyService } from '../services/companyService'
import { useStore } from '../../../store/useStore'
import { useAuth } from '../../auth/AuthProvider'
import type { Company, CompanySettings } from '../../../types/pocketbase-types'
import { Building2, Plus, Check, Settings } from 'lucide-react'
import styles from './CompanySelector.module.css'
import { CompanySettingsModal } from './CompanySettingsModal'

export const CompanySelector = () => {
    const { user } = useAuth()
    const { activeCompanyId, setActiveCompanyId, setCurrentCompany, currentCompany } = useStore()
    const [companies, setCompanies] = useState<Company[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)

    useEffect(() => {
        if (user) {
            loadCompanies()
        }
    }, [user])

    const loadCompanies = async () => {
        try {
            const list = await companyService.getCompanies()
            setCompanies(list)

            if (activeCompanyId) {
                const found = list.find(c => c.id === activeCompanyId)
                if (found) setCurrentCompany(found)
            } else if (list.length > 0) {
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

    const handleOpenSettings = (e: React.MouseEvent, company: Company) => {
        e.stopPropagation()
        setEditingCompany(company)
        setIsSettingsOpen(true)
        setIsOpen(false)
    }

    const handleSaveSettings = async (settings: CompanySettings) => {
        if (!editingCompany) return
        try {
            const updated = await companyService.updateSettings(editingCompany.id, settings)
            setCompanies(companies.map(c => c.id === updated.id ? updated : c))
            if (activeCompanyId === updated.id) {
                setCurrentCompany(updated)
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
            throw error
        }
    }

    if (isLoading) return <div className={styles.loading}>Carregando contextos...</div>

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
                                <div className={styles.itemLabel}>
                                    <span>{company.name}</span>
                                    {company.id === activeCompanyId && <Check size={14} className={styles.checkIcon} />}
                                </div>
                                <div className={styles.itemActions}>
                                    <button
                                        className={styles.settingsButton}
                                        onClick={(e) => handleOpenSettings(e, company)}
                                        title="Configurações"
                                    >
                                        <Settings size={14} />
                                    </button>
                                </div>
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

            {editingCompany && (
                <CompanySettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    company={editingCompany}
                    onSave={handleSaveSettings}
                />
            )}
        </div>
    )
}
