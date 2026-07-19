import React, { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import { toast, useEscape } from '../components/Toast.jsx'
import Onboarding from '../components/Onboarding.jsx'
import { leadScore, scorePriority, fmtTL, uid, initials } from '../utils.js'
import {
  SOURCES, SECTORS, COMPANY_SIZES, POTENTIAL_VALUES, MANUAL_SCORES,
  STAGES, SERVICES_LIST, CLOSE_PROBABILITIES
} from '../data/constants.js'

export const EMPTY_LEAD = {
  firma: '', yetkili: '', pozisyon: '', telefon: '', email: '', website: '',
  instagram: '', linkedin: '', sehir: '', ulke: 'Türkiye', sektor: '', calisanSayisi: '',
  tahminiCiro: '', buyukluk: '', kaynak: '', manuelSkor: 'Ilık',
  flags: { reklamAktif: false, instagramAktif: false, linkedinAktif: false, kararVericiTemas: false, butceBelirtildi: false, acilIhtiyac: false },
  potansiyelDeger: '', tahminiIlkSatis: '', tahminiRetainer: '', upsellPotansiyeli: 'Orta',
  kapanisOlasiligi: 25, status: 'Yeni Lead', ilgiHizmetler: [], sorumlu: '',
  kayipSebebi: '', aktifHizmetler: [], statusHistory: []
}

export function LeadForm({ initial, onSave, onCancel }) {
  const { state } = useStore()
  const ekip = state.settings?.ekip || []
  const [f, setF] = useState(initial || EMPTY_LEAD)
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  const setFlag = (k, v) => setF(prev => ({ ...prev, flags: { ...prev.flags, [k]: v } }))
  const toggleService = (s) => setF(prev => ({
    ...prev,
    ilgiHizmetler: prev.ilgiHizmetler.includes(s)
      ? prev.ilgiHizmetler.filter(x => x !== s)
      : [...prev.ilgiHizmetler, s]
  }))
  const score = leadScore(f)
  useEscape(onCancel)

  // Hata önleme: kaydetmeden önce format doğrulaması
  const emailOk = !f.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)
  const telOk = !f.telefon || f.telefon.replace(/\D/g, '').length >= 10
  const valid = f.firma && emailOk && telOk

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 860 }}>
        <div className="spread">
          <h2>{initial?.id ? 'Lead Düzenle' : 'Yeni Lead'}</h2>
          <span className={'score-ring ' + (score >= 70 ? 'score-hi' : score >= 40 ? 'score-mid' : 'score-lo')}>
            Harbi Lead Score: {score}/100 · {scorePriority(score)}
          </span>
        </div>
        <div className="grid g3">
          <label className="field"><span>Firma Adı *</span><input value={f.firma} onChange={e => set('firma', e.target.value)} /></label>
          <label className="field"><span>Yetkili Adı</span><input value={f.yetkili} onChange={e => set('yetkili', e.target.value)} /></label>
          <label className="field"><span>Yetkili Pozisyonu</span><input value={f.pozisyon} onChange={e => set('pozisyon', e.target.value)} /></label>
          <label className="field"><span>Telefon</span>
            <input type="tel" className={telOk ? '' : 'invalid'} value={f.telefon} onChange={e => set('telefon', e.target.value)} />
            {!telOk && <span className="field-err">En az 10 haneli bir numara girin (WhatsApp linki için gerekli)</span>}
          </label>
          <label className="field"><span>E-posta</span>
            <input type="email" className={emailOk ? '' : 'invalid'} value={f.email} onChange={e => set('email', e.target.value)} />
            {!emailOk && <span className="field-err">Geçerli bir e-posta adresi girin</span>}
          </label>
          <label className="field"><span>Website</span><input value={f.website} onChange={e => set('website', e.target.value)} /></label>
          <label className="field"><span>Instagram</span><input value={f.instagram} onChange={e => set('instagram', e.target.value)} /></label>
          <label className="field"><span>LinkedIn</span><input value={f.linkedin} onChange={e => set('linkedin', e.target.value)} /></label>
          <label className="field"><span>Şehir</span><input value={f.sehir} onChange={e => set('sehir', e.target.value)} /></label>
          <label className="field"><span>Ülke</span><input value={f.ulke} onChange={e => set('ulke', e.target.value)} /></label>
          <label className="field"><span>Sektör</span>
            <select value={f.sektor} onChange={e => set('sektor', e.target.value)}>
              <option value="">Seçin…</option>{SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="field"><span>Çalışan Sayısı</span><input type="number" value={f.calisanSayisi} onChange={e => set('calisanSayisi', e.target.value)} /></label>
          <label className="field"><span>Tahmini Ciro</span><input value={f.tahminiCiro} onChange={e => set('tahminiCiro', e.target.value)} /></label>
          <label className="field"><span>Firma Büyüklüğü</span>
            <select value={f.buyukluk} onChange={e => set('buyukluk', e.target.value)}>
              <option value="">Seçin…</option>{COMPANY_SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="field"><span>Kaynak</span>
            <select value={f.kaynak} onChange={e => set('kaynak', e.target.value)}>
              <option value="">Seçin…</option>{SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="field"><span>Sorumlu Satışçı</span>
            <select value={f.sorumlu} onChange={e => set('sorumlu', e.target.value)}>
              <option value="">Otomatik ata (rotasyon)</option>
              {ekip.map(u => <option key={u.id} value={u.ad}>{u.ad}</option>)}
              {f.sorumlu && !ekip.some(u => u.ad === f.sorumlu) && <option value={f.sorumlu}>{f.sorumlu}</option>}
            </select>
          </label>
          <label className="field"><span>Manuel Skor</span>
            <select value={f.manuelSkor} onChange={e => set('manuelSkor', e.target.value)}>
              {MANUAL_SCORES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="field"><span>Pipeline Aşaması</span>
            <select value={f.status} onChange={e => set('status', e.target.value)}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <details className="sec">
          <summary>⚙️ Skor Kriterleri & İlgilendiği Hizmetler</summary>
        <div className="grid g2">
          <div>
            <h3 style={{ fontSize: 13 }}>Skor Kriterleri (otomatik hesaba girer)</h3>
            <label className="check"><input type="checkbox" checked={f.flags.reklamAktif} onChange={e => setFlag('reklamAktif', e.target.checked)} />Aktif reklam veriyor (+15)</label>
            <label className="check"><input type="checkbox" checked={f.flags.instagramAktif} onChange={e => setFlag('instagramAktif', e.target.checked)} />Instagram aktif (+10)</label>
            <label className="check"><input type="checkbox" checked={f.flags.linkedinAktif} onChange={e => setFlag('linkedinAktif', e.target.checked)} />LinkedIn aktif (+5)</label>
            <label className="check"><input type="checkbox" checked={f.flags.kararVericiTemas} onChange={e => setFlag('kararVericiTemas', e.target.checked)} />Karar vericiyle temas kuruldu (+20)</label>
            <label className="check"><input type="checkbox" checked={f.flags.butceBelirtildi} onChange={e => setFlag('butceBelirtildi', e.target.checked)} />Bütçe belirtildi (+15)</label>
            <label className="check"><input type="checkbox" checked={f.flags.acilIhtiyac} onChange={e => setFlag('acilIhtiyac', e.target.checked)} />Acil ihtiyacı var (+15)</label>
            <div className="small muted mt">Website (+10), çalışan sayısı (10+ → +10, 50+ → +20) ve toplantı planlandı (+20) alanlardan otomatik hesaplanır.</div>
          </div>
          <div>
            <h3 style={{ fontSize: 13 }}>İlgilendiği Hizmetler</h3>
            <div style={{ columns: 2 }}>
              {SERVICES_LIST.map(s => (
                <label key={s} className="check">
                  <input type="checkbox" checked={f.ilgiHizmetler.includes(s)} onChange={() => toggleService(s)} />{s}
                </label>
              ))}
            </div>
          </div>
        </div>

        </details>
        <details className="sec">
          <summary>💰 Potansiyel Değer & Tahminler</summary>
        <div className="grid g4">
          <label className="field"><span>Potansiyel Değer</span>
            <select value={f.potansiyelDeger} onChange={e => set('potansiyelDeger', e.target.value)}>
              <option value="">Seçin…</option>{POTENTIAL_VALUES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="field"><span>Tahmini İlk Satış (TL)</span><input type="number" value={f.tahminiIlkSatis} onChange={e => set('tahminiIlkSatis', e.target.value)} /></label>
          <label className="field"><span>Tahmini Aylık Retainer (TL)</span><input type="number" value={f.tahminiRetainer} onChange={e => set('tahminiRetainer', e.target.value)} /></label>
          <label className="field"><span>Kapanış Olasılığı</span>
            <select value={f.kapanisOlasiligi} onChange={e => set('kapanisOlasiligi', Number(e.target.value))}>
              {CLOSE_PROBABILITIES.map(p => <option key={p} value={p}>%{p}</option>)}
            </select>
          </label>
        </div>
        </details>

        <div className="flex mt" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onCancel}>Vazgeç</button>
          <button className="btn" disabled={!valid} onClick={() => onSave(f)}>Kaydet</button>
        </div>
      </div>
    </div>
  )
}

export default function Leads({ openLead }) {
  const { state, dispatch } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [q, setQ] = useState('')
  const [filterStage, setFilterStage] = useState('')

  // "n" kısayolu formu açar
  useEffect(() => {
    const h = () => setShowForm(true)
    window.addEventListener('harb:new-lead', h)
    return () => window.removeEventListener('harb:new-lead', h)
  }, [])

  const leads = state.leads
    .filter(l => !q || (l.firma + l.yetkili + l.sektor + l.sehir).toLowerCase().includes(q.toLowerCase()))
    .filter(l => !filterStage || l.status === filterStage)

  const save = (f) => {
    dispatch({
      type: 'ADD_LEAD',
      lead: { ...f, id: uid('L'), createdAt: new Date().toISOString() }
    })
    toast(`✓ ${f.firma} eklendi — ilk temas görevi oluşturuldu`)
    setShowForm(false)
  }

  return (
    <div>
      <div className="spread mb">
        <div>
          <h1 className="page-title">Lead Yönetimi</h1>
          <p className="page-sub" style={{ margin: 0 }}>{state.leads.length} lead · skorlama otomatik</p>
        </div>
        <button className="btn" onClick={() => setShowForm(true)}>+ Yeni Lead</button>
      </div>

      <Onboarding
        id="leads"
        steps={[
          '"+ Yeni Lead" (veya klavyeden "n") ile ekle — sorumlu boş bırakılırsa rotasyonla otomatik atanır.',
          'Skor otomatik hesaplanır (▲70+ öncelikli); satıra tıkla, karta gir.',
          'Website formu bağlamak için: Ayarlar → Lead İçe Aktar veya POST /api/webhook/lead.'
        ]}
        config="Skor ağırlıkları ve atama kuralları: Ayarlar → Görünüm & Ekip bölümleri."
      />
      <div className="flex mb">
        <input placeholder="Ara: firma, yetkili, sektör, şehir…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 320 }} />
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">Tüm aşamalar</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Firma</th><th>Yetkili</th><th>Kaynak</th><th>Aşama</th>
              <th>Skor</th><th>Manuel</th><th>Potansiyel</th><th>İlk Satış</th><th>Olasılık</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => {
              const s = leadScore(l)
              return (
                <tr key={l.id} className="clickable" onClick={() => openLead(l.id)}>
                  <td style={{ fontWeight: 600 }}>
                    <span className="flex" style={{ gap: 8 }}>
                      {l.sorumlu && <span className="avatar" title={'Sorumlu: ' + l.sorumlu}>{initials(l.sorumlu)}</span>}
                      <span>{l.firma}<div className="small muted">{l.sektor || '—'} · {l.sehir || '—'}</div></span>
                    </span>
                  </td>
                  <td>{l.yetkili || '—'}<div className="small muted">{l.pozisyon}</div></td>
                  <td><span className="pill">{l.kaynak || '—'}</span></td>
                  <td><span className={'pill ' + (l.status === 'Kazanıldı' ? 'lime' : l.status === 'Kaybedildi' ? 'red' : 'blue')}>{l.status}</span></td>
                  <td><span className={'score-ring ' + (s >= 70 ? 'score-hi' : s >= 40 ? 'score-mid' : 'score-lo')} title={s >= 70 ? 'Yüksek öncelik' : s >= 40 ? 'Orta öncelik' : 'Düşük öncelik'}>{s >= 70 ? '▲' : s >= 40 ? '▶' : '▼'} {s}</span><span className="small muted">/100</span></td>
                  <td><span className={'pill ' + (l.manuelSkor === 'Sıcak' ? 'lime' : l.manuelSkor === 'Soğuk' ? 'red' : 'amber')}>{l.manuelSkor}</span></td>
                  <td>{l.potansiyelDeger || '—'}</td>
                  <td>{fmtTL(l.tahminiIlkSatis)}</td>
                  <td>%{l.kapanisOlasiligi || 0}</td>
                </tr>
              )
            })}
            {leads.length === 0 && <tr><td colSpan={9} className="empty">Lead bulunamadı</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && <LeadForm onSave={save} onCancel={() => setShowForm(false)} />}
    </div>
  )
}
