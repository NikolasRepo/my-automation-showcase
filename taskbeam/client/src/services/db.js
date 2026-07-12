import { openDB } from 'idb'

const DB_NAME = 'taskbeam'
const DB_VERSION = 1
const STORE_NAME = 'projects'

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    },
  })
}

export async function loadProjects() {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function saveProjects(projects) {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  await tx.store.clear()
  for (const project of projects) {
    await tx.store.put(project)
  }
  await tx.done
}