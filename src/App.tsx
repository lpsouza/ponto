import { useState } from 'react'
import { useAuth } from './features/auth/AuthProvider'
import LoginPage from './features/auth/pages/LoginPage'
import { Navbar } from './features/layout/components/Navbar'
import { PlusCircle, Clock, LayoutDashboard } from 'lucide-react'
import { useStore } from './store/useStore'
import { TimeClock } from './features/time_clock/components/TimeClock'
import { Dashboard } from './features/dashboard/components/Dashboard'

function App() {
  const { user, isLoading } = useAuth()
  const { currentCompany } = useStore()
  const [activeTab, setActiveTab] = useState<'clock' | 'dashboard'>('clock')

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>Sincronizando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <>
      <Navbar />
      <main style={{
        padding: 'var(--spacing-xl)',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {!currentCompany ? (
          <div style={{
            height: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-lg)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--color-surface-lvl2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <PlusCircle size={40} />
            </div>
            <div>
              <h2>Nenhum contexto selecionado</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Crie ou selecione uma empresa para começar a registrar seus pontos.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
            <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-xs)' }}>
                  Olá, {user.name || user.username}!
                </h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Contexto: <strong>{currentCompany.name}</strong>
                </p>
              </div>

              <div style={{
                display: 'flex',
                background: 'var(--color-surface-lvl2)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                gap: '4px'
              }}>
                <button
                  onClick={() => setActiveTab('clock')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: activeTab === 'clock' ? 'var(--color-surface-lvl3)' : 'transparent',
                    color: activeTab === 'clock' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <Clock size={18} />
                  <span>Ponto</span>
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: activeTab === 'dashboard' ? 'var(--color-surface-lvl3)' : 'transparent',
                    color: activeTab === 'dashboard' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </button>
              </div>
            </section>

            {activeTab === 'clock' ? (
              <TimeClock />
            ) : (
              <Dashboard />
            )}
          </div>
        )}
      </main>
    </>
  )
}

export default App
