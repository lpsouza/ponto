import React, { useMemo } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { TimeRecord, WorkSegment, getWorkSegments } from '../timeclock/timeCalculations'
import {
    calculateDailyBalance,
    formatBalance,
    formatHoursDecimal,
    isBurnoutDay,
    DEFAULT_DAILY_HOURS,
} from './dashboardCalculations'
import styles from './DailyBalance.module.css'

interface DailyBalanceProps {
    records: TimeRecord[]
    expectedHours?: number
}

/**
 * Displays the daily balance with a visual timeline bar,
 * balance metric, and burnout warning.
 */
export const DailyBalance: React.FC<DailyBalanceProps> = ({
    records,
    expectedHours = DEFAULT_DAILY_HOURS,
}) => {
    const dailyData = useMemo(
        () => calculateDailyBalance(records, expectedHours),
        [records, expectedHours]
    )

    const segments = useMemo(() => getWorkSegments(records), [records])

    const burnout = isBurnoutDay(dailyData.workedMs)
    const balanceStr = formatBalance(dailyData.balanceMs)
    const workedStr = formatHoursDecimal(dailyData.workedMs)
    const isPositive = dailyData.balanceMs >= 0
    const isZero = dailyData.balanceMs === 0

    // Calculate timeline bar percentages
    // Timeline spans the expected workday (e.g., 0 to max(expected, worked))
    const maxMs = Math.max(dailyData.expectedMs, dailyData.workedMs)
    const expectedPercent = maxMs > 0 ? (dailyData.expectedMs / maxMs) * 100 : 100
    const workedPercent = maxMs > 0 ? (dailyData.workedMs / maxMs) * 100 : 0

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Saldo do Dia</h3>
                {burnout && (
                    <div className={styles.burnoutAlert} role="alert">
                        <AlertTriangle size={16} />
                        <span>Atenção: mais de {DEFAULT_DAILY_HOURS}h trabalhadas!</span>
                    </div>
                )}
            </div>

            {/* Balance Metric */}
            <div className={styles.metric}>
                <div className={`${styles.balanceValue} ${isPositive ? styles.positive : styles.negative} ${isZero ? styles.neutral : ''}`}>
                    {isZero ? (
                        <Minus size={20} />
                    ) : isPositive ? (
                        <TrendingUp size={20} />
                    ) : (
                        <TrendingDown size={20} />
                    )}
                    <span>{balanceStr}</span>
                </div>
                <div className={styles.workedLabel}>
                    Trabalhado: {workedStr} / Esperado: {formatHoursDecimal(dailyData.expectedMs)}
                </div>
            </div>

            {/* Visual Timeline Bar */}
            <div className={styles.timelineBar}>
                <div className={styles.barBackground}>
                    <div
                        className={`${styles.barFill} ${burnout ? styles.barBurnout : isPositive ? styles.barPositive : styles.barNegative}`}
                        style={{ width: `${Math.min(workedPercent, 100)}%` }}
                    />
                    <div
                        className={styles.barExpected}
                        style={{ left: `${Math.min(expectedPercent, 100)}%` }}
                        title={`Meta: ${expectedHours}h`}
                    />
                </div>
                <div className={styles.barLabels}>
                    <span>0h</span>
                    <span>{expectedHours}h</span>
                    {dailyData.workedMs > dailyData.expectedMs && (
                        <span className={styles.barOvertime}>
                            {formatHoursDecimal(dailyData.workedMs)}
                        </span>
                    )}
                </div>
            </div>

            {/* Work Segments */}
            {segments.length > 0 && (
                <div className={styles.segments}>
                    <h4 className={styles.segmentsTitle}>Segmentos de trabalho</h4>
                    <div className={styles.segmentList}>
                        {segments.map((seg: WorkSegment, idx: number) => {
                            const startTime = seg.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            const endTime = seg.end
                                ? seg.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                : 'agora'
                            const durationMs = (seg.end ?? new Date()).getTime() - seg.start.getTime()
                            return (
                                <div key={idx} className={styles.segment}>
                                    <span className={styles.segmentTime}>{startTime} → {endTime}</span>
                                    <span className={styles.segmentDuration}>{formatHoursDecimal(durationMs)}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
