// HARB! SUITE — SQLite veri katmanı (node:sqlite, sıfır harici bağımlılık)
// Veri dosyası: data/harb.db — yedeklemek için bu dosyayı kopyalamak yeterli.
import { DatabaseSync } from 'node:sqlite'
import { pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = join(ROOT, 'data')
export const DB_PATH = join(DATA_DIR, 'harb.db')

// Uygulama state'inin koleksiyon dilimleri — her biri kendi tablosunda satır satır durur
export const SLICES = [
  'leads', 'meetings', 'proposals', 'tasks', 'handoffs',
  'customers', 'competitors', 'activities', 'payments', 'dojoSessions'
]

// Vite HMR yeniden başlatmalarında aynı bağlantıyı koru
function openDb() {
  if (globalThis.__harbDb) return globalThis.__harbDb
  mkdirSync(DATA_DIR, { recursive: true })
  const db = new DatabaseSync(DB_PATH)
  db.exec('PRAGMA journal_mode = WAL;')
  for (const s of SLICES) {
    db.exec(`CREATE TABLE IF NOT EXISTS "${s}" (id TEXT PRIMARY KEY, data TEXT NOT NULL)`)
  }
  db.exec('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
  db.exec('CREATE TABLE IF NOT EXISTS inbox (rid INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL)')
  db.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, ad TEXT UNIQUE NOT NULL, rol TEXT NOT NULL, hash TEXT NOT NULL, salt TEXT NOT NULL, createdAt TEXT NOT NULL)')
  db.exec('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, userId TEXT NOT NULL, createdAt TEXT NOT NULL)')
  globalThis.__harbDb = db
  seedUsers(db)
  return db
}

// ---------- Kullanıcılar & Oturumlar (harici servissiz, şifreler pbkdf2-sha512 hash'li) ----------
const hashPass = (sifre, salt) => pbkdf2Sync(String(sifre), salt, 120000, 64, 'sha512').toString('hex')

// İlk çalıştırmada 5 profil: 1 kurucu, 2 admin, 2 kullanıcı
function seedUsers(db) {
  const n = db.prepare('SELECT COUNT(*) c FROM users').get().c
  if (n > 0) return
  const seed = [
    { ad: 'Hüseyin Aydın', rol: 'kurucu', sifre: 'harbi.kurucu.2026' },
    { ad: 'Muhammed Aslan', rol: 'kurucu', sifre: 'harbi.kurucu.2026' },
    { ad: 'Elif Demir', rol: 'admin', sifre: 'harbi.elif.71' },
    { ad: 'Mert Kaya', rol: 'admin', sifre: 'harbi.mert.34' },
    { ad: 'Zeynep Şahin', rol: 'kullanici', sifre: 'harbi.zeynep.16' },
    // { ad: 'Emre Çelik', rol: 'kullanici', sifre: 'harbi.emre.27' }
  ]
  const ins = db.prepare('INSERT INTO users (id, ad, rol, hash, salt, createdAt) VALUES (?,?,?,?,?,?)')
  for (const u of seed) {
    const salt = randomBytes(16).toString('hex')
    ins.run(randomUUID(), u.ad, u.rol, hashPass(u.sifre, salt), salt, new Date().toISOString())
  }
}

export function listProfiles() {
  return openDb().prepare('SELECT id, ad, rol FROM users ORDER BY CASE rol WHEN \'kurucu\' THEN 0 WHEN \'admin\' THEN 1 ELSE 2 END, ad').all()
}

export function login(ad, sifre) {
  const db = openDb()
  const u = db.prepare('SELECT * FROM users WHERE ad = ?').get(ad)
  if (!u || hashPass(sifre, u.salt) !== u.hash) return null
  const token = randomBytes(24).toString('hex')
  db.prepare('INSERT INTO sessions (token, userId, createdAt) VALUES (?,?,?)').run(token, u.id, new Date().toISOString())
  return { token, user: { id: u.id, ad: u.ad, rol: u.rol } }
}

export function authUser(token) {
  if (!token) return null
  const r = openDb().prepare('SELECT u.id, u.ad, u.rol FROM sessions s JOIN users u ON u.id = s.userId WHERE s.token = ?').get(token)
  return r || null
}

export function logout(token) {
  openDb().prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

export function createUser({ ad, rol, sifre }) {
  const db = openDb()
  if (!ad || !sifre || !['admin', 'kullanici'].includes(rol)) throw new Error('Geçersiz: ad, şifre ve rol (admin|kullanici) zorunlu')
  if (db.prepare('SELECT 1 FROM users WHERE ad = ?').get(ad)) throw new Error('Bu isimde kullanıcı zaten var')
  const salt = randomBytes(16).toString('hex')
  const id = randomUUID()
  db.prepare('INSERT INTO users (id, ad, rol, hash, salt, createdAt) VALUES (?,?,?,?,?,?)')
    .run(id, ad, rol, hashPass(sifre, salt), salt, new Date().toISOString())
  return { id, ad, rol }
}

export function deleteUser(id) {
  const db = openDb()
  const u = db.prepare('SELECT rol FROM users WHERE id = ?').get(id)
  if (!u) throw new Error('Kullanıcı bulunamadı')
  if (u.rol === 'kurucu') throw new Error('Kurucu hesap silinemez')
  db.prepare('DELETE FROM sessions WHERE userId = ?').run(id)
  db.prepare('DELETE FROM users WHERE id = ?').run(id)
}

const idOf = (row, i) => row.id || row.leadId || 'row-' + i

export function getState() {
  const db = openDb()
  const state = {}
  let rowCount = 0
  for (const s of SLICES) {
    const rows = db.prepare(`SELECT data FROM "${s}"`).all()
    rowCount += rows.length
    state[s] = rows.map(r => JSON.parse(r.data))
  }
  const settingsRow = db.prepare("SELECT value FROM kv WHERE key = 'settings'").get()
  if (settingsRow) state.settings = JSON.parse(settingsRow.value)
  const empty = rowCount === 0 && !settingsRow
  return { state, empty }
}

export function saveState(full) {
  const db = openDb()
  db.exec('BEGIN')
  try {
    for (const s of SLICES) {
      db.exec(`DELETE FROM "${s}"`)
      const ins = db.prepare(`INSERT INTO "${s}" (id, data) VALUES (?, ?)`)
      const rows = Array.isArray(full[s]) ? full[s] : []
      rows.forEach((row, i) => ins.run(String(idOf(row, i)), JSON.stringify(row)))
    }
    db.prepare("INSERT INTO kv (key, value) VALUES ('settings', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .run(JSON.stringify(full.settings || {}))
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

// Webhook gelen kutusu: dış formlardan düşen lead adayları.
// İstemci açılışta çeker, IMPORT_LEADS otomasyonlarından (atama, görev, skor) geçirir.
export function inboxPush(item) {
  openDb().prepare('INSERT INTO inbox (data) VALUES (?)').run(JSON.stringify(item))
}

export function inboxPull() {
  const db = openDb()
  const rows = db.prepare('SELECT rid, data FROM inbox ORDER BY rid').all()
  return rows.map(r => ({ rid: r.rid, ...JSON.parse(r.data) }))
}

export function inboxClear(uptoRid) {
  openDb().prepare('DELETE FROM inbox WHERE rid <= ?').run(uptoRid)
}
