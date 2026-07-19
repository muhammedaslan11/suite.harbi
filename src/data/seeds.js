// Hizmet Bilgi Merkezi — her hizmet için satışçının ihtiyaç duyduğu her şey
export const SERVICE_CARDS = [
  {
    id: 'meta-ads',
    ad: 'Meta Ads',
    kategori: 'Performans Pazarlama',
    neSatiyoruz: 'Satış ve lead odaklı reklam sistemi. Kampanya değil; hedefleme, kreatif, teklif ve dönüşüm takibi bir arada.',
    kimeSatiyoruz: 'Aktif ürün/hizmet satan, müşteri edinmek isteyen işletmelere.',
    problem: 'Reklam harcanıyor ama dönüşüm alınamıyor; harcamanın nereye gittiği görünmüyor.',
    sonuc: 'Ölçülebilir lead, satış ve dönüşüm sistemi. Müşteri edinme maliyeti görünür hale gelir.',
    teslimSuresi: '7-14 gün kurulum',
    roi: 'İlk 60-90 günde reklam getirisinin (ROAS) ölçülebilir hale gelmesi, 3. aydan itibaren optimizasyonla maliyet düşüşü.',
    onKosullar: 'Çalışan bir landing page / site, dönüşüm takibi (Pixel + CAPI), net bir teklif.',
    acilisCumlesi: 'Reklamı değil, reklamın satışa dönüşeceği sistemi kuruyoruz. Önce mevcut hesabınızın neden dönüşmediğine birlikte bakalım.',
    sikItirazlar: ['Reklam denedik sonuç alamadık', 'Bütçemiz küçük', 'Ajansla kötü deneyimimiz oldu'],
    crossSell: ['Landing Page', 'CRM Kurulumu', 'WhatsApp Otomasyonu', 'E-Mail Marketing'],
    upsell: ['Kreatif üretimi', 'CRO', 'Funnel danışmanlığı'],
    caseStudy: 'E-ticaret müşterisinde 90 günde ROAS 1.8 → 4.2; aynı bütçeyle aylık sipariş sayısı 2.3 katına çıktı.',
    checklist: ['Pixel + CAPI kurulumu', 'Hedef kitle ve funnel yapısı', 'Kreatif set (min. 6 varyasyon)', 'Kampanya yapısı ve bütçe planı', 'Haftalık optimizasyon rutini', 'Raporlama dashboard\'u']
  },
  {
    id: 'google-ads',
    ad: 'Google Ads',
    kategori: 'Performans Pazarlama',
    neSatiyoruz: 'Arama, alışveriş ve YouTube reklamlarıyla "zaten arayan" müşteriyi yakalayan sistem.',
    kimeSatiyoruz: 'Hizmeti/ürünü aktif olarak aranan işletmelere (yerel hizmet, e-ticaret, B2B).',
    problem: 'Sizi arayan müşteri rakibe gidiyor; ya da tıklama var, satış yok.',
    sonuc: 'Yüksek niyetli trafikten ölçülebilir lead ve satış.',
    teslimSuresi: '5-10 gün kurulum',
    roi: 'Arama ağında ilk 30 günde lead akışı, 60-90 günde maliyet optimizasyonu.',
    onKosullar: 'Dönüşüm takibi, telefon/form altyapısı, landing page.',
    acilisCumlesi: 'Google\'da müşteri yaratmıyoruz; sizi zaten arayan müşteriyi rakibinizden önce yakalıyoruz.',
    sikItirazlar: ['Tıklama pahalı', 'Daha önce denedik para gitti'],
    crossSell: ['Landing Page', 'CRO', 'CRM Kurulumu', 'Analytics Kurulumu'],
    upsell: ['Remarketing', 'YouTube kampanyaları', 'Alışveriş feed optimizasyonu'],
    caseStudy: 'Diş kliniğinde tık başı maliyet aynı kalırken randevu maliyeti %47 düştü (negatif kelime + LP değişimi).',
    checklist: ['Dönüşüm takibi kurulumu', 'Anahtar kelime + negatif kelime seti', 'Kampanya yapısı', 'Reklam metinleri', 'Landing page eşleşmesi', 'Haftalık optimizasyon']
  },
  {
    id: 'seo',
    ad: 'SEO',
    kategori: 'Organik Büyüme',
    neSatiyoruz: 'Reklama bağımlılığı azaltan, kalıcı organik müşteri akışı kuran varlık.',
    kimeSatiyoruz: 'Orta-uzun vadeli düşünen, kategorisinde aranma hacmi olan markalara.',
    problem: 'Tüm müşteri akışı reklama bağımlı; reklam durunca satış duruyor.',
    sonuc: 'Zamanla büyüyen, tıklama başına para ödenmeyen müşteri edinme kanalı.',
    teslimSuresi: 'Kurulum 30 gün, ilk sonuçlar 3-6 ay',
    roi: '6-12 ayda organik trafiğin reklam maliyetine denk gelen kısmı net kazanca döner.',
    onKosullar: 'Teknik olarak müdahale edilebilir bir site, içerik üretim kapasitesi.',
    acilisCumlesi: 'Reklam kiralık trafik, SEO ise tapulu trafik. Bugün başlamazsanız 6 ay sonra da aynı yerde olursunuz.',
    sikItirazlar: ['Çok uzun sürüyor', 'Sonuç garantisi var mı'],
    crossSell: ['Blog İçeriği', 'Teknik SEO', 'CRO', 'Google Ads'],
    upsell: ['İçerik paketi büyütme', 'Digital PR / Backlink', 'Yerel SEO'],
    caseStudy: 'Mobilya markasında 8 ayda organik trafik 3.1x; organikten gelen ciro reklam cirosunu geçti.',
    checklist: ['Teknik SEO denetimi', 'Anahtar kelime haritası', 'İçerik takvimi', 'On-page optimizasyon', 'Otorite / backlink planı', 'Aylık rapor']
  },
  {
    id: 'landing-page',
    ad: 'Landing Page',
    kategori: 'Dönüşüm',
    neSatiyoruz: 'Tek aksiyona odaklı, reklam trafiğini başvuruya/satışa çeviren sayfa.',
    kimeSatiyoruz: 'Reklam veren ama dönüşüm alamayan tüm işletmelere.',
    problem: 'Reklamdan gelen kullanıcı dağınık web sitesinde kayboluyor.',
    sonuc: 'Aynı reklam bütçesinden daha fazla başvuru/satış (dönüşüm oranı artışı).',
    teslimSuresi: '5-10 gün',
    roi: 'Dönüşüm oranında tipik %30-100 artış; reklam maliyetine doğrudan etki.',
    onKosullar: 'Net teklif, görsel materyal, form/WhatsApp hedefi.',
    acilisCumlesi: 'Web sitesi markayı anlatır, landing page sattırır. Reklam bütçenizin karşılığını alan sayfayı kuruyoruz.',
    sikItirazlar: ['Web sitemiz zaten var'],
    crossSell: ['Meta Ads', 'Google Ads', 'CRM Kurulumu'],
    upsell: ['A/B test paketi', 'CRO danışmanlığı', 'Ek varyasyon sayfaları'],
    caseStudy: 'Estetik kliniğinde site yerine LP\'ye dönen trafikte form dönüşümü %2.1 → %6.8.',
    checklist: ['Teklif ve mesaj kurgusu', 'Wireframe + tasarım', 'Mobil optimizasyon', 'Form / WhatsApp entegrasyonu', 'Hız optimizasyonu', 'Dönüşüm takibi']
  },
  {
    id: 'web-tasarim',
    ad: 'Web Tasarım',
    kategori: 'Altyapı',
    neSatiyoruz: 'Satış aracı olarak kurgulanmış, hızlı ve dönüşüm odaklı kurumsal site.',
    kimeSatiyoruz: 'Sitesi eski, yavaş veya dönüşüm üretmeyen markalara; yeni kurulan işletmelere.',
    problem: 'Site vitrin gibi duruyor; güven vermiyor, aksiyon aldırmıyor.',
    sonuc: 'Marka algısı + dönüşüm altyapısı; tüm pazarlama kanallarının zemini.',
    teslimSuresi: '15-30 gün',
    roi: 'Tüm kanalların (reklam, SEO, sosyal) dönüşümünü kaldıran temel yatırım.',
    onKosullar: 'Marka kimliği, içerik ve görsel materyal.',
    acilisCumlesi: 'Sitenizin olması yetmez; satması gerekir. Biz siteyi satış ekibinizin ilk üyesi gibi kurguluyoruz.',
    sikItirazlar: ['Sitemiz var, gerek yok', 'Tanıdık yapıyor daha ucuza'],
    crossSell: ['SEO', 'Meta Ads', 'Google Ads', 'Analytics Kurulumu'],
    upsell: ['Blog altyapısı', 'Çoklu dil', 'Bakım / güvenlik paketi'],
    caseStudy: 'B2B üretici sitesi yenilendikten sonra teklif formu başvuruları ayda 4\'ten 23\'e çıktı.',
    checklist: ['Sitemap + wireframe', 'Tasarım onayı', 'Geliştirme', 'İçerik girişi', 'SEO temel kurulum', 'Hız + mobil test', 'Yayın + eğitim']
  },
  {
    id: 'crm-kurulumu',
    ad: 'CRM Kurulumu',
    kategori: 'Satış Altyapısı',
    neSatiyoruz: 'Lead\'den satışa tüm süreci görünür kılan satış yönetim sistemi.',
    kimeSatiyoruz: 'Lead akışı olan ama takibi Excel/WhatsApp\'ta kaybolan işletmelere.',
    problem: 'Lead\'ler takipsiz kalıyor, kim ne konuştu bilinmiyor, satış tahmin edilemiyor.',
    sonuc: 'Takip kaçmaz, pipeline ve potansiyel gelir görünür olur, satış süreci yönetilebilir hale gelir.',
    teslimSuresi: '7-14 gün kurulum + eğitim',
    roi: 'Kaçan follow-up\'ların geri kazanılması tek başına sistemi amorti eder; tipik %15-30 kapanış artışı.',
    onKosullar: 'Tanımlı satış süreci, ekip kullanım taahhüdü.',
    acilisCumlesi: 'Excel veri tutar, CRM satış yönetir. Kaç lead\'inizin takipsizlikten öldüğünü hiç ölçtünüz mü?',
    sikItirazlar: ['Excel bize yetiyor', 'Ekip kullanmaz'],
    crossSell: ['Satış Otomasyonu', 'E-Mail Marketing', 'WhatsApp Entegrasyonu', 'Lead Form Entegrasyonu'],
    upsell: ['Dashboard / raporlama', 'Otomasyon senaryoları', 'Ekip eğitimi paketi'],
    caseStudy: 'Danışmanlık firmasında CRM sonrası unutulan follow-up oranı %38 → %4; kapanış oranı %11 → %19.',
    checklist: ['Pipeline tasarımı', 'Alan ve kart yapısı', 'Lead kaynak entegrasyonları', 'Otomasyon kuralları', 'Raporlama ekranı', 'Ekip eğitimi']
  },
  {
    id: 'email-marketing',
    ad: 'E-Mail Marketing',
    kategori: 'Retention / Nurture',
    neSatiyoruz: 'Mevcut liste ve müşterilerden tekrar satış üreten otomasyon sistemi.',
    kimeSatiyoruz: 'Müşteri/lead listesi biriken ama işlemeyen markalara (özellikle e-ticaret).',
    problem: 'Bir kez alan müşteri geri gelmiyor; liste ölü yatıyor.',
    sonuc: 'Reklamsız, düzenli tekrar satış geliri (e-ticarette cironun %15-25\'i).',
    teslimSuresi: '10-15 gün kurulum',
    roi: 'Liste büyüklüğüne göre ilk 30 günde ölçülebilir ek ciro.',
    onKosullar: 'İzinli liste, e-posta altyapısı, ürün/hizmet çeşitliliği.',
    acilisCumlesi: 'En ucuz müşteri, zaten sizden almış müşteridir. O listeyi paraya çevirmiyorsanız her ay ciro bırakıyorsunuz.',
    sikItirazlar: ['Mail kimse okumuyor', 'Spam oluruz'],
    crossSell: ['Otomasyon', 'CRM Kurulumu', 'İçerik Üretimi'],
    upsell: ['Segmentasyon paketi', 'A/B test', 'SMS/WhatsApp kanalı ekleme'],
    caseStudy: 'E-ticaret markasında flow kurulumu sonrası e-posta cirosu toplam cironun %4\'ünden %19\'una çıktı.',
    checklist: ['Altyapı + domain doğrulama', 'Liste temizliği + segmentasyon', 'Hoş geldin / sepet / geri kazanım flow\'ları', 'Kampanya takvimi', 'Raporlama']
  },
  {
    id: 'sosyal-medya',
    ad: 'Sosyal Medya Yönetimi',
    kategori: 'Marka / İçerik',
    neSatiyoruz: 'Strateji, içerik ve ölçümü bir arada yürüten marka görünürlük sistemi.',
    kimeSatiyoruz: 'Görünürlüğü ve güveni satışa çevirmek isteyen B2C ağırlıklı markalara.',
    problem: 'Hesaplar düzensiz, içerik satışa hizmet etmiyor, marka güven vermiyor.',
    sonuc: 'Tutarlı marka dili, artan etkileşim ve reklamları besleyen organik zemin.',
    teslimSuresi: 'İlk takvim 7 gün, sürekli hizmet',
    roi: 'Reklam kreatif maliyetinin düşmesi + organik lead; 90 günde ölçülebilir etkileşim artışı.',
    onKosullar: 'Görsel materyal akışı, onay süreci, marka kimliği.',
    acilisCumlesi: 'İçerik paylaşmakla sosyal medyayı satış kanalına çevirmek farklı işler; biz ikincisini yapıyoruz.',
    sikItirazlar: ['Kendimiz yönetiyoruz', 'Sosyal medyadan müşteri gelmez'],
    crossSell: ['İçerik Üretimi', 'Meta Ads', 'Branding'],
    upsell: ['Video/Reels paketi', 'Influencer işbirliği', 'Topluluk yönetimi'],
    caseStudy: 'Restoran zincirinde 4 ayda takipçi 2.4x, rezervasyon DM\'leri haftalık 15 → 70.',
    checklist: ['Strateji + rakip analizi', 'İçerik takvimi', 'Tasarım şablonları', 'Yayın + topluluk yönetimi', 'Aylık performans raporu']
  }
]

// İtiraz Kütüphanesi
export const OBJECTIONS = [
  {
    id: 'cok-pahali',
    itiraz: 'Çok Pahalı',
    neDemek: '"Risk görüyorum, geri dönüşten emin değilim."',
    cevap: 'Fiyatı tek başına değil, yatırımın geri dönüşüyle değerlendirmek daha doğru olur. Eğer bu sistem size aylık yeni müşteri, daha düşük reklam maliyeti veya daha düzenli satış süreci kazandıracaksa maliyet değil yatırım olur.',
    devamSorusu: 'Bu yatırımın sizin için mantıklı olması adına kaç yeni müşteri getirmesi gerekir?',
    kapanis: 'O sayıya birlikte ulaşılabilir bir plan çıkaralım; rakam mantıklıysa başlayalım.'
  },
  {
    id: 'dusunecegim',
    itiraz: 'Düşüneceğim',
    neDemek: '"Tam ikna olmadım veya karar kriterim net değil."',
    cevap: 'Elbette düşünebilirsiniz. Sadece daha doğru yardımcı olabilmem için sorayım: Karar vermeden önce hangi konuda netleşmeniz gerekiyor? Fiyat mı, süreç mi, sonuçlar mı, güven mi?',
    devamSorusu: 'Netleşmeniz gereken konuyu birlikte şimdi kapatalım mı?',
    kapanis: 'O zaman şu konuyu netleştirip kararı bugün kolaylaştıralım.'
  },
  {
    id: 'baska-ajans',
    itiraz: 'Başka Ajansla Görüşüyoruz',
    neDemek: '"Karşılaştırma yapıyorum; beni fiyat dışında bir şeyle ikna et."',
    cevap: 'Bu çok normal. Zaten doğru karar vermek için karşılaştırma yapmanız gerekir. Ben size sadece hizmet listesi değil, nasıl büyüme sistemi kuracağımızı gösterebilirim. Böylece bizi fiyatla değil stratejiyle kıyaslayabilirsiniz.',
    devamSorusu: 'Diğer ajanslarla kıyaslarken sizin için en önemli kriter ne?',
    kapanis: 'O kritere göre somut planımızı görün, kararınızı öyle verin.'
  },
  {
    id: 'butce-yok',
    itiraz: 'Şu An Bütçemiz Yok',
    neDemek: '"Öncelik listemde değil / değeri göremedim."',
    cevap: 'Anlıyorum. Bütçe genelde yokluktan değil, öncelikten kaynaklanır. Bu çalışma müşteri kazandıran bir sistem kurduğu için gider kalemi değil, gelir kalemi olarak düşünülmeli. İsterseniz daha küçük kapsamla başlayıp sonucu görerek büyütelim.',
    devamSorusu: 'Hangi aylık seviye sizin için risksiz bir başlangıç olur?',
    kapanis: 'O seviyeye uygun bir başlangıç paketi hazırlayayım, sonuçla büyütelim.'
  },
  {
    id: 'kotu-deneyim',
    itiraz: 'Daha Önce Ajansla Kötü Deneyim Yaşadık',
    neDemek: '"Güvenim kırıldı; aynı filmi tekrar izlemek istemiyorum."',
    cevap: 'Bu sektörde en sık duyduğumuz cümle bu ve haklısınız. Kötü deneyimlerin ortak noktası genelde belirsiz kapsam, ölçümsüz iş ve raporsuz süreçtir. Biz her ay neyi neden yaptığımızı ve ne sonuç verdiğini rakamla gösteriyoruz; memnun kalmazsanız uzun taahhüde mecbur kalmıyorsunuz.',
    devamSorusu: 'Önceki ajansla en çok hangi konuda sorun yaşadınız?',
    kapanis: 'O sorunun bizde nasıl çözüldüğünü ilk 30 günde size kanıtlayalım.'
  },
  {
    id: 'ekibimiz-var',
    itiraz: 'Kendi Ekibimiz Var',
    neDemek: '"Mevcut düzeni bozmak istemiyorum / ekibimi korumak istiyorum."',
    cevap: 'Harika, bu bizim için avantaj. Biz ekibinizin yerine geçmiyoruz; strateji, sistem ve uzmanlık gerektiren alanlarda ekibinizi güçlendiriyoruz. En iyi sonuçları iç ekip + ajans birlikte çalıştığında alıyoruz.',
    devamSorusu: 'Ekibinizin en çok zorlandığı veya vakit bulamadığı alan hangisi?',
    kapanis: 'O alanı biz üstlenelim, ekibiniz asıl işine odaklansın.'
  },
  {
    id: 'sonuc-garantisi',
    itiraz: 'Sonuç Garantisi Veriyor musunuz?',
    neDemek: '"Riski paylaşmak istiyorum; boşa para harcamaktan korkuyorum."',
    cevap: 'Kimse pazarda satış rakamı garanti edemez; eden varsa sorgulamanızı öneririm. Bizim garanti ettiğimiz şey süreç: net kapsam, düzenli raporlama, veriye dayalı optimizasyon. Hedefleri birlikte koyar, ilerlemeyi şeffaf ölçeriz.',
    devamSorusu: 'Sizin için "başarılı geçti" diyeceğiniz 3 aylık sonuç ne olurdu?',
    kapanis: 'O hedefi plana yazalım ve her ay ilerlemesini birlikte ölçelim.'
  }
]

// Demo verisi — sistemi dolu görmek için
export function demoData(now = Date.now()) {
  const d = (days) => new Date(now + days * 86400000).toISOString()
  return {
    leads: [
      {
        id: 'L-1001', firma: 'Nova Mobilya', yetkili: 'Serkan Aydın', pozisyon: 'Genel Müdür',
        telefon: '+90 532 111 22 33', email: 'serkan@novamobilya.com', website: 'novamobilya.com',
        instagram: '@novamobilya', linkedin: '', sehir: 'İstanbul', ulke: 'Türkiye',
        sektor: 'Mobilya', calisanSayisi: 45, tahminiCiro: '40M TL', buyukluk: 'Küçük (10-49)',
        kaynak: 'Meta', manuelSkor: 'Sıcak',
        flags: { reklamAktif: true, instagramAktif: true, linkedinAktif: false, kararVericiTemas: true, butceBelirtildi: true, acilIhtiyac: false },
        potansiyelDeger: '100K+', tahminiIlkSatis: 85000, tahminiRetainer: 45000, upsellPotansiyeli: 'Yüksek',
        kapanisOlasiligi: 75, status: 'Teklif Gönderildi', ilgiHizmetler: ['Meta Ads', 'Landing Page'],
        sorumlu: 'Hüseyin', kayipSebebi: '', aktifHizmetler: [], createdAt: d(-12), statusHistory: []
      },
      {
        id: 'L-1002', firma: 'Denta Plus Klinik', yetkili: 'Dr. Elif Kara', pozisyon: 'Kurucu Ortak',
        telefon: '+90 533 444 55 66', email: 'elif@dentaplus.com', website: 'dentaplus.com',
        instagram: '@dentaplusklinik', linkedin: 'dentaplus', sehir: 'Ankara', ulke: 'Türkiye',
        sektor: 'Sağlık', calisanSayisi: 18, tahminiCiro: '15M TL', buyukluk: 'Küçük (10-49)',
        kaynak: 'Google', manuelSkor: 'Sıcak',
        flags: { reklamAktif: false, instagramAktif: true, linkedinAktif: true, kararVericiTemas: true, butceBelirtildi: false, acilIhtiyac: true },
        potansiyelDeger: '50K+', tahminiIlkSatis: 60000, tahminiRetainer: 30000, upsellPotansiyeli: 'Orta',
        kapanisOlasiligi: 50, status: 'Toplantı Yapıldı', ilgiHizmetler: ['Google Ads', 'Web Tasarım'],
        sorumlu: 'Hüseyin', kayipSebebi: '', aktifHizmetler: [], createdAt: d(-8), statusHistory: []
      },
      {
        id: 'L-1003', firma: 'Trendline Tekstil', yetkili: 'Murat Şen', pozisyon: 'Pazarlama Müdürü',
        telefon: '+90 542 777 88 99', email: 'murat@trendline.com.tr', website: 'trendline.com.tr',
        instagram: '@trendlinetekstil', linkedin: 'trendline-tekstil', sehir: 'Bursa', ulke: 'Türkiye',
        sektor: 'Tekstil / Moda', calisanSayisi: 120, tahminiCiro: '150M TL', buyukluk: 'Orta (50-249)',
        kaynak: 'Referans', manuelSkor: 'Ilık',
        flags: { reklamAktif: true, instagramAktif: true, linkedinAktif: true, kararVericiTemas: false, butceBelirtildi: false, acilIhtiyac: false },
        potansiyelDeger: '250K+', tahminiIlkSatis: 150000, tahminiRetainer: 80000, upsellPotansiyeli: 'Yüksek',
        kapanisOlasiligi: 25, status: 'İhtiyaç Analizi', ilgiHizmetler: ['SEO', 'E-Mail Marketing'],
        sorumlu: 'Hüseyin', kayipSebebi: '', aktifHizmetler: [], createdAt: d(-5), statusHistory: []
      },
      {
        id: 'L-1004', firma: 'Roka Restoran Grubu', yetkili: 'Ayşe Demir', pozisyon: 'Operasyon Direktörü',
        telefon: '+90 555 123 45 67', email: 'ayse@rokagrup.com', website: 'rokagrup.com',
        instagram: '@rokarestoran', linkedin: '', sehir: 'İzmir', ulke: 'Türkiye',
        sektor: 'Gıda / Restoran', calisanSayisi: 85, tahminiCiro: '90M TL', buyukluk: 'Orta (50-249)',
        kaynak: 'Website Form', manuelSkor: 'Sıcak',
        flags: { reklamAktif: false, instagramAktif: true, linkedinAktif: false, kararVericiTemas: true, butceBelirtildi: true, acilIhtiyac: true },
        potansiyelDeger: '100K+', tahminiIlkSatis: 95000, tahminiRetainer: 55000, upsellPotansiyeli: 'Yüksek',
        kapanisOlasiligi: 90, status: 'Kazanıldı', ilgiHizmetler: ['Sosyal Medya Yönetimi', 'Meta Ads'],
        sorumlu: 'Hüseyin', kayipSebebi: '', aktifHizmetler: ['Meta Ads', 'Sosyal Medya Yönetimi'], createdAt: d(-25), statusHistory: []
      },
      {
        id: 'L-1005', firma: 'Vektör Yazılım', yetkili: 'Can Öztürk', pozisyon: 'CEO',
        telefon: '+90 505 987 65 43', email: 'can@vektoryazilim.com', website: 'vektoryazilim.com',
        instagram: '', linkedin: 'vektor-yazilim', sehir: 'İstanbul', ulke: 'Türkiye',
        sektor: 'Teknoloji / SaaS', calisanSayisi: 12, tahminiCiro: '8M TL', buyukluk: 'Küçük (10-49)',
        kaynak: 'LinkedIn', manuelSkor: 'Soğuk',
        flags: { reklamAktif: false, instagramAktif: false, linkedinAktif: true, kararVericiTemas: true, butceBelirtildi: false, acilIhtiyac: false },
        potansiyelDeger: '25K+', tahminiIlkSatis: 25000, tahminiRetainer: 0, upsellPotansiyeli: 'Düşük',
        kapanisOlasiligi: 10, status: 'Kaybedildi', ilgiHizmetler: ['CRM Kurulumu'],
        sorumlu: 'Hüseyin', kayipSebebi: 'Bütçe yok', aktifHizmetler: [], createdAt: d(-20), statusHistory: []
      },
      {
        id: 'L-1006', firma: 'Grand Marina Hotel', yetkili: 'Kerem Yalçın', pozisyon: 'Satış & Pazarlama Md.',
        telefon: '+90 549 321 76 54', email: 'kerem@grandmarina.com', website: 'grandmarina.com',
        instagram: '@grandmarinahotel', linkedin: 'grand-marina', sehir: 'Antalya', ulke: 'Türkiye',
        sektor: 'Turizm', calisanSayisi: 210, tahminiCiro: '300M TL', buyukluk: 'Orta (50-249)',
        kaynak: 'Etkinlik', manuelSkor: 'Ilık',
        flags: { reklamAktif: true, instagramAktif: true, linkedinAktif: true, kararVericiTemas: false, butceBelirtildi: false, acilIhtiyac: false },
        potansiyelDeger: '250K+', tahminiIlkSatis: 200000, tahminiRetainer: 100000, upsellPotansiyeli: 'Yüksek',
        kapanisOlasiligi: 25, status: 'Yeni Lead', ilgiHizmetler: ['Google Ads', 'SEO'],
        sorumlu: 'Hüseyin', kayipSebebi: '', aktifHizmetler: [], createdAt: d(-1), statusHistory: []
      }
    ],
    meetings: [
      {
        id: 'M-1', leadId: 'L-1001', tarih: d(-6),
        problem: 'Showroom trafiği düşüyor, online satış kanalı yok denecek kadar zayıf.',
        hedef: 'Online\'dan aylık 150 nitelikli lead ve e-ticaret cirosunu 2 katına çıkarmak.',
        mevcutDurum: 'Boosted post seviyesinde Meta reklamı, dağınık bir kurumsal site.',
        rakipler: 'Vivense, Enza Home (bölgesel)',
        butce: 'Aylık 40-60K TL reklam + hizmet bütçesi',
        kararVerici: 'Serkan Bey (GM) — tek imza',
        aciliyet: 8,
        satinAlmaEngeli: 'Önceki ajans deneyiminden kalan güvensizlik.',
        hizmetler: ['Meta Ads', 'Landing Page'],
        sonrakiAdim: 'Teklif hazırlanacak'
      },
      {
        id: 'M-2', leadId: 'L-1002', tarih: d(-2),
        problem: 'Yeni hasta akışı tamamen tavsiyeye bağlı; dijitalden randevu gelmiyor.',
        hedef: 'Aylık 60+ online randevu başvurusu.',
        mevcutDurum: 'Eski bir site, reklam yok, Instagram aktif ama satışa bağlanmıyor.',
        rakipler: 'Bölgedeki 3 zincir klinik',
        butce: 'Belirtilmedi — toplam paket fiyatına göre karar verecek',
        kararVerici: 'Dr. Elif + ortak (2 imza)',
        aciliyet: 9,
        satinAlmaEngeli: 'Ortağın onayı gerekiyor.',
        hizmetler: ['Google Ads', 'Web Tasarım'],
        sonrakiAdim: 'Teklif hazırlanacak'
      }
    ],
    proposals: [
      {
        id: 'P-1', leadId: 'L-1001', hizmetler: ['Meta Ads', 'Landing Page'], paket: 'Growth',
        kalemler: [
          { hizmet: 'Meta Ads', aciklama: 'Pixel+CAPI kurulumu, funnel yapısı, 6 kreatif varyasyon, aylık optimizasyon', fiyat: 55000 },
          { hizmet: 'Landing Page', aciklama: 'Satış odaklı LP tasarımı + geliştirme, form/WhatsApp entegrasyonu', fiyat: 30000 }
        ],
        roi: { aylikYeniMusteri: 12, ortalamaMusteriDegeri: 15000, aylikRetainer: 45000 },
        fiyat: 85000, teslimSuresi: '14 gün kurulum', odemePlani: '%50 peşin, %50 teslimde',
        sozlesmeSuresi: '6 ay', ekHizmetler: ['CRM Kurulumu'], notlar: 'LP + Meta funnel kurulumu, aylık retainer ayrı teklif edilecek.',
        status: 'Gönderildi', createdAt: d(-4), sentAt: d(-4)
      }
    ],
    handoffs: [
      {
        id: 'H-1', leadId: 'L-1004',
        problem: 'Şube trafiği dengesiz; rezervasyonların çoğu tek şubeye yığılıyor, sosyal medya satışa bağlanmıyor.',
        hedef: 'Tüm şubelerde haftalık rezervasyon sayısını 2 katına çıkarmak.',
        butce: 'Aylık 55K TL retainer + 30K TL reklam bütçesi',
        hizmetler: ['Meta Ads', 'Sosyal Medya Yönetimi'],
        beklentiler: 'Aylık performans raporu + ayda 1 strateji toplantısı.',
        verilenSozler: 'İlk kampanya 10 iş günü içinde yayında; şube bazlı raporlama.',
        ozelIstekler: 'İçeriklerde marka fotoğraf arşivi kullanılacak, stok görsel istemiyorlar.',
        riskler: 'Satış sürecindeki engel: Yoğun sezonda onay süreçleri yavaşlayabilir.',
        materyaller: 'Marka kiti, fotoğraf arşivi, şube listesi, reklam hesabı erişimleri',
        sorumlu: 'Hüseyin', baslangicTarihi: d(-3), teslimTarihi: d(10),
        checklist: {
          'Meta Ads': [
            { madde: 'Pixel + CAPI kurulumu', done: true },
            { madde: 'Hedef kitle ve funnel yapısı', done: true },
            { madde: 'Kreatif set (min. 6 varyasyon)', done: false },
            { madde: 'Kampanya yapısı ve bütçe planı', done: false },
            { madde: 'Haftalık optimizasyon rutini', done: false },
            { madde: 'Raporlama dashboard\'u', done: false }
          ],
          'Sosyal Medya Yönetimi': [
            { madde: 'Strateji + rakip analizi', done: true },
            { madde: 'İçerik takvimi', done: false },
            { madde: 'Tasarım şablonları', done: false },
            { madde: 'Yayın + topluluk yönetimi', done: false },
            { madde: 'Aylık performans raporu', done: false }
          ]
        },
        onboarding: [
          { madde: 'Hoş geldin e-postası gönder', done: true },
          { madde: 'Onboarding formunu doldurt (erişimler, materyaller)', done: true },
          { madde: 'Kickoff toplantısı planla', done: true },
          { madde: 'Erişimleri topla (reklam hesapları, site, analytics)', done: false },
          { madde: 'İletişim kanalı kur (WhatsApp grubu / Slack)', done: false },
          { madde: 'İlk hafta planını paylaş', done: false },
          { madde: 'Raporlama formatını ve tarihlerini bildir', done: false }
        ],
        createdAt: d(-3)
      }
    ],
    customers: [
      {
        leadId: 'L-1004', sorumlu: 'Hüseyin', baslangic: d(-3), sozlesmeBitis: d(362), renewalTarihi: d(362),
        sonToplanti: d(-2), sonRapor: '', memnuniyet: 8,
        health: { sonucAliyor: true, toplantiKatilim: true, odemeDuzenli: true, sikayetYok: true, raporZamaninda: false, yeniIhtiyacVar: true },
        notlar: 'İlk ay kritik: şube bazlı raporlamayı özellikle istediler.'
      }
    ],
    payments: [
      { id: 'PAY-1', leadId: 'L-1004', tutar: 47500, vade: d(-3), tip: 'Peşinat', durum: 'Ödendi' },
      { id: 'PAY-2', leadId: 'L-1004', tutar: 47500, vade: d(-1), tip: 'Taksit', durum: 'Bekliyor' },
      { id: 'PAY-3', leadId: 'L-1004', tutar: 55000, vade: d(27), tip: 'Retainer', durum: 'Bekliyor' }
    ],
    activities: [
      { id: 'A-1', leadId: 'L-1004', tip: 'status', metin: 'Aşama: Müzakere → Kazanıldı', kisi: 'Hüseyin', at: d(-3) },
      { id: 'A-2', leadId: 'L-1004', tip: 'tahsilat', metin: 'Ödeme alındı: Peşinat', kisi: '', at: d(-3) },
      { id: 'A-3', leadId: 'L-1001', tip: 'teklif', metin: 'Teklif statüsü: Hazırlanıyor → Gönderildi', kisi: 'Hüseyin', at: d(-4) },
      { id: 'A-4', leadId: 'L-1001', tip: 'not', metin: 'Serkan Bey teklifi ortakla değerlendirecek, cuma günü dönüş sözü verdi.', kisi: 'Hüseyin', at: d(-2) },
      { id: 'A-5', leadId: 'L-1002', tip: 'toplanti', metin: 'Toplantı notu eklendi', kisi: 'Hüseyin', at: d(-2) },
      { id: 'A-6', leadId: 'L-1006', tip: 'lead', metin: 'Lead oluşturuldu (kaynak: Etkinlik)', kisi: '', at: d(-1) }
    ],
    dojoSessions: [],
    competitors: [
      {
        id: 'R-1', leadId: 'L-1001', ad: 'Vivense',
        website: 'vivense.com', instagram: '@vivense', linkedin: 'vivense',
        metaReklamAktif: true, googleGorunurluk: 'Yüksek', seoDurumu: 'Yüksek',
        websiteKalitesi: 'Yüksek', sosyalMedyaGucu: 'İyi', icerikSikligi: 'Sık',
        reklamAktivitesi: 'Meta + Google, yoğun ve sürekli',
        gucluYonler: 'Geniş ürün kataloğu, güçlü e-ticaret altyapısı',
        zayifYonler: 'Yerel showroom deneyimi ve kişisel danışmanlık sunmuyor'
      }
    ],
    tasks: [
      { id: 'T-1', leadId: 'L-1001', baslik: 'Follow-up araması (1. gün)', tip: 'Follow-Up', dueDate: d(-3), done: true, note: '' },
      { id: 'T-2', leadId: 'L-1001', baslik: 'Follow-up araması (3. gün)', tip: 'Follow-Up', dueDate: d(-1), done: false, note: '' },
      { id: 'T-3', leadId: 'L-1002', baslik: 'Teklifi hazırla', tip: 'Teklif', dueDate: d(1), done: false, note: '' },
      { id: 'T-4', leadId: 'L-1006', baslik: 'İlk temas: 24 saat içinde ara', tip: 'Arama', dueDate: d(0), done: false, note: '' },
      { id: 'T-5', leadId: 'L-1004', baslik: 'Delivery handoff briefi hazırla', tip: 'Operasyon', dueDate: d(1), done: false, note: '' },
      { id: 'T-6', leadId: 'L-1003', baslik: 'Karar vericiyle toplantı ayarla', tip: 'Toplantı', dueDate: d(2), done: false, note: '' }
    ]
  }
}
