import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { ApiError } from '@/lib/http'
import { useAuth } from './AuthContext'
import { AuthLayout } from './AuthLayout'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: e.target.value }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setError(null)
    if (form.password.length < 8) {
      setErrors({ password: 'A senha deve ter ao menos 8 caracteres' })
      return
    }
    setLoading(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors)
        if (Object.keys(err.fieldErrors).length === 0) setError(err.message)
      } else {
        setError('Não foi possível criar a conta')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Comece a organizar suas finanças em poucos minutos."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField label="Nome" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />
        {error && (
          <p role="alert" className="rounded-lg border border-critical/20 bg-critical/5 px-3.5 py-2.5 text-sm text-critical">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" block loading={loading} className="mt-1">
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  )
}
