import { useEffect, useState } from 'react'
import { Timer, ArrowRight, Plus, AlertCircle } from 'lucide-react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { ptBR } from 'date-fns/locale'
import "react-datepicker/dist/react-datepicker.css"

import { useTimeRecords } from './hooks'
import {
    calculateTotalWorkedMs,
    formatDuration,
    formatTime,
    getTrackerState,
    getWorkSegments,
} from './timeCalculations'
import styles from './TimeTracker.module.css'

// Register locale
registerLocale('pt-BR', ptBR)

interface TimeTrackerProps {
    companyId: string | null
}

const statusConfig = {
    idle: {
        label: 'Fora do serviço',
        style: styles.statusIdle,
        buttonText: 'Registrar Entrada',
        buttonClass: styles.btnEntry,
        nextAction: 'start' as const,
    },
    working: {
        label: 'Trabalhando',
        style: styles.statusWorking,
        buttonText: 'Registrar Saída',
        buttonClass: styles.btnExit,
        nextAction: 'finish' as const,
    },
}

export function TimeTracker({ companyId }: TimeTrackerProps) {
    const [selectedDate, setSelectedDate] = useState(new Date())

    const {
        records,
        loading,
        addRecord,
        updateRecord,
        deleteRecord
    } = useTimeRecords(companyId, selectedDate)

    const [currentTime, setCurrentTime] = useState(new Date())
    const [elapsedMs, setElapsedMs] = useState(0)

    // Manual entry state
    const [manualDate, setManualDate] = useState<Date>(new Date())
    const [manualType, setManualType] = useState<'start' | 'finish'>('start')
    const [submitting, setSubmitting] = useState(false)

    // Edit state
    const [editingSegment, setEditingSegment] = useState<{ start: Date, end: Date | null } | null>(null)
    const [editStart, setEditStart] = useState<Date | null>(null)
    const [editEnd, setEditEnd] = useState<Date | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date()
            setCurrentTime(now)
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // Update manual date when selectedDate changes
    useEffect(() => {
        const now = new Date()
        const isToday = selectedDate.toDateString() === now.toDateString()

        // If today, default to now. If past date, default to 12:00 of that date
        const defaultTime = isToday ? now : new Date(selectedDate)
        if (!isToday) defaultTime.setHours(12, 0, 0, 0)

        setManualDate(defaultTime)
    }, [selectedDate])

    // Calculate total worked time
    useEffect(() => {
        const total = calculateTotalWorkedMs(records, currentTime)
        setElapsedMs(total)
    }, [records, currentTime])

    const { status } = getTrackerState(records)
    const currentStatus = statusConfig[status]
    const segments = getWorkSegments(records)

    const isToday = selectedDate.toDateString() === new Date().toDateString()

    const handleMainAction = async () => {
        if (!companyId || submitting) return

        if (!isToday) {
            alert('Você só pode bater ponto para o dia atual. Use a entrada manual para datas passadas.')
            return
        }

        setSubmitting(true)
        try {
            await addRecord(currentStatus.nextAction)
        } catch (error) {
            console.error(error)
            alert('Erro ao registrar ponto')
        } finally {
            setSubmitting(false)
        }
    }

    const handleManualEntry = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!companyId || submitting || !manualDate) return

        setSubmitting(true)
        try {
            await addRecord(manualType, {
                timestamp: manualDate.toISOString(),
                isManual: true,
                notes: 'Manual entry'
            })
            // Reset form
            const now = new Date()
            const isToday = selectedDate.toDateString() === now.toDateString()
            const defaultTime = isToday ? now : new Date(selectedDate)
            if (!isToday) defaultTime.setHours(12, 0, 0, 0)
            setManualDate(defaultTime)
        } catch (error) {
            console.error(error)
            alert('Erro ao adicionar registro manual')
        } finally {
            setSubmitting(false)
        }
    }

    const handlePrevDay = () => {
        const prev = new Date(selectedDate)
        prev.setDate(prev.getDate() - 1)
        setSelectedDate(prev)
    }

    const handleNextDay = () => {
        const next = new Date(selectedDate)
        next.setDate(next.getDate() + 1)
        if (next > new Date()) return
        setSelectedDate(next)
    }

    const openEditModal = (segment: { start: Date, end: Date | null }) => {
        setEditingSegment(segment)
        setEditStart(segment.start)
        setEditEnd(segment.end)
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!editingSegment || !companyId || !editStart) return

        const startRecord = records.find(r => new Date(r.timestamp).getTime() === editingSegment.start.getTime() && (r.type === 'start' || r.type === 'resume'))
        const endRecord = editingSegment.end
            ? records.find(r => new Date(r.timestamp).getTime() === editingSegment.end!.getTime() && (r.type === 'finish' || r.type === 'pause'))
            : null

        if (!startRecord) {
            alert('Erro ao identificar registro de início')
            return
        }

        setSubmitting(true)
        try {
            // Update Start
            if (editStart.toISOString() !== startRecord.timestamp) {
                await updateRecord(startRecord.id, { timestamp: editStart.toISOString() })
            }

            // Update or Create End
            if (editEnd) {
                if (endRecord) {
                    if (editEnd.toISOString() !== endRecord.timestamp) {
                        await updateRecord(endRecord.id, { timestamp: editEnd.toISOString() })
                    }
                } else {
                    // Was active, now closing
                    await addRecord('finish', { timestamp: editEnd.toISOString(), isManual: true })
                }
            } else if (endRecord) {
                // Had end, now removed (making it active)
                await deleteRecord(endRecord.id)
            }

            setIsEditModalOpen(false)
            setEditingSegment(null)
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar alterações')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteSegment = async () => {
        if (!editingSegment || !companyId || !confirm('Tem certeza que deseja excluir este período?')) return

        const startRecord = records.find(r => new Date(r.timestamp).getTime() === editingSegment.start.getTime() && (r.type === 'start' || r.type === 'resume'))
        const endRecord = editingSegment.end
            ? records.find(r => new Date(r.timestamp).getTime() === editingSegment.end!.getTime() && (r.type === 'finish' || r.type === 'pause'))
            : null

        setSubmitting(true)
        try {
            if (endRecord) await deleteRecord(endRecord.id)
            if (startRecord) await deleteRecord(startRecord.id)
            setIsEditModalOpen(false)
            setEditingSegment(null)
        } catch (error) {
            console.error(error)
            alert('Erro ao excluir registros')
        } finally {
            setSubmitting(false)
        }
    }


    if (!companyId) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        <AlertCircle className="mx-auto mb-2" />
                        <p>Selecione ou crie uma empresa para começar.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {/* Date Navigation */}
            <div className={styles.dateNav}>
                <button onClick={handlePrevDay} className={styles.navButton}>&lt;</button>
                <span className={styles.currentDate}>
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <button
                    onClick={handleNextDay}
                    className={styles.navButton}
                    disabled={isToday}
                >
                    &gt;
                </button>
            </div>

            {/* Main Timer Card */}
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={`${styles.statusBadge} ${currentStatus.style}`}>
                        <Timer size={14} />
                        {currentStatus.label}
                    </div>
                    <div className={styles.timeDisplay}>
                        {formatDuration(elapsedMs)}
                    </div>
                    <div className={styles.dateDisplay}>
                        Total acumulado
                    </div>
                </div>

                <div className={styles.mainAction}>
                    <button
                        className={`${styles.toggleButton} ${currentStatus.buttonClass}`}
                        onClick={handleMainAction}
                        disabled={loading || submitting || !isToday}
                        style={{ opacity: !isToday ? 0.5 : 1 }}
                    >
                        {loading ? 'Carregando...' : currentStatus.buttonText}
                    </button>
                </div>

                {/* Manual Entry Form */}
                <div className={styles.manualEntry}>
                    <h3 className={styles.manualEntryTitle}>
                        {isToday ? 'Adicionar registro manual' : `Adicionar em ${selectedDate.toLocaleDateString('pt-BR')}`}
                    </h3>
                    <form className={styles.manualForm} onSubmit={handleManualEntry}>
                        <div className={styles.datePickerWrapper}>
                            <DatePicker
                                selected={manualDate}
                                onChange={(date: Date | null) => date && setManualDate(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy HH:mm"
                                locale="pt-BR"
                                className={styles.dateTimeInput}
                                required
                            />
                        </div>
                        <select
                            className={styles.typeSelect}
                            value={manualType}
                            onChange={(e) => setManualType(e.target.value as 'start' | 'finish')}
                        >
                            <option value="start">Entrada</option>
                            <option value="finish">Saída</option>
                        </select>
                        <button
                            type="submit"
                            className={styles.addButton}
                            disabled={submitting}
                            title="Adicionar"
                        >
                            <Plus size={20} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Timeline */}
            <div className={styles.timeline}>
                <h3 className={styles.timelineTitle}>Histórico</h3>
                <div className={styles.timelineList}>
                    {segments.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Nenhum registro para este dia.
                        </p>
                    )}

                    {segments.map((segment) => {
                        const isCompleted = !!segment.end
                        const duration = isCompleted
                            ? segment.end!.getTime() - segment.start.getTime()
                            : currentTime.getTime() - segment.start.getTime()

                        return (
                            <div
                                key={segment.start.toISOString()}
                                className={`${styles.timelineItem} ${isCompleted ? styles.completed : styles.active}`}
                                onClick={() => openEditModal(segment)}
                                style={{ cursor: 'pointer' }}
                                title="Clique para editar"
                            >
                                <div className={styles.timeBlock}>
                                    <span className={styles.timeLabel}>
                                        {formatTime(segment.start)}
                                    </span>
                                    <ArrowRight size={14} className={styles.timeArrow} />
                                    <span className={styles.timeLabel}>
                                        {segment.end ? formatTime(segment.end) : 'Agora'}
                                    </span>
                                </div>

                                <span className={styles.durationBadge}>
                                    {formatDuration(duration)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Editar Ponto</h3>
                        <div className={styles.modalField}>
                            <label>Entrada:</label>
                            <DatePicker
                                selected={editStart}
                                onChange={(date: Date | null) => setEditStart(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy HH:mm"
                                locale="pt-BR"
                                className={styles.dateTimeInput}
                                required
                            />
                        </div>
                        <div className={styles.modalField}>
                            <label>Saída (deixe vazio se ativo):</label>
                            <DatePicker
                                selected={editEnd}
                                onChange={(date: Date | null) => setEditEnd(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy HH:mm"
                                locale="pt-BR"
                                className={styles.dateTimeInput}
                                isClearable
                                placeholderText="Em andamento..."
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={handleDeleteSegment} className={styles.deleteButton}>Excluir</button>
                            <div className={styles.rightActions}>
                                <button onClick={() => setIsEditModalOpen(false)} className={styles.cancelButton}>Cancelar</button>
                                <button onClick={handleSaveEdit} className={styles.saveButton}>Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
