import { emptyDatabase, migrate, type Database } from './schema'

/**
 * Banco de dados local: todo o estado fica em memória e é gravado inteiro no
 * IndexedDB a cada alteração. Os volumes de um controle financeiro pessoal
 * (milhares de lançamentos) cabem folgados nesse modelo e as consultas viram
 * simples filtros em arrays.
 */
export interface StorageAdapter {
  load(): Promise<Database | null>
  save(db: Database): Promise<void>
}

const DB_NAME = 'cashflow'
const STORE = 'kv'
const KEY = 'db'

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function idbRequest<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openIndexedDb().then(
    (idb) =>
      new Promise<T>((resolve, reject) => {
        const tx = idb.transaction(STORE, mode)
        const request = run(tx.objectStore(STORE))
        tx.oncomplete = () => {
          idb.close()
          resolve(request.result as T)
        }
        tx.onerror = tx.onabort = () => {
          idb.close()
          reject(tx.error)
        }
      }),
  )
}

export const indexedDbAdapter: StorageAdapter = {
  load: () => idbRequest<Database | undefined>('readonly', (store) => store.get(KEY)).then((db) => db ?? null),
  save: (db) => idbRequest<void>('readwrite', (store) => store.put(db, KEY)),
}

/** Armazenamento só em memória (testes e navegadores sem IndexedDB). */
export function memoryAdapter(initial: Database | null = null): StorageAdapter {
  let data = initial
  return {
    load: async () => (data ? structuredClone(data) : null),
    save: async (db) => {
      data = structuredClone(db)
    },
  }
}

let adapter: StorageAdapter = typeof indexedDB === 'undefined' ? memoryAdapter() : indexedDbAdapter
let loaded: Promise<Database> | null = null
/** Fila que serializa leituras e escritas (nenhuma leitura vê uma escrita pela metade). */
let queue: Promise<unknown> = Promise.resolve()

export function setStorageAdapter(next: StorageAdapter): void {
  adapter = next
  loaded = null
}

function current(): Promise<Database> {
  loaded ??= adapter.load().then((db) => (db ? migrate(db) : emptyDatabase()))
  return loaded
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task)
  queue = result.catch(() => undefined)
  return result
}

/** Executa uma consulta sobre o estado atual. `fn` não deve alterar `db`. */
export function read<T>(fn: (db: Database) => T): Promise<T> {
  return enqueue(async () => fn(await current()))
}

/**
 * Executa uma alteração de forma atômica: `fn` trabalha numa cópia, e só se
 * terminar sem erro a cópia vira o estado atual e é gravada.
 */
export function write<T>(fn: (db: Database) => T): Promise<T> {
  return enqueue(async () => {
    const draft = structuredClone(await current())
    const result = fn(draft)
    await adapter.save(draft)
    loaded = Promise.resolve(draft)
    notifyOtherTabs()
    requestPersistence()
    return result
  })
}

/** Substitui todo o banco (importação de backup / apagar tudo). */
export function replaceAll(db: Database): Promise<void> {
  return write((draft) => {
    Object.assign(draft, migrate(db))
  })
}

// --- Sincronização entre abas -------------------------------------------------

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('cashflow-data')
const listeners = new Set<() => void>()

function notifyOtherTabs(): void {
  channel?.postMessage('changed')
}

/**
 * Descarta o estado em memória (a próxima consulta relê do armazenamento) e
 * avisa as telas. Usado quando os dados mudam fora desta aba.
 */
export async function reload(): Promise<void> {
  await enqueue(async () => {
    loaded = null
  })
  listeners.forEach((listener) => listener())
}

if (channel) channel.onmessage = () => void reload()

/** Avisa quando os dados mudam fora desta aba (para invalidar o cache das telas). */
export function onExternalChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// --- Persistência ---------------------------------------------------------------

let persistenceRequested = false

/** Pede ao navegador para não apagar os dados quando faltar espaço. */
function requestPersistence(): void {
  if (persistenceRequested || typeof navigator === 'undefined') return
  persistenceRequested = true
  void navigator.storage?.persist?.().catch(() => undefined)
}
