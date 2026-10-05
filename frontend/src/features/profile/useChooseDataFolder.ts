import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { changeDataFolder } from '@/data/desktop'

/** App desktop: escolher a pasta do arquivo de dados (ex.: uma pasta do OneDrive). */
export function useChooseDataFolder() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  async function choose() {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const dir = await open({ directory: true, title: 'Pasta do arquivo de dados' })
    if (typeof dir !== 'string') return
    setLoading(true)
    try {
      const result = await changeDataFolder(dir)
      await queryClient.invalidateQueries()
      toast.success(result === 'opened' ? 'Dados da pasta escolhida abertos' : 'Dados copiados para a nova pasta')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao trocar a pasta')
    } finally {
      setLoading(false)
    }
  }

  return { choose, loading }
}
