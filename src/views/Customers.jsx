import React, { useState } from 'react'
import CustomerSuccess from './CustomerSuccess.jsx'
import Handoff from './Handoff.jsx'
import Onboarding from '../components/Onboarding.jsx'

// Müşteri yaşam döngüsü tek ekranda: Başarı takibi + Operasyon devri
export default function Customers({ openLead }) {
  const [tab, setTab] = useState('success')
  return (
    <div>
      <h1 className="page-title">Müşteriler</h1>
      <p className="page-sub">Kazanılan müşterilerin sağlığı, yenilemeleri ve operasyon devirleri — tek yerde.</p>
      <Onboarding
        id="musteriler"
        steps={[
          'Bir lead "Kazanıldı" olduğunda burada otomatik müşteri kaydı + operasyon briefi oluşur.',
          'Health Score kriterlerini her ay güncelle — risk sinyalleri Command Center\'a otomatik düşer.',
          'Teslimat sekmesinde checklist\'i işaretle; %100 olunca onboarding tamamlanmış demektir.'
        ]}
        config="Ayarlar → Ekip (sorumlu atamaları). Renewal görev zinciri (90/60/30 gün) otomatiktir."
      />
      <div className="tabs">
        <button className={'tab' + (tab === 'success' ? ' active' : '')} onClick={() => setTab('success')}>❤️ Müşteri Başarısı</button>
        <button className={'tab' + (tab === 'handoff' ? ' active' : '')} onClick={() => setTab('handoff')}>🚚 Teslimat & Onboarding</button>
      </div>
      {tab === 'success' ? <CustomerSuccess openLead={openLead} embedded /> : <Handoff openLead={openLead} embedded />}
    </div>
  )
}
