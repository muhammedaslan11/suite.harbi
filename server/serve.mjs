// Üretim sunucusu: dist/ + API tek portta.
// Çalıştırma: npm run start  (önce npm run build)
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apiMiddleware } from './api.mjs'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const PORT = process.env.PORT || 5180
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json'
}

createServer((req, res) => {
  if ((req.url || '').startsWith('/api/')) return apiMiddleware(req, res)
  let file = join(DIST, (req.url || '/').split('?')[0])
  if (!existsSync(file) || extname(file) === '') file = join(DIST, 'index.html')
  try {
    res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream')
    res.end(readFileSync(file))
  } catch {
    res.statusCode = 404
    res.end('bulunamadı')
  }
}).listen(PORT, () => console.log(`HARB! SUITE → http://localhost:${PORT} (SQLite: data/harb.db)`))
