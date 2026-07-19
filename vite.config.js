import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { apiMiddleware } from './server/api.mjs'

// SQLite destekli API, dev sunucusuna gömülü çalışır (tek süreç, tek port).
// Node'un yerleşik sqlite modülü için "dev"/"build" scriptleri --experimental-sqlite ile çalışır.
const harbApi = {
  name: 'harb-sqlite-api',
  configureServer(server) {
    server.middlewares.use(apiMiddleware)
  }
}

export default defineConfig({
  plugins: [react(), harbApi],
  server: { port: 5180 }
})
