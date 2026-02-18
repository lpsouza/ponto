
import { useAuth } from '../auth/AuthProvider'
import { useCompanies } from '../companies/hooks'
import { useActiveCompany } from '../companies/useActiveCompany'
import { useTimeRecords } from '../timeclock/hooks'
import { TimeTracker } from '../timeclock/TimeTracker'
import { CompanyList } from '../companies/CompanyList'
import { DailyBalance } from './DailyBalance'
import { MonthlyReport } from './MonthlyReport'
import styles from './DashboardPage.module.css'

export const DashboardPage = () => {
    const { profile, signOut } = useAuth()
    const { companies } = useCompanies()
    const { activeCompanyId, setActiveCompany, loading: switching } = useActiveCompany()
    const { records: todayRecords } = useTimeRecords(activeCompanyId)

    const activeCompany = companies.find(c => c.id === activeCompanyId)
    const activeCompanyName = activeCompany?.name

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Olá, {profile?.full_name?.split(' ')[0]}</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        {activeCompanyName
                            ? `Contexto: ${activeCompanyName}`
                            : 'Selecione um contexto para começar'}
                    </p>
                </div>
                <div className={styles.headerActions}>
                    {/* Company Selector Dropdown */}
                    {companies.length > 0 && (
                        <select
                            className={styles.companySelect}
                            value={activeCompanyId ?? ''}
                            onChange={(e) => e.target.value && setActiveCompany(e.target.value)}
                            disabled={switching}
                            aria-label="Selecionar contexto de empresa"
                        >
                            <option value="" disabled>Selecionar contexto...</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                    <button onClick={signOut} className={`${styles.button} ${styles.buttonOutline}`}>
                        Sair
                    </button>
                </div>
            </header>

            {/* Time Tracker Section */}
            <section className={styles.trackerSection}>
                <TimeTracker companyId={activeCompanyId} />
            </section>

            {/* Daily Balance Section */}
            {activeCompanyId && todayRecords.length > 0 && (
                <section className={styles.balanceSection}>
                    <DailyBalance records={todayRecords} />
                </section>
            )}

            {/* Monthly Report Section */}
            {activeCompanyId && (
                <section className={styles.reportSection}>
                    <MonthlyReport
                        companyId={activeCompanyId}
                        companyName={activeCompanyName}
                    />
                </section>
            )}

            <CompanyList />
        </div>
    )
}

