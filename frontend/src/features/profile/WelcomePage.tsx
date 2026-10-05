import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { isDesktop, STORAGE_PLACE } from '@/data/desktop'
import { AppError } from '@/data/errors'
import { useProfile } from './ProfileContext'
import { useChooseDataFolder } from './useChooseDataFolder'
import { WelcomeLayout } from './WelcomeLayout'

/** Primeiro acesso: começar do zero, restaurar um backup ou (desktop) abrir a pasta de dados. */
export default function WelcomePage() {
  const { start, restore } = useProfile()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const folder = useChooseDataFolder()
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function run(action: () => Promise<void>) {
    setError(null)
    setLoading(true)
    try {
      await action()
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof AppError && err.fieldErrors.name) setNameError(err.fieldErrors.name)
      else setError(err instanceof Error ? err.message : 'Algo deu errado')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return setNameError('Informe seu nome')
    setNameError(undefined)
    void run(() => start(name))
  }

  function handleFile(file: File | undefined) {
    if (file) void run(async () => restore(await file.text()))
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <WelcomeLayout
      title="Boas-vindas ao Cashflow"
      subtitle={`Seus lançamentos ficam salvos só ${STORAGE_PLACE}. Como devemos chamar você?`}
      footer={
        <>
          Já usa o Cashflow em outro aparelho?{' '}
          <button
            type="button"
            className="font-medium text-accent hover:underline"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
          >
            Restaurar backup
          </button>
          {isDesktop && (
            <>
              {' ou '}
              <button
                type="button"
                className="font-medium text-accent hover:underline"
                onClick={folder.choose}
                disabled={loading || folder.loading}
              >
                abrir a pasta de dados (OneDrive)
              </button>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="Nome"
          autoComplete="given-name"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
        />
        {error && (
          <p role="alert" className="rounded-lg border border-critical/20 bg-critical/5 px-3.5 py-2.5 text-sm text-critical">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" block loading={loading} className="mt-1">
          Começar
        </Button>
      </form>
    </WelcomeLayout>
  )
}
