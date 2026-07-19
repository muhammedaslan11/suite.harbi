import React, { useState } from 'react'
import { SERVICE_CARDS } from '../data/seeds.js'
import Onboarding from '../components/Onboarding.jsx'

function Field({ label, value }) {
  if (!value) return null
  return (
    <div className="mb" style={{ marginBottom: 10 }}>
      <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10.5 }}>{label}</div>
      <div style={{ marginTop: 2 }}>{Array.isArray(value) ? value.join(' · ') : value}</div>
    </div>
  )
}

export default function Services() {
  const [selected, setSelected] = useState(SERVICE_CARDS[0].id)
  const svc = SERVICE_CARDS.find(s => s.id === selected)

  return (
    <div>
      <h1 className="page-title">Hizmet Bilgi Merkezi</h1>
      <p className="page-sub">Her hizmet için: ne satıyoruz, kime, hangi problemi çözüyor, itirazlar ve cross-sell haritası.</p>
      <Onboarding
        id="services"
        steps={[
          'Görüşme öncesi 2 dakika: satacağın hizmetin kartını aç, açılış cümlesi + case study\'yi tazele.',
          'Bu kartlar teklif PDF\'ini ve handoff checklist\'lerini de besler — tek doğruluk kaynağıdır.'
        ]}
      />

      <div className="flex mb" style={{ flexWrap: 'wrap' }}>
        {SERVICE_CARDS.map(s => (
          <button key={s.id} className={'btn sm ' + (selected === s.id ? '' : 'ghost')} onClick={() => setSelected(s.id)}>{s.ad}</button>
        ))}
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="spread">
            <h3 style={{ fontSize: 16 }}>{svc.ad}</h3>
            <span className="pill lime">{svc.kategori}</span>
          </div>
          <Field label="Ne Satıyoruz?" value={svc.neSatiyoruz} />
          <Field label="Kime Satıyoruz?" value={svc.kimeSatiyoruz} />
          <Field label="Hangi Problemi Çözüyor?" value={svc.problem} />
          <Field label="Ne Sonuç Veriyor?" value={svc.sonuc} />
          <Field label="Ortalama Teslim Süresi" value={svc.teslimSuresi} />
          <Field label="Ortalama ROI Beklentisi" value={svc.roi} />
          <Field label="Ön Koşullar" value={svc.onKosullar} />
        </div>
        <div>
          <div className="card mb">
            <h3>🎯 Satış Açılış Cümlesi</h3>
            <div className="script-box">{svc.acilisCumlesi}</div>
            <Field label="Sık İtirazlar" value={svc.sikItirazlar} />
          </div>
          <div className="card mb">
            <h3>🔁 Cross-Sell & Upsell</h3>
            <div className="small muted">CROSS-SELL</div>
            <div className="flex mb" style={{ flexWrap: 'wrap', marginTop: 4 }}>
              {svc.crossSell.map(x => <span key={x} className="pill lime">{x}</span>)}
            </div>
            <div className="small muted">UPSELL</div>
            <div className="flex" style={{ flexWrap: 'wrap', marginTop: 4 }}>
              {svc.upsell.map(x => <span key={x} className="pill blue">{x}</span>)}
            </div>
          </div>
          <div className="card mb">
            <h3>🏆 Case Study</h3>
            <div>{svc.caseStudy}</div>
          </div>
          <div className="card">
            <h3>📋 Teslimat Checklist'i</h3>
            {svc.checklist.map((c, i) => (
              <div key={i} className="small" style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>☐ {c}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
