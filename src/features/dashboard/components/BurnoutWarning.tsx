import { AlertTriangle } from 'lucide-react'
import styles from './BurnoutWarning.module.css'

interface BurnoutWarningProps {
    show: boolean
}

export const BurnoutWarning = ({ show }: BurnoutWarningProps) => {
    if (!show) return null

    return (
        <div className={styles.warning}>
            <AlertTriangle size={20} className={styles.icon} />
            <div>
                <strong>Alerta de Burnout!</strong>
                <p>Você trabalhou mais de 10 horas hoje. Tente descansar um pouco.</p>
            </div>
        </div>
    )
}
