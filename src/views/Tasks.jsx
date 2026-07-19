import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { fmtDate, uid } from '../utils.js'
import { TASK_TYPES, FOLLOWUP_SCHEDULE } from '../data/constants.js'
import { toast } from '../components/Toast.jsx'

const FILTERS = ['Açık', 'Bugün', 'Geciken', 'Tamamlanan', 'Tümü']

export default function Tasks({ openLead, embedded }) {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState('Açık')
  const [newTitle, setNewTitle] = useState('')
  const [newLead, setNewLead] = useState('')

  const now = Date.now()
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999)

  const tasks = state.tasks
    .filter(t => {
      if (filter === 'Açık') return !t.done
      if (filter === 'Bugün') return !t.done && new Date(t.dueDate) <= endOfToday
      if (filter === 'Geciken') return !t.done && new Date(t.dueDate) < now
      if (filter === 'Tamamlanan') return t.done
      return true
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  const addTask = () => {
    if (!newTitle) return
    dispatch({
      type: 'ADD_TASK',
      task: { id: uid('T'), leadId: newLead || null, baslik: newTitle, tip: TASK_TYPES.GENEL, dueDate: new Date().toISOString(), done: false, note: '' }
    })
    setNewTitle('')
  }

  return (
    <div>
      {!embedded && <>
        <h1 className="page-title">Görevler & Follow-Up</h1>
        <p className="page-sub">Tüm görevlerin arşivi ve filtreli yönetimi.</p>
      </>}

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
        <div>
          <div className="flex mb">
            {FILTERS.map(f => (
              <button key={f} className={'btn sm ' + (filter === f ? '' : 'ghost')} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>

          <div className="card mb">
            <div className="flex">
              <input placeholder="Yeni görev…" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
              <select value={newLead} onChange={e => setNewLead(e.target.value)} style={{ maxWidth: 200 }}>
                <option value="">Lead yok</option>
                {state.leads.map(l => <option key={l.id} value={l.id}>{l.firma}</option>)}
              </select>
              <button className="btn sm" onClick={addTask}>Ekle</button>
            </div>
          </div>

          <div className="card">
            {tasks.length === 0 && <div className="empty">Görev yok</div>}
            {tasks.map(t => {
              const lead = state.leads.find(l => l.id === t.leadId)
              const late = !t.done && new Date(t.dueDate) < now
              return (
                <div key={t.id} className={'task-row' + (t.done ? ' done' : '')}>
                  <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: 'TOGGLE_TASK', id: t.id })} />
                  <div style={{ flex: 1 }}>
                    <div className="t-title">
                      {t.baslik} <span className="pill" style={{ marginLeft: 6 }}>{t.tip}</span>
                      {lead && (
                        <span className="pill blue" style={{ marginLeft: 6, cursor: 'pointer' }} onClick={() => openLead(lead.id)}>{lead.firma}</span>
                      )}
                    </div>
                    <div className="t-meta">{late ? <span className="overdue">Gecikti · {fmtDate(t.dueDate)}</span> : fmtDate(t.dueDate)}</div>
                    {t.note && <div className="script-box" style={{ marginTop: 6 }}>{t.note}</div>}
                  </div>
                  <button className="btn danger sm" onClick={() => {
                    dispatch({ type: 'DELETE_TASK', id: t.id })
                    toast('Görev silindi', { tone: 'danger', undo: () => dispatch({ type: 'ADD_TASK', task: t }) })
                  }}>Sil</button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h3>📞 Follow-Up Script Kütüphanesi</h3>
          <p className="small muted">Teklif gönderiminden sonraki takip aramaları için hazır açılışlar.</p>
          {FOLLOWUP_SCHEDULE.map(f => (
            <div key={f.gun} className="mb">
              <span className="pill lime">{f.gun}. gün</span>
              <div className="script-box">{f.script}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
