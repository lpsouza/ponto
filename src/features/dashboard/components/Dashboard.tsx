import { useEffect } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import { useTimeClockStore } from '../../time_clock/store/useTimeClockStore'
import { DailyBalanceMetric } from './DailyBalanceMetric'
import { DailyTimeline } from './DailyTimeline'
import { BurnoutWarning } from './BurnoutWarning'
import { MonthlyHeatmap } from './MonthlyHeatmap'
import { calculateWorkBlocks, formatBalance } from '../../time_clock/utils/calculations'
import { useStore } from '../../../store/useStore'
import { LayoutDashboard } from 'lucide-react'
import { isToday, parsePBDate } from '../../../utils/dateUtils'
import styles from './Dashboard.module.css'

export const Dashboard = () => {
    const { stats, fetchPeriodStats, isLoading } = useDashboardStore()
    const { records: todayRecords } = useTimeClockStore()
    const { currentCompany } = useStore()

    useEffect(() => {
        // Default to current month
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        fetchPeriodStats(startOfMonth, endOfMonth)
    }, [fetchPeriodStats, currentCompany?.id])

    if (isLoading && !stats) {
        return <div>Carregando dashboard...</div>
    }

    const todaySummary = stats?.dailySummaries.find(s => isToday(parsePBDate(s.date)))
    const targetHours = (stats?.targetDailyMs || 8 * 60 * 60 * 1000) / (60 * 60 * 1000)
    const todayWorkBlocks = calculateWorkBlocks(todayRecords)
    const isWorking = todayWorkBlocks.some(b => !b.finish)

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <LayoutDashboard className={styles.icon} />
                    <h2 className={styles.title}>Dashboard de Saldo</h2>
                </div>
                {stats && (
                    <div className={styles.globalBalanceHeader}>
                        <span className={styles.globalLabel}>Saldo Acumulado</span>
                        <span className={`${styles.globalValue} ${stats.totalBalance >= 0 ? styles.positive : styles.negative}`}>
                            {formatBalance(stats.totalBalance)}
                        </span>
                    </div>
                )}
            </header>

            <BurnoutWarning show={todaySummary?.isBurnoutRisk || false} />

            <div className={styles.topGrid}>
                <DailyBalanceMetric
                    balance={todaySummary?.balance || 0}
                    targetHours={targetHours}
                    globalBalance={stats?.totalBalance}
                    isOngoing={isWorking}
                />
                <DailyTimeline blocks={todayWorkBlocks} />
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.cumulativeCard}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Saldo Acumulado (Mês)</span>
                    <div style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 'bold',
                        color: (stats?.totalBalance || 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)'
                    }}>
                        {formatBalance(stats?.totalBalance || 0)}
                    </div>
                </div>
            </div>

            <MonthlyHeatmap summaries={stats?.dailySummaries || []} />
        </div>
    )
}
