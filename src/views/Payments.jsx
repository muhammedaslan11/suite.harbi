import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { fmtTL, fmtDate } from '../utils.js'
import { PAYMENT_TYPES } from '../data/constants.js'
import Onboarding from '../components/Onboarding.jsx'

export default function Payments({ openLead }) {
  const { state, dispatch } = useStore()
  const [form, setForm] = useState({ leadId: '', tutar: '', vade: '', tip: 'Retainer' })
  const now = Date.now()

  const rows = state.payments
    .map(p => ({ ...p, lead: state.leads.find(l => l.id === p.leadId), gecikti: p.durum === 'Bekliyor' && new Date(p.vade) < now }))
    .sort((a, b) => new Date(a.vade) - new Date(b.vade))

  const bekleyen = rows.filter(p => p.durum === 'Bekliyor')
  const geciken = bekleyen.filter(p => p.gecikti)
  const tahsil = rows.filter(p => p.durum === 'Ödendi').reduce((a, p) => a + p.tutar, 0)

  const nextRetainer = (leadId) => {
    const son = rows.filter(p => p.leadId === leadId && p.tip === 'Retainer')
      .sort((a, b) => new Date(b.vade) - new Date(a.vade))[0]
    if (!son) return
    const vade = new Date(son.vade); vade.setMonth(vade.getMonth() + 1)
    dispatch({ type: 'ADD_PAYMENT', payment: { leadId, tutar: son.tutar, vade: vade.toISOString(), tip: 'Retainer', durum: 'Bekliyor' } })
  }

  return (
    <div>
      <h1 className="page-title">Tahsilat</h1>
      <p className="page-sub">Peşinat, taksit ve retainer takibi — geciken tahsilat nakit akışının sessiz katilidir.</p>
      <Onboarding
        id="payments"
        steps={[
          'Satış kazanılınca ödeme planı buraya otomatik düşer (teklifin ödeme planından).',
          'Para geldiğinde "✓ Ödendi" işaretle; retainer\'da "+ Gelecek ay" ile yeni dönemi aç.',
          'Vadesi geçen kayıt kırmızıya döner ve Command Center Finans bölümünde uyarır.'
        ]}
      />

      <div className="grid g3 mb">
        <div className="card kpi"><div className="label">Tahsilat Bekleyen</div><div className="value">{fmtTL(bekleyen.reduce((a, p) => a + p.tutar, 0))}</div><div className="sub">{bekleyen.length} kayıt</div></div>
        <div className="card kpi"><div className="label">Geciken</div><div className="value" style={{ color: geciken.length ? 'var(--red)' : undefined }}>{fmtTL(geciken.reduce((a, p) => a + p.tutar, 0))}</div><div className="sub">{geciken.length} kayıt</div></div>
        <div className="card kpi accent"><div className="label">Tahsil Edilen (toplam)</div><div className="value">{fmtTL(tahsil)}</div></div>
      </div>

      <div className="card mb">
        <h3>+ Manuel Ödeme Kaydı</h3>
        <div className="flex" style={{ flexWrap: 'wrap' }}>
          <select value={form.leadId} onChange={e => setForm({ ...form, leadId: e.target.value })} style={{ maxWidth: 220 }}>
            <option value="">Müşteri seçin…</option>
            {state.leads.filter(l => l.status === 'Kazanıldı').map(l => <option key={l.id} value={l.id}>{l.firma}</option>)}
          </select>
          <input type="number" placeholder="Tutar (TL)" value={form.tutar} onChange={e => setForm({ ...form, tutar: e.target.value })} style={{ maxWidth: 140 }} />
          <input type="date" value={form.vade} onChange={e => setForm({ ...form, vade: e.target.value })} style={{ maxWidth: 160 }} />
          <select value={form.tip} onChange={e => setForm({ ...form, tip: e.target.value })} style={{ maxWidth: 140 }}>
            {PAYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <button
            className="btn sm"
            disabled={!form.leadId || !form.tutar || !form.vade}
            onClick={() => {
              dispatch({ type: 'ADD_PAYMENT', payment: { leadId: form.leadId, tutar: Number(form.tutar), vade: new Date(form.vade).toISOString(), tip: form.tip, durum: 'Bekliyor' } })
              setForm({ leadId: '', tutar: '', vade: '', tip: 'Retainer' })
            }}
          >Ekle</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead><tr><th>Müşteri</th><th>Tip</th><th>Tutar</th><th>Vade</th><th>Durum</th><th></th></tr></thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => p.lead && openLead(p.lead.id)}>{p.lead?.firma || '—'}</td>
                <td><span className="pill">{p.tip}</span></td>
                <td style={{ fontWeight: 700 }}>{fmtTL(p.tutar)}</td>
                <td className={p.gecikti ? 'overdue' : ''}>{fmtDate(p.vade)}{p.gecikti && ' ⚠️'}</td>
                <td>
                  <span className={'pill ' + (p.durum === 'Ödendi' ? 'lime' : p.gecikti ? 'red' : 'amber')}>
                    {p.gecikti ? 'Gecikti' : p.durum}
                  </span>
                </td>
                <td>
                  <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
                    {p.durum === 'Bekliyor' && (
                      <button className="btn sm" onClick={() => dispatch({ type: 'UPDATE_PAYMENT', id: p.id, patch: { durum: 'Ödendi' } })}>✓ Ödendi</button>
                    )}
                    {p.tip === 'Retainer' && p.durum === 'Ödendi' && (
                      <button className="btn ghost sm" onClick={() => nextRetainer(p.leadId)}>+ Gelecek ay</button>
                    )}
                    <button className="btn danger sm" onClick={() => dispatch({ type: 'DELETE_PAYMENT', id: p.id })}>Sil</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="empty">Ödeme kaydı yok — bir satış kazanıldığında otomatik oluşur</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
