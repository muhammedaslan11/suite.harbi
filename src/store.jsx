import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react'
import { FOLLOWUP_SCHEDULE, TASK_TYPES, ONBOARDING_ITEMS, RENEWAL_CHAIN, DEFAULT_UI, DEFAULT_SCORE_WEIGHTS } from './data/constants.js'
import { demoData, SERVICE_CARDS } from './data/seeds.js'
import { uid, setUiConfig } from './utils.js'

const KEY = 'harb-suite-v1'

export const DEFAULT_SETTINGS = {
  ekip: [{ id: 'u1', ad: 'Hüseyin', aktif: true }],
  hedefler: {},        // { uyeId: { ciro, toplanti, teklif } }
  atamaKurallari: {},  // { kaynak: uyeId }
  rrIndex: 0,
  aiKey: '',
  aiModel: 'claude-sonnet-5',
  ui: DEFAULT_UI,
  skorAgirliklari: DEFAULT_SCORE_WEIGHTS,
  followupGunleri: [1, 3, 7, 14, 30]
}

const empty = {
  leads: [], meetings: [], proposals: [], tasks: [],
  handoffs: [], customers: [], competitors: [],
  activities: [], payments: [], dojoSessions: [],
  settings: DEFAULT_SETTINGS
}

// Ham veriyi varsayılanlarla birleştir (eski sürümlerden gelen eksik alanlar için)
function normalize(parsed) {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(parsed.settings || {}),
    ui: { ...DEFAULT_UI, ...(parsed.settings?.ui || {}) },
    skorAgirliklari: { ...DEFAULT_SCORE_WEIGHTS, ...(parsed.settings?.skorAgirliklari || {}) }
  }
  return { ...empty, ...parsed, settings }
}

function freshDemo() {
  return { ...empty, ...demoData(), settings: { ...DEFAULT_SETTINGS } }
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return normalize(JSON.parse(raw))
  } catch (e) { /* bozuk veri — demo ile başla */ }
  return freshDemo()
}

// Depolama modu: 'sqlite' (varsayılan) | 'local' (API'ye ulaşılamazsa yedek mod)
let STORAGE_MODE = 'yükleniyor'
export function getStorageMode() { return STORAGE_MODE }

// ---------- Oturum ----------
export function getToken() { return localStorage.getItem('harb-token') || '' }
export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('harb-user')) } catch { return null }
}
export function apiFetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { ...(opts.headers || {}), 'x-harb-token': getToken() } })
}
export async function logoutUser() {
  try { await apiFetch('/api/logout', { method: 'POST' }) } catch { /* yoksay */ }
  localStorage.removeItem('harb-token')
  localStorage.removeItem('harb-user')
  location.reload()
}

// Webhook gelen kutusundan düşen ham kaydı lead'e çevir
function inboxToLead(it) {
  return {
    firma: it.firma || it.company || '', yetkili: it.yetkili || it.name || '',
    pozisyon: '', telefon: it.telefon || it.phone || '', email: it.email || '',
    website: it.website || '', instagram: '', linkedin: '', sehir: it.sehir || it.city || '',
    ulke: 'Türkiye', sektor: it.sektor || '', calisanSayisi: '', tahminiCiro: '', buyukluk: '',
    kaynak: it.kaynak || 'Website Form', manuelSkor: 'Ilık',
    flags: { reklamAktif: false, instagramAktif: false, linkedinAktif: false, kararVericiTemas: false, butceBelirtildi: false, acilIhtiyac: false },
    potansiyelDeger: '', tahminiIlkSatis: '', tahminiRetainer: '', upsellPotansiyeli: 'Orta',
    kapanisOlasiligi: 25, status: 'Yeni Lead', ilgiHizmetler: [], sorumlu: '',
    kayipSebebi: '', aktifHizmetler: [], statusHistory: [],
    id: uid('L'), createdAt: new Date().toISOString()
  }
}

const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString()

const task = (leadId, baslik, tip, dueDays, note = '') => ({
  id: uid('T'), leadId, baslik, tip, dueDate: inDays(dueDays), done: false, note
})

const activity = (leadId, tip, metin, kisi = '') => ({
  id: uid('A'), leadId, tip, metin, kisi, at: new Date().toISOString()
})

// Status değişiminde otomatik aksiyonlar (Bölüm 3 + 17)
function automationTasks(lead, newStatus) {
  switch (newStatus) {
    case 'İlk Temas':
      return [task(lead.id, '24 saat içinde ara', TASK_TYPES.ARAMA, 1)]
    case 'Toplantı Planlandı':
      return [task(lead.id, 'Toplantı hazırlığı: rakip analizi + hizmet kartlarını incele', TASK_TYPES.TOPLANTI, 0)]
    case 'Toplantı Yapıldı':
      return [task(lead.id, 'Toplantı notlarını doldur', TASK_TYPES.TOPLANTI, 0)]
    case 'Teklif Hazırlanıyor':
      return [task(lead.id, 'Teklifi hazırla ve gönder', TASK_TYPES.TEKLIF, 2)]
    case 'Teklif Gönderildi':
      return [task(lead.id, '1 gün sonra takip et', TASK_TYPES.FOLLOWUP, 1)]
    case 'Kazanıldı':
      return [
        task(lead.id, 'Delivery handoff briefi hazırla (operasyona devir)', TASK_TYPES.OPERASYON, 1),
        task(lead.id, 'Onboarding formu gönder', TASK_TYPES.OPERASYON, 1)
      ]
    case 'Kaybedildi':
      return [task(lead.id, '30 gün sonra tekrar temas (nurturing)', TASK_TYPES.ARAMA, 30)]
    case 'Ertelendi':
      return [task(lead.id, '60 gün sonra tekrar değerlendir', TASK_TYPES.ARAMA, 60)]
    default:
      return []
  }
}

// Kazanıldı otomasyonu: operasyon briefi (handoff) — toplantı notlarından beslenir
function buildHandoff(lead, meetings) {
  const m = meetings.filter(x => x.leadId === lead.id)
    .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))[0]
  const hizmetler = (lead.aktifHizmetler?.length ? lead.aktifHizmetler : lead.ilgiHizmetler) || []
  const checklist = {}
  for (const h of hizmetler) {
    const card = SERVICE_CARDS.find(c => c.ad === h)
    checklist[h] = (card?.checklist || ['Kickoff toplantısı', 'Kapsam onayı', 'Teslimat']).map(madde => ({ madde, done: false }))
  }
  return {
    id: uid('H'),
    leadId: lead.id,
    problem: m?.problem || '',
    hedef: m?.hedef || '',
    butce: m?.butce || '',
    hizmetler,
    beklentiler: '',
    verilenSozler: '',
    ozelIstekler: '',
    riskler: m?.satinAlmaEngeli ? `Satış sürecindeki engel: ${m.satinAlmaEngeli}` : '',
    materyaller: '',
    sorumlu: lead.sorumlu || '',
    baslangicTarihi: new Date().toISOString(),
    teslimTarihi: '',
    checklist,
    onboarding: ONBOARDING_ITEMS.map(madde => ({ madde, done: false })),
    createdAt: new Date().toISOString()
  }
}

// Kazanıldı otomasyonu: Customer Success kaydı
function buildCustomer(lead) {
  const now = new Date()
  const renewal = new Date(now); renewal.setFullYear(renewal.getFullYear() + 1)
  return {
    leadId: lead.id,
    sorumlu: lead.sorumlu || '',
    baslangic: now.toISOString(),
    sozlesmeBitis: renewal.toISOString(),
    renewalTarihi: renewal.toISOString(),
    sonToplanti: '',
    sonRapor: '',
    memnuniyet: 7,
    health: { sonucAliyor: true, toplantiKatilim: true, odemeDuzenli: true, sikayetYok: true, raporZamaninda: true, yeniIhtiyacVar: false },
    renewalFlags: {},
    notlar: ''
  }
}

// Kazanıldı otomasyonu: son teklifin ödeme planından tahsilat kayıtları
function buildPayments(lead, proposals) {
  const p = proposals.filter(x => x.leadId === lead.id && x.status !== 'Reddedildi')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
  const toplam = p
    ? (p.kalemler?.length ? p.kalemler.reduce((a, k) => a + (Number(k.fiyat) || 0), 0) : Number(p.fiyat) || 0)
    : Number(lead.tahminiIlkSatis) || 0
  const out = []
  if (toplam > 0) {
    const yariYari = (p?.odemePlani || '').includes('%50')
    if (yariYari) {
      out.push({ id: uid('PAY'), leadId: lead.id, tutar: Math.round(toplam / 2), vade: inDays(0), tip: 'Peşinat', durum: 'Bekliyor' })
      out.push({ id: uid('PAY'), leadId: lead.id, tutar: Math.round(toplam / 2), vade: inDays(30), tip: 'Taksit', durum: 'Bekliyor' })
    } else {
      out.push({ id: uid('PAY'), leadId: lead.id, tutar: toplam, vade: inDays(0), tip: 'Peşinat', durum: 'Bekliyor' })
    }
  }
  const retainer = Number(lead.tahminiRetainer) || 0
  if (retainer > 0) {
    out.push({ id: uid('PAY'), leadId: lead.id, tutar: retainer, vade: inDays(30), tip: 'Retainer', durum: 'Bekliyor' })
  }
  return out
}

// Yeni lead'e sorumlu ata: önce kaynak kuralı, yoksa round-robin
function assignOwner(lead, settings) {
  if (lead.sorumlu) return { sorumlu: lead.sorumlu, rrIndex: settings.rrIndex, auto: false }
  const aktif = (settings.ekip || []).filter(u => u.aktif)
  if (!aktif.length) return { sorumlu: '', rrIndex: settings.rrIndex, auto: false }
  const kuralId = settings.atamaKurallari?.[lead.kaynak]
  const kural = kuralId && aktif.find(u => u.id === kuralId)
  if (kural) return { sorumlu: kural.ad, rrIndex: settings.rrIndex, auto: true }
  const idx = (settings.rrIndex || 0) % aktif.length
  return { sorumlu: aktif[idx].ad, rrIndex: idx + 1, auto: true }
}

// Teklif gönderilince follow-up görevleri (Bölüm 11) — günler Ayarlar'dan özelleştirilebilir
function followupTasks(leadId, gunler) {
  const takvim = (gunler?.length ? gunler : FOLLOWUP_SCHEDULE.map(f => f.gun))
  return takvim.map(gun => {
    const script = FOLLOWUP_SCHEDULE.find(f => f.gun === gun)?.script || ''
    return task(leadId, `Follow-up araması (${gun}. gün)`, TASK_TYPES.FOLLOWUP, gun, script)
  })
}

function addLead(state, lead) {
  const { sorumlu, rrIndex, auto } = assignOwner(lead, state.settings)
  const full = { ...lead, sorumlu }
  const t = task(full.id, 'İlk temas: 24 saat içinde ara', TASK_TYPES.ARAMA, 1)
  const acts = [activity(full.id, 'lead', `Lead oluşturuldu (kaynak: ${full.kaynak || '—'})`)]
  if (auto && sorumlu) acts.push(activity(full.id, 'atama', `Otomatik atandı: ${sorumlu}`))
  return {
    ...state,
    leads: [full, ...state.leads],
    tasks: [t, ...state.tasks],
    activities: [...acts, ...state.activities],
    settings: { ...state.settings, rrIndex }
  }
}

function reducer(state, action) {
  if (action.type === 'INIT') return action.state
  if (!state) return state // henüz yüklenmedi
  switch (action.type) {
    case 'ADD_LEAD':
      return addLead(state, action.lead)
    case 'IMPORT_LEADS':
      return action.leads.reduce((st, l) => addLead(st, l), state)
    case 'UPDATE_LEAD':
      return {
        ...state,
        leads: state.leads.map(l => l.id === action.id ? { ...l, ...action.patch } : l)
      }
    case 'SET_STATUS': {
      const lead = state.leads.find(l => l.id === action.id)
      if (!lead || lead.status === action.status) return state
      const auto = automationTasks(lead, action.status)
      const patch = {
        status: action.status,
        statusHistory: [...(lead.statusHistory || []), { from: lead.status, to: action.status, at: new Date().toISOString() }]
      }
      if (action.status === 'Kaybedildi') patch.kayipSebebi = action.kayipSebebi || lead.kayipSebebi
      let handoffs = state.handoffs
      let customers = state.customers
      let payments = state.payments
      const acts = [activity(lead.id, 'status', `Aşama: ${lead.status} → ${action.status}${action.kayipSebebi ? ` (sebep: ${action.kayipSebebi})` : ''}`)]
      if (action.status === 'Kazanıldı') {
        if (!(lead.aktifHizmetler || []).length) patch.aktifHizmetler = lead.ilgiHizmetler || []
        const wonLead = { ...lead, ...patch }
        if (!handoffs.some(h => h.leadId === lead.id)) {
          handoffs = [buildHandoff(wonLead, state.meetings), ...handoffs]
          acts.push(activity(lead.id, 'operasyon', 'Delivery handoff briefi otomatik oluşturuldu'))
        }
        if (!customers.some(c => c.leadId === lead.id)) {
          customers = [buildCustomer(wonLead), ...customers]
        }
        if (!payments.some(p => p.leadId === lead.id)) {
          const yeni = buildPayments(wonLead, state.proposals)
          payments = [...yeni, ...payments]
          if (yeni.length) acts.push(activity(lead.id, 'tahsilat', `${yeni.length} tahsilat kaydı oluşturuldu`))
        }
      }
      return {
        ...state,
        leads: state.leads.map(l => l.id === action.id ? { ...l, ...patch } : l),
        tasks: [...auto, ...state.tasks],
        activities: [...acts, ...state.activities],
        handoffs, customers, payments
      }
    }
    case 'DELETE_LEAD':
      return {
        ...state,
        leads: state.leads.filter(l => l.id !== action.id),
        meetings: state.meetings.filter(m => m.leadId !== action.id),
        proposals: state.proposals.filter(p => p.leadId !== action.id),
        tasks: state.tasks.filter(t => t.leadId !== action.id),
        handoffs: state.handoffs.filter(h => h.leadId !== action.id),
        customers: state.customers.filter(c => c.leadId !== action.id),
        competitors: state.competitors.filter(c => c.leadId !== action.id),
        activities: state.activities.filter(a => a.leadId !== action.id),
        payments: state.payments.filter(p => p.leadId !== action.id)
      }
    case 'ADD_MEETING':
      return {
        ...state,
        meetings: [action.meeting, ...state.meetings],
        activities: [activity(action.meeting.leadId, 'toplanti', 'Toplantı notu eklendi'), ...state.activities]
      }
    case 'ADD_PROPOSAL':
      return {
        ...state,
        proposals: [action.proposal, ...state.proposals],
        activities: [activity(action.proposal.leadId, 'teklif', `Teklif oluşturuldu (${(action.proposal.hizmetler || []).join(', ')})`), ...state.activities]
      }
    case 'UPDATE_PROPOSAL': {
      const prev = state.proposals.find(p => p.id === action.id)
      const next = { ...prev, ...action.patch }
      let tasks = state.tasks
      let activities = state.activities
      if (prev && action.patch.status && prev.status !== action.patch.status) {
        activities = [activity(next.leadId, 'teklif', `Teklif statüsü: ${prev.status} → ${action.patch.status}`), ...activities]
      }
      // Otomasyon: teklif "Gönderildi" olunca follow-up görevleri oluştur
      if (prev && prev.status !== 'Gönderildi' && next.status === 'Gönderildi') {
        next.sentAt = new Date().toISOString()
        tasks = [...followupTasks(next.leadId, state.settings.followupGunleri), ...tasks]
      }
      return {
        ...state,
        proposals: state.proposals.map(p => p.id === action.id ? next : p),
        tasks, activities
      }
    }
    case 'UPDATE_HANDOFF':
      return { ...state, handoffs: state.handoffs.map(h => h.id === action.id ? { ...h, ...action.patch } : h) }
    case 'TOGGLE_HANDOFF_CHECK': {
      return {
        ...state,
        handoffs: state.handoffs.map(h => {
          if (h.id !== action.id) return h
          if (action.hizmet == null) {
            return { ...h, onboarding: h.onboarding.map((x, i) => i === action.index ? { ...x, done: !x.done } : x) }
          }
          return {
            ...h,
            checklist: {
              ...h.checklist,
              [action.hizmet]: h.checklist[action.hizmet].map((x, i) => i === action.index ? { ...x, done: !x.done } : x)
            }
          }
        })
      }
    }
    case 'UPDATE_CUSTOMER':
      return { ...state, customers: state.customers.map(c => c.leadId === action.leadId ? { ...c, ...action.patch } : c) }
    case 'ADD_COMPETITOR':
      return {
        ...state,
        competitors: [action.competitor, ...state.competitors],
        activities: [activity(action.competitor.leadId, 'rakip', `Rakip eklendi: ${action.competitor.ad}`), ...state.activities]
      }
    case 'UPDATE_COMPETITOR':
      return { ...state, competitors: state.competitors.map(c => c.id === action.id ? { ...c, ...action.patch } : c) }
    case 'DELETE_COMPETITOR':
      return { ...state, competitors: state.competitors.filter(c => c.id !== action.id) }
    case 'ADD_TASK':
      return { ...state, tasks: [action.task, ...state.tasks] }
    case 'TOGGLE_TASK': {
      const t = state.tasks.find(x => x.id === action.id)
      const activities = t && !t.done && t.leadId
        ? [activity(t.leadId, 'gorev', `Görev tamamlandı: ${t.baslik}`), ...state.activities]
        : state.activities
      return { ...state, tasks: state.tasks.map(x => x.id === action.id ? { ...x, done: !x.done } : x), activities }
    }
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) }
    case 'ADD_ACTIVITY':
      return { ...state, activities: [activity(action.leadId, action.tip || 'not', action.metin, action.kisi), ...state.activities] }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'ADD_PAYMENT':
      return {
        ...state,
        payments: [{ ...action.payment, id: uid('PAY') }, ...state.payments],
        activities: action.payment.leadId
          ? [activity(action.payment.leadId, 'tahsilat', `Ödeme kaydı eklendi: ${action.payment.tip}`), ...state.activities]
          : state.activities
      }
    case 'UPDATE_PAYMENT': {
      const p = state.payments.find(x => x.id === action.id)
      const activities = p && action.patch.durum === 'Ödendi' && p.durum !== 'Ödendi'
        ? [activity(p.leadId, 'tahsilat', `Ödeme alındı: ${p.tip}`), ...state.activities]
        : state.activities
      return { ...state, payments: state.payments.map(x => x.id === action.id ? { ...x, ...action.patch } : x), activities }
    }
    case 'DELETE_PAYMENT':
      return { ...state, payments: state.payments.filter(p => p.id !== action.id) }
    case 'ADD_DOJO_SESSION':
      return { ...state, dojoSessions: [action.session, ...state.dojoSessions] }
    case 'RENEWAL_CHECK': {
      // Sözleşme yenileme motoru: 90/60/30 gün eşiklerinde tek seferlik görev üret
      let tasks = state.tasks
      let activities = state.activities
      const customers = state.customers.map(c => {
        if (!c.renewalTarihi) return c
        const lead = state.leads.find(l => l.id === c.leadId)
        if (!lead || lead.status !== 'Kazanıldı') return c
        const kalan = Math.ceil((new Date(c.renewalTarihi) - Date.now()) / 86400000)
        if (kalan < 0) return c
        const flags = { ...(c.renewalFlags || {}) }
        let changed = false
        for (const step of RENEWAL_CHAIN) {
          if (kalan <= step.gun && !flags['g' + step.gun]) {
            flags['g' + step.gun] = true
            changed = true
            tasks = [task(c.leadId, step.gorev, TASK_TYPES.RENEWAL, Math.min(3, kalan)), ...tasks]
            activities = [activity(c.leadId, 'renewal', `Yenileme motoru: "${step.gorev}" görevi oluşturuldu (${kalan} gün kaldı)`), ...activities]
          }
        }
        return changed ? { ...c, renewalFlags: flags } : c
      })
      if (tasks === state.tasks) return state
      return { ...state, customers, tasks, activities }
    }
    case 'IMPORT':
      return { ...empty, ...action.data, settings: { ...DEFAULT_SETTINGS, ...(action.data.settings || {}) } }
    case 'RESET_DEMO':
      return { ...empty, ...demoData(), settings: state.settings }
    case 'CLEAR_ALL':
      return { ...empty, settings: state.settings }
    default:
      return state
  }
}

const Ctx = createContext(null)

export function StoreProvider({ children, LoginScreen }) {
  const [state, dispatch] = useReducer(reducer, null)
  const [needAuth, setNeedAuth] = useState(false)
  const saveTimer = useRef(null)
  const loaded = useRef(false)

  // Açılış: SQLite API'den yükle → boşsa localStorage'dan migrasyon → o da yoksa demo.
  // API'ye ulaşılamazsa localStorage yedek moduna düş.
  useEffect(() => {
    (async () => {
      let next
      try {
        const r = await apiFetch('/api/state')
        if (r.status === 401) { setNeedAuth(true); return } // giriş ekranına
        if (!r.ok) throw new Error('api yok')
        const { state: s, empty: bos } = await r.json()
        STORAGE_MODE = 'sqlite'
        if (!bos) {
          next = normalize(s)
        } else {
          // İlk çalıştırma: localStorage'da eski veri varsa SQLite'a taşı
          next = loadLocal()
        }
      } catch (e) {
        STORAGE_MODE = 'local'
        next = loadLocal()
      }
      dispatch({ type: 'INIT', state: next })
      loaded.current = true
      dispatch({ type: 'RENEWAL_CHECK' })
      // Webhook gelen kutusu: bekleyen lead'leri otomasyonlardan geçirerek içe al
      if (STORAGE_MODE === 'sqlite') {
        try {
          const inbox = await (await apiFetch('/api/inbox')).json()
          if (inbox.items?.length) {
            // Önce kutuyu temizle (çift sekme/reload yarışında mükerrer import olmasın), sonra içe al
            await apiFetch('/api/inbox/clear', {
              method: 'POST', headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ uptoRid: Math.max(...inbox.items.map(i => i.rid)) })
            })
            const leads = inbox.items.map(inboxToLead).filter(l => l.firma)
            if (leads.length) dispatch({ type: 'IMPORT_LEADS', leads })
          }
        } catch (e) { /* gelen kutusu opsiyonel */ }
      }
    })()
  }, [])

  // Kaydetme: 400ms debounce ile SQLite'a yaz; localStorage acil durum aynası olarak tutulur
  useEffect(() => {
    if (!state || !loaded.current) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { /* kota */ }
      if (STORAGE_MODE === 'sqlite') {
        apiFetch('/api/state', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(state)
        }).catch(() => { /* geçici ağ hatası — localStorage aynası güncel */ })
      }
    }, 400)
    return () => clearTimeout(saveTimer.current)
  }, [state])

  // Görünüm ayarlarını uygula: tema, vurgu rengi, yoğunluk + utils konfigürasyonu
  useEffect(() => {
    if (!state) return
    const ui = state.settings.ui || DEFAULT_UI
    document.body.classList.toggle('theme-light', ui.tema === 'acik')
    document.body.classList.toggle('density-compact', ui.yogunluk === 'kompakt')
    document.body.classList.toggle('modern-ui', !!ui.modernMod)
    document.body.dataset.accent = ui.vurgu || 'lime'
    setUiConfig({ paraBirimi: ui.paraBirimi, skorAgirliklari: state.settings.skorAgirliklari })
  }, [state?.settings?.ui, state?.settings?.skorAgirliklari])

  if (needAuth && LoginScreen) return <LoginScreen />
  if (!state) {
    // Skeleton yükleme — algılanan hız (Doherty eşiği)
    return (
      <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }} aria-busy="true" aria-label="Yükleniyor">
        <div style={{ width: 236, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[90, 60, ...Array(8).fill(120)].map((w, i) => <div key={i} className="skel" style={{ height: i < 2 ? 20 : 30, width: w + '%' }} />)}
        </div>
        <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="skel" style={{ height: 38, maxWidth: 460, borderRadius: 22 }} />
          <div className="skel" style={{ height: 26, width: 200 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skel" style={{ height: 110 }} />)}
          </div>
        </div>
      </div>
    )
  }
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useStore() {
  return useContext(Ctx)
}
