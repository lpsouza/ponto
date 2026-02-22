import { formatBalance } from '../../time_clock/utils/calculations'
import styles from './DailyBalanceMetric.module.css'

interface DailyBalanceMetricProps {
    balance: number
    targetHours: number
    globalBalance?: number
    isOngoing?: boolean
}

export const DailyBalanceMetric = ({ balance, targetHours, globalBalance, isOngoing }: DailyBalanceMetricProps) => {
    const isPositive = balance >= 0
    const formattedBalance = formatBalance(balance)
    const formattedGlobal = globalBalance !== undefined ? formatBalance(globalBalance) : null

    return (
        <div className={`${styles.metricCard} ${isOngoing ? styles.highlight : ''}`}>
            <div className={styles.mainBalance}>
                <span className={styles.label}>Saldo Hoje</span>
                <span className={`${styles.value} ${isPositive ? styles.positive : styles.negative}`}>
                    {formattedBalance}
                </span>
            </div>

            <div className={styles.details}>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Meta Diária</span>
                    <span className={styles.detailValue}>{targetHours}h</span>
                </div>
                {formattedGlobal && (
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Banco Total</span>
                        <span className={`${styles.detailValue} ${globalBalance! >= 0 ? styles.positive : styles.negative}`}>
                            {formattedGlobal}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
