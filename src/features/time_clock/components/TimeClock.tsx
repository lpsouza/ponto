import React, { useEffect, useState } from 'react'
import { useTimeClockStore } from '../store/useTimeClockStore'
import { calculateTotalDuration, formatDuration } from '../utils/calculations'
import styles from './TimeClock.module.css'
import { Play, Square, Trash2, Edit2, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { EntryModal } from './EntryModal'
import type { TimeRecord } from '../../../types/pocketbase-types'
import { isToday, shiftDate } from '../../../utils/dateUtils'

export const TimeClock: React.FC = () => {
    const { records, isLoading, fetchRecords, clockIn, clockOut, deleteRecord, addManualEntry, updateRecord } = useTimeClockStore()
    const [currentTime, setCurrentTime] = useState(new Date())
    // In a full implementation, we'd have a date picker that sets this
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<TimeRecord | undefined>()

    useEffect(() => {
        fetchRecords(selectedDate)
    }, [fetchRecords, selectedDate])

    // Update current time every second for the clock display
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const totalToday = calculateTotalDuration(records)
    const lastRecord = [...records].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).pop()
    const isWorking = lastRecord?.type === 'start'

    const handleAction = () => {
        if (isWorking) {
            clockOut()
        } else {
            clockIn()
        }
    }

    const handleSaveEntry = async (data: { type: 'start' | 'finish', timestamp: string, notes?: string }) => {
        if (editingRecord) {
            await updateRecord(editingRecord.id, data)
        } else {
            await addManualEntry(data)
        }
    }

    const handleEdit = (record: TimeRecord) => {
        setEditingRecord(record)
        setIsModalOpen(true)
    }

    const handleOpenAddModal = () => {
        setEditingRecord(undefined)
        setIsModalOpen(true)
    }

    const handlePrevDay = () => {
        setSelectedDate(shiftDate(selectedDate, -1))
    }

    const handleNextDay = () => {
        setSelectedDate(shiftDate(selectedDate, 1))
    }

    const handleToday = () => {
        setSelectedDate(new Date())
    }

    const isTodaySelected = isToday(selectedDate)

    return (
        <div className={styles.container}>
            <header className={styles.dateNavigation}>
                <button onClick={handlePrevDay} className={styles.iconButton} title="Dia anterior">
                    <ChevronLeft size={24} />
                </button>
                <div className={styles.dateDisplay}>
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
                <button onClick={handleNextDay} className={styles.iconButton} title="Próximo dia">
                    <ChevronRight size={24} />
                </button>
                {!isTodaySelected && (
                    <button onClick={handleToday} className={styles.todayButton}>
                        Hoje
                    </button>
                )}
            </header>

            <section className={styles.trackerCard}>
                <div className={styles.timeDisplay}>
                    <span className={styles.currentTime}>
                        {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={styles.totalAccumulated}>
                        Acumulado hoje: <span className={styles.totalValue}>{formatDuration(totalToday)}</span>
                    </span>
                </div>

                <div className={styles.actions}>
                    <button
                        className={`${styles.clockButton} ${isWorking ? styles.clockButtonFinish : styles.clockButtonStart}`}
                        onClick={handleAction}
                        disabled={isLoading}
                    >
                        {isWorking ? (
                            <><Square size={24} fill="currentColor" /> Registrar Saída</>
                        ) : (
                            <><Play size={24} fill="currentColor" /> Registrar Entrada</>
                        )}
                    </button>
                </div>
            </section>

            <section className={styles.timelineSection}>
                <div className={styles.timelineHeader}>
                    <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
                        Linha do Tempo
                    </h3>
                    <button
                        className={styles.iconButton}
                        title="Adicionar registro manual"
                        onClick={handleOpenAddModal}
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className={styles.timelineList}>
                    {records.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            color: 'var(--color-text-muted)',
                            padding: 'var(--spacing-2xl)',
                            background: 'var(--color-surface-lvl1)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px dashed var(--color-surface-lvl3)'
                        }}>
                            <p>Nenhum registro para este dia.</p>
                            <p style={{ fontSize: 'var(--font-size-sm)' }}>Comece seu dia clicando em "Registrar Entrada".</p>
                        </div>
                    ) : (
                        [...records].reverse().map(record => (
                            <div key={record.id} className={styles.recordItem}>
                                <div className={styles.recordInfo}>
                                    <span className={`${styles.recordType} ${record.type === 'start' ? styles.typeStart : styles.typeFinish}`}>
                                        {record.type === 'start' ? 'Entrada' : 'Saída'}
                                    </span>
                                    <span className={styles.recordTime}>
                                        {new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {record.is_manual_entry && (
                                        <span style={{
                                            fontSize: '0.65rem',
                                            color: 'var(--color-primary)',
                                            background: 'rgba(0, 242, 234, 0.1)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold'
                                        }}>
                                            Manual
                                        </span>
                                    )}
                                </div>
                                <div className={styles.recordActions}>
                                    <button
                                        className={styles.iconButton}
                                        title="Editar"
                                        onClick={() => handleEdit(record)}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className={`${styles.iconButton} ${styles.deleteButton}`}
                                        title="Excluir"
                                        onClick={() => {
                                            if (confirm('Deseja realmente excluir este registro?')) {
                                                deleteRecord(record.id)
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <EntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEntry}
                initialData={editingRecord}
            />
        </div>
    )

}
