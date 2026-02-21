import React from 'react'
import { useAuth } from '../AuthProvider'
import { LogIn } from 'lucide-react'
import styles from './LoginPage.module.css'

const LoginPage: React.FC = () => {
    const { login, isLoading } = useAuth()

    const handleLogin = async () => {
        try {
            await login()
        } catch (error) {
            // Error is logged in AuthProvider
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.glassCard}>
                <div className={styles.header}>
                    <div className={styles.logoCircle}>
                        <div className={styles.clockIcon}></div>
                    </div>
                    <h1>Ponto Livre</h1>
                    <p>Seu controle pessoal de saldo de horas.</p>
                </div>

                <div className={styles.content}>
                    <button
                        className={styles.googleButton}
                        onClick={handleLogin}
                        disabled={isLoading}
                    >
                        <LogIn size={20} />
                        <span>Entrar com Google</span>
                    </button>

                    <p className={styles.disclaimer}>
                        Utilizamos o Google para garantir sua segurança e praticidade.
                    </p>
                </div>
            </div>

            <div className={styles.backgroundGlow}></div>
        </div>
    )
}

export default LoginPage
