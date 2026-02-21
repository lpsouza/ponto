import { useAuth } from '../../auth/AuthProvider'
import { CompanySelector } from '../../companies/components/CompanySelector'
import { LogOut, User } from 'lucide-react'
import styles from './Navbar.module.css'
import { pb } from '../../../lib/pocketbase'

export const Navbar = () => {
    const { user, logout } = useAuth()

    const avatarUrl = user?.avatar
        ? pb.files.getUrl(user as any, user.avatar)
        : null

    return (
        <nav className={styles.navbar}>
            <div className={styles.left}>
                <div className={styles.logo}>
                    <div className={styles.logoMark}></div>
                    <span className={styles.logoText}>Ponto Livre</span>
                </div>
            </div>

            <div className={styles.center}>
                <CompanySelector />
            </div>

            <div className={styles.right}>
                <div className={styles.userProfile}>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user?.name || user?.username}</span>
                        <span className={styles.userStatus}>Online</span>
                    </div>
                    <div className={styles.avatar}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={user?.name} />
                        ) : (
                            <User size={20} />
                        )}
                    </div>
                </div>

                <button className={styles.logoutBtn} onClick={logout} title="Sair">
                    <LogOut size={20} />
                </button>
            </div>
        </nav>
    )
}
