// Satış Dojo'su — Çevrimdışı Müşteri Motoru
// API anahtarı gerektirmez: itiraz kütüphanesini kullanarak müşteri rolü oynar,
// cevapları sezgisel kurallarla (anahtar kelime örtüşmesi, devam sorusu, kapanış sinyali) değerlendirir.

const STOPWORDS = new Set(['bir', 've', 'ile', 'için', 'daha', 'ama', 'bu', 'da', 'de', 'mi', 'mı', 'ne', 'olarak', 'gibi', 'çok', 'en', 'her', 'size', 'sizin', 'bize', 'biz', 'ben', 'sen', 'o', 'şu', 'ki', 'ya', 'veya', 'değil', 'olur', 'olan', 'sonra', 'önce', 'kadar', 'göre'])

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// İtiraz başlığını doğal müşteri cümlesine çevir
const OPENING_PHRASES = {
  'Çok Pahalı': ['Açık konuşayım, fiyatlarınız bize pahalı geldi. Bu bütçeyi ayırmakta zorlanırız.', 'Teklifinize baktık ama rakamlar beklediğimizin epey üzerinde.'],
  'Düşüneceğim': ['Her şey güzel de… biz bir düşünelim, size döneriz.', 'Şu an karar veremem, düşünmem lazım.'],
  'Başka Ajansla Görüşüyoruz': ['Dürüst olayım, iki ajansla daha görüşüyoruz. Sizi neden seçelim?', 'Başka tekliflerimiz de var, karşılaştırıyoruz.'],
  'Şu An Bütçemiz Yok': ['Bu dönem bütçemiz yok, belki seneye bakarız.', 'Kaynaklarımız şu an başka önceliklere ayrılmış durumda.'],
  'Daha Önce Ajansla Kötü Deneyim Yaşadık': ['Daha önce bir ajansla çalıştık ve paramız boşa gitti. Neden size güvenelim?', 'Ajans deyince tüylerimiz diken diken oluyor, kötü tecrübemiz var.'],
  'Kendi Ekibimiz Var': ['Bizim zaten sosyal medyacımız var, neden dışarıdan destek alalım?', 'İçeride ekibimiz bu işleri yürütüyor zaten.'],
  'Sonuç Garantisi Veriyor musunuz?': ['Peki sonuç garantisi veriyor musunuz? Vermiyorsanız neden risk alalım?', 'Bu paranın karşılığını alacağımızı bana kim garanti edecek?']
}

const ACK_GOOD = ['Hmm… bu açıdan bakmamıştım aslında.', 'Mantıklı söylüyorsunuz, devam edin.', 'Tamam, bu cevap fena değildi.', 'Anlıyorum, bu yaklaşım hoşuma gitti.']
const PUSHBACK = ['Bunu her ajans söylüyor ama. Beni gerçekten ikna edecek somut bir şey söyleyin.', 'Bu cevap bana biraz ezber geldi açıkçası.', 'Tam ikna olmadım. Biraz daha net olabilir misiniz?', 'Güzel laflar ama ben rakam ve somutluk isterim.']
const BUYING_SIGNALS = ['Peki… diyelim ki ikna oldum. Somut olarak nasıl başlıyoruz, süreç ne?', 'Tamam, ilgimi çekti. Bundan sonraki adım ne olur?']
const CLOSING_ACCEPT = ['Anlaştık. Önümüzdeki hafta için bir toplantı ayarlayalım, detayları orada konuşalım. 🤝', 'Tamam, teklifi gönderin, ortağımla değerlendirip bu hafta dönüş yapalım. 👍']
const CLOSING_NUDGE = ['Ben hazırım aslında… siz bana ne öneriyorsunuz şimdi?', 'E peki, nasıl ilerleyelim? Somut bir adım önerin bana.']

const CLOSING_KEYWORDS = ['toplantı', 'görüşelim', 'başlayalım', 'planlayalım', 'teklif', 'sözleşme', 'randevu', 'takvim', 'demo', 'arayalım', 'gönderelim', 'ayarlayalım']
const EMPATHY_WORDS = ['anlıyorum', 'haklısınız', 'çok normal', 'doğal', 'sizi', 'anladım', 'kesinlikle']

function keywords(text) {
  return (text || '').toLowerCase().replace(/[^a-zçğıöşü0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
}

// Cevap kalitesi 0..1 — itiraz kütüphanesindeki ideal cevapla örtüşme + teknik sinyaller
export function evaluateAnswer(answer, objection) {
  const a = (answer || '').toLowerCase()
  let score = 0
  // 1) Uzunluk: tek kelimelik cevap satış değildir
  if (a.length >= 40) score += 0.2
  if (a.length >= 100) score += 0.1
  // 2) İdeal cevapla anahtar kelime örtüşmesi
  const ideal = new Set([...keywords(objection.cevap), ...keywords(objection.devamSorusu)])
  const mine = keywords(a)
  const overlap = mine.filter(w => ideal.has(w)).length
  score += Math.min(0.35, overlap * 0.07)
  // 3) Devam sorusu — topu müşteriye geri atmak
  if (a.includes('?')) score += 0.2
  // 4) Empati açılışı
  if (EMPATHY_WORDS.some(w => a.includes(w))) score += 0.1
  // 5) Kötü refleksler: hemen indirim vermek
  if (a.includes('indirim') || a.includes('ucuzlat')) score -= 0.25
  return Math.max(0, Math.min(1, score))
}

export function createOfflineSession(objections, zorluk) {
  const esik = zorluk.startsWith('Kolay') ? 0.32 : zorluk.startsWith('Zor') ? 0.58 : 0.45
  return { queue: [...objections], idx: 0, retried: false, qualities: [], closingTur: 0, phase: 'objection', esik }
}

export function offlineOpening(session) {
  const obj = session.queue[0]
  const phrases = OPENING_PHRASES[obj.itiraz]
  return 'Merhaba, buyrun dinliyorum. ' + (phrases ? pick(phrases) : `Açıkçası bir çekincem var: ${obj.neDemek.replace(/"/g, '')}`)
}

// Satışçının cevabına müşteri tepkisi üret; session'ı ilerlet
export function offlineReply(session, answer) {
  if (session.phase === 'closing') {
    session.closingTur++
    const kapanisDenedi = CLOSING_KEYWORDS.some(k => answer.toLowerCase().includes(k))
    if (kapanisDenedi || session.closingTur >= 2) {
      session.phase = 'done'
      return { metin: pick(CLOSING_ACCEPT), done: true }
    }
    return { metin: pick(CLOSING_NUDGE) }
  }

  const obj = session.queue[session.idx]
  const q = evaluateAnswer(answer, obj)
  session.qualities.push(q)

  if (q >= session.esik || session.retried) {
    // İkna oldu (veya ikinci denemede geç) → sıradaki itiraza veya kapanışa
    session.retried = false
    session.idx++
    if (session.idx < session.queue.length) {
      const next = session.queue[session.idx]
      const phrases = OPENING_PHRASES[next.itiraz]
      return { metin: pick(ACK_GOOD) + ' Ama bir konu daha var… ' + (phrases ? pick(phrases) : next.itiraz) }
    }
    session.phase = 'closing'
    return { metin: pick(ACK_GOOD) + ' ' + pick(BUYING_SIGNALS) }
  }
  // İkna olmadı → aynı itirazda diren (tek sefer)
  session.retried = true
  return { metin: pick(PUSHBACK) }
}

export function offlineIdeal(session) {
  const obj = session.phase === 'closing'
    ? null
    : session.queue[Math.min(session.idx, session.queue.length - 1)]
  if (!obj) return 'Net bir sonraki adım önerin: "O zaman salı 14:00\'te 20 dakikalık bir toplantı planlayalım; size özel planı orada göstereyim." '
  return obj.cevap + ' ' + obj.devamSorusu
}

const TIPS = {
  itirazKarsilama: ['İtirazı geçiştirme: önce kabul et ("çok haklısınız"), sonra çerçeveyi değiştir (maliyet → yatırım).', 'İtiraz kütüphanesindeki "müşteri ne demek istiyor" satırını ezberle — itirazın altındaki gerçek endişeye cevap ver.'],
  devamSorusu: ['Her cevabını bir soruyla bitir — topu müşteride bırakma, sen yönet.', 'Devam sorusu sormadan susarsan müşteri "düşüneceğim" der. Soru = kontrol.'],
  kapanisDenemesi: ['Görüşmeyi somut bir adımla kapat: tarih ver, toplantı öner, teklif sözü al.', 'Alım sinyali geldiğinde ("nasıl başlıyoruz?") anlatmaya devam etme — hemen takvim öner.'],
  tonGuven: ['Cevapların çok kısa; 2-4 cümlelik, örnekli cevaplar güven verir.', 'Empatiyle başla: "anlıyorum / çok normal" — sonra pozisyonunu anlat.']
}

export function offlineScore(session, mesajlar) {
  const satisci = mesajlar.filter(m => m.rol === 'satisci').map(m => m.metin)
  const ortKalite = session.qualities.length ? session.qualities.reduce((a, b) => a + b, 0) / session.qualities.length : 0
  const itirazKarsilama = Math.round(ortKalite * 25)
  const soruOrani = satisci.length ? satisci.filter(m => m.includes('?')).length / satisci.length : 0
  const devamSorusu = Math.round(Math.min(1, soruOrani * 1.4) * 25)
  const kapanisDenedi = satisci.some(m => CLOSING_KEYWORDS.some(k => m.toLowerCase().includes(k)))
  const kapanisDenemesi = session.phase === 'done' ? 25 : kapanisDenedi ? 17 : 5
  const ortUzunluk = satisci.length ? satisci.reduce((a, m) => a + m.length, 0) / satisci.length : 0
  const empati = satisci.some(m => EMPATHY_WORDS.some(w => m.toLowerCase().includes(w)))
  let tonGuven = 8
  if (ortUzunluk >= 40) tonGuven += 7
  if (ortUzunluk >= 90) tonGuven += 4
  if (empati) tonGuven += 6
  tonGuven = Math.min(25, tonGuven)

  const skorlar = { itirazKarsilama, devamSorusu, kapanisDenemesi, tonGuven }
  const oneriler = Object.entries(skorlar)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([k]) => pick(TIPS[k]))
  return { ...skorlar, oneriler }
}
