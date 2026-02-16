import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, Square, RotateCcw, Pencil, Trash2, MapPin } from 'lucide-react'
import { useTimeRecords } from './hooks'
import {
    calculateTotalWorkedMs,
    formatDuration,
    formatTime,
    getTrackerState,
    TimeRecord,
    TimeRecordType,
    toDatetimeLocalString,
} from './timeCalculations'
import styles from './TimeTracker.module.css'

interface TimeTrackerProps {
    companyId: string | null
}

// Map record types to Portuguese labels
const typeLabels: Record<TimeRecordType, string> = {
    start: 'Início',
    pause: 'Pausa',
    resume: 'Retorno',
    finish: 'Fim',
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ companyId }) => {
    const { records, loading, addRecord, updateRecord, deleteRecord } = useTimeRecords(companyId)
    const [now, setNow] = useState(new Date())
    const [location, setLocation] = useState('')
    const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null)
    const [editTimestamp, setEditTimestamp] = useState('')
    const [editNotes, setEditNotes] = useState('')
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const { status, allowedActions } = getTrackerState(records)
    const totalWorkedMs = calculateTotalWorkedMs(records, now)

    // Live clock
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setNow(new Date())
        }, 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    const handleAction = useCallback(async (type: TimeRecordType) => {
        try {
            await addRecord(type, {
                location: location || undefined,
            })
        } catch (error) {
            console.error('Failed to record action:', error)
        }
    }, [addRecord, location])

    const handleEditOpen = useCallback((record: TimeRecord) => {
        setEditingRecord(record)
        setEditTimestamp(toDatetimeLocalString(new Date(record.timestamp)))
        setEditNotes(record.notes || '')
    }, [])

    const handleEditSave = useCallback(async () => {
        if (!editingRecord) return

        try {
            const newTimestamp = new Date(editTimestamp).toISOString()
            await updateRecord(editingRecord.id, {
                timestamp: newTimestamp,
                notes: editNotes || null,
            })
            setEditingRecord(null)
        } catch (error) {
            console.error('Failed to update record:', error)
        }
    }, [editingRecord, editTimestamp, editNotes, updateRecord])

    const handleDelete = useCallback(async (id: string) => {
        if (confirm('Tem certeza que deseja remover este registro?')) {
            try {
                await deleteRecord(id)
            } catch (error) {
                console.error('Failed to delete record:', error)
            }
        }
    }, [deleteRecord])

    if (!companyId) {
        return (
            <div className={styles.tracker}>
                <div className={styles.noCompany}>
                    <p>Selecione um contexto para começar a registrar.</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className={styles.tracker}>
                <div className={styles.loading}>Carregando registros...</div>
            </div>
        )
    }

    const statusClass = {
        idle: styles.statusIdle,
        working: styles.statusWorking,
        paused: styles.statusPaused,
        finished: styles.statusFinished,
    }[status]

    const statusLabel = {
        idle: 'Pronto',
        working: 'Trabalhando',
        paused: 'Em pausa',
        finished: 'Dia encerrado',
    }[status]

    return (
        <div className={styles.tracker}>
            {/* Current Clock */}
            <div className={styles.currentTime}>
                {now.toLocaleTimeString('pt-BR')}
            </div>

            {/* Status Badge */}
            <span className={`${styles.statusBadge} ${statusClass}`}>
                {statusLabel}
            </span>

            {/* Timer Display */}
            <div className={styles.timerDisplay}>
                {formatDuration(totalWorkedMs)}
            </div>
            <div className={styles.timerLabel}>Tempo acumulado hoje</div>

            {/* Optional Location */}
            <div className={styles.locationSection}>
                <MapPin size={14} />
                <input
                    type="text"
                    className={styles.locationInput}
                    placeholder="Local (ex: Home, Office)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    aria-label="Local de trabalho"
                />
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
                {allowedActions.includes('start') && (
                    <button
                        className={`${styles.actionButton} ${styles.startButton}`}
                        onClick={() => handleAction('start')}
                        aria-label="Iniciar trabalho"
                    >
                        <Play size={18} />
                        Iniciar
                    </button>
                )}
                {allowedActions.includes('pause') && (
                    <button
                        className={`${styles.actionButton} ${styles.pauseButton}`}
                        onClick={() => handleAction('pause')}
                        aria-label="Pausar trabalho"
                    >
                        <Pause size={18} />
                        Pausar
                    </button>
                )}
                {allowedActions.includes('resume') && (
                    <button
                        className={`${styles.actionButton} ${styles.resumeButton}`}
                        onClick={() => handleAction('resume')}
                        aria-label="Retomar trabalho"
                    >
                        <RotateCcw size={18} />
                        Retomar
                    </button>
                )}
                {allowedActions.includes('finish') && (
                    <button
                        className={`${styles.actionButton} ${styles.finishButton}`}
                        onClick={() => handleAction('finish')}
                        aria-label="Encerrar dia"
                    >
                        <Square size={18} />
                        Encerrar
                    </button>
                )}
            </div>

            {/* Timeline of Records */}
            {records.length > 0 && (
                <div className={styles.timeline}>
                    <h3 className={styles.timelineTitle}>Registros de hoje</h3>
                    <div className={styles.timelineList}>
                        {records
                            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                            .map((record) => (
                                <div key={record.id} className={styles.timelineItem}>
                                    <span className={`${styles.timelineDot} ${styles[`dot${record.type.charAt(0).toUpperCase() + record.type.slice(1)}`]}`} />
                                    <span className={styles.timelineTime}>
                                        {formatTime(new Date(record.timestamp))}
                                    </span>
                                    <span className={styles.timelineType}>
                                        {typeLabels[record.type]}
                                        {record.location && ` · ${record.location}`}
                                    </span>
                                    {record.is_manual_entry && (
                                        <span className={styles.timelineManual}>editado</span>
                                    )}
                                    <div className={styles.timelineActions}>
                                        <button
                                            className={styles.timelineActionBtn}
                                            onClick={() => handleEditOpen(record)}
                                            aria-label="Editar registro"
                                            title="Editar"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            className={styles.timelineActionBtn}
                                            onClick={() => handleDelete(record.id)}
                                            aria-label="Remover registro"
                                            title="Remover"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingRecord && (
                <div className={styles.editOverlay} onClick={() => setEditingRecord(null)}>
                    <div className={styles.editModal} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.editTitle}>
                            Editar {typeLabels[editingRecord.type]}
                        </h3>
                        <div className={styles.editField}>
                            <label className={styles.editLabel} htmlFor="edit-timestamp">
                                Horário
                            </label>
                            <input
                                id="edit-timestamp"
                                type="datetime-local"
                                className={styles.editInput}
                                value={editTimestamp}
                                onChange={(e) => setEditTimestamp(e.target.value)}
                            />
                        </div>
                        <div className={styles.editField}>
                            <label className={styles.editLabel} htmlFor="edit-notes">
                                Observações
                            </label>
                            <input
                                id="edit-notes"
                                type="text"
                                className={styles.editInput}
                                placeholder="Nota opcional..."
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                            />
                        </div>
                        <div className={styles.editActions}>
                            <button
                                className={styles.editCancel}
                                onClick={() => setEditingRecord(null)}
                            >
                                Cancelar
                            </button>
                            <button
                                className={styles.editSave}
                                onClick={handleEditSave}
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
