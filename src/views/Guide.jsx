import React from 'react'

const modules = [
  {
    title: 'Bugunum / Ajanda',
    purpose: 'Gunun satis ve operasyon onceliklerini tek ekranda toplar.',
    works: 'Acik gorevleri, geciken isleri, bugun takip edilmesi gereken leadleri ve yakin vadeli aksiyonlari listeler.',
    metrics: ['Bugunku gorevler', 'Geciken gorevler', 'Yaklasan follow-up', 'Aktif firsatlar']
  },
  {
    title: 'KPI Dashboard',
    purpose: 'Satis performansini ve gelir gorunumunu hizli okumak icin ana rapor ekranidir.',
    works: 'Lead, teklif, pipeline, kapanis ve forecast verilerini mevcut state uzerinden hesaplar.',
    metrics: ['Kapanis orani', 'Ortalama lead skoru', 'Pipeline degeri', 'Beklenen gelir', 'Kesinlesen gelir', 'MRR', 'Riskli gelir']
  },
  {
    title: 'Lead Yonetimi',
    purpose: 'Tum potansiyel musterilerin brief, iletisim, skor ve satis durumunu yonetir.',
    works: 'Lead kaydi olusturulur, kaynak/sektor/hizmet bilgileri girilir, sistem otomatik lead skoru ve gorevler uretir.',
    metrics: ['Harbi Lead Score', 'Potansiyel deger', 'Kapanis olasiligi', 'Kaynak ve sektor dagilimi']
  },
  {
    title: 'Pipeline',
    purpose: 'Satis surecini asama asama Kanban mantigiyla izler.',
    works: 'Leadler asamalar arasinda tasinir; asama degisimlerinde arama, toplanti, teklif, operasyon veya nurturing gorevleri otomatik olusur.',
    metrics: ['Asama bazli lead sayisi', 'Asama bazli tutar', 'Kazanildi / Kaybedildi / Ertelendi durumu']
  },
  {
    title: 'Teklifler',
    purpose: 'Teklif olusturma, takip etme ve PDF cikti alma merkezidir.',
    works: 'Teklif kalemleri, hizmetler, fiyat, odeme plani ve durum kaydi tutulur. Teklif gonderildiginde takip gorevleri olusur.',
    metrics: ['Gonderilen teklif sayisi', 'Ortalama teklif tutari', 'Kabul / red durumu', 'Follow-up gunleri']
  },
  {
    title: 'Gorevler / Follow-Up',
    purpose: 'Satis disiplinini ve takip ritmini korur.',
    works: 'Otomatik ve manuel gorevler filtrelenir, tamamlanir veya silinir. Teklif ve pipeline hareketleri bu ekrana is uretir.',
    metrics: ['Acik gorev', 'Bugunku gorev', 'Geciken gorev', 'Tamamlanan aksiyonlar']
  },
  {
    title: 'Satis Dojo',
    purpose: 'Satis ekibinin itiraz karsilama ve gorusme becerisini pratik yaptirir.',
    works: 'AI destekli musteri rolu, itiraz antrenmani, skor karti ve oturum kayitlariyla calisir.',
    metrics: ['Dojo oturumlari', 'Skor karti', 'Leaderboard performansi']
  },
  {
    title: 'Delivery Handoff',
    purpose: 'Kazanilan isin satis ekibinden operasyon ekibine temiz devrini saglar.',
    works: 'Lead kazanildiginda toplantidan gelen problem, hedef, butce ve hizmetlere gore handoff kaydi otomatik olusur.',
    metrics: ['Onboarding ilerlemesi', 'Hizmet checklist durumu', 'Teslim sorumlusu', 'Baslangic ve teslim tarihleri']
  },
  {
    title: 'Customer Success',
    purpose: 'Kazanilan musterilerin sagligini, memnuniyetini ve yenileme riskini takip eder.',
    works: 'Health kriterleri, son rapor/toplanti, memnuniyet, sikayet ve odeme sinyalleriyle risk seviyesi hesaplanir.',
    metrics: ['Health Score', 'Risk seviyesi', 'Renewal tarihi', 'Memnuniyet', 'Upsell firsati']
  },
  {
    title: 'Command Center',
    purpose: 'Yonetim icin satis, operasyon, finans, musteri basarisi ve buyume gorunumunu birlestirir.',
    works: 'Sistemdeki tum ana verileri yonetici ozetine cevirir; bugun, bu ay, gelecek ay ve 90 gunluk bakis verir.',
    metrics: ['Bu ay forecast', 'Gelecek ay forecast', '90 gun pipeline', 'Geciken tahsilat', 'Riskli musteriler']
  },
  {
    title: 'Tahsilat',
    purpose: 'Kazanilan islerin odeme planini ve tahsilat durumunu izler.',
    works: 'Kazanildi asamasinda teklif odeme planina gore pesinat, taksit veya retainer kayitlari otomatik olusabilir.',
    metrics: ['Bekleyen odeme', 'Odenen tutar', 'Geciken tahsilat', 'Retainer kayitlari']
  },
  {
    title: 'Hizmet Bilgi Merkezi',
    purpose: 'Ekibin her hizmeti ayni dil ve net deger onerisiyle satmasini saglar.',
    works: 'Hizmet kartlari; ne satildigi, kime satildigi, problem, sonuc, ROI, cross-sell ve teslim checklist bilgisini gosterir.',
    metrics: ['Hizmet bazli ROI beklentisi', 'Cross-sell onerileri', 'Teslimat checklist kapsami']
  },
  {
    title: 'Itiraz Kutuphanesi',
    purpose: 'Satis gorusmelerindeki yaygin itirazlara hazir ve tutarli cevap verir.',
    works: 'Itirazin anlami, cevap onerisi, devam sorusu ve kapanis cumlesi seklinde kullanilir.',
    metrics: ['Itiraz turleri', 'Cevap scriptleri', 'Kapanis yonlendirmeleri']
  },
  {
    title: 'Veri & Ayarlar',
    purpose: 'Sistemin veri, ekip, hedef, gorunum, skor ve AI ayarlarini yonetir.',
    works: 'SQLite/localStorage durumu, JSON import/export, ekip hedefleri, atama kurallari, tema ve modul gorunurlugu buradan ayarlanir.',
    metrics: ['Depolama modu', 'Ekip hedefleri', 'Skor agirliklari', 'Follow-up gunleri']
  }
]

const kpis = [
  ['Kapanis Orani', 'Kazanilan lead sayisinin kazanilan + kaybedilen lead toplamina oranidir.'],
  ['Pipeline Degeri', 'Acik firsatlarin tahmini ilk satis veya teklif degerlerinin toplamidir.'],
  ['Beklenen Gelir', 'Firsat degeri ile kapanis olasiliginin carpimindan uretilen forecast degeridir.'],
  ['Kesinlesen Gelir', 'Kazanildi durumundaki leadlerin tahmini ilk satis toplamidir.'],
  ['MRR', 'Kazanilan musterilerden beklenen aylik retainer toplamidir.'],
  ['Riskli Gelir', 'Kapanis olasiligi dusuk olan acik firsatlarin toplam degeridir.'],
  ['Harbi Lead Score', 'Website, reklam aktifligi, sosyal kanallar, calisan sayisi, butce, aciliyet ve toplanti sinyalleriyle 100 uzerinden hesaplanir.'],
  ['Health Score', 'Sonuc alma, odeme duzeni, toplanti katilimi, sikayet, rapor duzeni ve yeni ihtiyac sinyalleriyle musteri sagligini olcer.']
]

function InfoList({ items }) {
  return (
    <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
      {items.map(item => <span key={item} className="pill blue">{item}</span>)}
    </div>
  )
}

export default function Guide() {
  return (
    <div>
      <h1 className="page-title">Rehber</h1>
      <p className="page-sub">HARB! SUITE icindeki modullerin amaci, calisma mantigi ve takip edilen ana KPI metrikleri.</p>

      <div className="grid g3 mb">
        <div className="card kpi">
          <div className="label">Sistemin Amaci</div>
          <div className="sub">Ajans satis surecini lead girisinden tahsilat ve yenilemeye kadar tek yerde yonetmek.</div>
        </div>
        <div className="card kpi">
          <div className="label">Ana Akis</div>
          <div className="sub">Lead, pipeline, teklif, kapanis, handoff, customer success, upsell ve raporlama.</div>
        </div>
        <div className="card kpi">
          <div className="label">Veri Mantigi</div>
          <div className="sub">Uygulama yerel SQLite veritabanini kullanir; API olmazsa localStorage yedek moduna duser.</div>
        </div>
      </div>

      <div className="card mb">
        <h3>Genel Calisma Mantigi</h3>
        <table>
          <tbody>
            <tr><td className="muted">1. Lead girisi</td><td>Yeni lead eklenir veya webhook/inbox ile gelir; sistem sorumlu atayip ilk temas gorevi olusturur.</td></tr>
            <tr><td className="muted">2. Satis sureci</td><td>Pipeline asamalari ilerledikce toplanti, teklif, follow-up ve kayip nurturing gorevleri otomatik uretilir.</td></tr>
            <tr><td className="muted">3. Teklif ve kapanis</td><td>Teklif hazirlanir, gonderilir ve takip edilir. Kazanildi durumunda operasyon, musteri basarisi ve tahsilat kayitlari acilir.</td></tr>
            <tr><td className="muted">4. Operasyon ve buyume</td><td>Delivery handoff, health score, renewal zinciri, cross-sell onerileri ve command center ile surec devam eder.</td></tr>
          </tbody>
        </table>
      </div>

      <div className="grid g2 mb">
        {modules.map(module => (
          <div key={module.title} className="card">
            <div className="spread">
              <h3>{module.title}</h3>
              <span className="pill lime">Modul</span>
            </div>
            <div className="mb">
              <div className="small muted">AMAC</div>
              <div>{module.purpose}</div>
            </div>
            <div className="mb">
              <div className="small muted">NASIL CALISIR</div>
              <div>{module.works}</div>
            </div>
            <div className="small muted" style={{ marginBottom: 6 }}>KPI / METRIKLER</div>
            <InfoList items={module.metrics} />
          </div>
        ))}
      </div>

      <div className="card">
        <h3>KPI Sozlugu</h3>
        <table>
          <tbody>
            {kpis.map(([name, desc]) => (
              <tr key={name}>
                <td style={{ fontWeight: 700 }}>{name}</td>
                <td className="muted">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
