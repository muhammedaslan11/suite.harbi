import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { fmtDate } from '../utils.js'

function progressOf(h) {
  const items = [...Object.values(h.checklist || {}).flat(), ...(h.onboarding || [])]
  if (!items.length) return 0
  return Math.round(items.filter(x => x.done).length / items.length * 100)
}

function EditableField({ label, value, onChange, textarea }) {
  return (
    <label className="field"><span>{label}</span>
      {textarea
        ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} />
        : <input value={value || ''} onChange={e => onChange(e.target.value)} />}
    </label>
  )
}

export default function Handoff({ openLead, embedded }) {
  const { state, dispatch } = useStore()
  const handoffs = state.handoffs
    .map(h => ({ ...h, lead: state.leads.find(l => l.id === h.leadId) }))
    .filter(h => h.lead)
  const [selectedId, setSelectedId] = useState(handoffs[0]?.id || null)
  const cur = handoffs.find(h => h.id === selectedId)

  if (!handoffs.length) {
    return (
      <div>
        {!embedded && <h1 className="page-title">Delivery Handoff</h1>}
        <div className="card empty">Henüz handoff yok. Bir lead "Kazanıldı" olduğunda satış bilgileri otomatik olarak operasyon briefine dönüşür.</div>
      </div>
    )
  }

  const patch = (obj) => dispatch({ type: 'UPDATE_HANDOFF', id: cur.id, patch: obj })
  const pct = cur ? progressOf(cur) : 0

  return (
    <div>
      {!embedded && <>
        <h1 className="page-title">Delivery Handoff</h1>
        <p className="page-sub">Satıştan operasyona bilgi kaybı olmadan devir: brief, checklist, onboarding.</p>
      </>}

      <div className="grid" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
        <div className="card" style={{ padding: 8 }}>
          {handoffs.map(h => {
            const p = progressOf(h)
            return (
              <div
                key={h.id}
                onClick={() => setSelectedId(h.id)}
                style={{ padding: 10, borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: h.id === selectedId ? 'var(--panel2)' : 'transparent' }}
              >
                <div className="spread"><span style={{ fontWeight: 700 }}>{h.lead.firma}</span><span className="small muted">%{p}</span></div>
                <div className="progress" style={{ marginTop: 6 }}><div style={{ width: p + '%' }} /></div>
                <div className="small muted" style={{ marginTop: 4 }}>{(h.hizmetler || []).join(', ')}</div>
              </div>
            )
          })}
        </div>

        {cur && (
          <div>
            <div className="card mb">
              <div className="spread">
                <h3 style={{ fontSize: 16 }}>{cur.lead.firma} — Operasyon Briefi</h3>
                <span className={'pill ' + (pct === 100 ? 'lime' : 'amber')}>Teslimat: %{pct}</span>
              </div>
              <div className="progress mb" style={{ marginTop: 8 }}><div style={{ width: pct + '%' }} /></div>
              <div className="grid g2">
                <div>
                  <div className="small muted">MÜŞTERİ PROBLEMİ (satıştan)</div>
                  <div className="script-box mb">{cur.problem || '— toplantı notu bulunamadı —'}</div>
                  <div className="small muted">HEDEFİ</div>
                  <div className="script-box mb">{cur.hedef || '—'}</div>
                  <div className="small muted">BÜTÇE</div>
                  <div className="script-box">{cur.butce || '—'}</div>
                </div>
                <div>
                  <EditableField label="Verilen Sözler" value={cur.verilenSozler} onChange={v => patch({ verilenSozler: v })} textarea />
                  <EditableField label="Beklentiler" value={cur.beklentiler} onChange={v => patch({ beklentiler: v })} textarea />
                  <EditableField label="Riskler" value={cur.riskler} onChange={v => patch({ riskler: v })} textarea />
                </div>
              </div>
              <div className="grid g4 mt">
                <EditableField label="Sorumlu" value={cur.sorumlu} onChange={v => patch({ sorumlu: v })} />
                <label className="field"><span>Başlangıç</span><input type="date" value={cur.baslangicTarihi?.slice(0, 10) || ''} onChange={e => patch({ baslangicTarihi: e.target.value })} /></label>
                <label className="field"><span>Deadline</span><input type="date" value={cur.teslimTarihi?.slice(0, 10) || ''} onChange={e => patch({ teslimTarihi: e.target.value })} /></label>
                <EditableField label="Gerekli Materyaller" value={cur.materyaller} onChange={v => patch({ materyaller: v })} />
              </div>
              <EditableField label="Özel İstekler" value={cur.ozelIstekler} onChange={v => patch({ ozelIstekler: v })} />
              <button className="btn ghost sm" onClick={() => openLead(cur.leadId)}>Lead kartını aç →</button>
            </div>

            <div className="grid g2">
              <div>
                {Object.entries(cur.checklist || {}).map(([hizmet, items]) => (
                  <div key={hizmet} className="card mb">
                    <h3>📋 {hizmet} — Teslimat Checklist</h3>
                    {items.map((it, i) => (
                      <label key={i} className="check">
                        <input type="checkbox" checked={it.done} onChange={() => dispatch({ type: 'TOGGLE_HANDOFF_CHECK', id: cur.id, hizmet, index: i })} />
                        <span style={it.done ? { textDecoration: 'line-through', color: 'var(--muted)' } : {}}>{it.madde}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              <div className="card">
                <h3>🚀 Onboarding</h3>
                {(cur.onboarding || []).map((it, i) => (
                  <label key={i} className="check">
                    <input type="checkbox" checked={it.done} onChange={() => dispatch({ type: 'TOGGLE_HANDOFF_CHECK', id: cur.id, hizmet: null, index: i })} />
                    <span style={it.done ? { textDecoration: 'line-through', color: 'var(--muted)' } : {}}>{it.madde}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
