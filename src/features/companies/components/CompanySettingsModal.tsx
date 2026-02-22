import React, { useState } from 'react'
import type { Company, CompanySettings } from '../../../types/pocketbase-types'
import { CLT_DEFAULTS } from '../../../lib/constants'
import { X, Save, Info } from 'lucide-react'
import styles from './CompanySettingsModal.module.css'

interface CompanySettingsModalProps {
    isOpen: boolean
    onClose: () => void
    company: Company
    onSave: (settings: CompanySettings) => Promise<void>
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
    isOpen,
    onClose,
    company,
    onSave
}) => {
    const [settings, setSettings] = useState<CompanySettings>({
        ...CLT_DEFAULTS,
        ...(company.settings || {})
    })
    const [isSaving, setIsSaving] = useState(false)

    if (!isOpen) return null

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(settings)
            onClose()
        } catch (error) {
            alert('Erro ao salvar configurações.')
        } finally {
            setIsSaving(false)
        }
    }

    const toggleWorkDay = (day: number) => {
        const newWorkDays = settings.work_days.includes(day)
            ? settings.work_days.filter(d => d !== day)
            : [...settings.work_days, day].sort()
        setSettings({ ...settings, work_days: newWorkDays })
    }

    const days = [
        { id: 0, label: 'D' },
        { id: 1, label: 'S' },
        { id: 2, label: 'T' },
        { id: 3, label: 'Q' },
        { id: 4, label: 'Q' },
        { id: 5, label: 'S' },
        { id: 6, label: 'S' }
    ]

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <h2>Configurações: {company.name}</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </header>

                <div className={styles.content}>
                    <section className={styles.section}>
                        <h3>Jornada de Trabalho</h3>
                        <div className={styles.field}>
                            <label>Carga Horária Diária (minutos)</label>
                            <input
                                type="number"
                                value={settings.daily_target_ms / (60 * 1000)}
                                onChange={e => setSettings({
                                    ...settings,
                                    daily_target_ms: Number(e.target.value) * 60 * 1000
                                })}
                            />
                            <p className={styles.help}>Padrão CLT: 480 min (8h)</p>
                        </div>

                        <div className={styles.field}>
                            <label>Dias de Trabalho</label>
                            <div className={styles.daysGrid}>
                                {days.map(day => (
                                    <button
                                        key={day.id}
                                        className={`${styles.dayToggle} ${settings.work_days.includes(day.id) ? styles.dayActive : ''}`}
                                        onClick={() => toggleWorkDay(day.id)}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h3>Multiplicadores (Banco de Horas)</h3>
                        <div className={styles.multiGrid}>
                            <div className={styles.field}>
                                <label>Extra: Fim de Semana / Feriado</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings.multipliers.weekend || 1}
                                    onChange={e => setSettings({
                                        ...settings,
                                        multipliers: { ...settings.multipliers, weekend: Number(e.target.value) }
                                    })}
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Extra: Adicional Noturno</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={settings.multipliers.night?.value || 1}
                                    onChange={e => setSettings({
                                        ...settings,
                                        multipliers: {
                                            ...settings.multipliers,
                                            night: {
                                                ...(settings.multipliers.night || CLT_DEFAULTS.multipliers.night!),
                                                value: Number(e.target.value)
                                            }
                                        }
                                    })}
                                />
                            </div>
                        </div>

                        <div className={styles.multiGrid}>
                            <div className={styles.field}>
                                <label>Início Noturno</label>
                                <input
                                    type="time"
                                    value={settings.multipliers.night?.start || '22:00'}
                                    onChange={e => setSettings({
                                        ...settings,
                                        multipliers: {
                                            ...settings.multipliers,
                                            night: {
                                                ...(settings.multipliers.night || CLT_DEFAULTS.multipliers.night!),
                                                start: e.target.value
                                            }
                                        }
                                    })}
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Fim Noturno</label>
                                <input
                                    type="time"
                                    value={settings.multipliers.night?.end || '05:00'}
                                    onChange={e => setSettings({
                                        ...settings,
                                        multipliers: {
                                            ...settings.multipliers,
                                            night: {
                                                ...(settings.multipliers.night || CLT_DEFAULTS.multipliers.night!),
                                                end: e.target.value
                                            }
                                        }
                                    })}
                                />
                            </div>
                        </div>

                        <div className={styles.infoBox}>
                            <Info size={16} />
                            <p>O multiplicador noturno é aplicado sobre as horas trabalhadas entre o hórario de início e fim configurado.</p>
                        </div>
                    </section>
                </div>

                <footer className={styles.footer}>
                    <button onClick={onClose} className={styles.cancelButton} disabled={isSaving}>
                        Cancelar
                    </button>
                    <button onClick={handleSave} className={styles.saveButton} disabled={isSaving}>
                        {isSaving ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                    </button>
                </footer>
            </div>
        </div>
    )
}
