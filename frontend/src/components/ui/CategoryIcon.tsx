import clsx from 'clsx'
import {
  Baby,
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Car,
  CirclePlus,
  Coffee,
  Coins,
  Dumbbell,
  Ellipsis,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Music,
  PartyPopper,
  PawPrint,
  Pill,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  Smartphone,
  Stethoscope,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Registro de ícones disponíveis para categorias. O banco local guarda apenas o nome
 * (ex.: "utensils"); aqui o nome é traduzido para o componente do Lucide.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  home: House,
  utensils: Utensils,
  car: Car,
  'heart-pulse': HeartPulse,
  'party-popper': PartyPopper,
  'graduation-cap': GraduationCap,
  'shopping-bag': ShoppingBag,
  receipt: Receipt,
  ellipsis: Ellipsis,
  wallet: Wallet,
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  'circle-plus': CirclePlus,
  coffee: Coffee,
  fuel: Fuel,
  bus: Bus,
  plane: Plane,
  gift: Gift,
  dumbbell: Dumbbell,
  smartphone: Smartphone,
  zap: Zap,
  wifi: Wifi,
  baby: Baby,
  'paw-print': PawPrint,
  shirt: Shirt,
  film: Film,
  music: Music,
  gamepad: Gamepad2,
  book: BookOpen,
  stethoscope: Stethoscope,
  pill: Pill,
  landmark: Landmark,
  coins: Coins,
  banknote: Banknote,
  building: Building2,
}

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS)

interface CategoryIconProps {
  icon: string
  color: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Sem fundo tingido: apenas o ícone (ex.: seletor de ícones). */
  plain?: boolean
  className?: string
}

const sizes = {
  xs: 'size-5 rounded [&>svg]:size-3',
  sm: 'size-7 rounded-md [&>svg]:size-3.5',
  md: 'size-9 rounded-lg [&>svg]:size-[1.125rem]',
  lg: 'size-11 rounded-lg [&>svg]:size-5',
}

/** Ícone da categoria num quadrado discreto tingido com a cor da categoria. */
export function CategoryIcon({ icon, color, size = 'md', plain = false, className }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[icon] ?? Ellipsis
  return (
    <span
      aria-hidden
      className={clsx('inline-flex shrink-0 items-center justify-center', sizes[size], className)}
      style={plain ? { color } : { color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      <Icon strokeWidth={2} />
    </span>
  )
}
