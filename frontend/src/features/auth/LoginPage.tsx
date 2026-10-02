import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { ApiError } from '@/lib/http'
import { useAuth } from './AuthContext'
import { AuthLayout } from './AuthLayout'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ email, password })
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar na sua conta"
      subtitle="Informe seu e-mail e senha para continuar."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="rounded-lg border border-critical/20 bg-critical/5 px-3.5 py-2.5 text-sm text-critical">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" block loading={loading} className="mt-1">
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}
