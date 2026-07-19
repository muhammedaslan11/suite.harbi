// AI Satış Koçu — Çevrimdışı Motor
// API gerektirmez: lead bağlamını (aşama, skor, toplantı notları, rakipler, itiraz kütüphanesi,
// cross-sell haritası) kurallarla analiz edip arama planı + itiraz hazırlığı + açılış üretir.
import { OBJECTIONS, SERVICE_CARDS } from './data/seeds.js'
import { leadScore, nextBestSale, competitorSentences } from './utils.js'

export function offlineCoach(lead, meetings = [], competitors = []) {
  const m = meetings[0] // en güncel toplantı
  const skor = leadScore(lead)
  const hizmet = (lead.ilgiHizmetler || [])[0]
  const card = SERVICE_CARDS.find(c => c.ad === hizmet)
  const nbs = nextBestSale(lead)

  // --- Arama planı: aşamaya + eksik bilgiye göre ---
  const plan = []
  const f = lead.flags || {}
  if (!f.kararVericiTemas) plan.push('Önce karar vericiye ulaş — şu an görüştüğün kişi imza sahibi değilse toplantıya karar vericiyi de dahil etmeyi öner (+20 skor).')
  if (m?.satinAlmaEngeli) plan.push(`Satın alma engelini doğrudan masaya koy: "${m.satinAlmaEngeli}" — bu çözülmeden teklif ilerlemez.`)
  if (!f.butceBelirtildi && !m?.butce) plan.push('Bütçe aralığını bu aramada netleştir: "Doğru kapsamı önerebilmem için aylık ayırabileceğiniz aralığı bilmem lazım."')
  switch (lead.status) {
    case 'Yeni Lead':
    case 'İlk Temas':
      plan.push('İlk aramada satma — problemi teşhis et: mevcut durum, hedef ve aciliyeti öğren, 15 dk\'lık analiz toplantısı al.')
      break
    case 'İhtiyaç Analizi':
    case 'Toplantı Planlandı':
      plan.push('Toplantı öncesi rakip analizi sekmesini doldur — görüşmede rakip kıyası en güçlü kozun olacak.')
      break
    case 'Toplantı Yapıldı':
    case 'Teklif Hazırlanıyor':
      plan.push(`Teklifi 48 saat içinde gönder — sıcaklık düşmeden. ${m?.hedef ? `Teklifi müşterinin hedefine bağla: "${m.hedef}"` : 'Teklifi toplantıda konuşulan hedefe bağla.'}`)
      break
    case 'Teklif Gönderildi':
    case 'Takip Bekliyor':
      plan.push('Takip aramasında "incelediniz mi" deme — spesifik sor: "ROI tablosundaki 6 aylık projeksiyon size gerçekçi geldi mi?"')
      break
    case 'Müzakere':
      plan.push('Fiyat inmeden kapsam konuş: indirim isterse kapsamdan kalem çıkar, fiyatı koru.')
      break
    default:
      plan.push('Sonraki somut adımı bu aramada takvime bağla — tarih olmayan söz, kaybedilmiş fırsattır.')
  }
  if ((m?.aciliyet ?? 0) >= 8) plan.push(`Aciliyet ${m.aciliyet}/10 — hızlı başlangıç paketi öner, uzun onay süreçlerine sokma.`)
  if (nbs && lead.status === 'Kazanıldı') plan.push(`Upsell zamanı: ${nbs.oneriler.slice(0, 2).map(o => o.oneri).join(' + ')} önerisini sonuç raporuyla birlikte sun.`)

  // --- Muhtemel itirazlar: bağlama göre kütüphaneden seç ---
  const secilen = []
  const ekle = (baslik) => {
    const o = OBJECTIONS.find(x => x.itiraz === baslik)
    if (o && !secilen.some(s => s.itiraz === o.itiraz)) secilen.push({ itiraz: o.itiraz, cevap: o.cevap, devamSorusu: o.devamSorusu })
  }
  if (!f.butceBelirtildi) { ekle('Çok Pahalı'); ekle('Şu An Bütçemiz Yok') }
  if (['Teklif Gönderildi', 'Takip Bekliyor', 'Müzakere'].includes(lead.status)) ekle('Düşüneceğim')
  if ((m?.satinAlmaEngeli || '').toLowerCase().includes('güven') || (m?.satinAlmaEngeli || '').toLowerCase().includes('deneyim')) ekle('Daha Önce Ajansla Kötü Deneyim Yaşadık')
  if (competitors.length || (m?.rakipler || '').length > 2) ekle('Başka Ajansla Görüşüyoruz')
  ekle('Sonuç Garantisi Veriyor musunuz?')
  ekle('Düşüneceğim')

  // --- Açılış cümlesi: hizmet kartı + kişiselleştirme ---
  let acilis
  if (card) {
    acilis = `${lead.yetkili ? lead.yetkili.split(' ')[0] + ' Bey/Hanım, ' : ''}${card.acilisCumlesi}`
    if (m?.problem) acilis += ` Geçen görüşmede bahsettiğiniz "${m.problem.slice(0, 60)}${m.problem.length > 60 ? '…' : ''}" konusuna tam bu noktadan çözüm getiriyoruz.`
  } else {
    acilis = `${lead.firma} için hazırladığımız büyüme yaklaşımını 10 dakikada özetlemek istiyorum — ${lead.sektor || 'sektörünüzde'} benzer firmalarla aldığımız sonuçlar üzerinden konuşalım.`
  }

  // --- Rakip kozu: varsa plana ekle ---
  const rakipKozu = competitors.flatMap(c => competitorSentences(c))[0]
  if (rakipKozu) plan.push(`Rakip kozu: "${rakipKozu}"`)

  // --- Kaçınılacak hata: aşamaya göre ---
  const hatalar = {
    'Yeni Lead': 'İlk temasta fiyat söyleme — önce değer, sonra rakam.',
    'İlk Temas': 'Monolog yapma; konuşmanın %70\'i müşteride olsun.',
    'Teklif Gönderildi': 'Sessiz kalıp beklemek — teklif gönderdikten sonra takip planına harfiyen uy.',
    'Müzakere': 'Karşılıksız indirim verme; her taviz karşılığında bir şey iste (süre, referans, peşin ödeme).',
    'Kazanıldı': 'Satış bitti diye iletişimi operasyona bırakıp kaybolma — ilk 30 gün güven penceresidir.'
  }
  const kacinilacakHata = hatalar[lead.status] || 'Sonraki adımı tarihe bağlamadan telefonu kapatma.'

  return {
    aramaPlani: plan.slice(0, 4),
    muhtemelItirazlar: secilen.slice(0, 3).map(o => ({ itiraz: o.itiraz, cevap: o.cevap + ' → ' + o.devamSorusu })),
    acilisCumlesi: acilis,
    kacinilacakHata,
    _skorNotu: skor < 40 ? `Skor düşük (${skor}/100) — skor kriterlerindeki eksikleri (karar verici, bütçe, aciliyet) bu aramada kapatmaya odaklan.` : null
  }
}
