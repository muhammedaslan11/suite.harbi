import React, { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import { fmtDate, leadScore, waLink, mailtoLink } from '../utils.js'
import Tasks from './Tasks.jsx'
import Onboarding from '../components/Onboarding.jsx'

function ContactButtons({ lead, script }) {
  if (!lead) return null
  const wa = waLink(lead.telefon, script)
  const mail = mailtoLink(lead.email, 'Harbi Digital — Görüşmemiz hk.', script)
  return (
    <span className="flex" style={{ gap: 6 }}>
      {wa && <a className="btn ghost sm" href={wa} target="_blank" rel="noreferrer">📱</a>}
      {mail && <a className="btn ghost sm" href={mail}>✉️</a>}
    </span>
  )
}

function TaskLine({ t, lead, openLead, dispatch }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={'task-row' + (t.done ? ' done' : '')}>
      <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: 'TOGGLE_TASK', id: t.id })} />
      <div style={{ flex: 1 }}>
        <div className="t-title">
          {t.baslik} <span className="pill" style={{ marginLeft: 6 }}>{t.tip}</span>
          {lead && <span className="pill blue" style={{ marginLeft: 6, cursor: 'pointer' }} onClick={() => openLead(lead.id)}>{lead.firma}</span>}
        </div>
        <div className="t-meta">
          {new Date(t.dueDate) < Date.now() && !t.done
            ? <span className="overdue">Gecikti · {fmtDate(t.dueDate)}</span>
            : fmtDate(t.dueDate)}
          {t.note && <button className="btn ghost sm" style={{ marginLeft: 8, padding: '1px 8px' }} onClick={() => setOpen(!open)}>{open ? 'Script gizle' : 'Script göster'}</button>}
        </div>
        {open && t.note && <div className="script-box" style={{ marginTop: 6 }}>{t.note}</div>}
      </div>
      <ContactButtons lead={lead} script={t.note} />
    </div>
  )
}

export default function Agenda({ openLead }) {
  const { state, dispatch } = useStore()
  const { tasks, leads, activities } = state
  const [kisi, setKisi] = useState('') // sorumluya göre filtre
  const [sekme, setSekme] = useState('bugun') // bugun | arsiv
  const now = Date.now()
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999)
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)

  const leadOf = (t) => leads.find(l => l.id === t.leadId)
  const mine = (t) => { if (!kisi) return true; const l = leadOf(t); return l?.sorumlu === kisi }
  const overdue = tasks.filter(t => !t.done && new Date(t.dueDate) < startOfToday).filter(mine)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const today = tasks.filter(t => !t.done && new Date(t.dueDate) >= startOfToday && new Date(t.dueDate) <= endOfToday).filter(mine)
  const todayCalls = today.filter(t => ['Arama', 'Follow-Up'].includes(t.tip))
  const todayOther = today.filter(t => !['Arama', 'Follow-Up'].includes(t.tip))

  // Dokunulmamış sıcak lead'ler: skor >= 70, açık, 3+ gündür aktivitesiz
  const uc_gun = 3 * 86400000
  const hotIdle = leads
    .filter(l => !['Kazanıldı', 'Kaybedildi', 'Ertelendi'].includes(l.status))
    .map(l => ({ ...l, _score: leadScore(l) }))
    .filter(l => l._score >= 70)
    .filter(l => !kisi || l.sorumlu === kisi)
    .filter(l => {
      const last = activities.find(a => a.leadId === l.id)
      return !last || (now - new Date(last.at)) > uc_gun
    })

  const done = tasks.filter(t => t.done && new Date(t.dueDate) >= startOfToday).filter(mine).length
  const toplam = today.length + overdue.length
  const gunToplam = toplam + done
  const pct = gunToplam ? Math.round(done / gunToplam * 100) : 0

  // Tarayıcı bildirimi: geciken görev varsa (oturum başına 1 kez)
  const bildirimDestegi = typeof Notification !== 'undefined'
  const bildirVe = () => {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification('HARB! SUITE', { body: overdue.length ? `${overdue.length} geciken göreviniz var!` : 'Hatırlatıcılar açık — geciken görevlerde haber vereceğim.' })
    })
  }
  useEffect(() => {
    if (bildirimDestegi && Notification.permission === 'granted' && overdue.length && !window.__harbNotified) {
      window.__harbNotified = true
      new Notification('HARB! SUITE', { body: `⏰ ${overdue.length} geciken göreviniz var` })
    }
  }, [])

  return (
    <div>
      <div className="spread">
        <h1 className="page-title">Bugünüm</h1>
        <span className="flex" style={{ gap: 8 }}>
          {(state.settings.ekip || []).length > 1 && (
            <select value={kisi} onChange={e => setKisi(e.target.value)} style={{ width: 'auto' }} aria-label="Sorumluya göre filtrele">
              <option value="">👥 Tüm ekip</option>
              {state.settings.ekip.map(u => <option key={u.id} value={u.ad}>{u.ad}</option>)}
            </select>
          )}
          {bildirimDestegi && Notification.permission !== 'granted' && (
            <button className="btn ghost sm" onClick={bildirVe}>🔔 Hatırlatıcıları aç</button>
          )}
        </span>
      </div>
      <p className="page-sub" style={{ marginBottom: 8 }}>
        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} ·
        {' '}{toplam === 0 ? 'Bugün için açık iş yok 🎉' : `${toplam} açık iş`}{done > 0 && ` · ${done} tamamlandı`}
      </p>
      <Onboarding
        id="agenda"
        steps={[
          'Güne buradan başla: geciken + bugünkü aramalar öncelik sırasında.',
          'Görevin yanındaki 📱/✉️ ile script hazır şekilde WhatsApp/e-posta aç.',
          '"Tüm Görevler" sekmesinden geçmişe ve gelecek follow-up\'lara ulaş.'
        ]}
        config="Follow-up günleri: Ayarlar → Follow-Up Takvimi · Bildirimler: 🔔 butonu · Ekip filtresi sağ üstte."
      />
      <div className="tabs">
        <button className={'tab' + (sekme === 'bugun' ? ' active' : '')} onClick={() => setSekme('bugun')}>☀️ Bugün</button>
        <button className={'tab' + (sekme === 'arsiv' ? ' active' : '')} onClick={() => setSekme('arsiv')}>🗂️ Tüm Görevler & Scriptler</button>
      </div>
      {sekme === 'arsiv' && <Tasks openLead={openLead} embedded />}
      {sekme === 'bugun' && <>{null}</>}
      <div style={{ display: sekme === 'bugun' ? 'block' : 'none' }}>
      {gunToplam > 0 && (
        <div className="mb" style={{ maxWidth: 420 }}>
          <div className="spread small muted" style={{ marginBottom: 3 }}><span>Günün ilerlemesi</span><span>{done}/{gunToplam} {pct >= 90 && pct < 100 ? '— son düzlük! 💪' : pct === 100 ? '— gün tamam! 🏁' : ''}</span></div>
          <div className="progress"><div style={{ width: pct + '%' }} /></div>
        </div>
      )}

      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div>
          {overdue.length > 0 && (
            <div className="card mb" style={{ borderColor: '#5b2b2b' }}>
              <h3 style={{ color: 'var(--red)' }}>🔴 Geciken ({overdue.length})</h3>
              {overdue.map(t => <TaskLine key={t.id} t={t} lead={leadOf(t)} openLead={openLead} dispatch={dispatch} />)}
            </div>
          )}
          <div className="card mb">
            <h3>📞 Bugünkü Aramalar & Follow-Up'lar ({todayCalls.length})</h3>
            {todayCalls.length === 0 && <div className="empty">Bugün planlanmış arama yok</div>}
            {todayCalls.map(t => <TaskLine key={t.id} t={t} lead={leadOf(t)} openLead={openLead} dispatch={dispatch} />)}
          </div>
          <div className="card">
            <h3>📋 Bugünkü Diğer Görevler ({todayOther.length})</h3>
            {todayOther.length === 0 && <div className="empty">Başka görev yok</div>}
            {todayOther.map(t => <TaskLine key={t.id} t={t} lead={leadOf(t)} openLead={openLead} dispatch={dispatch} />)}
          </div>
        </div>
        <div className="card">
          <h3>🔥 Dokunulmamış Sıcak Lead'ler ({hotIdle.length})</h3>
          <p className="small muted">Skoru 70+ olup 3+ gündür hiçbir aktivite görmeyen fırsatlar — soğumadan arayın.</p>
          {hotIdle.length === 0 && <div className="empty">Tüm sıcak lead'ler taze 👌</div>}
          {hotIdle.map(l => (
            <div key={l.id} className="spread" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ cursor: 'pointer' }} onClick={() => openLead(l.id)}>
                <div style={{ fontWeight: 600 }}>{l.firma}</div>
                <div className="small muted">{l.status} · {l.sorumlu || 'atanmamış'}</div>
              </div>
              <div className="flex" style={{ gap: 6 }}>
                <span className="score-ring score-hi">{l._score}</span>
                <ContactButtons lead={l} script="" />
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
