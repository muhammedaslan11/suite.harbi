import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { healthScore, riskLevel, HEALTH_CRITERIA, fmtTL, fmtDate, daysUntil, nextBestSale, riskSignals } from '../utils.js'
import { Ring } from '../components/widgets.jsx'

export default function CustomerSuccess({ openLead, embedded }) {
  const { state, dispatch } = useStore()
  const customers = state.customers
    .map(c => ({ ...c, lead: state.leads.find(l => l.id === c.leadId) }))
    .filter(c => c.lead)
  const [selectedId, setSelectedId] = useState(customers[0]?.leadId || null)
  const cur = customers.find(c => c.leadId === selectedId)

  const patch = (obj) => dispatch({ type: 'UPDATE_CUSTOMER', leadId: cur.leadId, patch: obj })
  const setHealth = (key, val) => patch({ health: { ...cur.health, [key]: val } })

  if (!customers.length) {
    return (
      <div>
        {!embedded && <h1 className="page-title">Customer Success</h1>}
        <div className="card empty">Henüz aktif müşteri yok. Pipeline'da bir lead "Kazanıldı" olduğunda burada otomatik müşteri kaydı oluşur.</div>
      </div>
    )
  }

  return (
    <div>
      {!embedded && <>
        <h1 className="page-title">Customer Success</h1>
        <p className="page-sub">Aktif müşteriler, health score, risk ve upsell fırsatları.</p>
      </>}

      <div className="grid" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
        <div className="card" style={{ padding: 8 }}>
          {customers.map(c => {
            const s = healthScore(c)
            const r = riskLevel(s)
            return (
              <div
                key={c.leadId}
                onClick={() => setSelectedId(c.leadId)}
                style={{
                  padding: '10px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  background: c.leadId === selectedId ? 'var(--panel2)' : 'transparent'
                }}
              >
                <div className="spread">
                  <span style={{ fontWeight: 700 }}>{c.lead.firma}</span>
                  <span className={'score-ring ' + (s >= 80 ? 'score-hi' : s >= 60 ? 'score-mid' : 'score-lo')}>{s}</span>
                </div>
                <div className="progress" style={{ margin: '6px 0' }}><div style={{ width: s + '%', background: s >= 80 ? 'var(--lime)' : s >= 60 ? 'var(--amber)' : 'var(--red)' }} /></div>
                <span className={'pill ' + r.tone}>{r.label}</span>
              </div>
            )
          })}
        </div>

        {cur && (() => {
          const s = healthScore(cur)
          const r = riskLevel(s)
          const nbs = nextBestSale(cur.lead)
          const renewalGun = cur.renewalTarihi ? daysUntil(cur.renewalTarihi) : null
          const sinyaller = riskSignals(cur, cur.lead, state.payments)
          return (
            <div>
              <div className="card mb">
                <div className="spread">
                  <div>
                    <h3 style={{ fontSize: 16, marginBottom: 4 }}>{cur.lead.firma}</h3>
                    <div className="flex" style={{ flexWrap: 'wrap' }}>
                      {(cur.lead.aktifHizmetler || []).map(h => <span key={h} className="pill lime">{h}</span>)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Ring value={s} display={s} size={92} label={null} color={s >= 80 ? 'var(--accent)' : s >= 60 ? 'var(--amber)' : 'var(--red)'} />
                    <div><span className={'pill ' + r.tone}>{r.label}</span></div>
                  </div>
                </div>
                <button className="btn ghost sm mt" onClick={() => openLead(cur.leadId)}>Lead kartını aç →</button>
              </div>

              {sinyaller.length > 0 && (
                <div className="card mb" style={{ borderColor: '#5b2b2b', background: 'rgba(248,113,113,.05)' }}>
                  <div className="small" style={{ color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {sinyaller.length >= 2 ? '🚨 Kaybedilme Riski — Davranış Sinyalleri' : '⚠️ Risk Sinyali'}
                  </div>
                  {sinyaller.map((x, i) => <div key={i} className="small" style={{ padding: '3px 0' }}>• {x}</div>)}
                </div>
              )}

              {nbs && (
                <div className="card mb" style={{ borderColor: 'var(--lime-dim)', background: 'rgba(163,230,53,.05)' }}>
                  <div className="small" style={{ color: 'var(--lime)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>💡 Upsell Fırsatı</div>
                  <div style={{ marginTop: 6 }}>{nbs.metin}</div>
                  {Number(cur.lead.tahminiRetainer) > 0 && (
                    <div className="small muted" style={{ marginTop: 4 }}>Tahmini upsell değeri: {fmtTL(Number(cur.lead.tahminiRetainer) * 0.6)} – {fmtTL(Number(cur.lead.tahminiRetainer) * 1.2)}</div>
                  )}
                </div>
              )}

              <div className="grid g2">
                <div className="card">
                  <h3>Health Score Kriterleri</h3>
                  {HEALTH_CRITERIA.map(c => (
                    <label key={c.key} className="check" style={{ justifyContent: 'space-between' }}>
                      <span className="flex" style={{ gap: 8 }}>
                        <input type="checkbox" checked={!!cur.health?.[c.key]} onChange={e => setHealth(c.key, e.target.checked)} />
                        {c.label}
                      </span>
                      <span className="muted small">+{c.puan}</span>
                    </label>
                  ))}
                  <hr className="divider" />
                  <label className="field"><span>Memnuniyet Skoru (1-10): {cur.memnuniyet}</span>
                    <input type="range" min="1" max="10" value={cur.memnuniyet} onChange={e => patch({ memnuniyet: Number(e.target.value) })} />
                  </label>
                </div>
                <div className="card">
                  <h3>Sözleşme & Takip</h3>
                  <table><tbody>
                    <tr><td className="muted">Aylık Gelir (MRR)</td><td style={{ fontWeight: 700, color: 'var(--lime)' }}>{fmtTL(cur.lead.tahminiRetainer)}</td></tr>
                    <tr><td className="muted">Başlangıç</td><td>{fmtDate(cur.baslangic)}</td></tr>
                    <tr><td className="muted">Sözleşme Bitiş</td><td>{fmtDate(cur.sozlesmeBitis)}</td></tr>
                    <tr>
                      <td className="muted">Renewal</td>
                      <td>
                        {fmtDate(cur.renewalTarihi)}
                        {renewalGun != null && renewalGun <= 60 && <span className="pill amber" style={{ marginLeft: 6 }}>{renewalGun} gün kaldı!</span>}
                      </td>
                    </tr>
                    <tr><td className="muted">Sorumlu</td><td><input value={cur.sorumlu} onChange={e => patch({ sorumlu: e.target.value })} /></td></tr>
                    <tr><td className="muted">Son Toplantı</td><td><input type="date" value={cur.sonToplanti?.slice(0, 10) || ''} onChange={e => patch({ sonToplanti: e.target.value })} /></td></tr>
                    <tr><td className="muted">Son Rapor</td><td><input type="date" value={cur.sonRapor?.slice(0, 10) || ''} onChange={e => patch({ sonRapor: e.target.value })} /></td></tr>
                  </tbody></table>
                  <label className="field mt"><span>Notlar</span>
                    <textarea value={cur.notlar} onChange={e => patch({ notlar: e.target.value })} />
                  </label>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
