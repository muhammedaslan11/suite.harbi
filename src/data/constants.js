// Pipeline aşamaları — sıralı
export const STAGES = [
  'Yeni Lead',
  'İlk Temas',
  'İhtiyaç Analizi',
  'Toplantı Planlandı',
  'Toplantı Yapıldı',
  'Teklif Hazırlanıyor',
  'Teklif Gönderildi',
  'Takip Bekliyor',
  'Müzakere',
  'Sözleşme Bekleniyor',
  'Ödeme Bekleniyor',
  'Kazanıldı',
  'Kaybedildi',
  'Ertelendi'
]

export const OPEN_STAGES = STAGES.filter(
  s => !['Kazanıldı', 'Kaybedildi', 'Ertelendi'].includes(s)
)

export const SOURCES = [
  'Meta', 'Google', 'Referans', 'Organik', 'Cold Outreach', 'LinkedIn',
  'Website Form', 'WhatsApp', 'Eski Müşteri', 'Etkinlik', 'Diğer'
]

export const SECTORS = [
  'E-Ticaret', 'Sağlık', 'Eğitim', 'İnşaat / Gayrimenkul', 'Turizm', 'Gıda / Restoran',
  'Üretim / Sanayi', 'Hukuk', 'Finans', 'Güzellik / Estetik', 'Otomotiv', 'Mobilya',
  'Tekstil / Moda', 'Teknoloji / SaaS', 'Hizmet', 'Diğer'
]

export const COMPANY_SIZES = ['Mikro (1-9)', 'Küçük (10-49)', 'Orta (50-249)', 'Büyük (250+)']

export const POTENTIAL_VALUES = ['10K+', '25K+', '50K+', '100K+', '250K+']

export const CLOSE_PROBABILITIES = [10, 25, 50, 75, 90]

export const MANUAL_SCORES = ['Sıcak', 'Ilık', 'Soğuk']

export const LOST_REASONS = [
  'Fiyat yüksek',
  'Zamanlama uygun değil',
  'Başka ajansla çalıştı',
  'Güven oluşmadı',
  'Karar vericiye ulaşılamadı',
  'Bütçe yok',
  'İhtiyaç net değil',
  'Cevap vermedi',
  'Diğer'
]

export const SERVICES_LIST = [
  'Meta Ads', 'Google Ads', 'SEO', 'Landing Page', 'Web Tasarım', 'CRM Kurulumu',
  'E-Mail Marketing', 'İçerik Üretimi', 'Sosyal Medya Yönetimi', 'Otomasyon',
  'Branding', 'CRO'
]

export const NEXT_STEPS = [
  'Teklif hazırlanacak', 'Tekrar aranacak', 'Demo yapılacak',
  'Sözleşme gönderilecek', 'Beklemeye alınacak'
]

export const PROPOSAL_STATUSES = [
  'Taslak', 'Hazırlanıyor', 'Gönderildi', 'Görüldü', 'Revize İstendi', 'Kabul Edildi', 'Reddedildi'
]

// Cross-sell / Upsell haritası — müşterinin aldığı hizmete göre öneriler
export const CROSS_SELL_MAP = {
  'Meta Ads': ['Landing Page', 'CRM Kurulumu', 'E-Mail Marketing', 'WhatsApp Otomasyonu', 'CRO', 'Kreatif Paket'],
  'SEO': ['Blog İçeriği', 'Teknik SEO', 'Backlink', 'CRO', 'Landing Page', 'Google Ads'],
  'Web Tasarım': ['SEO', 'Meta Ads', 'Google Ads', 'CRM Kurulumu', 'Analytics Kurulumu', 'E-Mail Marketing'],
  'CRM Kurulumu': ['Satış Otomasyonu', 'E-Mail Marketing', 'WhatsApp Entegrasyonu', 'Dashboard', 'Lead Form Entegrasyonu'],
  'Google Ads': ['Landing Page', 'CRO', 'CRM Kurulumu', 'Remarketing Kurulumu', 'Analytics Kurulumu'],
  'Landing Page': ['Meta Ads', 'Google Ads', 'CRO', 'A/B Test Paketi', 'CRM Kurulumu'],
  'E-Mail Marketing': ['Otomasyon', 'CRM Kurulumu', 'İçerik Üretimi', 'Landing Page'],
  'Sosyal Medya Yönetimi': ['İçerik Üretimi', 'Meta Ads', 'Branding', 'Influencer Kampanyası'],
  'İçerik Üretimi': ['SEO', 'Sosyal Medya Yönetimi', 'E-Mail Marketing'],
  'Otomasyon': ['CRM Kurulumu', 'E-Mail Marketing', 'WhatsApp Entegrasyonu', 'Dashboard'],
  'Branding': ['Web Tasarım', 'Sosyal Medya Yönetimi', 'İçerik Üretimi'],
  'CRO': ['Landing Page', 'A/B Test Paketi', 'Analytics Kurulumu', 'Meta Ads']
}

// Follow-up takvimi (gün, script)
export const FOLLOWUP_SCHEDULE = [
  {
    gun: 1,
    script: 'Merhaba, teklifimizi inceleme fırsatınız oldu mu? Özellikle süreç, kapsam veya fiyat tarafında netleştirmemi istediğiniz bir nokta var mı?'
  },
  {
    gun: 3,
    script: 'Merhaba, karar sürecinizde takıldığınız bir nokta varsa yardımcı olmak isterim. İsterseniz teklif üzerinden birlikte geçebiliriz.'
  },
  {
    gun: 7,
    script: 'Merhaba, bu süreci şu an aktif olarak değerlendirmeye devam ediyor musunuz, yoksa daha ileri bir tarihe mi planlayalım?'
  },
  {
    gun: 14,
    script: 'Merhaba, teklifimizin üzerinden iki hafta geçti. Öncelikleriniz değiştiyse teklifi güncel ihtiyacınıza göre revize edebiliriz. Kısa bir görüşme planlayalım mı?'
  },
  {
    gun: 30,
    script: 'Merhaba, bir süre önce paylaştığımız çalışma hâlâ gündeminizde mi? Bu dönemde piyasada/rakiplerinizde gördüğümüz bazı gelişmeleri de aktarmak isterim.'
  }
]

// Satışçı Yardım Merkezi — hizmete göre dinamik scriptler
export const SALES_SCRIPTS = {
  'Meta Ads': [
    {
      itiraz: '“Reklam denedik sonuç alamadık.”',
      cevap: 'Çoğu işletme aslında reklam vermiyor, sadece kampanya yayınlıyor. Sonuç alamamanızın nedeni genelde reklam kanalından değil; kreatif, teklif, landing page ve dönüşüm takibinden kaynaklanıyor. Biz önce reklamı değil, reklamın satışa dönüşeceği sistemi kuruyoruz.'
    },
    {
      itiraz: '“Reklam bütçemiz zaten yetmiyor.”',
      cevap: 'Sorun genelde bütçenin azlığı değil, bütçenin dönüşmeyen tıklamalara harcanması. Doğru hedefleme ve dönüşüm takibiyle aynı bütçeden daha fazla müşteri çıkarmak mümkün. Önce mevcut harcamanızın nereye gittiğini birlikte görelim.'
    }
  ],
  'SEO': [
    {
      itiraz: '“SEO çok uzun sürüyor.”',
      cevap: 'Evet, SEO kısa vadeli bir satış kanalı değil. Ama doğru kurulduğunda reklam maliyetinizi azaltan, markanıza kalıcı müşteri akışı sağlayan bir varlık haline gelir. Bugün reklama sürekli para vermek zorundasınız; SEO ise zamanla kendi müşteri edinme kanalınızı oluşturur.'
    }
  ],
  'Landing Page': [
    {
      itiraz: '“Web sitemiz zaten var.”',
      cevap: 'Web sitesi ile satış odaklı landing page aynı şey değil. Web sitesi markayı anlatır, landing page tek bir aksiyona odaklanır. Reklamdan gelen kullanıcıyı dağıtmadan başvuruya, randevuya veya satın almaya yönlendirir.'
    }
  ],
  'CRM Kurulumu': [
    {
      itiraz: '“Biz müşteri takibini Excel’den yapıyoruz.”',
      cevap: 'Excel veri tutar ama satış yönetmez. CRM ise hangi müşteriyle ne konuşulduğunu, kimin ne zaman aranacağını, teklifin hangi aşamada olduğunu ve potansiyel geliri görünür hale getirir.'
    }
  ],
  'Google Ads': [
    {
      itiraz: '“Google reklamları çok pahalı.”',
      cevap: 'Google’da pahalı olan tıklama değil, dönüşmeyen tıklamadır. Arama ağında sizi zaten arayan müşteriye ulaşırsınız; doğru anahtar kelime, negatif kelime ve landing page kurgusuyla müşteri edinme maliyeti çoğu kanaldan daha ölçülebilir hale gelir.'
    }
  ],
  'Web Tasarım': [
    {
      itiraz: '“Sitemiz var, yenilemeye gerek yok.”',
      cevap: 'Soru sitenizin olup olmaması değil, satıp satmadığı. Yavaş açılan, mobilde dağılan veya yönlendirmesi olmayan bir site, reklam ve SEO yatırımınızın dönüşümünü düşürür. Biz siteyi vitrin olarak değil, satış aracı olarak kurguluyoruz.'
    }
  ],
  'Sosyal Medya Yönetimi': [
    {
      itiraz: '“Sosyal medyayı kendimiz yönetiyoruz.”',
      cevap: 'İçerik paylaşmak ile sosyal medyayı bir müşteri kazanma kanalına çevirmek farklı işler. Strateji, içerik takvimi, tasarım dili ve performans ölçümü bir arada olduğunda sosyal medya maliyet değil, satış kanalı olur.'
    }
  ]
}

// Delivery Handoff — standart onboarding maddeleri
export const ONBOARDING_ITEMS = [
  'Hoş geldin e-postası gönder',
  'Onboarding formunu doldurt (erişimler, materyaller)',
  'Kickoff toplantısı planla',
  'Erişimleri topla (reklam hesapları, site, analytics)',
  'İletişim kanalı kur (WhatsApp grubu / Slack)',
  'İlk hafta planını paylaş',
  'Raporlama formatını ve tarihlerini bildir'
]

// Rakip analizi seçenekleri
export const COMPETITOR_LEVELS = ['Zayıf', 'Orta', 'İyi', 'Yüksek']
export const CONTENT_FREQ = ['Yok', 'Seyrek', 'Düzenli', 'Sık']

// Görevlerin tipleri
export const TASK_TYPES = {
  ARAMA: 'Arama',
  FOLLOWUP: 'Follow-Up',
  TOPLANTI: 'Toplantı',
  TEKLIF: 'Teklif',
  OPERASYON: 'Operasyon',
  RENEWAL: 'Yenileme',
  GENEL: 'Genel'
}

// Sözleşme yenileme motoru: renewal'a kalan güne göre görev zinciri
export const RENEWAL_CHAIN = [
  { gun: 90, gorev: 'Değer raporu hazırla (yenilemeye 90 gün)' },
  { gun: 60, gorev: 'Yenileme görüşmesi planla (yenilemeye 60 gün)' },
  { gun: 30, gorev: 'Yeni dönem teklifini gönder (yenilemeye 30 gün)' }
]

// Ödeme tipleri
export const PAYMENT_TYPES = ['Peşinat', 'Taksit', 'Retainer', 'Diğer']

// Lead skor ağırlıkları (varsayılan — Ayarlar'dan özelleştirilebilir)
export const DEFAULT_SCORE_WEIGHTS = {
  website: 10,
  reklamAktif: 15,
  instagramAktif: 10,
  linkedinAktif: 5,
  calisan10: 10,
  calisan50: 20,
  kararVericiTemas: 20,
  butceBelirtildi: 15,
  acilIhtiyac: 15,
  toplantiPlanlandi: 20
}

export const SCORE_WEIGHT_LABELS = {
  website: 'Website var',
  reklamAktif: 'Aktif reklam veriyor',
  instagramAktif: 'Instagram aktif',
  linkedinAktif: 'LinkedIn aktif',
  calisan10: 'Çalışan sayısı 10+',
  calisan50: 'Çalışan sayısı 50+',
  kararVericiTemas: 'Karar vericiyle temas',
  butceBelirtildi: 'Bütçe belirtildi',
  acilIhtiyac: 'Acil ihtiyaç',
  toplantiPlanlandi: 'Toplantı planlandı'
}

// Görünüm varsayılanları (Ayarlar → Görünüm & Özelleştirme)
export const DEFAULT_UI = {
  tema: 'koyu',            // koyu | acik
  vurgu: 'lime',           // lime | cyan | violet | amber | rose
  yogunluk: 'rahat',       // rahat | kompakt
  acilisEkrani: 'agenda',  // nav id
  paraBirimi: 'TL',        // TL | ₺ | USD | EUR
  ajansAdi: 'Harbi Digital',
  markaAdi: 'HARB! SUITE',
  modernMod: false,
  gizliModuller: []        // nav id listesi
}

export const ACCENT_COLORS = {
  lime: '#a3e635', mavi: '#0ea5e9', cyan: '#22d3ee', violet: '#a78bfa', amber: '#fbbf24', rose: '#fb7185'
}

// Kanban kolon renkleri (aşama grubuna göre — Bitrix24 tarzı)
export function stageColor(stage) {
  if (stage === 'Kazanıldı') return '#4ade80'
  if (stage === 'Kaybedildi') return '#f87171'
  if (stage === 'Ertelendi') return '#94a3b8'
  const i = STAGES.indexOf(stage)
  if (i <= 2) return '#60a5fa'        // giriş: mavi
  if (i <= 5) return '#22d3ee'        // analiz/toplantı: cyan
  if (i <= 8) return '#fbbf24'        // teklif/müzakere: amber
  return '#a78bfa'                     // sözleşme/ödeme: mor
}

// Navigasyon (App + Ayarlar/modül gizleme + açılış ekranı seçimi bunu kullanır)
export const NAV_ITEMS = [
  { section: 'Satış' },
  { id: 'agenda', label: '☀️ Bugünüm' },
  { id: 'dashboard', label: '📊 KPI Dashboard' },
  { id: 'leads', label: '👥 Lead Yönetimi' },
  { id: 'pipeline', label: '🔀 Pipeline' },
  { id: 'proposals', label: '📄 Teklifler' },
  { id: 'dojo', label: '🥊 Satış Dojo\'su' },
  { section: 'Müşteri' },
  { id: 'customers', label: '❤️ Müşteriler' },
  { section: 'Yönetim' },
  { id: 'command-center', label: '🎛️ Command Center' },
  { id: 'payments', label: '💰 Tahsilat' },
  { section: 'Bilgi Merkezi' },
  { id: 'services', label: '🧰 Hizmet Bilgi Merkezi' },
  { id: 'objections', label: '🛡️ İtiraz Kütüphanesi' },
  { id: 'guide', label: '📖 Rehber' },
  { section: 'Oyunlar' },
  { section: 'Sistem' },
  { id: 'settings', label: '⚙️ Veri & Ayarlar' }
]
