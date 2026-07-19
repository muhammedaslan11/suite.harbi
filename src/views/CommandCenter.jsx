import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { forecast, fmtTL, fmtDate, healthScore, riskLevel, daysUntil, nextBestSale, riskSignals, monthlyPerformance } from '../utils.js'
import { askJson } from '../ai.js'
import AiButton from '../components/AiButton.jsx'
import Onboarding from '../components/Onboarding.jsx'

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

function Section({ icon, title, children }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: 14 }}>{icon} {title}</h3>
      {children}
    </div>
  )
}

const Row = ({ label, value, tone }) => (
  <div className="spread" style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
    <span className="muted small">{label}</span>
    <span style={{ fontWeight: 700, color: tone ? `var(--${tone})` : undefined }}>{value}</span>
  </div>
)

export default function CommandCenter({ openLead }) {
  const { state } = useStore()
  const { leads, tasks, handoffs, customers, proposals, payments, settings, dojoSessions } = state
  const [aiPlan, setAiPlan] = useState(null) // { leadId, maddeler }
  const f = forecast(leads, proposals)

  const bekleyenOdeme = payments.filter(p => p.durum === 'Bekliyor')
  const gecikenOdeme = bekleyenOdeme.filter(p => new Date(p.vade) < Date.now())

  const won = leads.filter(l => l.status === 'Kazanıldı')
  const lost = leads.filter(l => l.status === 'Kaybedildi')
  const open = leads.filter(l => !['Kazanıldı', 'Kaybedildi', 'Ertelendi'].includes(l.status))

  const overdue = tasks.filter(t => !t.done && new Date(t.dueDate) < Date.now())
  const upcoming = handoffs.filter(h => h.teslimTarihi && daysUntil(h.teslimTarihi) >= 0 && daysUntil(h.teslimTarihi) <= 14)
  const activeHandoffs = handoffs.filter(h => {
    const items = [...Object.values(h.checklist || {}).flat(), ...(h.onboarding || [])]
    return items.some(x => !x.done)
  })

  const cs = customers.map(c => ({ ...c, lead: leads.find(l => l.id === c.leadId), score: healthScore(c) })).filter(c => c.lead)
  const healthy = cs.filter(c => c.score >= 80)
  const risky = cs.filter(c => c.score < 60)
  const renewals = cs.filter(c => c.renewalTarihi && daysUntil(c.renewalTarihi) <= 60 && daysUntil(c.renewalTarihi) >= 0)
  const upsells = cs.map(c => ({ c, nbs: nextBestSale(c.lead) })).filter(x => x.nbs)

  const avgCustomerValue = won.length
    ? won.reduce((a, l) => a + (Number(l.tahminiIlkSatis) || 0) + (Number(l.tahminiRetainer) || 0) * 12, 0) / won.length
    : 0

  return (
    <div>
      <h1 className="page-title">Agency Command Center</h1>
      <p className="page-sub">Yönetici görünümü: satış, operasyon, finans, müşteri başarısı ve büyüme — tek ekranda.</p>
      <Onboarding
        id="command"
        steps={[
          'Haftada bir buradan başla: kırmızılar (geciken tahsilat/görev, riskli müşteri) aksiyon listendir.',
          'Riskli müşteride "🤖 Kurtarma planı" 3 adımlık öneri üretir.',
          'Büyüme bölümü hangi kaynağın/hizmetin gerçekten kazandırdığını gösterir — bütçeyi ona kaydır.'
        ]}
        config="Hedefler ve leaderboard: Ayarlar → Ekip & Hedefler · Dojo ortalaması otomatik işlenir."
      />

      <div className="grid g3 mb">
        <Section icon="💼" title="Satış">
          <Row label="Toplam lead" value={leads.length} />
          <Row label="Aktif fırsat" value={open.length} />
          <Row label="Pipeline değeri" value={fmtTL(f.pipeline)} tone="lime" />
          <Row label="Kazanılan müşteri" value={won.length} tone="lime" />
          <Row label="Kaybedilen" value={lost.length} tone="red" />
          <Row label="Beklenen gelir (forecast)" value={fmtTL(f.beklenen)} />
        </Section>

        <Section icon="🛠️" title="Operasyon">
          <Row label="Aktif proje (handoff)" value={activeHandoffs.length} />
          <Row label="Geciken görev" value={overdue.length} tone={overdue.length ? 'red' : undefined} />
          <Row label="14 gün içinde deadline" value={upcoming.length} tone={upcoming.length ? 'amber' : undefined} />
          {upcoming.slice(0, 3).map(h => {
            const lead = leads.find(l => l.id === h.leadId)
            return <div key={h.id} className="small" style={{ padding: '4px 0', cursor: 'pointer' }} onClick={() => openLead(h.leadId)}>⏳ {lead?.firma}: {fmtDate(h.teslimTarihi)}</div>
          })}
        </Section>

        <Section icon="💰" title="Finans">
          <Row label="Kesinleşen ciro" value={fmtTL(f.kesin)} tone="lime" />
          <div title="MRR: aylık düzenli tekrarlayan gelir (retainer toplamı)"><Row label="MRR (retainer) ⓘ" value={fmtTL(f.mrr)} tone="lime" /></div>
          <Row label="Tahsilat bekleyen" value={fmtTL(bekleyenOdeme.reduce((a, p) => a + p.tutar, 0))} tone="amber" />
          <Row label="Geciken tahsilat" value={fmtTL(gecikenOdeme.reduce((a, p) => a + p.tutar, 0))} tone={gecikenOdeme.length ? 'red' : undefined} />
          {gecikenOdeme.slice(0, 3).map(p => {
            const lead = leads.find(l => l.id === p.leadId)
            return <div key={p.id} className="small" style={{ padding: '3px 0', color: 'var(--red)', cursor: 'pointer' }} onClick={() => lead && openLead(lead.id)}>🔴 {lead?.firma}: {fmtTL(p.tutar)} ({fmtDate(p.vade)})</div>
          })}
          <Row label="Ortalama müşteri değeri (yıllık)" value={fmtTL(avgCustomerValue)} />
          <Row label="Bu ay / gelecek ay tahmini" value={`${fmtTL(f.buAy)} / ${fmtTL(f.gelecekAy)}`} />
          <Row label="90 günlük pipeline" value={fmtTL(f.pipeline90)} />
        </Section>
      </div>

      {(() => {
        const ekip = (settings?.ekip || []).filter(u => u.aktif)
        if (ekip.length < 2 && !dojoSessions.length) return null
        return (
          <div className="card mb">
            <h3>🏆 Satışçı Leaderboard (bu ay)</h3>
            <table>
              <thead><tr><th>Üye</th><th>Ciro</th><th>Toplantı</th><th>Teklif</th><th>Dojo Ort.</th></tr></thead>
              <tbody>
                {ekip.map(u => {
                  const p = monthlyPerformance(state, u.ad)
                  const dojo = dojoSessions.filter(d => d.uye === u.ad)
                  const ort = dojo.length ? Math.round(dojo.reduce((a, d) => a + d.skor, 0) / dojo.length) : null
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.ad}</td>
                      <td>{fmtTL(p.ciro)}</td>
                      <td>{p.toplanti}</td>
                      <td>{p.teklif}</td>
                      <td>{ort !== null ? <span className={ort >= 70 ? 'score-hi' : ort >= 40 ? 'score-mid' : 'score-lo'}>{ort}/100</span> : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })()}

      <div className="grid g2">
        <Section icon="❤️" title="Müşteri Başarısı">
          <Row label="Sağlıklı müşteri" value={healthy.length} tone="lime" />
          <Row label="Riskli müşteri" value={risky.length} tone={risky.length ? 'red' : undefined} />
          <Row label="60 gün içinde renewal" value={renewals.length} tone={renewals.length ? 'amber' : undefined} />
          {cs.map(c => ({ c, sinyaller: riskSignals(c, c.lead, payments) }))
            .filter(x => x.sinyaller.length >= 1)
            .sort((a, b) => b.sinyaller.length - a.sinyaller.length)
            .slice(0, 4)
            .map(({ c, sinyaller }) => (
              <div key={c.leadId} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="spread">
                  <span className="small" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => openLead(c.leadId)}>
                    {sinyaller.length >= 2 ? '🚨' : '⚠️'} {c.lead.firma} <span className="muted">({c.score}/100)</span>
                  </span>
                  <AiButton
                    label="🤖 Kurtarma planı"
                    className="btn ghost sm"
                    onRun={async (settings) => {
                      const json = await askJson(settings, {
                        system: 'Sen bir müşteri başarısı (CS) uzmanısın. Risk sinyallerine bakıp müşteriyi kaybetmemek için somut plan yazarsın. SADECE JSON döndür.',
                        user: `MÜŞTERİ: ${c.lead.firma} (${(c.lead.aktifHizmetler || []).join(', ')})\nRİSK SİNYALLERİ: ${sinyaller.join('; ')}\nMemnuniyet: ${c.memnuniyet}/10, Health: ${c.score}/100\n\n{"maddeler":["3 somut kurtarma aksiyonu, en acili önce"]}`,
                        maxTokens: 600
                      })
                      setAiPlan({ leadId: c.leadId, firma: c.lead.firma, maddeler: json.maddeler || [] })
                    }}
                  />
                </div>
                <div className="small muted">{sinyaller.join(' · ')}</div>
              </div>
            ))}
          {aiPlan && (
            <div className="script-box mt">
              <div className="small" style={{ color: 'var(--lime)', fontWeight: 700 }}>🛟 {aiPlan.firma} — Kurtarma Planı</div>
              {aiPlan.maddeler.map((m, i) => <div key={i} className="small" style={{ padding: '3px 0' }}>{i + 1}. {m}</div>)}
            </div>
          )}
          {upsells.slice(0, 3).map(({ c, nbs }) => (
            <div key={c.leadId} className="small" style={{ padding: '4px 0', color: 'var(--lime)', cursor: 'pointer' }} onClick={() => openLead(c.leadId)}>
              💡 {c.lead.firma}: {nbs.oneriler.slice(0, 2).map(o => o.oneri).join(' + ')}
            </div>
          ))}
        </Section>

        <Section icon="📈" title="Büyüme">
          <Row label="En iyi lead kaynağı" value={topBy(leads, l => l.kaynak)} />
          <Row label="En çok satan hizmet" value={topBy(won.flatMap(l => (l.aktifHizmetler || []).map(h => ({ h }))), x => x.h)} />
          <Row label="En çok kapanan sektör" value={topBy(won, l => l.sektor)} />
          <Row label="En yüksek değerli kaynak" value={topBy(won, l => l.kaynak)} />
          <Row label="En sık kayıp sebebi" value={topBy(lost, l => l.kayipSebebi)} />
          <Row label="Kapanış oranı" value={(won.length + lost.length) ? `%${Math.round(won.length / (won.length + lost.length) * 100)}` : '—'} />
        </Section>
      </div>
    </div>
  )
}
