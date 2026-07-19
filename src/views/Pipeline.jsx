import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { leadScore, fmtTL, initials } from '../utils.js'
import { STAGES, LOST_REASONS, stageColor } from '../data/constants.js'
import { toast, useEscape } from '../components/Toast.jsx'
import Onboarding from '../components/Onboarding.jsx'

// Hat Görünümü: pipeline'ı metro hattı gibi çizer — durak başına fırsatlar,
// ok butonlarıyla tek tıkla ilerletme, yatay kaydırma derdi yok, mobilde de rahat.
function HatGorunumu({ state, move, setLostFor, openLead }) {
  return (
    <div className="card" style={{ paddingBottom: 4 }}>
      {STAGES.map((stage, si) => {
        const items = state.leads.filter(l => l.status === stage)
        const sum = items.reduce((a, l) => a + (Number(l.tahminiIlkSatis) || 0), 0)
        const renk = stageColor(stage)
        const sonrakiRenk = stageColor(STAGES[si + 1] || stage)
        const kapali = ['Kazanıldı', 'Kaybedildi', 'Ertelendi'].includes(stage)
        return (
          <div key={stage} className={'rail-row' + (items.length ? ' dolu' : ' rail-bos')} style={{ '--rail-renk': renk, '--rail-sonraki': sonrakiRenk }}>
            <div className="rail-line"><div className="rail-dot" /><div className="rail-track" /></div>
            <div className="rail-content">
              <div className="rail-head">
                <span className="rail-title">{stage}</span>
                {items.length > 0 && <span className="pill" style={{ borderColor: renk, color: renk }}>{items.length}</span>}
                {sum > 0 && <span className="small muted">{fmtTL(sum)}</span>}
              </div>
              {items.length > 0 && (
                <div className="rail-cards">
                  {items.map(l => {
                    const s = leadScore(l)
                    return (
                      <div key={l.id} className="rail-card">
                        {!kapali && si > 0 && (
                          <button className="rail-move" title={`← ${STAGES[si - 1]}`} aria-label="Önceki aşama" onClick={() => move(l, STAGES[si - 1])}>◀</button>
                        )}
                        <span style={{ minWidth: 0 }}>
                          <span className="rc-firma" onClick={() => openLead(l.id)}>{l.firma}</span>
                          <span className="rc-tutar"> · {fmtTL(l.tahminiIlkSatis)} · <span className={s >= 70 ? 'score-hi' : s >= 40 ? 'score-mid' : 'score-lo'}>{s}</span></span>
                        </span>
                        {l.sorumlu && <span className="avatar" title={l.sorumlu}>{initials(l.sorumlu)}</span>}
                        {!kapali && (
                          <>
                            <button
                              className="rail-move"
                              title={si + 1 < STAGES.indexOf('Kazanıldı') ? `→ ${STAGES[si + 1]}` : '→ Kazanıldı 🏆'}
                              aria-label="Sonraki aşama"
                              onClick={() => move(l, STAGES[si + 1])}
                            >▶</button>
                            <button className="rail-move kayip" title="Kaybedildi" aria-label="Kaybedildi" onClick={() => setLostFor(l.id)}>✕</button>
                          </>
                        )}
                        {kapali && stage !== 'Kazanıldı' && (
                          <button className="rail-move" title="Pipeline'a geri al" onClick={() => move(l, 'İhtiyaç Analizi')}>↩</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Pipeline({ openLead }) {
  const { state, dispatch } = useStore()
  const [gorunum, setGorunum] = useState(() => localStorage.getItem('harb-pipe-gorunum') || 'hat')
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)
  const [lostFor, setLostFor] = useState(null)
  const [lostReason, setLostReason] = useState('')

  useEscape(() => setLostFor(null))

  const move = (lead, stage) => {
    if (!stage || lead.status === stage) return
    if (stage === 'Kaybedildi') { setLostFor(lead.id); return }
    dispatch({ type: 'SET_STATUS', id: lead.id, status: stage })
    if (stage === 'Kazanıldı') toast(`🏆 ${lead.firma} kazanıldı! Handoff + müşteri kaydı oluşturuldu.`, { confetti: true })
    else toast(`✓ ${lead.firma} → ${stage}`)
  }

  const secGorunum = (g) => { setGorunum(g); localStorage.setItem('harb-pipe-gorunum', g) }

  const drop = (stage) => {
    setOverCol(null)
    if (!dragId) return
    const lead = state.leads.find(l => l.id === dragId)
    setDragId(null)
    if (lead) move(lead, stage)
  }

  return (
    <div>
      <div className="spread">
        <h1 className="page-title">Satış Pipeline</h1>
        <span className="flex" style={{ gap: 6 }}>
          <button className={'btn sm ' + (gorunum === 'hat' ? '' : 'ghost')} onClick={() => secGorunum('hat')}>🚇 Hat</button>
          <button className={'btn sm ' + (gorunum === 'kanban' ? '' : 'ghost')} onClick={() => secGorunum('kanban')}>📋 Kanban</button>
        </span>
      </div>
      <p className="page-sub">{gorunum === 'hat' ? 'Metro hattı görünümü: ◀▶ ile tek tıkla ilerlet, ✕ ile kaybet — kaydırma yok, her şey gözünün önünde.' : 'Kartları sürükleyerek aşama değiştirin — her geçişte otomatik görevler oluşur.'}</p>
      <Onboarding
        id="pipeline"
        steps={[
          'Kartı yeni aşamaya sürükle; sistem gerekli görevi (ara/not/teklif) kendisi kurar.',
          '"Kaybedildi"ye bırakınca sebep sorulur — 30 gün sonra nurturing görevi otomatik.',
          'Klavye tercih edersen: lead kartındaki aşama şeridi Tab + Enter ile çalışır.'
        ]}
        config="Kolon renkleri aşama grubunu gösterir (mavi→giriş, amber→teklif, yeşil→kazanıldı)."
      />
      {gorunum === 'hat' && <HatGorunumu state={state} move={move} setLostFor={setLostFor} openLead={openLead} />}

      {gorunum === 'kanban' && <div className="kanban">
        {STAGES.map(stage => {
          const items = state.leads.filter(l => l.status === stage)
          const sum = items.reduce((a, l) => a + (Number(l.tahminiIlkSatis) || 0), 0)
          return (
            <div
              key={stage}
              className={'kcol' + (overCol === stage ? ' drag-over' : '')}
              style={{ '--kcol-renk': stageColor(stage) }}
              onDragOver={e => { e.preventDefault(); setOverCol(stage) }}
              onDragLeave={() => setOverCol(c => c === stage ? null : c)}
              onDrop={() => drop(stage)}
            >
              <div className="kcol-head">
                <span className="kcol-title">{stage}</span>
                <span className="kcol-sum">{items.length}</span>
              </div>
              {sum > 0 && <div className="kcol-sum" style={{ marginBottom: 8 }}>{fmtTL(sum)}</div>}
              {items.map(l => {
                const s = leadScore(l)
                return (
                  <div
                    key={l.id}
                    className="kcard"
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onClick={() => openLead(l.id)}
                  >
                    <div className="firma">{l.firma}</div>
                    <div className="muted small">{(l.ilgiHizmetler || []).slice(0, 2).join(', ') || l.sektor || '—'}</div>
                    <div className="meta">
                      <span>{fmtTL(l.tahminiIlkSatis)}</span>
                      <span className="flex" style={{ gap: 5 }}>
                        {l.sorumlu && <span className="avatar" title={l.sorumlu}>{initials(l.sorumlu)}</span>}
                        <span className={s >= 70 ? 'score-hi' : s >= 40 ? 'score-mid' : 'score-lo'}>{s}</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>}

      {lostFor && (
        <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setLostFor(null)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <h2>Kaybedilme Sebebi</h2>
            <p className="small muted">Kaybedilen lead için sebep zorunludur. 30 gün sonra otomatik tekrar temas görevi oluşturulur.</p>
            <label className="field"><span>Sebep *</span>
              <select value={lostReason} onChange={e => setLostReason(e.target.value)}>
                <option value="">Seçin…</option>{LOST_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </label>
            <div className="flex" style={{ justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setLostFor(null)}>Vazgeç</button>
              <button
                className="btn" disabled={!lostReason}
                onClick={() => {
                  dispatch({ type: 'SET_STATUS', id: lostFor, status: 'Kaybedildi', kayipSebebi: lostReason })
                  setLostFor(null); setLostReason('')
                }}
              >Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
