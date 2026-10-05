import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { ErrorState, Spinner } from '@/components/ui/Feedback'
import { clearAllData, importBackup } from '@/data/backup'
import { createProfile, getProfile, updateProfile } from '@/data/profile'
import type { ProfileRecord } from '@/data/schema'
import { onExternalChange } from '@/data/store'
import { queryKeys } from '@/lib/queryKeys'

interface ProfileContextValue {
  /** null até o primeiro acesso. */
  profile: ProfileRecord | null
  start: (name: string) => Promise<void>
  rename: (name: string) => Promise<void>
  /** Substitui todos os dados pelos do backup. */
  restore: (backup: string) => Promise<void>
  /** Apaga todos os dados e volta à tela de boas-vindas. */
  reset: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

/** Carrega o perfil local (e, com ele, o banco do navegador) antes de mostrar o app. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: queryKeys.profile, queryFn: getProfile, staleTime: Infinity })

  // Dados alterados em outra aba: todas as telas recarregam.
  useEffect(() => onExternalChange(() => void queryClient.invalidateQueries()), [queryClient])

  const value = useMemo<ProfileContextValue>(() => {
    const setProfile = (profile: ProfileRecord | null) => {
      queryClient.setQueryData(queryKeys.profile, profile)
    }
    // Recarrega tudo (inclusive o perfil) mantendo a tela atual até os novos dados chegarem.
    const reloadAll = () => queryClient.invalidateQueries()
    return {
      profile: query.data ?? null,
      start: async (name) => setProfile(await createProfile(name)),
      rename: async (name) => setProfile(await updateProfile(name)),
      restore: async (backup) => {
        await importBackup(backup)
        await reloadAll()
      },
      reset: async () => {
        await clearAllData()
        await reloadAll()
      },
    }
  }, [query.data, queryClient])

  if (query.isPending) return <Spinner className="min-h-dvh items-center" />
  if (query.isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <ErrorState
          message={query.error.message || 'Não foi possível abrir os dados salvos.'}
          onRetry={() => query.refetch()}
        />
      </div>
    )
  }
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile deve ser usado dentro de <ProfileProvider>')
  return context
}
