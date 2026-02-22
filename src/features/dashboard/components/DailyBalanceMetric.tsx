import { formatBalance } from '../../time_clock/utils/calculations'
import styles from './DailyBalanceMetric.module.css'

interface DailyBalanceMetricProps {
    balance: number
    targetHours: number
}

export const DailyBalanceMetric = ({ balance, targetHours }: DailyBalanceMetricProps) => {
    const isPositive = balance >= 0
    const formattedBalance = formatBalance(balance)

    return (
        <div className={styles.metricCard}>
            <span className={styles.label}>Saldo Hoje</span>
            <div className={`${styles.value} ${isPositive ? styles.positive : styles.negative}`}>
                {formattedBalance}
            </div>
            <span className={styles.subtext}>Meta: {targetHours}h/dia</span>
        </div>
    )
}
