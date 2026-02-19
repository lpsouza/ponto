import { useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { useNavigate } from 'react-router-dom'
import styles from './LoginPage.module.css'

export const LoginPage = () => {
    const { signInWithGoogle, user, loading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user && !loading) {
            navigate('/dashboard', { replace: true })
        }
    }, [user, loading, navigate])

    if (loading) {
        return <div className={styles.container}>Loading...</div>
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Ponto Livre</h1>
            <p className={styles.subtitle}>
                Gerencie seu tempo com liberdade e equilíbrio.
            </p>

            <button
                onClick={signInWithGoogle}
                className={styles.button}
                aria-label="Entrar com Google"
            >
                <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google Logo"
                    className={styles.googleIcon}
                />
                Entrar com Google
            </button>
        </div>
    )
}
