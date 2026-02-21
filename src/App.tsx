import { useAuth } from './features/auth/AuthProvider'
import LoginPage from './features/auth/pages/LoginPage'
import { Navbar } from './features/layout/components/Navbar'
import { PlusCircle } from 'lucide-react'
import { useStore } from './store/useStore'
import { TimeClock } from './features/time_clock/components/TimeClock'

function App() {
  const { user, isLoading } = useAuth()
  const { currentCompany } = useStore()

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
            <section>
              <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-md)' }}>
                Olá, {user.name || user.username}!
              </h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Você está visualizando o contexto: <strong>{currentCompany.name}</strong>
              </p>
            </section>

            {/* Main Time Clock Feature */}
            <TimeClock />

          </div>
        )}
      </main>
    </>
  )
}

export default App
