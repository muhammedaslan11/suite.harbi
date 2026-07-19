import React from 'react'
import { fmtTL, fmtDate, proposalTotal } from '../utils.js'
import { SERVICE_CARDS } from '../data/seeds.js'

// Teklifin müşteriye gösterilecek temiz görünümü (ekran paylaşımı / yerinde sunum).
// Supabase geçişinde bu bileşen public link olarak servis edilecek ve açılma anı "Görüldü" tetikleyecek.
export default function ProposalShare({ proposal: p, lead, onClose, onSeen }) {
  const kalemler = p.kalemler?.length ? p.kalemler : (p.hizmetler || []).map(h => ({ hizmet: h, aciklama: '', fiyat: 0 }))
  const toplam = proposalTotal(p)
  const roi = p.roi && Number(p.roi.aylikYeniMusteri) > 0 && Number(p.roi.ortalamaMusteriDegeri) > 0 ? p.roi : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#f4f5f0', color: '#16190f', overflowY: 'auto' }}>
      <div style={{ position: 'sticky', top: 0, background: '#16190f', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
        <span style={{ color: '#fff', fontWeight: 800 }}><span style={{ color: '#a3e635' }}>H</span>ARB<span style={{ color: '#a3e635' }}>!</span> — Teklif Sunumu</span>
        <span style={{ display: 'flex', gap: 8 }}>
          {!['Görüldü', 'Kabul Edildi', 'Reddedildi'].includes(p.status) && (
            <button className="btn sm" onClick={onSeen}>👁 Görüldü işaretle</button>
          )}
          <button className="btn ghost sm" style={{ color: '#fff', borderColor: '#555' }} onClick={onClose}>✕ Kapat</button>
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 32px' }}>
        <div style={{ borderBottom: '3px solid #a3e635', paddingBottom: 20, marginBottom: 32 }}>
          <div style={{ fontSize: 13, letterSpacing: 3, color: '#667', textTransform: 'uppercase' }}>Harbi Digital — Büyüme Teklifi</div>
          <h1 style={{ fontSize: 34, margin: '8px 0 4px' }}>{lead?.firma}</h1>
          <div style={{ color: '#667' }}>{lead?.yetkili}{lead?.pozisyon ? ` — ${lead.pozisyon}` : ''} · {fmtDate(p.createdAt)}</div>
        </div>

        {p.aiOzet && (
          <div style={{ background: '#fff', borderLeft: '4px solid #a3e635', padding: '18px 22px', marginBottom: 32, borderRadius: '0 10px 10px 0', lineHeight: 1.7 }}>
            {p.aiOzet}
          </div>
        )}

        <h2 style={{ fontSize: 20 }}>Ne Kuruyoruz?</h2>
        {kalemler.map((k, i) => {
          const card = SERVICE_CARDS.find(c => c.ad === k.hizmet)
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '18px 22px', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{k.hizmet}</div>
              <div style={{ lineHeight: 1.6, color: '#333' }}>{k.aciklama || card?.neSatiyoruz}</div>
              {card && <div style={{ marginTop: 8, fontSize: 13, color: '#667' }}>🎯 {card.sonuc} · ⏱ {card.teslimSuresi}</div>}
            </div>
          )
        })}

        {roi && (
          <>
            <h2 style={{ fontSize: 20, marginTop: 32 }}>Yatırımın Geri Dönüşü</h2>
            {p.roiHikayesi && <p style={{ lineHeight: 1.7, color: '#333' }}>{p.roiHikayesi}</p>}
            <table style={{ width: '100%', background: '#fff', borderRadius: 12, overflow: 'hidden', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#16190f', color: '#fff' }}>
                  {['Dönem', 'Beklenen Ek Gelir', 'Toplam Yatırım', 'ROI'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {[3, 6, 12].map(ay => {
                  const gelir = roi.aylikYeniMusteri * roi.ortalamaMusteriDegeri * ay
                  const yatirim = toplam + (Number(roi.aylikRetainer) || 0) * ay
                  return (
                    <tr key={ay} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{ay} Ay</td>
                      <td style={{ padding: '10px 14px' }}>{fmtTL(gelir)}</td>
                      <td style={{ padding: '10px 14px' }}>{fmtTL(yatirim)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: gelir / yatirim >= 1 ? '#65a30d' : '#667' }}>{(gelir / yatirim).toFixed(1)}x</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ fontSize: 11, color: '#889', marginTop: 6 }}>Rakamlar simülasyondur; birlikte koyacağımız hedeflere göre aylık raporla ölçülür.</div>
          </>
        )}

        <h2 style={{ fontSize: 20, marginTop: 32 }}>Yatırım</h2>
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
          {kalemler.map((k, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 22px', borderBottom: '1px solid #eee' }}>
              <span>{k.hizmet}</span><span style={{ fontWeight: 700 }}>{fmtTL(k.fiyat)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 22px', background: '#16190f', color: '#fff' }}>
            <span style={{ fontWeight: 800 }}>TOPLAM</span><span style={{ fontWeight: 800, color: '#a3e635' }}>{fmtTL(toplam)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 13, color: '#333', flexWrap: 'wrap' }}>
          {p.odemePlani && <span><b>Ödeme:</b> {p.odemePlani}</span>}
          {p.sozlesmeSuresi && <span><b>Süre:</b> {p.sozlesmeSuresi}</span>}
          {p.teslimSuresi && <span><b>Teslim:</b> {p.teslimSuresi}</span>}
        </div>

        <div style={{ marginTop: 48, textAlign: 'center', color: '#889', fontSize: 12, borderTop: '1px solid #ddd', paddingTop: 16 }}>
          Harbi Digital · Bu teklif {fmtDate(p.createdAt)} tarihinde hazırlanmıştır.
        </div>
      </div>
    </div>
  )
}
