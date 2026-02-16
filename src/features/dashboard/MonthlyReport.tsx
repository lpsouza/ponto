import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Flame } from 'lucide-react'
import {
    getDailyDataList,
    generateHeatmapData,
    calculateNetBalance,
    countBurnoutDays,
    formatBalance,
    formatHoursDecimal,
    generateCsvContent,
    downloadCsv,
    DEFAULT_DAILY_HOURS,
    HeatmapCell,
} from './dashboardCalculations'
import { useDashboardRecords } from './useDashboardRecords'
import styles from './MonthlyReport.module.css'

interface MonthlyReportProps {
    companyId: string | null
    companyName?: string
    expectedHours?: number
}

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/**
 * Monthly report component with heatmap, net balance, and CSV export.
 */
export const MonthlyReport: React.FC<MonthlyReportProps> = ({
    companyId,
    companyName,
    expectedHours = DEFAULT_DAILY_HOURS,
}) => {
    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth())

    const { records, loading } = useDashboardRecords(companyId, year, month)

    const dailyDataList = useMemo(
        () => getDailyDataList(records, expectedHours),
        [records, expectedHours]
    )

    const heatmapCells = useMemo(
        () => generateHeatmapData(records, year, month),
        [records, year, month]
    )

    const netBalanceMs = useMemo(
        () => calculateNetBalance(records, expectedHours),
        [records, expectedHours]
    )

    const burnoutDays = useMemo(
        () => countBurnoutDays(dailyDataList),
        [dailyDataList]
    )

    const totalWorkedMs = useMemo(
        () => dailyDataList.reduce((sum, d) => sum + d.workedMs, 0),
        [dailyDataList]
    )

    const daysWorked = dailyDataList.filter(d => d.workedMs > 0).length

    const handlePrevMonth = () => {
        if (month === 0) {
            setMonth(11)
            setYear(y => y - 1)
        } else {
            setMonth(m => m - 1)
        }
    }

    const handleNextMonth = () => {
        if (month === 11) {
            setMonth(0)
            setYear(y => y + 1)
        } else {
            setMonth(m => m + 1)
        }
    }

    const handleExport = () => {
        const csv = generateCsvContent(dailyDataList)
        const monthStr = (month + 1).toString().padStart(2, '0')
        const companySlug = companyName?.toLowerCase().replace(/\s+/g, '-') ?? 'report'
        downloadCsv(csv, `ponto-${companySlug}-${year}-${monthStr}.csv`)
    }

    // Calculate the first day offset for heatmap grid alignment
    const firstDayWeekday = new Date(year, month, 1).getDay()

    if (!companyId) {
        return null
    }

    return (
        <div className={styles.container}>
            {/* Month Navigation */}
            <div className={styles.navigation}>
                <button
                    className={styles.navButton}
                    onClick={handlePrevMonth}
                    aria-label="Mês anterior"
                >
                    <ChevronLeft size={18} />
                </button>
                <h3 className={styles.monthTitle}>
                    {MONTH_NAMES[month]} {year}
                </h3>
                <button
                    className={styles.navButton}
                    onClick={handleNextMonth}
                    aria-label="Próximo mês"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {loading ? (
                <div className={styles.loading}>Carregando relatório...</div>
            ) : (
                <>
                    {/* Summary Stats */}
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>Saldo do Período</span>
                            <span className={`${styles.statValue} ${netBalanceMs >= 0 ? styles.positive : styles.negative}`}>
                                {formatBalance(netBalanceMs)}
                            </span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>Total Trabalhado</span>
                            <span className={styles.statValue}>
                                {formatHoursDecimal(totalWorkedMs)}
                            </span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>Dias Trabalhados</span>
                            <span className={styles.statValue}>{daysWorked}</span>
                        </div>
                        {burnoutDays > 0 && (
                            <div className={`${styles.statCard} ${styles.statBurnout}`}>
                                <span className={styles.statLabel}>
                                    <Flame size={14} /> Dias Intensos
                                </span>
                                <span className={`${styles.statValue} ${styles.burnoutValue}`}>
                                    {burnoutDays}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Heatmap */}
                    <div className={styles.heatmapSection}>
                        <h4 className={styles.sectionTitle}>Mapa de Intensidade</h4>
                        <div className={styles.heatmapGrid}>
                            {/* Weekday headers */}
                            {WEEKDAY_LABELS.map(label => (
                                <div key={label} className={styles.heatmapHeader}>
                                    {label}
                                </div>
                            ))}

                            {/* Empty cells for offset */}
                            {Array.from({ length: firstDayWeekday }).map((_, i) => (
                                <div key={`empty-${i}`} className={styles.heatmapEmpty} />
                            ))}

                            {/* Day cells */}
                            {heatmapCells.map((cell) => (
                                <HeatmapDay key={cell.date} cell={cell} />
                            ))}
                        </div>

                        {/* Legend */}
                        <div className={styles.legend}>
                            <span className={styles.legendLabel}>Menos</span>
                            {[0, 1, 2, 3, 4].map(level => (
                                <div
                                    key={level}
                                    className={`${styles.legendCell} ${styles[`intensity${level}`]}`}
                                />
                            ))}
                            <span className={styles.legendLabel}>Mais</span>
                        </div>
                    </div>

                    {/* Export */}
                    <div className={styles.exportSection}>
                        <button
                            className={styles.exportButton}
                            onClick={handleExport}
                            disabled={dailyDataList.length === 0}
                        >
                            <Download size={16} />
                            Exportar CSV
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

/**
 * Individual heatmap day cell with tooltip.
 */
const HeatmapDay: React.FC<{ cell: HeatmapCell }> = ({ cell }) => {
    const dayNumber = parseInt(cell.date.split('-')[2], 10)
    const intensityClass = styles[`intensity${cell.intensity}`]
    const title = cell.workedHours > 0
        ? `${cell.date}: ${cell.workedHours}h trabalhadas`
        : `${cell.date}: sem registros`

    return (
        <div
            className={`${styles.heatmapCell} ${intensityClass}`}
            title={title}
        >
            <span className={styles.heatmapDayNumber}>{dayNumber}</span>
        </div>
    )
}
