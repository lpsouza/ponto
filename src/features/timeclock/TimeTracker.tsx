import { useEffect, useState } from 'react'
import { Timer, ArrowRight, Plus, AlertCircle } from 'lucide-react'
import { useTimeRecords } from './hooks'
import {
    calculateTotalWorkedMs,
    formatDuration,
    formatTime,
    getTrackerState,
    getWorkSegments,
    toDatetimeLocalString,
} from './timeCalculations'
import styles from './TimeTracker.module.css'

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
    const {
        records,
        loading,
        addRecord
    } = useTimeRecords(companyId)

    const [currentTime, setCurrentTime] = useState(new Date())
    const [elapsedMs, setElapsedMs] = useState(0)

    // Manual entry state
    const [manualDate, setManualDate] = useState(toDatetimeLocalString(new Date()))
    const [manualType, setManualType] = useState<'start' | 'finish'>('start')
    const [submitting, setSubmitting] = useState(false)

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date()
            setCurrentTime(now)
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // Calculate total worked time
    useEffect(() => {
        const total = calculateTotalWorkedMs(records, currentTime)
        setElapsedMs(total)
    }, [records, currentTime])

    const { status } = getTrackerState(records)
    const currentStatus = statusConfig[status]
    const segments = getWorkSegments(records)

    const handleMainAction = async () => {
        if (!companyId || submitting) return
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
        if (!companyId || submitting) return

        const date = new Date(manualDate)
        if (isNaN(date.getTime())) {
            alert('Data inválida')
            return
        }

        setSubmitting(true)
        try {
            await addRecord(manualType, {
                timestamp: date.toISOString(),
                isManual: true,
                notes: 'Manual entry'
            })
            // Reset form to current time
            setManualDate(toDatetimeLocalString(new Date()))
        } catch (error) {
            console.error(error)
            alert('Erro ao adicionar registro manual')
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
                        {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>

                <div className={styles.mainAction}>
                    <button
                        className={`${styles.toggleButton} ${currentStatus.buttonClass}`}
                        onClick={handleMainAction}
                        disabled={loading || submitting}
                    >
                        {loading ? 'Carregando...' : currentStatus.buttonText}
                    </button>
                </div>

                {/* Manual Entry Form */}
                <div className={styles.manualEntry}>
                    <h3 className={styles.manualEntryTitle}>Adicionar registro manual</h3>
                    <form className={styles.manualForm} onSubmit={handleManualEntry}>
                        <input
                            type="datetime-local"
                            className={styles.dateTimeInput}
                            value={manualDate}
                            onChange={(e) => setManualDate(e.target.value)}
                            required
                        />
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
                <h3 className={styles.timelineTitle}>Histórico de hoje</h3>
                <div className={styles.timelineList}>
                    {segments.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Nenhum registro hoje.
                        </p>
                    )}

                    {segments.map((segment) => {
                        const isCompleted = !!segment.end
                        const duration = isCompleted
                            ? segment.end!.getTime() - segment.start.getTime()
                            : currentTime.getTime() - segment.start.getTime()

                        // Find original records to allow deletion
                        // In a real app we might store record IDs in the segment
                        // For now we'll just not implement individual record deletion from the block view easily
                        // Or we can find them in the records array.
                        // Let's keep it simple: just show the blocks. 
                        // To delete, we would need to list individual records, 
                        // but the spec says "timeline: show records as entry/exit pairs".

                        return (
                            <div
                                key={segment.start.toISOString()}
                                className={`${styles.timelineItem} ${isCompleted ? styles.completed : styles.active}`}
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
        </div>
    )
}
