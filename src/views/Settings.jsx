import React, { useEffect, useRef, useState } from 'react'
import { useStore, getStorageMode, getCurrentUser, apiFetch } from '../store.jsx'
import { uid } from '../utils.js'
import { SOURCES, NAV_ITEMS, ACCENT_COLORS, DEFAULT_SCORE_WEIGHTS, SCORE_WEIGHT_LABELS } from '../data/constants.js'
import { testConnection } from '../ai.js'
import { EMPTY_LEAD } from './Leads.jsx'
import { resetOnboarding } from '../components/Onboarding.jsx'
import { toast } from '../components/Toast.jsx'

const AI_MODELS = ['claude-sonnet-5', 'claude-opus-4-8', 'claude-haiku-4-5-20251001']

// Kurucuya özel: panel kullanıcılarını yönet (hesap aç / sil) — şifreler SQLite'ta hash'li
function UsersSection() {
  const me = getCurrentUser()
  const [users, setUsers] = useState(null)
  const [form, setForm] = useState({ ad: '', rol: 'kullanici', sifre: '' })
  const [msg, setMsg] = useState('')
  const ROL = { kurucu: '👑 Kurucu', admin: '🛡️ Admin', kullanici: '💼 Satış' }

  const yukle = () => apiFetch('/api/users').then(r => r.json()).then(d => setUsers(d.users || []))
  useEffect(() => { if (me?.rol === 'kurucu' && getStorageMode() === 'sqlite') yukle() }, [])

  if (me?.rol !== 'kurucu' || getStorageMode() !== 'sqlite') return null

  const ekle = async () => {
    setMsg('')
    const r = await apiFetch('/api/users', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form)
    })
    const d = await r.json()
    if (!r.ok) { setMsg('❌ ' + d.error); return }
    toast(`✓ ${form.ad} eklendi (${ROL[form.rol]})`)
    setForm({ ad: '', rol: 'kullanici', sifre: '' })
    yukle()
  }

  const sil = async (u) => {
    if (!confirm(`${u.ad} hesabı silinecek. Emin misiniz?`)) return
    const r = await apiFetch('/api/users', {
      method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: u.id })
    })
    if (r.ok) { toast(`${u.ad} silindi`, { tone: 'danger' }); yukle() }
    else setMsg('❌ ' + (await r.json()).error)
  }

  return (
    <div className="card mb" style={{ borderColor: 'var(--accent-border)' }}>
      <h3>👑 Kullanıcı Yönetimi <span className="small muted">(sadece kurucu görür)</span></h3>
      <table>
        <thead><tr><th>Kullanıcı</th><th>Rol</th><th></th></tr></thead>
        <tbody>
          {(users || []).map(u => (
            <tr key={u.id}>
              <td style={{ fontWeight: 600 }}>{u.ad}</td>
              <td><span className={'pill ' + (u.rol === 'kurucu' ? 'lime' : u.rol === 'admin' ? 'blue' : '')}>{ROL[u.rol]}</span></td>
              <td style={{ textAlign: 'right' }}>
                {u.rol !== 'kurucu' && <button className="btn danger sm" onClick={() => sil(u)}>Sil</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex mt" style={{ flexWrap: 'wrap' }}>
        <input placeholder="Ad Soyad" value={form.ad} onChange={e => setForm({ ...form, ad: e.target.value })} style={{ maxWidth: 180 }} />
        <input type="text" placeholder="Şifre" value={form.sifre} onChange={e => setForm({ ...form, sifre: e.target.value })} style={{ maxWidth: 150 }} />
        <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} style={{ maxWidth: 130 }}>
          <option value="kullanici">💼 Satış</option>
          <option value="admin">🛡️ Admin</option>
        </select>
        <button className="btn sm" disabled={!form.ad || form.sifre.length < 6} onClick={ekle}>+ Hesap Aç</button>
        {form.sifre && form.sifre.length < 6 && <span className="small" style={{ color: 'var(--amber)' }}>Şifre en az 6 karakter</span>}
        {msg && <span className="small">{msg}</span>}
      </div>
    </div>
  )
}

function AppearanceSection() {
  const { state, dispatch } = useStore()
  const s = state.settings
  const ui = s.ui || {}
  const setUi = (p) => dispatch({ type: 'UPDATE_SETTINGS', patch: { ui: { ...ui, ...p } } })
  const setWeight = (k, v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { skorAgirliklari: { ...s.skorAgirliklari, [k]: Number(v) || 0 } } })
  const moduller = NAV_ITEMS.filter(n => n.id && !['settings'].includes(n.id))
  const gizli = new Set(ui.gizliModuller || [])

  return (
    <div className="card mb">
      <h3>🎨 Görünüm & Özelleştirme</h3>

      <div className="modern-mode-banner mb">
        <div>
          <div className="modern-mode-title">Modern Mod</div>
          <div className="small muted">Referans dashboard hissi: temiz acik zemin, yumusak kartlar, kompakt yonetim panelleri.</div>
        </div>
        <button
          className={'modern-mode-toggle' + (ui.modernMod ? ' on' : '')}
          type="button"
          aria-pressed={!!ui.modernMod}
          onClick={() => setUi({ modernMod: !ui.modernMod })}
        >
          <span>{ui.modernMod ? 'Acik' : 'Kapali'}</span>
          <i />
        </button>
      </div>

      <div className="grid g4">
        <label className="field"><span>Tema</span>
          <select value={ui.tema} onChange={e => setUi({ tema: e.target.value })}>
            <option value="koyu">🌙 Koyu</option>
            <option value="acik">☀️ Açık</option>
          </select>
        </label>
        <label className="field"><span>Yoğunluk</span>
          <select value={ui.yogunluk} onChange={e => setUi({ yogunluk: e.target.value })}>
            <option value="rahat">Rahat</option>
            <option value="kompakt">Kompakt</option>
          </select>
        </label>
        <label className="field"><span>Açılış Ekranı</span>
          <select value={ui.acilisEkrani} onChange={e => setUi({ acilisEkrani: e.target.value })}>
            {moduller.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <label className="field"><span>Para Birimi</span>
          <select value={ui.paraBirimi} onChange={e => setUi({ paraBirimi: e.target.value })}>
            {['TL', '₺', 'USD', 'EUR'].map(x => <option key={x}>{x}</option>)}
          </select>
        </label>
      </div>

      <div className="flex mb">
        <button className="btn ghost sm" onClick={() => { resetOnboarding(); toast('🧭 Tüm "Nasıl kullanılır" kartları tekrar gösterilecek') }}>🧭 Kullanım ipuçlarını sıfırla</button>
        <span className="small muted">Her modülün üstündeki 1-2-3 adımlık rehber kartlarını geri getirir.</span>
      </div>
      <label className="field"><span>Vurgu Rengi</span></label>
      <div className="flex mb" style={{ gap: 8 }}>
        {Object.entries(ACCENT_COLORS).map(([ad, hex]) => (
          <span
            key={ad}
            className={'accent-swatch' + (ui.vurgu === ad ? ' selected' : '')}
            style={{ background: hex }}
            title={ad}
            onClick={() => setUi({ vurgu: ad })}
          />
        ))}
      </div>

      <div className="grid g2">
        <label className="field"><span>Marka Adı (sol menü başlığı)</span>
          <input value={ui.markaAdi} onChange={e => setUi({ markaAdi: e.target.value })} />
        </label>
        <label className="field"><span>Ajans Adı (PDF ve tekliflere yansır)</span>
          <input value={ui.ajansAdi} onChange={e => setUi({ ajansAdi: e.target.value })} />
        </label>
      </div>

      <hr className="divider" />
      <h3 style={{ fontSize: 13 }}>📦 Görünür Modüller</h3>
      <p className="small muted">Ekibin kullanmadığı modülleri gizleyerek menüyü sadeleştirin.</p>
      <div style={{ columns: 3 }}>
        {moduller.map(m => (
          <label key={m.id} className="check">
            <input
              type="checkbox"
              checked={!gizli.has(m.id)}
              onChange={e => {
                const yeni = new Set(gizli)
                e.target.checked ? yeni.delete(m.id) : yeni.add(m.id)
                setUi({ gizliModuller: [...yeni] })
              }}
            />{m.label}
          </label>
        ))}
      </div>

      <hr className="divider" />
      <div className="grid g2">
        <div>
          <h3 style={{ fontSize: 13 }}>📞 Follow-Up Takvimi (gün)</h3>
          <p className="small muted">Teklif gönderilince hangi günlerde takip görevi oluşsun? Virgülle ayırın.</p>
          <input
            value={(s.followupGunleri || []).join(', ')}
            onChange={e => {
              const gunler = e.target.value.split(',').map(x => parseInt(x.trim(), 10)).filter(n => n > 0 && n <= 365)
              dispatch({ type: 'UPDATE_SETTINGS', patch: { followupGunleri: [...new Set(gunler)].sort((a, b) => a - b) } })
            }}
            placeholder="1, 3, 7, 14, 30"
          />
        </div>
        <div>
          <h3 style={{ fontSize: 13 }}>🎯 Lead Skor Ağırlıkları</h3>
          <p className="small muted">Kriterlerin puanlarını ajansınıza göre ayarlayın (toplam 100'ü aşarsa 100'de kırpılır).</p>
          <div className="grid g2" style={{ gap: 4 }}>
            {Object.keys(DEFAULT_SCORE_WEIGHTS).map(k => (
              <label key={k} className="check" style={{ justifyContent: 'space-between', marginBottom: 2 }}>
                <span className="small">{SCORE_WEIGHT_LABELS[k]}</span>
                <input type="number" value={s.skorAgirliklari?.[k] ?? DEFAULT_SCORE_WEIGHTS[k]} onChange={e => setWeight(k, e.target.value)} style={{ width: 58, padding: '3px 6px' }} />
              </label>
            ))}
          </div>
          <button
            className="btn ghost sm mt"
            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', patch: { skorAgirliklari: { ...DEFAULT_SCORE_WEIGHTS } } })}
          >Varsayılana dön</button>
        </div>
      </div>
    </div>
  )
}

function TeamSection() {
  const { state, dispatch } = useStore()
  const s = state.settings
  const [yeniAd, setYeniAd] = useState('')
  const patch = (p) => dispatch({ type: 'UPDATE_SETTINGS', patch: p })

  const setHedef = (uyeId, alan, deger) => {
    patch({ hedefler: { ...s.hedefler, [uyeId]: { ...(s.hedefler[uyeId] || {}), [alan]: Number(deger) || 0 } } })
  }

  return (
    <div className="card mb">
      <h3>👥 Ekip & Aylık Hedefler</h3>
      <p className="small muted">Yeni lead'ler aktif üyelere sırayla (round-robin) atanır; kaynak kuralı tanımlarsanız o kaynak hep aynı kişiye gider.</p>
      <table>
        <thead><tr><th>Üye</th><th>Aktif</th><th>Ciro Hedefi (TL)</th><th>Toplantı</th><th>Teklif</th><th></th></tr></thead>
        <tbody>
          {s.ekip.map(u => (
            <tr key={u.id}>
              <td style={{ fontWeight: 600 }}>{u.ad}</td>
              <td><input type="checkbox" checked={u.aktif} onChange={e => patch({ ekip: s.ekip.map(x => x.id === u.id ? { ...x, aktif: e.target.checked } : x) })} style={{ width: 'auto' }} /></td>
              <td><input type="number" value={s.hedefler[u.id]?.ciro || ''} onChange={e => setHedef(u.id, 'ciro', e.target.value)} style={{ maxWidth: 130 }} /></td>
              <td><input type="number" value={s.hedefler[u.id]?.toplanti || ''} onChange={e => setHedef(u.id, 'toplanti', e.target.value)} style={{ maxWidth: 80 }} /></td>
              <td><input type="number" value={s.hedefler[u.id]?.teklif || ''} onChange={e => setHedef(u.id, 'teklif', e.target.value)} style={{ maxWidth: 80 }} /></td>
              <td><button className="btn danger sm" onClick={() => patch({ ekip: s.ekip.filter(x => x.id !== u.id) })}>Sil</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex mt">
        <input placeholder="Yeni üye adı…" value={yeniAd} onChange={e => setYeniAd(e.target.value)} style={{ maxWidth: 220 }} />
        <button className="btn sm" disabled={!yeniAd} onClick={() => { patch({ ekip: [...s.ekip, { id: uid('U'), ad: yeniAd, aktif: true }] }); setYeniAd('') }}>+ Ekle</button>
      </div>
      <hr className="divider" />
      <h3 style={{ fontSize: 13 }}>Kaynak Bazlı Atama Kuralları</h3>
      <div className="grid g3">
        {SOURCES.map(k => (
          <label key={k} className="field"><span>{k}</span>
            <select
              value={s.atamaKurallari[k] || ''}
              onChange={e => patch({ atamaKurallari: { ...s.atamaKurallari, [k]: e.target.value || undefined } })}
            >
              <option value="">Rotasyon (varsayılan)</option>
              {s.ekip.map(u => <option key={u.id} value={u.id}>{u.ad}</option>)}
            </select>
          </label>
        ))}
      </div>
    </div>
  )
}

function AiSection() {
  const { state, dispatch } = useStore()
  const s = state.settings
  const [show, setShow] = useState(false)
  const [test, setTest] = useState('')
  const patch = (p) => dispatch({ type: 'UPDATE_SETTINGS', patch: p })

  const runTest = async () => {
    setTest('⏳ Test ediliyor…')
    try {
      await testConnection(s)
      setTest('✅ Bağlantı başarılı — AI özellikleri aktif.')
    } catch (e) {
      setTest('❌ ' + e.message)
    }
  }

  return (
    <div className="card mb">
      <h3>🤖 AI Ayarları</h3>
      <p className="small muted">
        AI özellikleri (toplantı asistanı, satış koçu, teklif metni, dojo, rakip araştırması) kendi Anthropic API anahtarınızla çalışır.
        Anahtar yalnızca bu tarayıcıda saklanır. Anahtar almak için: console.anthropic.com
      </p>
      <div className="grid g3">
        <label className="field" style={{ gridColumn: 'span 2' }}><span>Anthropic API Anahtarı</span>
          <div className="flex">
            <input
              type={show ? 'text' : 'password'}
              placeholder="sk-ant-…"
              value={s.aiKey}
              onChange={e => patch({ aiKey: e.target.value.trim() })}
            />
            <button className="btn ghost sm" onClick={() => setShow(!show)}>{show ? 'Gizle' : 'Göster'}</button>
          </div>
        </label>
        <label className="field"><span>Model</span>
          <select value={s.aiModel} onChange={e => patch({ aiModel: e.target.value })}>
            {AI_MODELS.map(m => <option key={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <div className="flex">
        <button className="btn sm" disabled={!s.aiKey} onClick={runTest}>Bağlantıyı Test Et</button>
        {test && <span className="small">{test}</span>}
      </div>
    </div>
  )
}

function ImportLeadsSection() {
  const { dispatch } = useStore()
  const [raw, setRaw] = useState('')
  const [preview, setPreview] = useState(null)
  const [msg, setMsg] = useState('')

  const parse = () => {
    setMsg('')
    try {
      let items
      const trimmed = raw.trim()
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const j = JSON.parse(trimmed)
        items = Array.isArray(j) ? j : [j]
      } else {
        // CSV: ilk satır başlık (firma,yetkili,telefon,email,sehir,sektor gibi)
        const lines = trimmed.split(/\r?\n/).filter(Boolean)
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        items = lines.slice(1).map(line => {
          const vals = line.split(',')
          const o = {}
          headers.forEach((h, i) => { o[h] = (vals[i] || '').trim() })
          return o
        })
      }
      const leads = items.map(x => ({
        ...EMPTY_LEAD,
        firma: x.firma || x.company || '',
        yetkili: x.yetkili || x.name || '',
        telefon: x.telefon || x.phone || '',
        email: x.email || '',
        website: x.website || '',
        sehir: x.sehir || x.city || '',
        sektor: x.sektor || '',
        kaynak: x.kaynak || 'Website Form',
        id: uid('L'),
        createdAt: new Date().toISOString()
      })).filter(l => l.firma)
      if (!leads.length) throw new Error('Geçerli kayıt yok ("firma" alanı zorunlu).')
      setPreview(leads)
    } catch (e) {
      setPreview(null)
      setMsg('❌ ' + e.message)
    }
  }

  return (
    <div className="card mb">
      <h3>📥 Lead İçe Aktar (webhook öncüsü)</h3>
      <p className="small muted">
        Website formunuzdan gelen kayıtları JSON veya CSV olarak yapıştırın. Her lead için kaynak otomatik "Website Form",
        sorumlu ataması ve ilk temas görevi otomatik oluşur. Format: {'{"firma","yetkili","telefon","email","website","sehir","sektor","kaynak"}'} — Supabase geçişinde aynı format gerçek webhook olur.
      </p>
      <textarea
        placeholder={'JSON: [{"firma":"ABC Ltd","yetkili":"Ali Yılmaz","telefon":"+90 5xx","email":"ali@abc.com"}]\nveya CSV:\nfirma,yetkili,telefon,email\nABC Ltd,Ali Yılmaz,+90 5xx,ali@abc.com'}
        value={raw} onChange={e => setRaw(e.target.value)} style={{ minHeight: 100 }}
      />
      <div className="flex mt">
        <button className="btn ghost sm" disabled={!raw.trim()} onClick={parse}>Önizle</button>
        {preview && (
          <button className="btn sm" onClick={() => {
            dispatch({ type: 'IMPORT_LEADS', leads: preview })
            setMsg(`✅ ${preview.length} lead içe aktarıldı — görevler ve atamalar oluşturuldu.`)
            setPreview(null); setRaw('')
          }}>{preview.length} Lead'i İçe Aktar</button>
        )}
        {msg && <span className="small">{msg}</span>}
      </div>
      {preview && (
        <table className="mt">
          <thead><tr><th>Firma</th><th>Yetkili</th><th>Telefon</th><th>E-posta</th><th>Kaynak</th></tr></thead>
          <tbody>
            {preview.map(l => (
              <tr key={l.id}><td>{l.firma}</td><td>{l.yetkili || '—'}</td><td>{l.telefon || '—'}</td><td>{l.email || '—'}</td><td>{l.kaynak}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function Settings() {
  const { state, dispatch } = useStore()
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `harb-suite-yedek-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg('Yedek indirildi.')
  }

  const importJson = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data.leads) throw new Error('geçersiz')
        dispatch({ type: 'IMPORT', data })
        setMsg('Veri içe aktarıldı.')
      } catch {
        setMsg('Hata: geçersiz yedek dosyası.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      <h1 className="page-title">Veri & Ayarlar</h1>
      <p className="page-sub">
        {getStorageMode() === 'sqlite'
          ? <>🗄️ Veriler yerel SQLite veritabanında saklanıyor (<b>data/harb.db</b>) — yedeklemek için bu dosyayı kopyalamanız yeterli. Dış form entegrasyonu: <b>POST /api/webhook/lead</b></>
          : <>⚠️ SQLite API'sine ulaşılamadı — veriler geçici olarak tarayıcıda (localStorage) tutuluyor. Uygulamayı <b>npm run dev</b> ile başlattığınızdan emin olun.</>}
      </p>

      <UsersSection />
      <AppearanceSection />
      <TeamSection />
      <AiSection />
      <ImportLeadsSection />

      <div className="grid g3">
        <div className="card">
          <h3>💾 Yedekleme</h3>
          <p className="small muted">Tüm veriyi JSON olarak indirir.</p>
          <button className="btn" onClick={exportJson}>Yedeği İndir (JSON)</button>
        </div>
        <div className="card">
          <h3>📥 Geri Yükleme</h3>
          <p className="small muted">Yedeği içe aktarır; mevcut verinin üzerine yazar.</p>
          <input type="file" accept=".json" ref={fileRef} onChange={importJson} />
        </div>
        <div className="card">
          <h3>🧪 Demo / Sıfırlama</h3>
          <div className="flex">
            <button className="btn ghost" onClick={() => { if (confirm('Mevcut veri demo verisiyle değiştirilecek. Emin misiniz?')) { dispatch({ type: 'RESET_DEMO' }); setMsg('Demo verisi yüklendi.') } }}>Demo Verisi Yükle</button>
            <button className="btn danger" onClick={() => { if (confirm('TÜM veri silinecek. Emin misiniz?')) { dispatch({ type: 'CLEAR_ALL' }); setMsg('Tüm veri silindi.') } }}>Tümünü Sil</button>
          </div>
        </div>
      </div>

      {msg && <p className="mt" style={{ color: 'var(--lime)' }}>{msg}</p>}

      <div className="card mt">
        <h3>📊 Veri Özeti</h3>
        <div className="flex" style={{ gap: 24, flexWrap: 'wrap' }}>
          <span>{state.leads.length} lead</span>
          <span>{state.meetings.length} toplantı</span>
          <span>{state.proposals.length} teklif</span>
          <span>{state.tasks.length} görev</span>
          <span>{state.payments.length} ödeme</span>
          <span>{state.activities.length} aktivite</span>
          <span>{state.dojoSessions.length} dojo seansı</span>
        </div>
      </div>
    </div>
  )
}
