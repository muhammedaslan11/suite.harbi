import React, { useState } from 'react'
import { OBJECTIONS } from '../data/seeds.js'
import Onboarding from '../components/Onboarding.jsx'

export default function Objections() {
  const [q, setQ] = useState('')
  const items = OBJECTIONS.filter(o =>
    !q || (o.itiraz + o.cevap + o.neDemek).toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div>
      <h1 className="page-title">İtiraz Kütüphanesi</h1>
      <p className="page-sub">Her itiraz için: müşteri ne demek istiyor → cevap → devam sorusu → kapanış.</p>
      <Onboarding
        id="objections"
        steps={[
          'Yapıyı ezberle: itirazı kabul et → çerçeveyi değiştir → devam sorusuyla topu geri at.',
          'Bu kütüphane Dojo\'yu ve AI Koç\'u besler — pratik için Dojo\'da antrenman yap.'
        ]}
      />
      <input placeholder="İtiraz ara…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 320 }} className="mb" />

      <div className="grid g2 mt">
        {items.map(o => (
          <div key={o.id} className="card">
            <h3 style={{ fontSize: 15, color: 'var(--amber)' }}>“{o.itiraz}”</h3>
            <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10.5 }}>Müşteri ne demek istiyor?</div>
            <div className="small" style={{ fontStyle: 'italic', marginBottom: 10 }}>{o.neDemek}</div>
            <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10.5 }}>Cevap</div>
            <div className="script-box" style={{ marginBottom: 10 }}>{o.cevap}</div>
            <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10.5 }}>Devam Sorusu</div>
            <div className="small mb" style={{ color: 'var(--lime)' }}>→ {o.devamSorusu}</div>
            <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10.5 }}>Kapanış</div>
            <div className="small">✅ {o.kapanis}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
