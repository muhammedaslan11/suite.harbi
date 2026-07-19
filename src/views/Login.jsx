import React, { useEffect, useRef, useState } from 'react'

// Alışılmışın dışında giriş: kullanıcı adı/şifre formu yerine profil kartları.
// Kartını seç → kart çevrilir → şifreni yaz → kapı açılır. Yanlış şifrede kart sallanır.
const ROL_ETIKET = { kurucu: '👑 Kurucu', admin: '🛡️ Admin', kullanici: '💼 Satış' }
const RENKLER = ['#a3e635', '#22d3ee', '#a78bfa', '#fbbf24', '#fb7185', '#60a5fa', '#34d399']

const initials = (ad) => ad.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

export default function Login() {
  const [profiller, setProfiller] = useState(null)
  const [secili, setSecili] = useState(null)
  const [sifre, setSifre] = useState('')
  const [sallan, setSallan] = useState(false)
  const [hata, setHata] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    fetch('/api/profiles').then(r => r.json()).then(d => setProfiller(d.profiles || [])).catch(() => setProfiller([]))
  }, [])
  useEffect(() => { if (secili) setTimeout(() => inputRef.current?.focus(), 350) }, [secili])

  const gir = async () => {
    if (!sifre || busy) return
    setBusy(true); setHata('')
    try {
      const r = await fetch('/api/login', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ad: secili.ad, sifre })
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Giriş başarısız')
      const { token, user } = await r.json()
      localStorage.setItem('harb-token', token)
      localStorage.setItem('harb-user', JSON.stringify(user))
      location.reload()
    } catch (e) {
      setHata(e.message)
      setSifre('')
      setSallan(true)
      setTimeout(() => setSallan(false), 500)
      inputRef.current?.focus()
    } finally { setBusy(false) }
  }

  return (
    <div className="login-stage">
      <div className="login-glow" aria-hidden="true" />
      <div className="login-brand"><span className="h">H</span>ARB<span className="h">!</span> SUITE</div>
      <div className="login-sub">{secili ? 'Şifreni gir, kapıyı aç 🔑' : 'Kim geldi? Kartını seç 👇'}</div>

      {!profiller && <div className="muted" style={{ marginTop: 40 }}>⏳ Profiller yükleniyor…</div>}

      {profiller && !secili && (
        <div className="profile-grid">
          {profiller.map((p, i) => (
            <button key={p.id} className="profile-card" onClick={() => setSecili(p)} style={{ animationDelay: (i * 0.07) + 's' }}>
              <span className="profile-avatar" style={{ background: RENKLER[i % RENKLER.length] + '22', borderColor: RENKLER[i % RENKLER.length], color: RENKLER[i % RENKLER.length] }}>
                {initials(p.ad)}
              </span>
              <span className="profile-name">{p.ad}</span>
              <span className="profile-rol">{ROL_ETIKET[p.rol] || p.rol}</span>
            </button>
          ))}
        </div>
      )}

      {secili && (
        <div className={'login-door' + (sallan ? ' shake' : '')}>
          <span className="profile-avatar big" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            {initials(secili.ad)}
          </span>
          <div className="profile-name" style={{ fontSize: 17 }}>{secili.ad}</div>
          <div className="profile-rol">{ROL_ETIKET[secili.rol]}</div>
          <input
            ref={inputRef}
            type="password"
            placeholder="••••••••"
            value={sifre}
            onChange={e => setSifre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && gir()}
            aria-label="Şifre"
            style={{ textAlign: 'center', fontSize: 18, letterSpacing: 3, maxWidth: 240, marginTop: 14 }}
          />
          {hata && <div className="small" style={{ color: 'var(--red)', marginTop: 8 }}>❌ {hata}</div>}
          <div className="flex" style={{ marginTop: 14, gap: 10 }}>
            <button className="btn ghost sm" onClick={() => { setSecili(null); setSifre(''); setHata('') }}>← Başka kart</button>
            <button className="btn" disabled={!sifre || busy} onClick={gir}>{busy ? '⏳' : '🔓 Kapıyı Aç'}</button>
          </div>
        </div>
      )}

      <div className="small muted" style={{ position: 'absolute', bottom: 18 }}>Agency Revenue OS · Şifreler yerel SQLite'ta güvenle saklanır</div>
    </div>
  )
}
