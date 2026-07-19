import React, { useRef, useState } from 'react'
import { useStore } from '../store.jsx'
import { leadScore, scorePriority, fmtTL, fmtDate, uid, nextBestSale, crossSellSuggestions, competitorSentences, proposalTotal, waLink, mailtoLink, dealDNA } from '../utils.js'
import { STAGES, OPEN_STAGES, LOST_REASONS, SALES_SCRIPTS, NEXT_STEPS, SERVICES_LIST, TASK_TYPES, CLOSE_PROBABILITIES, COMPETITOR_LEVELS, CONTENT_FREQ } from '../data/constants.js'
import { OBJECTIONS } from '../data/seeds.js'
import { askJson } from '../ai.js'
import { offlineCoach } from '../coachEngine.js'
import AiButton from '../components/AiButton.jsx'
import { toast, useEscape } from '../components/Toast.jsx'
import { LeadForm } from './Leads.jsx'
import { ProposalForm } from './Proposals.jsx'
// pdfmake ağır olduğu için PDF modülü tıklama anında yüklenir
const generateProposalPdf = async (p, lead, settings) => (await import('../pdf.js')).generateProposalPdf(p, lead, settings)

const EMPTY_MEETING = {
  problem: '', hedef: '', mevcutDurum: '', rakipler: '', butce: '',
  kararVerici: '', aciliyet: 5, satinAlmaEngeli: '', hizmetler: [], sonrakiAdim: ''
}

function MeetingForm({ lead, onSave, onCancel }) {
  const [m, setM] = useState({ ...EMPTY_MEETING, hizmetler: lead.ilgiHizmetler || [] })
  const [transcript, setTranscript] = useState('')
  const [dinliyor, setDinliyor] = useState(false)
  const [aiSonuc, setAiSonuc] = useState(null) // {tespitEdilenItirazlar, kocNotu}
  const recRef = useRef(null)
  const set = (k, v) => setM(prev => ({ ...prev, [k]: v }))
  const toggle = (s) => set('hizmetler', m.hizmetler.includes(s) ? m.hizmetler.filter(x => x !== s) : [...m.hizmetler, s])

  useEscape(onCancel)
  const speechOk = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  const toggleDikte = () => {
    if (dinliyor) { recRef.current?.stop(); setDinliyor(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'tr-TR'; rec.continuous = true; rec.interimResults = false
    rec.onresult = (e) => {
      const parca = [...e.results].slice(e.resultIndex).map(r => r[0].transcript).join(' ')
      setTranscript(prev => (prev + ' ' + parca).trim())
    }
    rec.onend = () => setDinliyor(false)
    rec.onerror = () => setDinliyor(false)
    recRef.current = rec
    rec.start()
    setDinliyor(true)
  }

  const aiDoldur = async (settings) => {
    const json = await askJson(settings, {
      system: 'Sen bir dijital pazarlama ajansının satış operasyon asistanısın. Görüşme transkriptinden CRM toplantı notu şablonunu doldurursun. SADECE JSON döndür.',
      user: `Aşağıdaki satış görüşmesi transkriptinden toplantı notunu çıkar.

TRANSKRIPT:
${transcript}

Hizmet listesi (hizmetler alanında yalnızca bunlardan seç): ${SERVICES_LIST.join(', ')}
Sonraki adım seçenekleri: ${NEXT_STEPS.join(', ')}
Bilinen itiraz başlıkları: ${OBJECTIONS.map(o => o.itiraz).join(', ')}

Şu şemada SADECE JSON döndür (bilinmeyeni boş string bırak):
{"problem":"","hedef":"","mevcutDurum":"","rakipler":"","butce":"","kararVerici":"","aciliyet":5,"satinAlmaEngeli":"","hizmetler":[],"sonrakiAdim":"","tespitEdilenItirazlar":["itiraz başlığı"],"kocNotu":"satışçıya 1-2 cümle taktik not"}`,
      maxTokens: 1500
    })
    setM(prev => ({
      ...prev,
      problem: json.problem || prev.problem,
      hedef: json.hedef || prev.hedef,
      mevcutDurum: json.mevcutDurum || prev.mevcutDurum,
      rakipler: json.rakipler || prev.rakipler,
      butce: json.butce || prev.butce,
      kararVerici: json.kararVerici || prev.kararVerici,
      aciliyet: Number(json.aciliyet) || prev.aciliyet,
      satinAlmaEngeli: json.satinAlmaEngeli || prev.satinAlmaEngeli,
      hizmetler: json.hizmetler?.length ? json.hizmetler.filter(h => SERVICES_LIST.includes(h)) : prev.hizmetler,
      sonrakiAdim: NEXT_STEPS.includes(json.sonrakiAdim) ? json.sonrakiAdim : prev.sonrakiAdim
    }))
    setAiSonuc({ itirazlar: json.tespitEdilenItirazlar || [], kocNotu: json.kocNotu || '' })
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 780 }}>
        <h2>Toplantı Notu — {lead.firma}</h2>

        <div className="card mb" style={{ background: 'var(--bg2)' }}>
          <div className="spread">
            <h3 style={{ margin: 0 }}>🎤 AI Toplantı Asistanı</h3>
            {speechOk && (
              <button className={'btn sm ' + (dinliyor ? '' : 'ghost')} onClick={toggleDikte}>
                {dinliyor ? '⏺ Kaydediliyor — durdur' : '🎙️ Canlı dikte başlat'}
              </button>
            )}
          </div>
          <p className="small muted" style={{ margin: '6px 0' }}>Görüşme transkriptini yapıştırın (veya dikte edin) — AI tüm şablonu doldursun, itirazları tespit etsin.</p>
          <textarea
            placeholder="Zoom/Meet transkriptini buraya yapıştırın…"
            value={transcript} onChange={e => setTranscript(e.target.value)} style={{ minHeight: 70 }}
          />
          <div className="mt" style={{ marginTop: 8 }}>
            <AiButton label="✨ AI ile Doldur" className="btn sm" disabled={!transcript.trim()} onRun={aiDoldur} />
          </div>
          {aiSonuc && (
            <div className="mt" style={{ marginTop: 10 }}>
              {aiSonuc.itirazlar.length > 0 && (
                <div className="small">🛡️ Tespit edilen itirazlar: {aiSonuc.itirazlar.map(i => <span key={i} className="pill amber" style={{ marginRight: 4 }}>{i}</span>)} <span className="muted">→ İtiraz Kütüphanesi'nde cevapları hazır</span></div>
              )}
              {aiSonuc.kocNotu && <div className="script-box" style={{ marginTop: 6 }}>🤖 {aiSonuc.kocNotu}</div>}
            </div>
          )}
        </div>
        <div className="grid g2">
          <label className="field"><span>Problem — müşterinin ana problemi nedir?</span><textarea value={m.problem} onChange={e => set('problem', e.target.value)} /></label>
          <label className="field"><span>Hedef — neye ulaşmak istiyor?</span><textarea value={m.hedef} onChange={e => set('hedef', e.target.value)} /></label>
          <label className="field"><span>Mevcut Durum — şu an ne kullanıyor?</span><textarea value={m.mevcutDurum} onChange={e => set('mevcutDurum', e.target.value)} /></label>
          <label className="field"><span>Rakipler — hangi firmaları rakip görüyor?</span><textarea value={m.rakipler} onChange={e => set('rakipler', e.target.value)} /></label>
          <label className="field"><span>Bütçe — aylık / tek seferlik</span><input value={m.butce} onChange={e => set('butce', e.target.value)} /></label>
          <label className="field"><span>Karar Verici — kararı kim veriyor?</span><input value={m.kararVerici} onChange={e => set('kararVerici', e.target.value)} /></label>
          <label className="field"><span>Aciliyet (1-10): {m.aciliyet}</span><input type="range" min="1" max="10" value={m.aciliyet} onChange={e => set('aciliyet', Number(e.target.value))} /></label>
          <label className="field"><span>Satın Alma Engeli — neden hemen almıyor?</span><input value={m.satinAlmaEngeli} onChange={e => set('satinAlmaEngeli', e.target.value)} /></label>
        </div>
        <h3 style={{ fontSize: 13 }}>İlgilendiği Hizmetler</h3>
        <div style={{ columns: 3 }}>
          {SERVICES_LIST.map(s => (
            <label key={s} className="check"><input type="checkbox" checked={m.hizmetler.includes(s)} onChange={() => toggle(s)} />{s}</label>
          ))}
        </div>
        <label className="field mt"><span>Sonraki Adım</span>
          <select value={m.sonrakiAdim} onChange={e => set('sonrakiAdim', e.target.value)}>
            <option value="">Seçin…</option>{NEXT_STEPS.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <div className="flex" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onCancel}>Vazgeç</button>
          <button className="btn" onClick={() => onSave(m)}>Kaydet</button>
        </div>
      </div>
    </div>
  )
}

function LostModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('')
  useEscape(onCancel)
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <h2>Kaybedilme Sebebi</h2>
        <p className="small muted">Kaybedilen lead için sebep zorunludur. 30 gün sonra otomatik tekrar temas görevi oluşturulacak.</p>
        <label className="field"><span>Sebep *</span>
          <select value={reason} onChange={e => setReason(e.target.value)}>
            <option value="">Seçin…</option>{LOST_REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </label>
        <div className="flex" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onCancel}>Vazgeç</button>
          <button className="btn" disabled={!reason} onClick={() => onConfirm(reason)}>Kaydet ve Kapat</button>
        </div>
      </div>
    </div>
  )
}

const EMPTY_COMPETITOR = {
  ad: '', website: '', instagram: '', linkedin: '', metaReklamAktif: false,
  googleGorunurluk: 'Orta', seoDurumu: 'Orta', websiteKalitesi: 'Orta',
  sosyalMedyaGucu: 'Orta', icerikSikligi: 'Seyrek', reklamAktivitesi: '',
  gucluYonler: '', zayifYonler: ''
}

function CompetitorForm({ lead, onSave, onCancel }) {
  const [c, setC] = useState(EMPTY_COMPETITOR)
  const [arastirmaNotu, setArastirmaNotu] = useState('')
  const set = (k, v) => setC(prev => ({ ...prev, [k]: v }))
  useEscape(onCancel)

  const aiArastir = async (settings) => {
    const seviyeler = COMPETITOR_LEVELS.join('|')
    const json = await askJson(settings, {
      system: 'Sen bir dijital pazarlama analistisin. Web aramasıyla rakip firmayı araştırır, dijital varlığını değerlendirirsin. SADECE JSON döndür.',
      user: `"${c.ad}" firmasını web'de araştır${c.website ? ` (website: ${c.website})` : ''}. Müşterimiz "${lead.firma}" (${lead.sektor || 'sektör bilinmiyor'}) ile rakipler.
Dijital varlığını değerlendir ve şu şemada SADECE JSON döndür:
{"website":"","instagram":"","linkedin":"","metaReklamAktif":false,"googleGorunurluk":"${seviyeler}","seoDurumu":"${seviyeler}","websiteKalitesi":"${seviyeler}","sosyalMedyaGucu":"${seviyeler}","icerikSikligi":"${CONTENT_FREQ.join('|')}","reklamAktivitesi":"kısa tahmin","gucluYonler":"","zayifYonler":"","arastirmaNotu":"kaynaklara dayalı 1-2 cümle özet; emin olamadıkların için 'doğrulanamadı' de"}`,
      maxTokens: 1500,
      useWebSearch: true
    })
    const seviye = (v, def = 'Orta') => COMPETITOR_LEVELS.includes(v) ? v : def
    setC(prev => ({
      ...prev,
      website: json.website || prev.website,
      instagram: json.instagram || prev.instagram,
      linkedin: json.linkedin || prev.linkedin,
      metaReklamAktif: Boolean(json.metaReklamAktif),
      googleGorunurluk: seviye(json.googleGorunurluk),
      seoDurumu: seviye(json.seoDurumu),
      websiteKalitesi: seviye(json.websiteKalitesi),
      sosyalMedyaGucu: seviye(json.sosyalMedyaGucu),
      icerikSikligi: CONTENT_FREQ.includes(json.icerikSikligi) ? json.icerikSikligi : prev.icerikSikligi,
      reklamAktivitesi: json.reklamAktivitesi || prev.reklamAktivitesi,
      gucluYonler: json.gucluYonler || prev.gucluYonler,
      zayifYonler: json.zayifYonler || prev.zayifYonler
    }))
    setArastirmaNotu(json.arastirmaNotu || 'Araştırma tamamlandı — alanları kontrol edin.')
  }
  const Level = ({ label, k, options = COMPETITOR_LEVELS }) => (
    <label className="field"><span>{label}</span>
      <select value={c[k]} onChange={e => set(k, e.target.value)}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </label>
  )
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 720 }}>
        <h2>Rakip Ekle — {lead.firma}</h2>
        <div className="grid g2">
          <label className="field"><span>Rakip Firma Adı *</span><input value={c.ad} onChange={e => set('ad', e.target.value)} /></label>
          <label className="field"><span>Website</span><input value={c.website} onChange={e => set('website', e.target.value)} /></label>
        </div>
        <div className="mb">
          <AiButton label="🔍 AI ile Araştır (web araması)" className="btn ghost sm" disabled={!c.ad} onRun={aiArastir} title="Rakibi web'de araştırıp alanları doldurur" />
          {arastirmaNotu && <div className="script-box" style={{ marginTop: 8 }}>🔎 {arastirmaNotu}</div>}
        </div>
        <div className="grid g2">
          <label className="field"><span>Instagram</span><input value={c.instagram} onChange={e => set('instagram', e.target.value)} /></label>
          <label className="field"><span>LinkedIn</span><input value={c.linkedin} onChange={e => set('linkedin', e.target.value)} /></label>
        </div>
        <label className="check mb"><input type="checkbox" checked={c.metaReklamAktif} onChange={e => set('metaReklamAktif', e.target.checked)} />Meta reklamı aktif</label>
        <div className="grid g4">
          <Level label="Google Görünürlüğü" k="googleGorunurluk" />
          <Level label="SEO Durumu" k="seoDurumu" />
          <Level label="Website Kalitesi" k="websiteKalitesi" />
          <Level label="Sosyal Medya Gücü" k="sosyalMedyaGucu" />
        </div>
        <div className="grid g2">
          <Level label="İçerik Sıklığı" k="icerikSikligi" options={CONTENT_FREQ} />
          <label className="field"><span>Tahmini Reklam Aktivitesi</span><input placeholder="örn. Meta + Google, yoğun" value={c.reklamAktivitesi} onChange={e => set('reklamAktivitesi', e.target.value)} /></label>
        </div>
        <div className="grid g2">
          <label className="field"><span>Güçlü Yönler</span><textarea value={c.gucluYonler} onChange={e => set('gucluYonler', e.target.value)} /></label>
          <label className="field"><span>Zayıf Yönler</span><textarea value={c.zayifYonler} onChange={e => set('zayifYonler', e.target.value)} /></label>
        </div>
        <div className="flex" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onCancel}>Vazgeç</button>
          <button className="btn" disabled={!c.ad} onClick={() => onSave(c)}>Kaydet</button>
        </div>
      </div>
    </div>
  )
}

const TABS = ['Timeline', 'Genel', 'Toplantı Notları', 'Teklifler', 'Satışçı Yardımı', 'Cross-Sell', 'Rakip Analizi', 'Görevler']

const ACT_ICONS = { lead: '✨', atama: '👤', status: '🔀', toplanti: '📅', teklif: '📄', gorev: '✅', rakip: '⚔️', tahsilat: '💰', renewal: '🔄', not: '📝' }

export default function LeadDetail({ leadId, back }) {
  const { state, dispatch } = useStore()
  const [tab, setTab] = useState('Timeline')
  const [notMetin, setNotMetin] = useState('')
  const [editing, setEditing] = useState(false)
  const [showMeeting, setShowMeeting] = useState(false)
  const [showProposal, setShowProposal] = useState(false)
  const [showLost, setShowLost] = useState(false)
  const [showCompetitor, setShowCompetitor] = useState(false)

  const lead = state.leads.find(l => l.id === leadId)
  if (!lead) return <div className="empty">Lead bulunamadı. <button className="btn sm ghost" onClick={back}>Geri</button></div>

  const score = leadScore(lead)
  const meetings = state.meetings.filter(m => m.leadId === lead.id)
  const proposals = state.proposals.filter(p => p.leadId === lead.id)
  const tasks = state.tasks.filter(t => t.leadId === lead.id).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const competitors = state.competitors.filter(c => c.leadId === lead.id)
  const acts = state.activities.filter(a => a.leadId === lead.id)
  const dna = dealDNA(lead, state.leads)
  const nbs = nextBestSale(lead)
  const wa = waLink(lead.telefon)
  const mail = mailtoLink(lead.email, `Harbi Digital — ${lead.firma}`)

  const setStatus = (status) => {
    if (status === 'Kaybedildi') { setShowLost(true); return }
    dispatch({ type: 'SET_STATUS', id: lead.id, status })
    if (status === 'Kazanıldı') {
      toast(`🏆 ${lead.firma} kazanıldı! Handoff briefi ve müşteri kaydı otomatik oluşturuldu.`, { confetti: true })
    } else {
      const gorev = { 'İlk Temas': '"24 saat içinde ara" görevi eklendi', 'Toplantı Yapıldı': '"Toplantı notlarını doldur" görevi eklendi', 'Teklif Hazırlanıyor': '"Teklifi hazırla" görevi eklendi', 'Ertelendi': '60 gün sonra hatırlatma kuruldu' }[status]
      toast(`✓ Aşama: ${status}${gorev ? ' — ' + gorev : ''}`)
    }
  }

  // Yardım merkezi: ilgilenilen hizmetlere göre dinamik scriptler
  const scripts = (lead.ilgiHizmetler || []).flatMap(h =>
    (SALES_SCRIPTS[h] || []).map(s => ({ ...s, hizmet: h }))
  )

  return (
    <div>
      <button className="btn ghost sm mb" onClick={back}>← Lead listesi</button>
      <div className="spread mb" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{lead.firma}</h1>
          <p className="page-sub" style={{ margin: '2px 0 8px' }}>
            {lead.yetkili} {lead.pozisyon && `(${lead.pozisyon})`} · {lead.sektor || '—'} · {lead.sehir || '—'} · Kaynak: {lead.kaynak || '—'}
          </p>
          <div className="flex" style={{ flexWrap: 'wrap' }}>
            <span className={'pill ' + (score >= 70 ? 'lime' : score >= 40 ? 'amber' : 'red')}>
              Harbi Lead Score: {score}/100 · Öncelik: {scorePriority(score)}
            </span>
            <span className={'pill ' + (lead.manuelSkor === 'Sıcak' ? 'lime' : lead.manuelSkor === 'Soğuk' ? 'red' : 'amber')}>{lead.manuelSkor}</span>
            {lead.potansiyelDeger && <span className="pill blue">Potansiyel: {lead.potansiyelDeger}</span>}
            <span className="pill">Olasılık: %{lead.kapanisOlasiligi || 0}</span>
            {dna && <span className="pill blue" title={`${dna.n} kapanmış deal verisinden`}>🧬 Deal DNA: kazandıklarına %{dna.benzerlik} benziyor</span>}
            {lead.status === 'Kaybedildi' && lead.kayipSebebi && <span className="pill red">Kayıp: {lead.kayipSebebi}</span>}
          </div>
          <div className="flex mt" style={{ gap: 8 }}>
            {wa && <a className="btn ghost sm" href={wa} target="_blank" rel="noreferrer">📱 WhatsApp</a>}
            {mail && <a className="btn ghost sm" href={mail}>✉️ E-posta</a>}
            {lead.telefon && <span className="small muted">{lead.telefon}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <button className="btn ghost sm" onClick={() => setEditing(true)}>✏️ Düzenle</button>
        </div>
      </div>

      {/* Bitrix24 tarzı tıklanabilir aşama şeridi */}
      <div className="card mb" style={{ padding: '10px 16px 12px' }}>
        <div className="stage-label">
          <span>Aşama: <b>{lead.status}</b></span>
          <span className="flex" style={{ gap: 6 }}>
            {lead.status !== 'Kazanıldı' && <button className="btn sm" onClick={() => setStatus('Kazanıldı')}>✓ Kazanıldı</button>}
            {!['Kazanıldı', 'Kaybedildi'].includes(lead.status) && (
              <>
                <button className="btn danger sm" onClick={() => setStatus('Kaybedildi')}>✕ Kaybedildi</button>
                <button className="btn ghost sm" aria-label="Ertele" title="Ertele (60 gün sonra hatırlatılır)" onClick={() => setStatus('Ertelendi')}>⏸</button>
              </>
            )}
          </span>
        </div>
        {!['Kazanıldı', 'Kaybedildi', 'Ertelendi'].includes(lead.status) ? (
          <div className="stage-bar">
            {OPEN_STAGES.map((s, i) => {
              const idx = OPEN_STAGES.indexOf(lead.status)
              return (
                <div
                  key={s}
                  className={'stage-seg' + (i <= idx ? ' done' : '') + (i === idx ? ' current' : '')}
                  title={s}
                  role="button"
                  tabIndex={0}
                  aria-label={`Aşamayı "${s}" yap`}
                  onClick={() => setStatus(s)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStatus(s) } }}
                />
              )
            })}
          </div>
        ) : (
          <div className="mt" style={{ marginTop: 8 }}>
            <span className={'pill ' + (lead.status === 'Kazanıldı' ? 'lime' : lead.status === 'Kaybedildi' ? 'red' : 'amber')}>
              {lead.status === 'Kazanıldı' ? '🏆 Kazanıldı' : lead.status === 'Kaybedildi' ? `Kaybedildi${lead.kayipSebebi ? ' — ' + lead.kayipSebebi : ''}` : 'Ertelendi'}
            </span>
            <button className="btn ghost sm" style={{ marginLeft: 8 }} onClick={() => setStatus('İhtiyaç Analizi')}>↩ Pipeline'a geri al</button>
          </div>
        )}
      </div>

      {nbs && (
        <div className="card mb" style={{ borderColor: 'var(--lime-dim)', background: 'rgba(163,230,53,.05)' }}>
          <div className="small" style={{ color: 'var(--lime)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>💡 Sonraki En Mantıklı Satış</div>
          <div className="mt" style={{ marginTop: 6 }}>{nbs.metin}</div>
        </div>
      )}

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={'tab' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>
            {t}
            {t === 'Toplantı Notları' && meetings.length > 0 && ` (${meetings.length})`}
            {t === 'Teklifler' && proposals.length > 0 && ` (${proposals.length})`}
            {t === 'Rakip Analizi' && competitors.length > 0 && ` (${competitors.length})`}
            {t === 'Görevler' && tasks.filter(x => !x.done).length > 0 && ` (${tasks.filter(x => !x.done).length})`}
          </button>
        ))}
      </div>

      {tab === 'Timeline' && (
        <div className="card">
          <div className="flex mb">
            <input
              placeholder="Not ekle: arama sonucu, gözlem, söz verilen şey…"
              value={notMetin} onChange={e => setNotMetin(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && notMetin.trim()) { dispatch({ type: 'ADD_ACTIVITY', leadId: lead.id, tip: 'not', metin: notMetin.trim() }); setNotMetin('') } }}
            />
            <button className="btn sm" disabled={!notMetin.trim()} onClick={() => { dispatch({ type: 'ADD_ACTIVITY', leadId: lead.id, tip: 'not', metin: notMetin.trim() }); setNotMetin('') }}>Ekle</button>
          </div>
          {acts.length === 0 && <div className="empty">Henüz aktivite yok.</div>}
          {acts.map(a => (
            <div key={a.id} className="flex" style={{ alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{ACT_ICONS[a.tip] || '•'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{a.metin}</div>
                <div className="small muted">{new Date(a.at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}{a.kisi && ` · ${a.kisi}`}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Genel' && (
        <div className="grid g2">
          <div className="card">
            <h3>İletişim & Firma</h3>
            <table><tbody>
              <tr><td className="muted">Telefon</td><td>{lead.telefon || '—'}</td></tr>
              <tr><td className="muted">E-posta</td><td>{lead.email || '—'}</td></tr>
              <tr><td className="muted">Website</td><td>{lead.website || '—'}</td></tr>
              <tr><td className="muted">Instagram</td><td>{lead.instagram || '—'}</td></tr>
              <tr><td className="muted">LinkedIn</td><td>{lead.linkedin || '—'}</td></tr>
              <tr><td className="muted">Çalışan Sayısı</td><td>{lead.calisanSayisi || '—'}</td></tr>
              <tr><td className="muted">Tahmini Ciro</td><td>{lead.tahminiCiro || '—'}</td></tr>
              <tr><td className="muted">Büyüklük</td><td>{lead.buyukluk || '—'}</td></tr>
              <tr><td className="muted">Sorumlu</td><td>{lead.sorumlu || '—'}</td></tr>
              <tr><td className="muted">Oluşturulma</td><td>{fmtDate(lead.createdAt)}</td></tr>
            </tbody></table>
          </div>
          <div>
            <div className="card mb">
              <h3>Potansiyel Değer</h3>
              <table><tbody>
                <tr><td className="muted">Tahmini İlk Satış</td><td style={{ fontWeight: 700 }}>{fmtTL(lead.tahminiIlkSatis)}</td></tr>
                <tr><td className="muted">Tahmini Aylık Retainer</td><td style={{ fontWeight: 700 }}>{fmtTL(lead.tahminiRetainer)}</td></tr>
                <tr><td className="muted">Tahmini Yıllık Değer</td><td style={{ fontWeight: 700, color: 'var(--lime)' }}>{fmtTL((Number(lead.tahminiIlkSatis) || 0) + (Number(lead.tahminiRetainer) || 0) * 12)}</td></tr>
                <tr><td className="muted">Upsell Potansiyeli</td><td>{lead.upsellPotansiyeli || '—'}</td></tr>
                <tr><td className="muted">Beklenen Gelir (forecast)</td><td>{fmtTL((Number(lead.tahminiIlkSatis) || 0) * (Number(lead.kapanisOlasiligi) || 0) / 100)}</td></tr>
              </tbody></table>
            </div>
            <div className="card">
              <h3>İlgilendiği Hizmetler</h3>
              <div className="flex" style={{ flexWrap: 'wrap' }}>
                {(lead.ilgiHizmetler || []).map(h => <span key={h} className="pill lime">{h}</span>)}
                {!(lead.ilgiHizmetler || []).length && <span className="muted small">Henüz seçilmedi</span>}
              </div>
              {lead.status === 'Kazanıldı' && (
                <>
                  <hr className="divider" />
                  <h3>Aktif Hizmetler (satın alınan)</h3>
                  <div className="flex" style={{ flexWrap: 'wrap' }}>
                    {(lead.aktifHizmetler || []).map(h => <span key={h} className="pill lime">{h}</span>)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'Toplantı Notları' && (
        <div>
          <button className="btn mb" onClick={() => setShowMeeting(true)}>+ Toplantı Notu Ekle</button>
          {meetings.length === 0 && <div className="card empty">Henüz toplantı notu yok.</div>}
          {meetings.map(m => (
            <div key={m.id} className="card mb">
              <div className="spread"><h3>Toplantı — {fmtDate(m.tarih)}</h3><span className="pill amber">Aciliyet: {m.aciliyet}/10</span></div>
              <div className="grid g2">
                <div><div className="small muted">PROBLEM</div><div>{m.problem || '—'}</div></div>
                <div><div className="small muted">HEDEF</div><div>{m.hedef || '—'}</div></div>
                <div><div className="small muted">MEVCUT DURUM</div><div>{m.mevcutDurum || '—'}</div></div>
                <div><div className="small muted">RAKİPLER</div><div>{m.rakipler || '—'}</div></div>
                <div><div className="small muted">BÜTÇE</div><div>{m.butce || '—'}</div></div>
                <div><div className="small muted">KARAR VERİCİ</div><div>{m.kararVerici || '—'}</div></div>
                <div><div className="small muted">SATIN ALMA ENGELİ</div><div>{m.satinAlmaEngeli || '—'}</div></div>
                <div><div className="small muted">SONRAKİ ADIM</div><div style={{ color: 'var(--lime)', fontWeight: 600 }}>{m.sonrakiAdim || '—'}</div></div>
              </div>
              {m.hizmetler?.length > 0 && (
                <div className="flex mt" style={{ flexWrap: 'wrap' }}>
                  {m.hizmetler.map(h => <span key={h} className="pill">{h}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'Teklifler' && (
        <div>
          <button className="btn mb" onClick={() => setShowProposal(true)}>+ Teklif Oluştur</button>
          {proposals.length === 0 && <div className="card empty">Henüz teklif yok.</div>}
          {proposals.map(p => (
            <div key={p.id} className="card mb">
              <div className="spread">
                <h3>{p.hizmetler.join(' + ')} {p.paket && `— ${p.paket} Paketi`}</h3>
                <button className="btn sm" onClick={() => generateProposalPdf(p, lead, state.settings)}>📄 PDF İndir</button>
                <select
                  value={p.status}
                  onChange={e => dispatch({ type: 'UPDATE_PROPOSAL', id: p.id, patch: { status: e.target.value } })}
                  style={{ width: 'auto' }}
                >
                  {['Taslak', 'Hazırlanıyor', 'Gönderildi', 'Görüldü', 'Revize İstendi', 'Kabul Edildi', 'Reddedildi'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <table><tbody>
                <tr><td className="muted">Toplam</td><td style={{ fontWeight: 700 }}>{fmtTL(proposalTotal(p))}</td></tr>
                <tr><td className="muted">Teslim Süresi</td><td>{p.teslimSuresi || '—'}</td></tr>
                <tr><td className="muted">Ödeme Planı</td><td>{p.odemePlani || '—'}</td></tr>
                <tr><td className="muted">Sözleşme Süresi</td><td>{p.sozlesmeSuresi || '—'}</td></tr>
                <tr><td className="muted">Ek Hizmetler</td><td>{(p.ekHizmetler || []).join(', ') || '—'}</td></tr>
                <tr><td className="muted">Oluşturma / Gönderim</td><td>{fmtDate(p.createdAt)} {p.sentAt && `→ ${fmtDate(p.sentAt)}`}</td></tr>
              </tbody></table>
              {p.notlar && <div className="script-box mt">{p.notlar}</div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'Satışçı Yardımı' && (
        <div>
          <div className="card mb" style={{ borderColor: 'var(--lime-dim)' }}>
            <div className="spread">
              <h3>🤖 Satış Koçu</h3>
              <span className="flex" style={{ gap: 6 }}>
                <button
                  className="btn sm"
                  onClick={() => dispatch({
                    type: 'UPDATE_LEAD', id: lead.id,
                    patch: { aiKoc: { at: new Date().toISOString(), kaynak: 'offline', data: offlineCoach(lead, meetings, competitors) } }
                  })}
                  title="API/anahtar gerektirmez — kural bazlı anlık analiz"
                >📚 Hızlı Analiz</button>
              <AiButton
                label={lead.aiKoc?.kaynak === 'ai' ? '🔄 AI Yenile' : '🤖 AI Analiz'}
                className="btn ghost sm"
                onRun={async (settings) => {
                  const json = await askJson(settings, {
                    system: 'Sen deneyimli bir ajans satış koçusun. Lead bağlamını analiz edip satışçıya somut, uygulanabilir taktikler verirsin. SADECE JSON döndür.',
                    user: `LEAD: ${JSON.stringify({ firma: lead.firma, sektor: lead.sektor, buyukluk: lead.buyukluk, kaynak: lead.kaynak, status: lead.status, skor: leadScore(lead), manuelSkor: lead.manuelSkor, ilgiHizmetler: lead.ilgiHizmetler, potansiyel: lead.potansiyelDeger })}
TOPLANTI NOTLARI: ${JSON.stringify(meetings.map(m => ({ problem: m.problem, hedef: m.hedef, butce: m.butce, kararVerici: m.kararVerici, aciliyet: m.aciliyet, engel: m.satinAlmaEngeli })))}
TEKLİFLER: ${JSON.stringify(proposals.map(p => ({ hizmetler: p.hizmetler, toplam: proposalTotal(p), status: p.status })))}
RAKİPLER: ${JSON.stringify(competitors.map(c => ({ ad: c.ad, guclu: c.gucluYonler, zayif: c.zayifYonler })))}
İTİRAZ KÜTÜPHANESİ BAŞLIKLARI: ${OBJECTIONS.map(o => o.itiraz).join(', ')}

Şu şemada SADECE JSON döndür:
{"aramaPlani":["madde1","madde2","madde3"],"muhtemelItirazlar":[{"itiraz":"","cevap":""}],"acilisCumlesi":"bu müşteriye özel açılış","kacinilacakHata":"tek cümle"}`,
                    maxTokens: 1800
                  })
                  dispatch({ type: 'UPDATE_LEAD', id: lead.id, patch: { aiKoc: { at: new Date().toISOString(), kaynak: 'ai', data: json } } })
                }}
              />
              </span>
            </div>
            {!lead.aiKoc && <p className="small muted">Lead'in bağlamını (kart, toplantılar, rakipler, itiraz kütüphanesi) analiz edip sonraki arama için taktik üretir. <b>Hızlı Analiz</b> anahtar gerektirmez; AI Analiz daha doğal metin yazar.</p>}
            {lead.aiKoc?.data?._skorNotu && <div className="script-box" style={{ borderLeftColor: 'var(--amber)' }}>⚠️ {lead.aiKoc.data._skorNotu}</div>}
            {lead.aiKoc && (
              <div className="grid g2 mt">
                <div>
                  <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10.5 }}>📞 Sonraki Arama Planı</div>
                  {(lead.aiKoc.data.aramaPlani || []).map((x, i) => <div key={i} className="small" style={{ padding: '4px 0' }}>{i + 1}. {x}</div>)}
                  <div className="small muted mt" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10.5 }}>🎯 Kişiye Özel Açılış</div>
                  <div className="script-box">{lead.aiKoc.data.acilisCumlesi}</div>
                  {lead.aiKoc.data.kacinilacakHata && <div className="small mt" style={{ color: 'var(--red)' }}>⛔ {lead.aiKoc.data.kacinilacakHata}</div>}
                </div>
                <div>
                  <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10.5 }}>🛡️ Muhtemel İtirazlar</div>
                  {(lead.aiKoc.data.muhtemelItirazlar || []).map((x, i) => (
                    <div key={i} className="script-box" style={{ marginTop: 6 }}>
                      <div className="q">"{x.itiraz}"</div>
                      <div>{x.cevap}</div>
                    </div>
                  ))}
                  <div className="small muted mt">Analiz: {fmtDate(lead.aiKoc.at)} · {lead.aiKoc.kaynak === 'offline' ? '📚 kural bazlı (çevrimdışı)' : '🤖 AI'}</div>
                </div>
              </div>
            )}
          </div>
          <p className="page-sub">İlgilendiği hizmetlere göre dinamik satış scriptleri. Hizmet seçtikçe burası zenginleşir.</p>
          {scripts.length === 0 && <div className="card empty">Lead'in ilgilendiği hizmet seçilmemiş. "Düzenle" ile hizmet ekleyin — ilgili scriptler burada görünecek.</div>}
          {scripts.map((s, i) => (
            <div key={i} className="card mb">
              <span className="pill lime mb">{s.hizmet}</span>
              <div className="script-box">
                <div className="q">Müşteri: {s.itiraz}</div>
                <div>{s.cevap}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Cross-Sell' && (
        <div>
          {!nbs && <div className="card empty">Cross-sell önerisi için önce ilgilendiği/aldığı hizmet seçilmeli.</div>}
          {nbs && (
            <div className="grid g2">
              {nbs.oneriler.map((o, i) => (
                <div key={i} className="card">
                  <div className="spread">
                    <h3>{o.oneri}</h3>
                    <span className="pill">↳ {o.kaynak} müşterisine</span>
                  </div>
                  <div className="small muted">"{o.kaynak}" alan/ilgilenen müşteriler için önerilen tamamlayıcı hizmet.</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Rakip Analizi' && (
        <div>
          <button className="btn mb" onClick={() => setShowCompetitor(true)}>+ Rakip Ekle</button>
          {competitors.length === 0 && <div className="card empty">Henüz rakip eklenmemiş. Görüşme öncesi müşterinin rakiplerini ekleyin — sistem satış cümleleri üretecek.</div>}
          {competitors.map(c => {
            const sentences = competitorSentences(c)
            return (
              <div key={c.id} className="card mb">
                <div className="spread">
                  <h3 style={{ fontSize: 15 }}>{c.ad}</h3>
                  <div className="flex">
                    {c.metaReklamAktif && <span className="pill red">Meta reklamı aktif</span>}
                    <button className="btn danger sm" onClick={() => {
                      dispatch({ type: 'DELETE_COMPETITOR', id: c.id })
                      toast(`${c.ad} silindi`, { tone: 'danger', undo: () => dispatch({ type: 'ADD_COMPETITOR', competitor: c }) })
                    }}>Sil</button>
                  </div>
                </div>
                <div className="grid g2">
                  <table><tbody>
                    <tr><td className="muted">Website</td><td>{c.website || '—'}</td></tr>
                    <tr><td className="muted">Instagram / LinkedIn</td><td>{[c.instagram, c.linkedin].filter(Boolean).join(' · ') || '—'}</td></tr>
                    <tr><td className="muted">Google Görünürlüğü</td><td>{c.googleGorunurluk}</td></tr>
                    <tr><td className="muted">SEO Durumu</td><td>{c.seoDurumu}</td></tr>
                    <tr><td className="muted">Website Kalitesi</td><td>{c.websiteKalitesi}</td></tr>
                    <tr><td className="muted">Sosyal Medya Gücü</td><td>{c.sosyalMedyaGucu}</td></tr>
                    <tr><td className="muted">İçerik Sıklığı</td><td>{c.icerikSikligi}</td></tr>
                    <tr><td className="muted">Reklam Aktivitesi</td><td>{c.reklamAktivitesi || '—'}</td></tr>
                    <tr><td className="muted">Güçlü Yönler</td><td>{c.gucluYonler || '—'}</td></tr>
                    <tr><td className="muted">Zayıf Yönler</td><td>{c.zayifYonler || '—'}</td></tr>
                  </tbody></table>
                  <div>
                    <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10.5 }}>🎯 Satışçıya Hazır Cümleler</div>
                    {sentences.length === 0 && <div className="small muted mt">Alanları doldurdukça satış cümleleri burada üretilir.</div>}
                    {sentences.map((s, i) => (
                      <div key={i} className="script-box" style={{ marginTop: 8 }}>
                        {s}
                        <div><button className="btn ghost sm mt" style={{ marginTop: 6 }} onClick={() => navigator.clipboard?.writeText(s)}>Kopyala</button></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'Görevler' && (
        <div className="card">
          <h3>Görevler & Follow-Up</h3>
          {tasks.length === 0 && <div className="empty">Görev yok.</div>}
          {tasks.map(t => (
            <div key={t.id} className={'task-row' + (t.done ? ' done' : '')}>
              <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: 'TOGGLE_TASK', id: t.id })} />
              <div style={{ flex: 1 }}>
                <div className="t-title">{t.baslik} <span className="pill" style={{ marginLeft: 6 }}>{t.tip}</span></div>
                <div className="t-meta">
                  {new Date(t.dueDate) < Date.now() && !t.done
                    ? <span className="overdue">Gecikti · {fmtDate(t.dueDate)}</span>
                    : fmtDate(t.dueDate)}
                </div>
                {t.note && <div className="script-box" style={{ marginTop: 6 }}>{t.note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <LeadForm
          initial={lead}
          onCancel={() => setEditing(false)}
          onSave={(f) => { dispatch({ type: 'UPDATE_LEAD', id: lead.id, patch: f }); setEditing(false) }}
        />
      )}
      {showMeeting && (
        <MeetingForm
          lead={lead}
          onCancel={() => setShowMeeting(false)}
          onSave={(m) => {
            dispatch({ type: 'ADD_MEETING', meeting: { ...m, id: uid('M'), leadId: lead.id, tarih: new Date().toISOString() } })
            // Toplantıda seçilen hizmetleri lead'e yansıt
            const merged = [...new Set([...(lead.ilgiHizmetler || []), ...m.hizmetler])]
            dispatch({ type: 'UPDATE_LEAD', id: lead.id, patch: { ilgiHizmetler: merged } })
            setShowMeeting(false)
          }}
        />
      )}
      {showProposal && (
        <ProposalForm
          fixedLead={lead}
          onCancel={() => setShowProposal(false)}
          onSaved={() => setShowProposal(false)}
        />
      )}
      {showCompetitor && (
        <CompetitorForm
          lead={lead}
          onCancel={() => setShowCompetitor(false)}
          onSave={(c) => {
            dispatch({ type: 'ADD_COMPETITOR', competitor: { ...c, id: uid('R'), leadId: lead.id } })
            setShowCompetitor(false)
          }}
        />
      )}
      {showLost && (
        <LostModal
          onCancel={() => setShowLost(false)}
          onConfirm={(reason) => {
            dispatch({ type: 'SET_STATUS', id: lead.id, status: 'Kaybedildi', kayipSebebi: reason })
            toast(`Kaybedildi olarak işaretlendi — 30 gün sonra nurturing görevi kuruldu`, { tone: 'danger' })
            setShowLost(false)
          }}
        />
      )}
    </div>
  )
}
