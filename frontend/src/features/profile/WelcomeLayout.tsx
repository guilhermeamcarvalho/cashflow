import { ChartColumn, PiggyBank, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { STORAGE_PLACE } from '@/data/desktop'
import { Logo } from '@/components/layout/Logo'

interface WelcomeLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

const YEAR = new Date().getFullYear()

const HIGHLIGHTS = [
  { icon: ChartColumn, title: 'Visão clara do mês', text: 'Receitas, despesas e saldo consolidados em um só lugar.' },
  { icon: PiggyBank, title: 'Orçamentos por categoria', text: 'Defina limites e acompanhe o consumo em tempo real.' },
  { icon: ShieldCheck, title: 'Seus dados, no seu aparelho', text: `Tudo fica salvo ${STORAGE_PLACE}, sem conta nem servidor.` },
]

export function WelcomeLayout({ title, subtitle, children, footer }: WelcomeLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Painel institucional (desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0b1220] p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at top left, #000 30%, transparent 75%)',
          }}
        />
        <Logo inverted className="relative" />

        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">
            Controle financeiro pessoal, com a seriedade que seu dinheiro merece.
          </h2>
          <ul className="mt-10 flex flex-col gap-6">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <item.icon className="size-4 text-white/80" aria-hidden />
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm text-white/60">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {YEAR} Cashflow</p>
      </aside>

      {/* Formulário */}
      <main className="flex items-center justify-center bg-surface px-5 py-12 sm:px-8">
        <div className="animate-rise w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-3">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-sm text-ink-3">{footer}</p>
        </div>
      </main>
    </div>
  )
}
