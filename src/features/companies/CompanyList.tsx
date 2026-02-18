import React, { useState } from 'react'
import { useCompanies } from './hooks'
import { useActiveCompany } from './useActiveCompany'
import { CompanySettings } from './types'
import styles from './CompanyList.module.css'

export const CompanyList = () => {
    const { companies, createCompany, updateCompany, deleteCompany, loading } = useCompanies()
    const { activeCompanyId, setActiveCompany, loading: switching } = useActiveCompany()

    const [isCreating, setIsCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form States
    const [formData, setFormData] = useState<{ name: string; targetHours: string }>({
        name: '',
        targetHours: '8'
    })

    const resetForm = () => {
        setFormData({ name: '', targetHours: '8' })
        setIsCreating(false)
        setEditingId(null)
    }

    const startCreating = () => {
        resetForm()
        setIsCreating(true)
    }

    const startEditing = (company: { id: string; name: string; settings: any }) => {
        resetForm()
        const settings = company.settings as CompanySettings
        setFormData({
            name: company.name,
            targetHours: settings?.target_hours?.toString() || '8'
        })
        setEditingId(company.id)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) return

        const settings: CompanySettings = {
            target_hours: Number(formData.targetHours) || 8
        }

        try {
            if (isCreating) {
                await createCompany({
                    name: formData.name,
                    settings: settings as any
                })
            } else if (editingId) {
                await updateCompany(editingId, {
                    name: formData.name,
                    settings: settings as any
                })
            }
            resetForm()
        } catch (error) {
            console.error('Error saving company:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este contexto? Todos os dados associados podem ser perdidos.')) {
            await deleteCompany(id)
        }
    }

    if (loading) return <div>Carregando contextos...</div>

    return (
        <section className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Seus Contextos</h2>
                {!isCreating && !editingId && (
                    <button
                        onClick={startCreating}
                        className={`${styles.button} ${styles.buttonOutline}`}
                    >
                        Novo Contexto
                    </button>
                )}
            </div>

            {isCreating && (
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup} style={{ flex: 2 }}>
                            <label className={styles.label}>Nome</label>
                            <input
                                autoFocus
                                className={styles.input}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Empresa X, Freelance Y"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Meta Diária (h)</label>
                            <input
                                type="number"
                                step="0.5"
                                className={styles.input}
                                value={formData.targetHours}
                                onChange={e => setFormData({ ...formData, targetHours: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <button type="button" onClick={resetForm} className={`${styles.button} ${styles.buttonOutline}`}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.button} disabled={!formData.name.trim()}>
                            Gravar
                        </button>
                    </div>
                </form>
            )}

            <div className={styles.list}>
                {companies.length === 0 && !isCreating ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>Nenhum contexto criado.</p>
                ) : (
                    companies.map(company => {
                        const isEditing = editingId === company.id
                        const settings = company.settings as CompanySettings
                        const targetHours = settings?.target_hours || 8

                        if (isEditing) {
                            return (
                                <form key={company.id} onSubmit={handleSubmit} className={styles.form}>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup} style={{ flex: 2 }}>
                                            <label className={styles.label}>Nome</label>
                                            <input
                                                autoFocus
                                                className={styles.input}
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Meta Diária (h)</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                className={styles.input}
                                                value={formData.targetHours}
                                                onChange={e => setFormData({ ...formData, targetHours: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formActions}>
                                        <button type="button" onClick={resetForm} className={`${styles.button} ${styles.buttonOutline}`}>
                                            Cancelar
                                        </button>
                                        <button type="submit" className={styles.button} disabled={!formData.name.trim()}>
                                            Salvar
                                        </button>
                                    </div>
                                </form>
                            )
                        }

                        return (
                            <div
                                key={company.id}
                                className={`${styles.card} ${activeCompanyId === company.id ? styles.active : ''}`}
                            >
                                <div className={styles.cardContent}>
                                    <div className={styles.companyInfo}>
                                        <div className={styles.companyName}>{company.name}</div>
                                        <div className={styles.companyDetails}>Meta: {targetHours}h / dia</div>
                                    </div>

                                    <div className={styles.actions}>
                                        {activeCompanyId === company.id ? (
                                            <span className={styles.badge}>Ativo</span>
                                        ) : (
                                            <button
                                                onClick={() => setActiveCompany(company.id)}
                                                className={`${styles.button} ${styles.buttonOutline}`}
                                                disabled={switching}
                                            >
                                                Selecionar
                                            </button>
                                        )}

                                        <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }} />

                                        <button
                                            onClick={() => startEditing(company)}
                                            className={styles.iconButton}
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(company.id)}
                                            className={`${styles.iconButton} ${styles.deleteButton}`}
                                            title="Remover"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }))}
            </div>
        </section>
    )
}
