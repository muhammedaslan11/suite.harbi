// HTTP API katmanı — Vite dev sunucusuna middleware olarak takılır,
// üretimde serve.mjs aynı fonksiyonu kullanır. Endpoint'ler:
//   GET  /api/state        → tüm state + empty bayrağı
//   PUT  /api/state        → tüm state'i SQLite'a yaz
//   GET  /api/inbox        → webhook gelen kutusu
//   POST /api/inbox/clear  → { uptoRid } işlenenleri sil
//   POST /api/webhook/lead → dış form entegrasyonu (firma zorunlu)
//   GET  /api/health       → { ok, db }
import { getState, saveState, inboxPush, inboxPull, inboxClear, DB_PATH, listProfiles, login, logout, authUser, createUser, deleteUser } from './db.mjs'

// Kimlik gerektirmeyen endpoint'ler (giriş, profil listesi, dış webhook, sağlık)
const PUBLIC_ROUTES = ['/api/login', '/api/profiles', '/api/webhook/lead', '/api/health']

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', c => { raw += c })
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}) } catch (e) { reject(new Error('Geçersiz JSON')) }
    })
    req.on('error', reject)
  })
}

function send(res, code, obj) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(obj))
}

export function apiMiddleware(req, res, next) {
  const url = (req.url || '').split('?')[0]
  if (!url.startsWith('/api/')) return next ? next() : send(res, 404, { error: 'yok' })

  // Kimlik kontrolü: public rotalar hariç geçerli oturum token'ı şart
  const token = req.headers['x-harb-token']
  const me = authUser(token)
  if (!PUBLIC_ROUTES.includes(url) && !me) {
    return send(res, 401, { error: 'Oturum gerekli' })
  }

  const route = async () => {
    if (url === '/api/health' && req.method === 'GET') {
      return send(res, 200, { ok: true, db: DB_PATH })
    }
    if (url === '/api/profiles' && req.method === 'GET') {
      return send(res, 200, { profiles: listProfiles() })
    }
    if (url === '/api/login' && req.method === 'POST') {
      const { ad, sifre } = await readBody(req)
      const sonuc = login(ad, sifre)
      if (!sonuc) return send(res, 401, { error: 'Şifre hatalı' })
      return send(res, 200, sonuc)
    }
    if (url === '/api/logout' && req.method === 'POST') {
      logout(token)
      return send(res, 200, { ok: true })
    }
    if (url === '/api/me' && req.method === 'GET') {
      return send(res, 200, { user: me })
    }
    if (url === '/api/users' && req.method === 'GET') {
      if (!['kurucu', 'admin'].includes(me.rol)) return send(res, 403, { error: 'Yetki yok' })
      return send(res, 200, { users: listProfiles() })
    }
    if (url === '/api/users' && req.method === 'POST') {
      if (me.rol !== 'kurucu') return send(res, 403, { error: 'Sadece kurucu hesap açabilir' })
      const body = await readBody(req)
      return send(res, 200, { user: createUser(body) })
    }
    if (url === '/api/users' && req.method === 'DELETE') {
      if (me.rol !== 'kurucu') return send(res, 403, { error: 'Sadece kurucu hesap silebilir' })
      const { id } = await readBody(req)
      deleteUser(id)
      return send(res, 200, { ok: true })
    }
    if (url === '/api/state' && req.method === 'GET') {
      return send(res, 200, getState())
    }
    if (url === '/api/state' && req.method === 'PUT') {
      const body = await readBody(req)
      saveState(body)
      return send(res, 200, { ok: true })
    }
    if (url === '/api/inbox' && req.method === 'GET') {
      return send(res, 200, { items: inboxPull() })
    }
    if (url === '/api/inbox/clear' && req.method === 'POST') {
      const { uptoRid } = await readBody(req)
      inboxClear(Number(uptoRid) || 0)
      return send(res, 200, { ok: true })
    }
    if (url === '/api/webhook/lead' && req.method === 'POST') {
      const body = await readBody(req)
      if (!body.firma && !body.company) return send(res, 400, { error: '"firma" alanı zorunlu' })
      inboxPush({ ...body, receivedAt: new Date().toISOString() })
      return send(res, 200, { ok: true, mesaj: 'Lead gelen kutusuna alındı; uygulama açılınca içe aktarılır.' })
    }
    return send(res, 404, { error: 'bilinmeyen endpoint' })
  }

  route().catch(e => send(res, 500, { error: e.message }))
}
