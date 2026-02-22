import { useEffect } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import { useTimeClockStore } from '../../time_clock/store/useTimeClockStore'
import { DailyBalanceMetric } from './DailyBalanceMetric'
import { DailyTimeline } from './DailyTimeline'
import { BurnoutWarning } from './BurnoutWarning'
import { MonthlyHeatmap } from './MonthlyHeatmap'
import { calculateWorkBlocks, formatBalance } from '../../time_clock/utils/calculations'
import { useStore } from '../../../store/useStore'
import { Download, LayoutDashboard } from 'lucide-react'
import { exportToCSV } from '../utils/csv-export'
import { getLocalDateString } from '../../../utils/dateUtils'
import styles from './Dashboard.module.css'

export const Dashboard = () => {
    const { stats, fetchPeriodStats, isLoading } = useDashboardStore()
    const { records: todayRecords } = useTimeClockStore()
    const { currentCompany } = useStore()

    useEffect(() => {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        fetchPeriodStats(startOfMonth, endOfMonth)
    }, [fetchPeriodStats, currentCompany?.id])

    if (isLoading && !stats) {
        return <div>Carregando dashboard...</div>
    }

    const todayStr = getLocalDateString(new Date())
    const todaySummary = stats?.dailySummaries.find(s => s.date === todayStr)
    const todayBalance = todaySummary?.balance || 0
    const todayWorkBlocks = calculateWorkBlocks(todayRecords)

    return (
        <div className={styles.dashboard}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <LayoutDashboard size={24} color="var(--color-primary)" />
                    <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Dashboard</h2>
                    {todayWorkBlocks.some(b => !b.finish) && (
                        <span className={styles.ongoingBadge}>Em andamento</span>
                    )}
                </div>
                {stats && (
                    <button
                        className={styles.exportBtn}
                        onClick={() => exportToCSV(stats.dailySummaries, currentCompany?.name || 'export')}
                    >
                        <Download size={16} />
                        Exportar CSV
                    </button>
                )}
            </header>

            <BurnoutWarning show={todaySummary?.isBurnoutRisk || false} />

            <div className={styles.topRow}>
                <DailyBalanceMetric
                    balance={todayBalance}
                    targetHours={stats?.targetDailyMs ? stats.targetDailyMs / 3600000 : 8}
                    isOngoing={todayWorkBlocks.some(b => !b.finish)}
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
