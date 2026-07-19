import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { aiReady } from '../ai.js'

// Ortak AI aksiyon butonu: anahtar kontrolü, spinner, hata gösterimi
export default function AiButton({ label, onRun, className = 'btn', disabled = false, title = '' }) {
  const { state } = useStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ready = aiReady(state.settings)

  const run = async () => {
    setError('')
    if (!ready) {
      setError('AI için Ayarlar → AI bölümünden Anthropic API anahtarınızı girin.')
      return
    }
    setBusy(true)
    try {
      await onRun(state.settings)
    } catch (e) {
      setError(e.message || 'Beklenmeyen hata')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <button className={className} onClick={run} disabled={disabled || busy} title={title}>
        {busy ? '⏳ Çalışıyor…' : label}
      </button>
      {error && <span className="small" style={{ color: 'var(--red)', maxWidth: 360 }}>{error}</span>}
    </span>
  )
}
