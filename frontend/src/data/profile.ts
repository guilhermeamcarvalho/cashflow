import { timestamp } from './clock'
import { createDefaultCategories } from './categories'
import type { ProfileRecord } from './schema'
import { read, write } from './store'
import { Validator } from './validation'

/** Perfil local: só o nome exibido. Existe a partir do primeiro acesso. */
export function getProfile(): Promise<ProfileRecord | null> {
  return read((db) => (db.profile ? { ...db.profile } : null))
}

function validName(name: string): string {
  const v = new Validator()
  const trimmed = v.text('name', name, 120, 'Informe o nome', 'O nome deve ter no máximo 120 caracteres')
  v.check()
  return trimmed
}

/** Primeiro acesso: cria o perfil e as categorias padrão. */
export async function createProfile(name: string): Promise<ProfileRecord> {
  const trimmed = validName(name)
  return write((db) => {
    db.profile = { name: trimmed, createdAt: timestamp() }
    if (db.categories.length === 0) createDefaultCategories(db)
    return { ...db.profile }
  })
}

export async function updateProfile(name: string): Promise<ProfileRecord> {
  const trimmed = validName(name)
  return write((db) => {
    db.profile = { createdAt: timestamp(), ...db.profile, name: trimmed }
    return { ...db.profile }
  })
}
