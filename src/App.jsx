import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Toaster } from './components/Toast.jsx'
import { useStore, getCurrentUser, logoutUser, getStorageMode } from './store.jsx'
import { leadScore, initials } from './utils.js'
import { NAV_ITEMS } from './data/constants.js'
import Dashboard from './views/Dashboard.jsx'
import Leads from './views/Leads.jsx'
import LeadDetail from './views/LeadDetail.jsx'
import Pipeline from './views/Pipeline.jsx'
import Proposals from './views/Proposals.jsx'
import Services from './views/Services.jsx'
import Objections from './views/Objections.jsx'
import Settings from './views/Settings.jsx'
import Customers from './views/Customers.jsx'
import CommandCenter from './views/CommandCenter.jsx'
import Agenda from './views/Agenda.jsx'
import Dojo from './views/Dojo.jsx'
import Payments from './views/Payments.jsx'
import Guide from './views/Guide.jsx'

const NAV = NAV_ITEMS

function GlobalSearch({ openLead }) {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  const results = useMemo(() => {
    if (q.trim().length < 2) return []
    const t = q.toLowerCase()
    return state.leads
      .filter(l => (l.firma + ' ' + (l.yetkili || '') + ' ' + (l.sektor || '') + ' ' + (l.sehir || '')).toLowerCase().includes(t))
      .slice(0, 7)
  }, [q, state.leads])

  return (
    <div className="search-wrap">
      <span className="search-icon">🔍</span>
      <input
        ref={inputRef}
        className="global-search"
        placeholder="Lead ara: firma, yetkili, sektör, şehir…  ( / )"
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') setQ('')
          if (e.key === 'Enter' && results[0]) { openLead(results[0].id); setQ('') }
        }}
      />
      {results.length > 0 && (
        <div className="search-results">
          {results.map(l => (
            <div key={l.id} className="sr-item" onMouseDown={() => { openLead(l.id); setQ('') }}>
              <span>
                <b>{l.firma}</b>
                <span className="muted small"> · {l.yetkili || '—'} · {l.sektor || '—'}</span>
              </span>
              <span className="flex" style={{ gap: 6 }}>
                <span className="pill blue">{l.status}</span>
                <span className={'score-ring small ' + (leadScore(l) >= 70 ? 'score-hi' : leadScore(l) >= 40 ? 'score-mid' : 'score-lo')}>{leadScore(l)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const { state } = useStore()
  const ui = state.settings.ui || {}
  // Eski modül id'leri birleştirilmiş ekranlara yönlenir (kayıtlı açılış ekranı tercihi bozulmasın)
  const ALIAS = { tasks: 'agenda', handoff: 'customers', 'customer-success': 'customers' }
  const [view, setView] = useState(ALIAS[ui.acilisEkrani] || ui.acilisEkrani || 'agenda')
  const [selectedLead, setSelectedLead] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const openLead = (id) => { setSelectedLead(id); setView('lead-detail'); setMenuOpen(false) }

  // Klavye kısayolları: "/" arama, "n" yeni lead (input içinde yazarken devre dışı)
  useEffect(() => {
    const h = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === '/') { e.preventDefault(); document.querySelector('.global-search')?.focus() }
      if (e.key === 'n') { setView('leads'); setSelectedLead(null); setTimeout(() => window.dispatchEvent(new CustomEvent('harb:new-lead')), 50) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const openTasks = state.tasks.filter(t => !t.done).length
  const gizli = new Set(ui.gizliModuller || [])
  // Rol yetkisi: "kullanici" yönetim ekranlarını görmez
  const me = getCurrentUser()
  if (me?.rol === 'kullanici') { gizli.add('command-center'); gizli.add('payments') }

  // Marka adı: "X! SUITE" kalıbındaki ilk harf ve ünlem vurgulanır
  const marka = ui.markaAdi || 'HARB! SUITE'

  const visibleNav = NAV.filter((n, i) => {
    if (!n.section) return !gizli.has(n.id) || n.id === 'settings'
    // Bölüm başlığı: altında görünür öğe kaldıysa göster
    for (let j = i + 1; j < NAV.length && !NAV[j].section; j++) {
      if (!gizli.has(NAV[j].id) || NAV[j].id === 'settings') return true
    }
    return false
  })

  return (
    <>
      <div className={'scrim' + (menuOpen ? ' show' : '')} onClick={() => setMenuOpen(false)} />
      <aside className={'sidebar' + (menuOpen ? ' open' : '')}>
        <div className="logo">
          <span className="h">{marka.charAt(0)}</span>{marka.slice(1).replace(/!/, '')}{marka.includes('!') && <span className="h">!</span>}
        </div>
        <div className="logo-sub">Agency Revenue OS</div>
        {visibleNav.map((n, i) =>
          n.section
            ? <div key={'s' + i} className="nav-section">{n.section}</div>
            : (
              <button
                key={n.id}
                className={'nav-item' + ((view === n.id || (view === 'lead-detail' && n.id === 'leads')) ? ' active' : '')}
                onClick={() => { setView(n.id); setSelectedLead(null); setMenuOpen(false) }}
              >
                {n.label}
                {n.id === 'agenda' && openTasks > 0 && <span className="badge">{openTasks}</span>}
              </button>
            )
        )}
        {me && getStorageMode() === 'sqlite' && (
          <div className="user-chip">
            <span className="avatar">{initials(me.ad)}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.ad}</div>
              <div className="small muted">{{ kurucu: '👑 Kurucu', admin: '🛡️ Admin', kullanici: '💼 Satış' }[me.rol]}</div>
            </span>
            <button className="btn ghost sm" title="Çıkış yap" aria-label="Çıkış yap" onClick={logoutUser}>⏻</button>
          </div>
        )}
      </aside>
      <main className="main">
        <div className="topbar">
          <button className="btn ghost sm menu-btn" aria-label="Menüyü aç" onClick={() => setMenuOpen(true)}>☰</button>
          <GlobalSearch openLead={openLead} />
          <span className="tb-date">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} · {ui.ajansAdi || 'Harbi Digital'}
          </span>
        </div>
        {view === 'agenda' && <Agenda openLead={openLead} />}
        {view === 'dojo' && <Dojo />}
        {view === 'payments' && <Payments openLead={openLead} />}
        {view === 'dashboard' && <Dashboard openLead={openLead} />}
        {view === 'leads' && <Leads openLead={openLead} />}
        {view === 'lead-detail' && selectedLead && (
          <LeadDetail leadId={selectedLead} back={() => setView('leads')} />
        )}
        {view === 'pipeline' && <Pipeline openLead={openLead} />}
        {view === 'proposals' && <Proposals openLead={openLead} />}
        {view === 'customers' && <Customers openLead={openLead} />}
        {view === 'command-center' && <CommandCenter openLead={openLead} />}
        {view === 'services' && <Services />}
        {view === 'objections' && <Objections />}
        {view === 'guide' && <Guide />}
        {view === 'settings' && <Settings />}
      </main>
      <Toaster />
    </>
  )
}
