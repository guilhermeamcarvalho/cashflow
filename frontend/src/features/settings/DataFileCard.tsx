import { useQuery } from '@tanstack/react-query'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { dataFilePath } from '@/data/desktop'
import { useChooseDataFolder } from '@/features/profile/useChooseDataFolder'

/** Só no app desktop: mostra onde fica o arquivo de dados e permite trocar a pasta. */
export function DataFileCard() {
  // `invalidateQueries()` após a troca de pasta também atualiza este caminho.
  const path = useQuery({ queryKey: ['desktop', 'data-file'], queryFn: dataFilePath })
  const { choose, loading } = useChooseDataFolder()

  return (
    <Card className="animate-rise flex flex-col gap-4 p-5">
      <CardHeader
        title="Arquivo de dados"
        description="Escolha uma pasta do OneDrive para ter backup automático e usar os mesmos dados em outro computador (com o app aberto em um de cada vez)."
      />
      <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs break-all text-ink-2">
        {path.data ?? '…'}
      </p>
      <Button variant="secondary" onClick={choose} loading={loading} className="self-start">
        <FolderOpen className="size-4" aria-hidden /> Escolher pasta…
      </Button>
    </Card>
  )
}
