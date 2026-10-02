import { ChevronRight, KeyRound, LogOut, Repeat, Tags, UserRound } from 'lucide-react'
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
import { useAuth } from '@/features/auth/AuthContext'
import { userApi } from '@/features/auth/api'
import { ApiError } from '@/lib/http'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
]

type Panel = 'profile' | 'password' | null

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { preference, setPreference } = useTheme()
  const [panel, setPanel] = useState<Panel>(null)

  return (
    <>
      <PageHeader title="Ajustes" description="Conta, segurança e preferências do aplicativo." />

      <div className="flex max-w-3xl flex-col gap-4">
        <Card className="animate-rise flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar name={user?.name ?? ''} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{user?.name}</p>
            <p className="truncate text-sm text-ink-3">{user?.email}</p>
          </div>
          <Button variant="secondary" onClick={() => setPanel('profile')}>
            Editar perfil
          </Button>
        </Card>

        <Card className="animate-rise overflow-hidden">
          <CardHeader title="Conta" className="border-b border-line px-5 py-4" />
          <ul className="divide-y divide-line">
            <MenuItem
              icon={<UserRound className="size-4" />}
              label="Perfil"
              description="Nome exibido no aplicativo"
              onClick={() => setPanel('profile')}
            />
            <MenuItem
              icon={<KeyRound className="size-4" />}
              label="Senha"
              description="Altere a senha de acesso"
              onClick={() => setPanel('password')}
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

        <Card className="animate-rise flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <CardHeader title="Sessão" description="Encerre o acesso neste dispositivo." />
          <Button variant="danger" onClick={logout}>
            <LogOut className="size-4" aria-hidden /> Sair da conta
          </Button>
        </Card>

        <p className="text-xs text-ink-3">Cashflow v1.0.0</p>
      </div>

      <Sheet open={panel === 'profile'} onClose={() => setPanel(null)} title="Editar perfil">
        {panel === 'profile' && <ProfileForm onDone={() => setPanel(null)} />}
      </Sheet>
      <Sheet open={panel === 'password'} onClose={() => setPanel(null)} title="Alterar senha">
        {panel === 'password' && <PasswordForm onDone={() => setPanel(null)} />}
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
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return setError('Informe o nome')
    setLoading(true)
    try {
      updateUser(await userApi.updateProfile(name.trim()))
      toast.success('Perfil atualizado')
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? (err.fieldErrors.name ?? err.message) : 'Erro ao salvar')
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

function PasswordForm({ onDone }: { onDone: () => void }) {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (next.length < 8) return setErrors({ newPassword: 'A nova senha deve ter ao menos 8 caracteres' })
    setErrors({})
    setLoading(true)
    try {
      await userApi.changePassword(current, next)
      toast.success('Senha alterada')
      onDone()
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) setErrors(err.fieldErrors)
      else setErrors({ currentPassword: err instanceof Error ? err.message : 'Erro ao alterar senha' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <TextField
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        error={errors.currentPassword}
      />
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        error={errors.newPassword}
      />
      <Button type="submit" size="lg" block loading={loading}>
        Alterar senha
      </Button>
    </form>
  )
}
