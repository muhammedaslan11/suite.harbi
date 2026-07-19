// Toast + Geri Al + kutlama + Escape kancası — tek dosyada geri bildirim altyapısı
import React, { useEffect, useState } from 'react'

let listeners = []
let idc = 0

// toast('✓ Kaydedildi') | toast('Silindi', { undo: () => ..., tone: 'danger' }) | toast('🏆 ...', { confetti: true })
export function toast(msg, opts = {}) {
  listeners.forEach(l => l({ id: ++idc, msg, ...opts }))
}

// Modal'lar için: Escape ile kapat
export function useEscape(onClose) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <span key={i} style={{ left: (i * 6.5 + Math.random() * 4) + '%', animationDelay: (Math.random() * 0.4) + 's' }}>
          {['🎉', '✨', '🏆', '💚'][i % 4]}
        </span>
      ))}
    </div>
  )
}

export function Toaster() {
  const [items, setItems] = useState([])
  useEffect(() => {
    const l = (t) => {
      setItems(x => [...x, t])
      setTimeout(() => setItems(x => x.filter(i => i.id !== t.id)), t.undo ? 6000 : 3500)
    }
    listeners.push(l)
    return () => { listeners = listeners.filter(x => x !== l) }
  }, [])
  return (
    <>
      {items.some(t => t.confetti) && <Confetti />}
      <div className="toaster" role="status" aria-live="polite">
        {items.map(t => (
          <div key={t.id} className={'toast' + (t.tone ? ' ' + t.tone : '')}>
            <span>{t.msg}</span>
            {t.undo && (
              <button
                className="btn sm"
                onClick={() => { t.undo(); setItems(x => x.filter(i => i.id !== t.id)) }}
              >↩ Geri Al</button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
