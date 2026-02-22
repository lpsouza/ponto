import type { DailySummary } from './dashboard-calculations'
import { formatBalance } from '../../time_clock/utils/calculations'

export const exportToCSV = (summaries: DailySummary[], companyName: string) => {
    const headers = ['Data', 'Total Trabalhado (ms)', 'Total Trabalhado (h)', 'Saldo (h)', 'Burnout Risk']
    const rows = summaries.map(s => [
        s.date,
        s.totalDuration,
        (s.totalDuration / 3600000).toFixed(2),
        formatBalance(s.balance),
        s.isBurnoutRisk ? 'SIM' : 'NÃO'
    ])

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `ponto_livre_${companyName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
