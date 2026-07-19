import { CROSS_SELL_MAP, STAGES, DEFAULT_SCORE_WEIGHTS } from './data/constants.js'

// Ayarlar'dan beslenen çalışma zamanı konfigürasyonu (StoreProvider senkronlar)
let UI_CFG = { paraBirimi: 'TL', skorAgirliklari: DEFAULT_SCORE_WEIGHTS }
export function setUiConfig(cfg) { UI_CFG = { ...UI_CFG, ...cfg } }

// Harbi Lead Score — 100 üzerinden otomatik hesap (ağırlıklar özelleştirilebilir)
export function leadScore(lead) {
  const w = { ...DEFAULT_SCORE_WEIGHTS, ...(UI_CFG.skorAgirliklari || {}) }
  const f = lead.flags || {}
  let s = 0
  if (lead.website) s += w.website
  if (f.reklamAktif) s += w.reklamAktif
  if (f.instagramAktif || lead.instagram) s += w.instagramAktif
  if (f.linkedinAktif || lead.linkedin) s += w.linkedinAktif
  const emp = Number(lead.calisanSayisi) || 0
  if (emp >= 50) s += w.calisan50
  else if (emp >= 10) s += w.calisan10
  if (f.kararVericiTemas) s += w.kararVericiTemas
  if (f.butceBelirtildi) s += w.butceBelirtildi
  if (f.acilIhtiyac) s += w.acilIhtiyac
  const stageIdx = STAGES.indexOf(lead.status)
  if (f.toplantiPlanlandi || stageIdx >= STAGES.indexOf('Toplantı Planlandı')) s += w.toplantiPlanlandi
  return Math.min(100, s)
}

export function scorePriority(score) {
  if (score >= 70) return 'Yüksek'
  if (score >= 40) return 'Orta'
  return 'Düşük'
}

export function fmtTL(n) {
  const v = Number(n) || 0
  return v.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ' + (UI_CFG.paraBirimi || 'TL')
}

export function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function daysUntil(iso) {
  return Math.ceil((new Date(iso) - Date.now()) / 86400000)
}

export function initials(ad) {
  return ad ? ad.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('') : '?'
}

export function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// Cross-sell: sahip olunmayan önerileri döndür
export function crossSellSuggestions(ownedServices) {
  const owned = new Set(ownedServices || [])
  const suggestions = []
  for (const svc of owned) {
    for (const rec of CROSS_SELL_MAP[svc] || []) {
      if (!owned.has(rec) && !suggestions.find(x => x.oneri === rec)) {
        suggestions.push({ oneri: rec, kaynak: svc })
      }
    }
  }
  return suggestions
}

// "Sonraki En Mantıklı Satış" cümlesi
export function nextBestSale(lead) {
  const owned = lead.status === 'Kazanıldı'
    ? (lead.aktifHizmetler?.length ? lead.aktifHizmetler : lead.ilgiHizmetler)
    : lead.ilgiHizmetler
  const sugg = crossSellSuggestions(owned)
  if (!sugg.length) return null
  const top = sugg.slice(0, 2).map(s => s.oneri)
  return {
    metin: `Bu müşteri ${owned.join(' + ')} ${lead.status === 'Kazanıldı' ? 'aldı' : 'ile ilgileniyor'}. Önerilen satış: ${top.join(' + ')}.`,
    oneriler: sugg
  }
}

// Customer Success — Health Score (100 üzerinden)
export const HEALTH_CRITERIA = [
  { key: 'sonucAliyor', label: 'Sonuç alıyor', puan: 25 },
  { key: 'odemeDuzenli', label: 'Ödemeleri düzenli', puan: 20 },
  { key: 'toplantiKatilim', label: 'Toplantılara katılıyor', puan: 15 },
  { key: 'sikayetYok', label: 'Şikayet yok', puan: 15 },
  { key: 'raporZamaninda', label: 'Raporlar zamanında gidiyor', puan: 15 },
  { key: 'yeniIhtiyacVar', label: 'Yeni hizmet ihtiyacı var', puan: 10 }
]

export function healthScore(customer) {
  const h = customer?.health || {}
  return HEALTH_CRITERIA.reduce((a, c) => a + (h[c.key] ? c.puan : 0), 0)
}

export function riskLevel(score) {
  if (score >= 80) return { label: 'Sağlıklı', tone: 'lime' }
  if (score >= 60) return { label: 'Dikkat', tone: 'amber' }
  if (score >= 40) return { label: 'Riskli', tone: 'red' }
  return { label: 'Kaybedilme Riski Yüksek', tone: 'red' }
}

// Revenue forecast: teklif değeri x kapanış olasılığı
export function forecast(leads, proposals) {
  const open = leads.filter(l => !['Kazanıldı', 'Kaybedildi', 'Ertelendi'].includes(l.status))
  let beklenen = 0, pipeline = 0, riskli = 0
  for (const l of open) {
    const p = proposals.filter(x => x.leadId === l.id && !['Reddedildi'].includes(x.status))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    const deger = p ? Number(p.fiyat) : Number(l.tahminiIlkSatis) || 0
    const olasilik = (Number(l.kapanisOlasiligi) || 0) / 100
    pipeline += deger
    beklenen += deger * olasilik
    if (olasilik <= 0.25) riskli += deger
  }
  const kesin = leads.filter(l => l.status === 'Kazanıldı')
    .reduce((a, l) => a + (Number(l.tahminiIlkSatis) || 0), 0)
  const mrr = leads.filter(l => l.status === 'Kazanıldı')
    .reduce((a, l) => a + (Number(l.tahminiRetainer) || 0), 0)
  // Yakın vade tahmini: yüksek olasılık bu ay, orta olasılık gelecek ay kapanır varsayımı
  const buAy = open.reduce((a, l) => {
    const deger = Number(l.tahminiIlkSatis) || 0
    return (Number(l.kapanisOlasiligi) || 0) >= 75 ? a + deger * l.kapanisOlasiligi / 100 : a
  }, 0)
  const gelecekAy = open.reduce((a, l) => {
    const deger = Number(l.tahminiIlkSatis) || 0
    return Number(l.kapanisOlasiligi) === 50 ? a + deger * 0.5 : a
  }, 0)
  return { pipeline, beklenen, riskli, kesin, mrr, buAy, gelecekAy, pipeline90: pipeline }
}

// Teklif kalemleri toplamı
export function proposalTotal(p) {
  if (p.kalemler?.length) return p.kalemler.reduce((a, k) => a + (Number(k.fiyat) || 0), 0)
  return Number(p.fiyat) || 0
}

// WhatsApp & e-posta hızlı linkleri
export function waLink(telefon, metin = '') {
  const num = String(telefon || '').replace(/[^\d]/g, '')
  if (!num) return null
  return `https://wa.me/${num}${metin ? '?text=' + encodeURIComponent(metin) : ''}`
}

export function mailtoLink(email, konu = '', metin = '') {
  if (!email) return null
  const params = []
  if (konu) params.push('subject=' + encodeURIComponent(konu))
  if (metin) params.push('body=' + encodeURIComponent(metin))
  return `mailto:${email}${params.length ? '?' + params.join('&') : ''}`
}

// Aylık performans (quota takibi): üyenin bu ayki ciro / toplantı / teklif sayısı
export function monthlyPerformance(state, uyeAd) {
  const now = new Date()
  const ayBasi = new Date(now.getFullYear(), now.getMonth(), 1)
  const buAy = (iso) => iso && new Date(iso) >= ayBasi
  const ciro = state.leads
    .filter(l => l.sorumlu === uyeAd && l.status === 'Kazanıldı' &&
      (l.statusHistory || []).some(h => h.to === 'Kazanıldı' && buAy(h.at)))
    .reduce((a, l) => a + (Number(l.tahminiIlkSatis) || 0), 0)
  const leadIds = new Set(state.leads.filter(l => l.sorumlu === uyeAd).map(l => l.id))
  const toplanti = state.meetings.filter(m => leadIds.has(m.leadId) && buAy(m.tarih)).length
  const teklif = state.proposals.filter(p => leadIds.has(p.leadId) && buAy(p.sentAt || p.createdAt) &&
    !['Taslak', 'Hazırlanıyor'].includes(p.status)).length
  return { ciro, toplanti, teklif }
}

// Churn sinyalleri (kural bazlı davranış analizi)
export function riskSignals(customer, lead, payments = []) {
  const out = []
  const gun = (iso) => iso ? Math.floor((Date.now() - new Date(iso)) / 86400000) : null
  const rapor = gun(customer.sonRapor)
  if (rapor === null) out.push('Hiç rapor gönderilmemiş')
  else if (rapor > 35) out.push(`Son rapor ${rapor} gün önce`)
  const toplanti = gun(customer.sonToplanti)
  if (toplanti !== null && toplanti > 45) out.push(`Son toplantı ${toplanti} gün önce`)
  if ((customer.memnuniyet ?? 10) <= 5) out.push(`Memnuniyet düşük (${customer.memnuniyet}/10)`)
  const geciken = payments.some(p => p.leadId === customer.leadId && p.durum === 'Bekliyor' && new Date(p.vade) < Date.now())
  if (geciken) out.push('Geciken ödeme var')
  const score = healthScore(customer)
  if (score < 60) out.push(`Health score düşük (${score}/100)`)
  const renewal = customer.renewalTarihi ? Math.ceil((new Date(customer.renewalTarihi) - Date.now()) / 86400000) : null
  if (renewal !== null && renewal <= 60 && renewal >= 0 && (score < 80 || out.length)) out.push(`Renewal yaklaşıyor (${renewal} gün) ve risk sinyali var`)
  return out
}

// Deal DNA: lead'in kazanılmış deal'lere benzerliği (kendi satış geçmişinden)
export function dealDNA(lead, leads) {
  const closed = leads.filter(l => ['Kazanıldı', 'Kaybedildi'].includes(l.status) && l.id !== lead.id)
  if (closed.length < 5) return null // anlamlı veri eşiği
  const won = closed.filter(l => l.status === 'Kazanıldı')
  if (!won.length) return { benzerlik: 0, n: closed.length }
  const sim = (a, b) => {
    let s = 0, w = 0
    if (a.sektor && b.sektor) { w += 3; if (a.sektor === b.sektor) s += 3 }
    if (a.kaynak && b.kaynak) { w += 3; if (a.kaynak === b.kaynak) s += 3 }
    if (a.buyukluk && b.buyukluk) { w += 2; if (a.buyukluk === b.buyukluk) s += 2 }
    if (a.potansiyelDeger && b.potansiyelDeger) { w += 2; if (a.potansiyelDeger === b.potansiyelDeger) s += 2 }
    return w ? s / w : 0
  }
  const best = Math.max(...won.map(w => sim(lead, w)))
  return { benzerlik: Math.round(best * 100), n: closed.length, kazanilan: won.length }
}

// Kaynak/sektör bazlı kazanma istatistikleri (akıllı skor için)
export function closeStats(leads, keyFn) {
  const stats = {}
  for (const l of leads) {
    if (!['Kazanıldı', 'Kaybedildi'].includes(l.status)) continue
    const k = keyFn(l)
    if (!k) continue
    stats[k] = stats[k] || { won: 0, lost: 0 }
    stats[k][l.status === 'Kazanıldı' ? 'won' : 'lost']++
  }
  return stats
}

// Kazanılmış müşterilerde birlikte görülen hizmet çiftleri (öğrenen cross-sell)
export function crossSellStats(leads) {
  const pairs = {}
  for (const l of leads.filter(x => x.status === 'Kazanıldı')) {
    const h = l.aktifHizmetler || []
    for (let i = 0; i < h.length; i++) {
      for (let j = 0; j < h.length; j++) {
        if (i === j) continue
        pairs[h[i]] = pairs[h[i]] || {}
        pairs[h[i]][h[j]] = (pairs[h[i]][h[j]] || 0) + 1
      }
    }
  }
  return pairs
}

// Rakip analizi — otomatik satış cümleleri
export function competitorSentences(c) {
  const out = []
  if (c.metaReklamAktif) out.push(`Rakibiniz ${c.ad} son dönemde aktif reklam çıkıyor.`)
  if (['İyi', 'Yüksek'].includes(c.googleGorunurluk)) out.push(`${c.ad}, Google'da sizden daha görünür durumda — aramalarda müşteriyi önce o yakalıyor.`)
  if (['İyi', 'Yüksek'].includes(c.seoDurumu)) out.push(`SEO tarafında rakibiniz ${c.ad} belirli kelimelerde sizden daha görünür.`)
  if (['İyi', 'Yüksek'].includes(c.websiteKalitesi)) out.push(`${c.ad} firmasının web sitesi sizinkinden daha hızlı ve dönüşüm odaklı.`)
  if (['İyi', 'Yüksek'].includes(c.sosyalMedyaGucu)) out.push(`Sosyal medyada ${c.ad} sizden daha aktif ve etkileşimi daha yüksek.`)
  if (c.icerikSikligi === 'Sık') out.push(`${c.ad} düzenli içerik üretiyor; bu, uzun vadede organik görünürlük farkını açar.`)
  if (c.zayifYonler) out.push(`Fırsat: ${c.ad} firmasının zayıf noktası — ${c.zayifYonler}. Burada hızlıca öne geçebilirsiniz.`)
  return out
}
