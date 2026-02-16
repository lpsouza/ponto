import React, { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCompanies } from '../companies/hooks'
import { useActiveCompany } from '../companies/useActiveCompany'
import { useTimeRecords } from '../timeclock/hooks'
import { TimeTracker } from '../timeclock/TimeTracker'
import { DailyBalance } from './DailyBalance'
import { MonthlyReport } from './MonthlyReport'
import styles from './DashboardPage.module.css'

export const DashboardPage = () => {
    const { profile, signOut } = useAuth()
    const { companies, createCompany, deleteCompany, loading } = useCompanies()
    const { activeCompanyId, setActiveCompany, loading: switching } = useActiveCompany()
    const { records: todayRecords } = useTimeRecords(activeCompanyId)
    const [newCompanyName, setNewCompanyName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCompanyName.trim()) return

        try {
            await createCompany({ name: newCompanyName, settings: {} })
            setNewCompanyName('')
            setIsCreating(false)
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este contexto?')) {
            await deleteCompany(id)
        }
    }

    const activeCompany = companies.find(c => c.id === activeCompanyId)
    const activeCompanyName = activeCompany?.name

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Olá, {profile?.full_name?.split(' ')[0]}</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        {activeCompanyName
                            ? `Contexto: ${activeCompanyName}`
                            : 'Selecione um contexto para começar'}
                    </p>
                </div>
                <div className={styles.headerActions}>
                    {/* Company Selector Dropdown */}
                    {companies.length > 0 && (
                        <select
                            className={styles.companySelect}
                            value={activeCompanyId ?? ''}
                            onChange={(e) => e.target.value && setActiveCompany(e.target.value)}
                            disabled={switching}
                            aria-label="Selecionar contexto de empresa"
                        >
                            <option value="" disabled>Selecionar contexto...</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                    <button onClick={signOut} className={`${styles.button} ${styles.buttonOutline}`}>
                        Sair
                    </button>
                </div>
            </header>

            {/* Time Tracker Section */}
            <section className={styles.trackerSection}>
                <TimeTracker companyId={activeCompanyId} />
            </section>

            {/* Daily Balance Section */}
            {activeCompanyId && todayRecords.length > 0 && (
                <section className={styles.balanceSection}>
                    <DailyBalance records={todayRecords} />
                </section>
            )}

            {/* Monthly Report Section */}
            {activeCompanyId && (
                <section className={styles.reportSection}>
                    <MonthlyReport
                        companyId={activeCompanyId}
                        companyName={activeCompanyName}
                    />
                </section>
            )}

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Seus Contextos</h2>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className={`${styles.button} ${styles.buttonOutline}`}
                    >
                        {isCreating ? 'Cancelar' : 'Novo Contexto'}
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreate} className={styles.form}>
                        <input
                            type="text"
                            placeholder="Nome do contexto (ex: Freelance, CLT)"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            className={styles.input}
                            autoFocus
                        />
                        <button type="submit" className={styles.button} disabled={!newCompanyName.trim()}>
                            Criar
                        </button>
                    </form>
                )}

                <div className={styles.companyList}>
                    {loading ? (
                        <p>Carregando...</p>
                    ) : companies.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>Nenhum contexto criado.</p>
                    ) : (
                        companies.map((company) => (
                            <div
                                key={company.id}
                                className={`${styles.companyCard} ${activeCompanyId === company.id ? styles.active : ''}`}
                            >
                                <div>
                                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>{company.name}</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {activeCompanyId === company.id ? (
                                        <span className={styles.badge}>Ativo</span>
                                    ) : (
                                        <button
                                            onClick={() => setActiveCompany(company.id)}
                                            className={`${styles.button} ${styles.buttonOutline}`}
                                            disabled={switching}
                                            style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                                        >
                                            Selecionar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(company.id)}
                                        className={styles.deleteButton}
                                        title="Remover"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    )
}

