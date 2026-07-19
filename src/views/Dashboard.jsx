import React from 'react'
import { useStore } from '../store.jsx'
import { forecast, fmtTL, leadScore, scorePriority, fmtDate, monthlyPerformance } from '../utils.js'
import { Ring, Spark, Funnel } from '../components/widgets.jsx'
import Onboarding from '../components/Onboarding.jsx'
import { OPEN_STAGES } from '../data/constants.js'

const DAY = 86400000

function within(iso, days) {
  return Date.now() - new Date(iso).getTime() < days * DAY
}

function topBy(items, keyFn) {
  const counts = {}
  for (const it of items) {
    const k = keyFn(it)
    if (!k) continue
    counts[k] = (counts[k] || 0) + 1
  }
  const arr = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return arr.length ? `${arr[0][0]} (${arr[0][1]})` : '—'
}

export default function Dashboard({ openLead }) {
  const { state } = useStore()
  const { leads, proposals, tasks, meetings } = state
  const f = forecast(leads, proposals)

  const won = leads.filter(l => l.status === 'Kazanıldı')
  const lost = leads.filter(l => l.status === 'Kaybedildi')
  const open = leads.filter(l => !['Kazanıldı', 'Kaybedildi', 'Ertelendi'].includes(l.status))
  const closeRate = (won.length + lost.length) ? Math.round(won.length / (won.length + lost.length) * 100) : 0

  const newToday = leads.filter(l => within(l.createdAt, 1)).length
  const newWeek = leads.filter(l => within(l.createdAt, 7)).length
  const sentProposals = proposals.filter(p => !['Taslak', 'Hazırlanıyor'].includes(p.status))
  const overdue = tasks.filter(t => !t.done && new Date(t.dueDate) < Date.now())

  // Kaybedilme sebepleri dağılımı
  const lostReasons = topBy(lost, l => l.kayipSebebi)
  const avgProposal = sentProposals.length
    ? sentProposals.reduce((a, p) => a + Number(p.fiyat || 0), 0) / sentProposals.length
    : 0

  const hotLeads = open
    .map(l => ({ ...l, _score: leadScore(l) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 5)

  // Son 14 günün lead akışı (sparkline)
  const leadTrend = Array.from({ length: 14 }, (_, i) => {
    const gun = new Date(); gun.setHours(0, 0, 0, 0); gun.setDate(gun.getDate() - (13 - i))
    const sonraki = new Date(gun); sonraki.setDate(sonraki.getDate() + 1)
    return leads.filter(l => { const d = new Date(l.createdAt); return d >= gun && d < sonraki }).length
  })

  // Pipeline hunisi: açık aşamalar (boşları atla)
  const funnelRows = OPEN_STAGES
    .map(s => {
      const items = leads.filter(l => l.status === s)
      return { label: s, value: items.length, sub: fmtTL(items.reduce((a, l) => a + (Number(l.tahminiIlkSatis) || 0), 0)) }
    })
    .filter(r => r.value > 0)

  const ortSkor = open.length ? Math.round(open.reduce((a, l) => a + leadScore(l), 0) / open.length) : 0

  return (
    <div>
      <h1 className="page-title">KPI Dashboard</h1>
      <p className="page-sub">Satış, pipeline ve gelir görünümü — tek bakışta.</p>
      <Onboarding
        id="dashboard"
        steps={[
          'Halkalar sağlığı özetler: kapanış oranı, ortalama skor, aktif fırsat.',
          '"Beklenen Gelir" = teklif değeri × kapanış olasılığı — olasılıkları lead kartından güncel tut.',
          'En sıcak lead\'e tıkla, doğrudan kartına git.'
        ]}
        config="Hedef kartı için Ayarlar → Ekip & Hedefler'e aylık ciro hedefi gir · Para birimi: Ayarlar → Görünüm."
      />

      <div className="grid mb" style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 8 }}>
          <Ring value={closeRate} label="Kapanış Oranı" />
          <Ring value={ortSkor} label="Ort. Lead Skoru" display={ortSkor} />
          <Ring value={open.length} max={Math.max(leads.length, 1)} label="Aktif Fırsat" display={open.length} color="var(--blue)" />
        </div>
        <div className="card kpi">
          <div className="label">Lead Akışı (14 gün)</div>
          <div className="value">{newToday} <span className="sub" style={{ fontSize: 13 }}>bugün · {newWeek} bu hafta</span></div>
          <div className="mt" style={{ marginTop: 8 }}><Spark data={leadTrend} width={200} height={40} /></div>
        </div>
        <div className="card kpi">
          <div className="label">Gönderilen Teklif</div>
          <div className="value">{sentProposals.length}</div>
          <div className="sub">Ortalama {fmtTL(avgProposal)} · {won.length} kazanıldı / {lost.length} kaybedildi</div>
        </div>
      </div>

      <div className="grid g4 mb">
        <div className="card kpi accent"><div className="label">Pipeline Değeri</div><div className="value">{fmtTL(f.pipeline)}</div></div>
        <div className="card kpi accent"><div className="label">Beklenen Gelir (Forecast)</div><div className="value">{fmtTL(f.beklenen)}</div><div className="sub">Teklif değeri × kapanış olasılığı</div></div>
        <div className="card kpi"><div className="label">Kesinleşen Gelir</div><div className="value">{fmtTL(f.kesin)}</div><div className="sub" title="MRR (Monthly Recurring Revenue): aylık düzenli tekrarlayan gelir — retainer sözleşmelerinin toplamı">+ {fmtTL(f.mrr)} / ay retainer (MRR ⓘ)</div></div>
        <div className="card kpi"><div className="label">Riskli Gelir</div><div className="value" style={{ color: 'var(--red)' }}>{fmtTL(f.riskli)}</div><div className="sub">Olasılık ≤ %25 olan fırsatlar</div></div>
      </div>

      {(() => {
        const ekip = state.settings?.ekip?.filter(u => u.aktif) || []
        const hedefli = ekip.filter(u => state.settings.hedefler?.[u.id]?.ciro)
        if (!hedefli.length) return null
        const kalanGun = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()
        return (
          <div className="card mb">
            <div className="spread">
              <h3>🎯 Aylık Hedefler</h3>
              <span className="small muted">Ay sonuna {kalanGun} gün</span>
            </div>
            <div className="grid g3">
              {hedefli.map(u => {
                const h = state.settings.hedefler[u.id]
                const p = monthlyPerformance(state, u.ad)
                const pct = Math.min(100, Math.round(p.ciro / h.ciro * 100))
                return (
                  <div key={u.id}>
                    <div className="spread small"><span style={{ fontWeight: 700 }}>{u.ad}</span><span className={pct >= 100 ? 'score-hi' : ''}>%{pct}</span></div>
                    <div className="progress" style={{ margin: '4px 0' }}><div style={{ width: pct + '%' }} /></div>
                    <div className="small muted">{fmtTL(p.ciro)} / {fmtTL(h.ciro)} · {p.toplanti} toplantı{h.toplanti ? `/${h.toplanti}` : ''} · {p.teklif} teklif{h.teklif ? `/${h.teklif}` : ''}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {funnelRows.length > 0 && (
        <div className="card mb">
          <h3>🔀 Pipeline Hunisi</h3>
          <Funnel rows={funnelRows} />
        </div>
      )}

      <div className="grid g3 mb">
        <div className="card">
          <h3>🔥 En Sıcak Lead'ler</h3>
          {hotLeads.length === 0 && <div className="empty">Aktif lead yok</div>}
          {hotLeads.map(l => (
            <div key={l.id} className="spread" style={{ padding: '7px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => openLead(l.id)}>
              <div>
                <div style={{ fontWeight: 600 }}>{l.firma}</div>
                <div className="small muted">{l.status} · {l.potansiyelDeger || '—'}</div>
              </div>
              <div className={'score-ring ' + (l._score >= 70 ? 'score-hi' : l._score >= 40 ? 'score-mid' : 'score-lo')}>{l._score}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>⏰ Geciken Görevler ({overdue.length})</h3>
          {overdue.length === 0 && <div className="empty">Geciken görev yok 🎉</div>}
          {overdue.slice(0, 6).map(t => {
            const lead = leads.find(l => l.id === t.leadId)
            return (
              <div key={t.id} style={{ padding: '7px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => lead && openLead(lead.id)}>
                <div style={{ fontWeight: 600 }}>{t.baslik}</div>
                <div className="small"><span className="overdue">{fmtDate(t.dueDate)}</span> <span className="muted">· {lead?.firma || '—'}</span></div>
              </div>
            )
          })}
        </div>
        <div className="card">
          <h3>📈 Haftalık / Aylık Özet</h3>
          <table>
            <tbody>
              <tr><td className="muted">En iyi lead kaynağı</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{topBy(leads, l => l.kaynak)}</td></tr>
              <tr><td className="muted">En çok ilgi gören hizmet</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{topBy(leads.flatMap(l => (l.ilgiHizmetler || []).map(h => ({ h }))), x => x.h)}</td></tr>
              <tr><td className="muted">En çok kapanan sektör</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{topBy(won, l => l.sektor)}</td></tr>
              <tr><td className="muted">En sık kayıp sebebi</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{lostReasons}</td></tr>
              <tr><td className="muted">Toplantı sayısı</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{meetings.length}</td></tr>
              <tr><td className="muted">MRR</td><td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--lime)' }}>{fmtTL(f.mrr)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
