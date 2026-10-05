import type { Category, CategoryInput, TransactionType } from '@/types/api'
import { newId, timestamp } from './clock'
import { conflict } from './errors'
import { findCategory, toCategory } from './mappers'
import type { CategoryRecord, Database } from './schema'
import { read, write } from './store'
import { Validator } from './validation'

/** Categorias criadas no primeiro acesso (ícones do conjunto Lucide, mapeados no front-end). */
const DEFAULTS: Omit<CategoryRecord, 'id' | 'createdAt'>[] = [
  { name: 'Moradia', type: 'EXPENSE', color: '#6366F1', icon: 'home' },
  { name: 'Alimentação', type: 'EXPENSE', color: '#F97316', icon: 'utensils' },
  { name: 'Transporte', type: 'EXPENSE', color: '#0EA5E9', icon: 'car' },
  { name: 'Saúde', type: 'EXPENSE', color: '#10B981', icon: 'heart-pulse' },
  { name: 'Lazer', type: 'EXPENSE', color: '#EC4899', icon: 'party-popper' },
  { name: 'Educação', type: 'EXPENSE', color: '#8B5CF6', icon: 'graduation-cap' },
  { name: 'Compras', type: 'EXPENSE', color: '#F59E0B', icon: 'shopping-bag' },
  { name: 'Contas', type: 'EXPENSE', color: '#EF4444', icon: 'receipt' },
  { name: 'Outros', type: 'EXPENSE', color: '#64748B', icon: 'ellipsis' },
  { name: 'Salário', type: 'INCOME', color: '#22C55E', icon: 'wallet' },
  { name: 'Freelance', type: 'INCOME', color: '#14B8A6', icon: 'briefcase' },
  { name: 'Investimentos', type: 'INCOME', color: '#3B82F6', icon: 'trending-up' },
  { name: 'Outras receitas', type: 'INCOME', color: '#84CC16', icon: 'circle-plus' },
]

export function createDefaultCategories(db: Database): void {
  const createdAt = timestamp()
  db.categories.push(...DEFAULTS.map((template) => ({ ...template, id: newId(), createdAt })))
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'pt-BR')

export function listCategories(type?: TransactionType): Promise<Category[]> {
  return read((db) => db.categories.filter((c) => !type || c.type === type).sort(byName).map(toCategory))
}

function validate(input: Omit<CategoryInput, 'type'>) {
  const v = new Validator()
  const name = v.text('name', input.name, 60, 'Informe o nome', 'O nome deve ter no máximo 60 caracteres')
  const color = v.color('color', input.color)
  const icon = v.text('icon', input.icon, 40, 'Informe o ícone', 'O ícone deve ter no máximo 40 caracteres')
  v.check()
  return { name, color, icon }
}

function assertUniqueName(db: Database, type: TransactionType, name: string, exceptId?: string) {
  const key = name.toLocaleLowerCase('pt-BR')
  if (db.categories.some((c) => c.type === type && c.id !== exceptId && c.name.toLocaleLowerCase('pt-BR') === key)) {
    throw conflict('Já existe uma categoria com este nome', 'name')
  }
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const fields = validate(input)
  const type: TransactionType = input.type === 'INCOME' ? 'INCOME' : 'EXPENSE'
  return write((db) => {
    assertUniqueName(db, type, fields.name)
    const record: CategoryRecord = { id: newId(), type, ...fields, createdAt: timestamp() }
    db.categories.push(record)
    return toCategory(record)
  })
}

export async function updateCategory(id: string, input: Omit<CategoryInput, 'type'>): Promise<Category> {
  const fields = validate(input)
  return write((db) => {
    const category = findCategory(db, id)
    assertUniqueName(db, category.type, fields.name, id)
    Object.assign(category, fields)
    return toCategory(category)
  })
}

export function deleteCategory(id: string): Promise<void> {
  return write((db) => {
    findCategory(db, id)
    if (db.transactions.some((t) => t.categoryId === id)) {
      throw conflict('Categoria possui lançamentos e não pode ser excluída')
    }
    if (db.recurring.some((r) => r.categoryId === id)) {
      throw conflict('Categoria possui lançamentos fixos e não pode ser excluída')
    }
    db.budgets = db.budgets.filter((b) => b.categoryId !== id)
    db.categories = db.categories.filter((c) => c.id !== id)
  })
}
