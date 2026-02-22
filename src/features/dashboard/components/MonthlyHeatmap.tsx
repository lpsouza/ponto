import type { DailySummary } from '../utils/dashboard-calculations'
import styles from './MonthlyHeatmap.module.css'

interface MonthlyHeatmapProps {
    summaries: DailySummary[]
}

export const MonthlyHeatmap = ({ summaries }: MonthlyHeatmapProps) => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Get number of days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    // Get which day of week the month starts (0-6)
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const padding = Array.from({ length: firstDayOfWeek }, (_, i) => i)

    const getIntensityClass = (dateStr: string) => {
        const summary = summaries.find(s => s.date === dateStr)
        if (!summary || summary.totalDuration === 0) return styles.level0

        if (summary.isBurnoutRisk) return styles.burnout

        const hours = summary.totalDuration / (1000 * 60 * 60)
        if (hours < 4) return styles.level1
        if (hours < 6) return styles.level2
        if (hours < 8) return styles.level3
        return styles.level4
    }

    const monthName = today.toLocaleString('pt-BR', { month: 'long' })

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.title}>Intensidade - {monthName}</span>
            </div>
            <div className={styles.dayLabel}>
                <span>Dom</span>
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
            </div>
            <div className={styles.grid}>
                {padding.map(i => <div key={`pad-${i}`} />)}
                {days.map(day => {
                    const date = new Date(currentYear, currentMonth, day)
                    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`

                    return (
                        <div
                            key={day}
                            className={`${styles.day} ${getIntensityClass(dateStr)}`}
                            title={`${day}/${currentMonth + 1}: ${summaries.find(s => s.date === dateStr)?.totalDuration ? (summaries.find(s => s.date === dateStr)!.totalDuration / 3600000).toFixed(1) + 'h' : 'Sem registros'}`}
                        />
                    )
                })}
            </div>
        </div>
    )
}
