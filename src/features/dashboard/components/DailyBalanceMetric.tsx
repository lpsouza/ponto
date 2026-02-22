import { formatBalance } from '../../time_clock/utils/calculations'
import styles from './DailyBalanceMetric.module.css'

interface DailyBalanceMetricProps {
    balance: number
    targetHours: number
    isOngoing?: boolean
}

export const DailyBalanceMetric = ({ balance, targetHours, isOngoing }: DailyBalanceMetricProps) => {
    const isPositive = balance >= 0
    const formattedBalance = formatBalance(balance)

    return (
        <div className={`${styles.metricCard} ${isOngoing ? styles.highlight : ''}`}>
            <span className={styles.label}>Saldo Hoje</span>
            <div className={`${styles.value} ${isPositive ? styles.positive : styles.negative}`}>
                {formattedBalance}
            </div>
            <span className={styles.subtext}>Meta: {targetHours}h/dia</span>
        </div>
    )
}
