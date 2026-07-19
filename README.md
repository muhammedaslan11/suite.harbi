# HARB! SUITE — Agency Revenue OS

Harbi Digital için uçtan uca satış işletim sistemi:
**Lead → Satış → Teklif → Kapanış → Operasyon → Customer Success → Upsell → Dashboard**

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # production build (dist/)
```

## MVP'de olanlar (v1)

| Modül | Açıklama |
|---|---|
| **KPI Dashboard** | Yeni lead, aktif fırsat, teklif, kapanış oranı, pipeline değeri, beklenen/kesin/riskli gelir, MRR, en sıcak lead'ler, geciken görevler |
| **Lead Yönetimi** | Tüm brief alanları + otomatik **Harbi Lead Score** (100 üzerinden, brief'teki kriterlerle) + manuel skor + potansiyel değer alanları |
| **Pipeline (Kanban)** | 14 aşama, sürükle-bırak; her geçişte otomatik görev (örn. "24 saat içinde ara"), Kaybedildi'de zorunlu sebep + 30 gün nurturing görevi |
| **Toplantı Notları** | Problem / Hedef / Mevcut Durum / Rakipler / Bütçe / Karar Verici / Aciliyet / Engel / Hizmetler / Sonraki Adım şablonu |
| **Satışçı Yardım Merkezi** | Lead'in ilgilendiği hizmete göre **dinamik** satış scriptleri (Meta Ads, SEO, LP, CRM, Google Ads, Web, SM) |
| **İtiraz Kütüphanesi** | 7 itiraz: ne demek istiyor → cevap → devam sorusu → kapanış |
| **Hizmet Bilgi Merkezi** | 8 hizmet kartı: ne/kime satıyoruz, problem, sonuç, ROI, açılış cümlesi, cross-sell/upsell, case study, teslimat checklist |
| **Teklif Merkezi** | Teklif oluşturma + statü takibi; "Gönderildi" olunca 1-3-7-14-30 gün follow-up görevleri **otomatik** oluşur (scriptli) |
| **Follow-Up / Görevler** | Filtreli görev listesi (açık/bugün/geciken), otomasyon görevleri + manuel görev, follow-up script kütüphanesi |
| **Cross-Sell** | Hizmet bazlı öneri haritası + her lead kartında "Sonraki En Mantıklı Satış" banner'ı |
| **Revenue Forecast (temel)** | Beklenen Gelir = Teklif Değeri × Kapanış Olasılığı; dashboard'da kesin/beklenen/riskli gelir |

## Veri — SQLite (v4)

- Veri **yerel SQLite veritabanında** tutulur: `data/harb.db` (Node'un yerleşik `node:sqlite` modülü, harici bağımlılık yok).
- API, Vite dev sunucusuna gömülüdür (tek süreç, tek port). Üretimde `npm run build` + `npm run start`.
- **Yedekleme:** `data/harb.db` dosyasını kopyalamak yeterli; ayrıca Ayarlar'dan JSON export/import sürüyor.
- **Migrasyon:** DB boşken açılışta eski localStorage verisi otomatik SQLite'a taşınır. API'ye ulaşılamazsa uygulama localStorage yedek moduna düşer (Ayarlar'da uyarı gösterilir). localStorage her kayıtta acil durum aynası olarak güncel tutulur.
- **Gerçek webhook:** `POST /api/webhook/lead` (`{"firma","yetkili","telefon","email",...}`) — gelen lead kutuya düşer, uygulama açılınca atama + görev otomasyonlarından geçirilerek içe aktarılır.
- Diğer endpoint'ler: `GET/PUT /api/state`, `GET /api/inbox`, `GET /api/health`.
- İlk açılışta örnek demo verisi yüklüdür.

## v2'de eklenenler

| Modül | Açıklama |
|---|---|
| **Teklif PDF** | Kalem bazlı fiyat tablosu, hizmet kapsamı + beklenen etkiler (hizmet kartlarından), 3/6/12 ay **ROI simülasyonu**, taraflar + imza blokları. pdfmake ile gerçek .pdf; tıklama anında lazy-load edilir ([src/pdf.js](src/pdf.js)). |
| **Customer Success** | Health Score (100 üzerinden 6 kriter), risk seviyeleri (Sağlıklı → Kaybedilme Riski Yüksek), renewal uyarısı, memnuniyet, upsell fırsatı. |
| **Delivery Handoff** | "Kazanıldı" olduğunda **otomatik** oluşur: toplantı notlarından problem/hedef/bütçe, hizmet bazlı teslimat checklist'i, onboarding checklist'i, ilerleme yüzdesi. |
| **Rakip Analizi** | Lead kartında sekme: rakip kartları + alan değerlerinden **otomatik üretilen satış cümleleri** (kopyala butonlu). |
| **Command Center** | Yönetici ekranı: Satış / Operasyon / Finans / Müşteri Başarısı / Büyüme — bu ay & gelecek ay & 90 gün forecast dahil. |

## v3'te eklenenler

**Temel katman:** Aktivite Timeline (lead kartında ilk sekme + manuel not), Bugünüm ajandası, Ekip & Hedefler + quota progress (Dashboard), lead atama rotasyonu (kaynak kuralı + round-robin), Tahsilat modülü (Kazanıldı'da otomatik ödeme kayıtları, geciken tahsilat Command Center'da), WhatsApp/e-posta hızlı butonları (scriptli), sözleşme yenileme motoru (90/60/30 gün otomatik görev zinciri), churn risk sinyalleri (davranış bazlı), Deal DNA rozeti (kendi satış geçmişinden benzerlik, ≥5 kapanmış deal gerekir).

**AI katmanı** (`src/ai.js` — Ayarlar'a kendi Anthropic API anahtarınızı girin, tarayıcıdan direkt çalışır):
- 🎤 **AI Toplantı Asistanı** — transcript yapıştır veya canlı dikte (Chrome), şablon otomatik dolar, itirazlar tespit edilir
- 🤖 **AI Satış Koçu** — lead bağlamından arama planı, muhtemel itirazlar, kişiye özel açılış
- ✨ **AI Teklif Metni** — yönetici özeti + kalem açıklamaları + ROI hikayesi; PDF ve sunum sayfasına akar
- 🥊 **Satış Dojo'su** — AI müşteri rolü oynar, itiraz antrenmanı + skor kartı + leaderboard
- 🔍 **AI Rakip Araştırması** — web aramasıyla rakip alanlarını doldurur
- 🛟 **AI Kurtarma Planı** — riskli müşteri için aksiyon planı (Command Center)

**Supabase hazırlığı:** Lead içe aktarma (JSON/CSV, webhook formatı) + Teklif sunum görünümü ("Görüldü" statü entegrasyonlu; gerçek uzaktan izleme Supabase'de).

## Yol haritası

- **Altyapı:** Çok kullanıcılı kullanım için Supabase backend'e geçiş (tüm veri erişimi `store.jsx`'te; webhook + teklif link takibi + AI proxy o zaman gerçek uzaktan çalışır)

## Teknik

Vite + React 18, ek bağımlılık yok. Kod: `src/`
- `data/constants.js` — aşamalar, kaynaklar, cross-sell haritası, follow-up takvimi, scriptler
- `data/seeds.js` — hizmet kartları, itiraz kütüphanesi, demo verisi
- `store.jsx` — veri katmanı + **tüm otomasyon kuralları** (status geçişleri, follow-up üretimi)
- `utils.js` — lead skoru, forecast, cross-sell mantığı
- `views/` — ekranlar
