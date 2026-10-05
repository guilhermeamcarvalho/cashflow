import { ChevronRight, Download, Repeat, Tags, Trash2, Upload, UserRound } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useTheme, type ThemePreference } from '@/app/theme'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { TextField } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { isDesktop, STORAGE_PLACE } from '@/data/desktop'
import { AppError } from '@/data/errors'
import { downloadBackup } from '@/features/profile/backupFile'
import { useProfile } from '@/features/profile/ProfileContext'
import { DataFileCard } from './DataFileCard'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
]

type Panel = 'profile' | 'restore' | 'reset' | null

export default function SettingsPage() {
  const { profile } = useProfile()
  const { preference, setPreference } = useTheme()
  const toast = useToast()
  const [panel, setPanel] = useState<Panel>(null)

  async function handleExport() {
    try {
      await downloadBackup()
      toast.success('Backup exportado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao exportar')
    }
  }

  return (
    <>
      <PageHeader title="Ajustes" description="Perfil, dados e preferências do aplicativo." />

      <div className="flex max-w-3xl flex-col gap-4">
        <Card className="animate-rise flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar name={profile?.name ?? ''} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{profile?.name || 'Sem nome'}</p>
            <p className="truncate text-sm text-ink-3">Dados salvos {STORAGE_PLACE}</p>
          </div>
          <Button variant="secondary" onClick={() => setPanel('profile')}>
            Editar perfil
          </Button>
        </Card>

        <Card className="animate-rise overflow-hidden">
          <CardHeader title="Geral" className="border-b border-line px-5 py-4" />
          <ul className="divide-y divide-line">
            <MenuItem
              icon={<UserRound className="size-4" />}
              label="Perfil"
              description="Nome exibido no aplicativo"
              onClick={() => setPanel('profile')}
            />
            <MenuItem
              icon={<Repeat className="size-4" />}
              label="Lançamentos fixos"
              description="Despesas e receitas que se repetem todo mês"
              to="/recurring"
            />
            <MenuItem
              icon={<Tags className="size-4" />}
              label="Categorias"
              description="Gerencie categorias de receitas e despesas"
              to="/settings/categories"
            />
          </ul>
        </Card>

        <Card className="animate-rise p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardHeader
              title="Aparência"
              description={
                preference === 'system'
                  ? 'Segue a configuração do dispositivo.'
                  : `Tema ${preference === 'dark' ? 'escuro' : 'claro'} fixo.`
              }
            />
            <SegmentedControl
              label="Tema"
              options={THEME_OPTIONS}
              value={preference}
              onChange={setPreference}
              className="sm:w-72"
            />
          </div>
        </Card>

        {isDesktop && <DataFileCard />}

        <Card className="animate-rise overflow-hidden">
          <CardHeader
            title="Dados"
            description={
              isDesktop
                ? 'Exporte um backup para guardar uma cópia ou abrir os dados no navegador.'
                : 'Tudo fica salvo só neste navegador. Exporte um backup de vez em quando para não perder nada e para levar os dados a outro aparelho.'
            }
            className="border-b border-line px-5 py-4"
          />
          <ul className="divide-y divide-line">
            <MenuItem
              icon={<Download className="size-4" />}
              label="Exportar backup"
              description="Baixa um arquivo .json com todos os dados"
              onClick={handleExport}
            />
            <MenuItem
              icon={<Upload className="size-4" />}
              label="Restaurar backup"
              description="Substitui os dados deste navegador pelos do arquivo"
              onClick={() => setPanel('restore')}
            />
            <MenuItem
              icon={<Trash2 className="size-4" />}
              label="Apagar todos os dados"
              description="Remove lançamentos, cartões, orçamentos e categorias"
              onClick={() => setPanel('reset')}
            />
          </ul>
        </Card>

        <p className="text-xs text-ink-3">Cashflow v1.0.0</p>
      </div>

      <Sheet open={panel === 'profile'} onClose={() => setPanel(null)} title="Editar perfil">
        {panel === 'profile' && <ProfileForm onDone={() => setPanel(null)} />}
      </Sheet>
      <Sheet open={panel === 'restore'} onClose={() => setPanel(null)} title="Restaurar backup">
        {panel === 'restore' && <RestoreForm onDone={() => setPanel(null)} />}
      </Sheet>
      <Sheet open={panel === 'reset'} onClose={() => setPanel(null)} title="Apagar todos os dados">
        {panel === 'reset' && <ResetForm onExport={handleExport} />}
      </Sheet>
    </>
  )
}

interface MenuItemProps {
  icon: ReactNode
  label: string
  description: string
  to?: string
  onClick?: () => void
}

function MenuItem({ icon, label, description, to, onClick }: MenuItemProps) {
  const className = 'flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-2'
  const content = (
    <>
      <span className="flex size-8 items-center justify-center rounded-md border border-line bg-surface-2 text-ink-2">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block truncate text-[0.8125rem] text-ink-3">{description}</span>
      </span>
      <ChevronRight className="size-4 text-ink-3" aria-hidden />
    </>
  )
  return (
    <li>
      {to ? (
        <Link to={to} className={className}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {content}
        </button>
      )}
    </li>
  )
}

function ProfileForm({ onDone }: { onDone: () => void }) {
  const { profile, rename } = useProfile()
  const toast = useToast()
  const [name, setName] = useState(profile?.name ?? '')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return setError('Informe o nome')
    setLoading(true)
    try {
      await rename(name)
      toast.success('Perfil atualizado')
      onDone()
    } catch (err) {
      setError(err instanceof AppError ? (err.fieldErrors.name ?? err.message) : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <TextField label="Nome" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} error={error} />
      <Button type="submit" size="lg" block loading={loading}>
        Salvar
      </Button>
    </form>
  )
}

function RestoreForm({ onDone }: { onDone: () => void }) {
  const { restore } = useProfile()
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) return setError('Escolha o arquivo de backup')
    setLoading(true)
    try {
      await restore(await file.text())
      toast.success('Backup restaurado')
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao restaurar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <p className="text-sm text-ink-2">
        Os dados atuais deste navegador serão <strong>substituídos</strong> pelos do arquivo. Se quiser guardá-los,
        exporte um backup antes.
      </p>
      <TextField
        label="Arquivo de backup (.json)"
        type="file"
        accept="application/json,.json"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null)
          setError(undefined)
        }}
        error={error}
      />
      <Button type="submit" size="lg" block loading={loading}>
        Restaurar
      </Button>
    </form>
  )
}

const RESET_CONFIRMATION = 'APAGAR'

function ResetForm({ onExport }: { onExport: () => void }) {
  const { reset } = useProfile()
  const toast = useToast()
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (typed.trim().toUpperCase() !== RESET_CONFIRMATION) return
    setLoading(true)
    try {
      await reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao apagar')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <p className="text-sm text-ink-2">
        Isso apaga <strong>todos</strong> os dados deste navegador e não pode ser desfeito.{' '}
        <button type="button" className="font-medium text-accent hover:underline" onClick={onExport}>
          Exportar um backup antes
        </button>
      </p>
      <TextField
        label={`Digite ${RESET_CONFIRMATION} para confirmar`}
        autoComplete="off"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
      />
      <Button
        type="submit"
        variant="danger"
        size="lg"
        block
        loading={loading}
        disabled={typed.trim().toUpperCase() !== RESET_CONFIRMATION}
      >
        Apagar tudo
      </Button>
    </form>
  )
}
