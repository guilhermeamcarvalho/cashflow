import { exportBackup } from '@/data/backup'
import { toIsoDate } from '@/lib/month'

/** Baixa o backup como `cashflow-backup-AAAA-MM-DD.json`. */
export async function downloadBackup(): Promise<void> {
  const blob = new Blob([await exportBackup()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `cashflow-backup-${toIsoDate(new Date())}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
