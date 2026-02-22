import React, { useState, useEffect } from 'react'
import styles from './EntryModal.module.css'
import { X } from 'lucide-react'
import type { TimeRecord } from '../../../types/pocketbase-types'
import { formatDateForInput, formatTimeForInput, parseDateTime, parsePBDate } from '../../../utils/dateUtils'

interface EntryModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: { type: 'start' | 'finish', timestamp: string, notes?: string, location?: string }) => Promise<void>
    initialData?: TimeRecord
}

export const EntryModal: React.FC<EntryModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [type, setType] = useState<'start' | 'finish'>('start')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [notes, setNotes] = useState('')
    const [location, setLocation] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const d = parsePBDate(initialData.timestamp)
                setType(initialData.type as 'start' | 'finish')
                setDate(formatDateForInput(d))
                setTime(formatTimeForInput(d))
                setNotes(initialData.notes || '')
                setLocation(initialData.location || '')
            } else {
                const d = new Date()
                setType('start')
                setDate(formatDateForInput(d))
                setTime(formatTimeForInput(d))
                setNotes('')
                setLocation('')
            }
        }
    }, [isOpen, initialData])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const timestamp = parseDateTime(date, time).toISOString()

            await onSave({ type, timestamp, notes, location })
            onClose()
        } catch (error) {
            console.error('Error saving entry:', error)
            alert('Erro ao salvar registro.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>{initialData ? 'Editar Registro' : 'Novo Registro Manual'}</h2>
                    <button className={styles.closeButton} onClick={onClose}><X size={20} /></button>
                </header>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>Tipo de Registro</label>
                        <div className={styles.typeSelector}>
                            <button
                                type="button"
                                className={`${styles.typeButton} ${type === 'start' ? styles.activeStart : ''}`}
                                onClick={() => setType('start')}
                            >
                                Entrada
                            </button>
                            <button
                                type="button"
                                className={`${styles.typeButton} ${type === 'finish' ? styles.activeFinish : ''}`}
                                onClick={() => setType('finish')}
                            >
                                Saída
                            </button>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.group}>
                            <label>Data</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.group}>
                            <label>Hora</label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.group}>
                        <label>Observações (opcional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ex: Trabalhei de casa, Almoço, Reunião externo..."
                        />
                    </div>

                    <div className={styles.group}>
                        <label>Localização (opcional)</label>
                        <input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="Ex: Escritório, Home Office..."
                        />
                    </div>

                    <footer className={styles.footer}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
                        <button type="submit" className={styles.saveButton} disabled={isLoading}>
                            {isLoading ? 'Salvando...' : 'Salvar Registro'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    )
}
