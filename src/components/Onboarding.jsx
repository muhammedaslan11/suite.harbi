import React, { useState } from 'react'

// İnteraktif modül rehberi: adımlar tek tek ilerler, noktalara tıklanır,
// bitirince kalıcı gizlenir ve yerinde küçük bir 🧭 rozeti kalır (tekrar açılabilir).
export function resetOnboarding() {
  Object.keys(localStorage).filter(k => k.startsWith('harb-onb-')).forEach(k => localStorage.removeItem(k))
}

export default function Onboarding({ id, steps = [], config }) {
  const key = 'harb-onb-' + id
  const [gizli, setGizli] = useState(() => localStorage.getItem(key) === '1')
  const [adim, setAdim] = useState(0)
  const [yon, setYon] = useState('ileri') // animasyon yönü

  const bitir = () => { localStorage.setItem(key, '1'); setGizli(true) }
  const ac = () => { localStorage.removeItem(key); setGizli(false); setAdim(0) }
  const git = (i) => { setYon(i > adim ? 'ileri' : 'geri'); setAdim(Math.max(0, Math.min(steps.length - 1, i))) }

  // Kapalıyken: tekrar açılabilir mini rozet
  if (gizli) {
    return (
      <button className="onb-reopen" onClick={ac} title="Bu ekranın rehberini tekrar aç" aria-label="Rehberi aç">🧭</button>
    )
  }

  const son = adim === steps.length - 1
  return (
    <div className="onb mb" role="region" aria-label="Modül rehberi">
      <div className="spread">
        <span className="onb-title">🧭 Nasıl kullanılır? <span className="muted" style={{ fontWeight: 500 }}>· {adim + 1}/{steps.length}</span></span>
        <button className="btn ghost sm" onClick={bitir} aria-label="Rehberi kapat">✕ Geç</button>
      </div>

      {/* Tıklanabilir ilerleme noktaları */}
      <div className="onb-dots" role="tablist">
        {steps.map((_, i) => (
          <button
            key={i}
            className={'onb-dot' + (i === adim ? ' active' : '') + (i < adim ? ' done' : '')}
            onClick={() => git(i)}
            aria-label={`Adım ${i + 1}`}
            role="tab"
            aria-selected={i === adim}
          >{i < adim ? '✓' : i + 1}</button>
        ))}
        <div className="onb-track"><div className="onb-track-fill" style={{ width: (adim / Math.max(1, steps.length - 1)) * 100 + '%' }} /></div>
      </div>

      {/* Aktif adım — yön animasyonlu */}
      <div key={adim} className={'onb-body ' + (yon === 'ileri' ? 'slide-l' : 'slide-r')}>
        {steps[adim]}
      </div>

      <div className="spread" style={{ marginTop: 10 }}>
        <span className="small muted">{son && config ? <>⚙️ <b>Özelleştir:</b> {config}</> : ''}</span>
        <span className="flex" style={{ gap: 6 }}>
          {adim > 0 && <button className="btn ghost sm" onClick={() => git(adim - 1)}>← Geri</button>}
          {son
            ? <button className="btn sm" onClick={bitir}>✓ Tamamdır, başlayalım!</button>
            : <button className="btn sm" onClick={() => git(adim + 1)}>Sıradaki →</button>}
        </span>
      </div>
    </div>
  )
}
