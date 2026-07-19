import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { fmtTL, fmtDate, uid, proposalTotal } from '../utils.js'
import { SERVICES_LIST, PROPOSAL_STATUSES } from '../data/constants.js'
import { SERVICE_CARDS } from '../data/seeds.js'
import { askJson } from '../ai.js'
import AiButton from '../components/AiButton.jsx'
import ProposalShare from './ProposalShare.jsx'
import { toast, useEscape } from '../components/Toast.jsx'
import Onboarding from '../components/Onboarding.jsx'
// pdfmake ağır olduğu için PDF modülü tıklama anında yüklenir
const generateProposalPdf = async (p, lead, settings) => (await import('../pdf.js')).generateProposalPdf(p, lead, settings)

const EMPTY = {
  leadId: '', kalemler: [], paket: '', teslimSuresi: '',
  odemePlani: '', sozlesmeSuresi: '', ekHizmetler: [], notlar: '', status: 'Taslak',
  roi: { aylikYeniMusteri: '', ortalamaMusteriDegeri: '', aylikRetainer: '' },
  aiOzet: '', roiHikayesi: ''
}

export function ProposalForm({ fixedLead, onCancel, onSaved }) {
  const { state, dispatch } = useStore()
  const [p, setP] = useState({
    ...EMPTY,
    leadId: fixedLead?.id || '',
    kalemler: (fixedLead?.ilgiHizmetler || []).map(h => ({ hizmet: h, aciklama: '', fiyat: '' }))
  })
  const set = (k, v) => setP(prev => ({ ...prev, [k]: v }))
  const setRoi = (k, v) => setP(prev => ({ ...prev, roi: { ...prev.roi, [k]: v } }))
  const setKalem = (i, k, v) => setP(prev => ({
    ...prev,
    kalemler: prev.kalemler.map((x, idx) => idx === i ? { ...x, [k]: v } : x)
  }))
  const addKalem = () => set('kalemler', [...p.kalemler, { hizmet: '', aciklama: '', fiyat: '' }])
  const removeKalem = (i) => set('kalemler', p.kalemler.filter((_, idx) => idx !== i))
  const toggleEk = (s) => set('ekHizmetler', p.ekHizmetler.includes(s) ? p.ekHizmetler.filter(x => x !== s) : [...p.ekHizmetler, s])

  useEscape(onCancel)
  const toplam = proposalTotal(p)
  const valid = p.leadId && p.kalemler.length > 0 && p.kalemler.every(k => k.hizmet && Number(k.fiyat) > 0)

  // AI teklif metni: toplantı notları + kalemler + hizmet kartları → özet, kapsam, ROI hikayesi
  const aiYaz = async (settings) => {
    const lead = fixedLead || state.leads.find(l => l.id === p.leadId)
    const meetings = state.meetings.filter(m => m.leadId === lead?.id)
    const cards = p.kalemler.map(k => SERVICE_CARDS.find(c => c.ad === k.hizmet)).filter(Boolean)
    const json = await askJson(settings, {
      system: 'Sen bir dijital pazarlama ajansının teklif yazarısın. Müşteriye özel, ikna edici ama abartısız Türkçe metin yazarsın. SADECE JSON döndür.',
      user: `MÜŞTERİ: ${JSON.stringify({ firma: lead?.firma, sektor: lead?.sektor, yetkili: lead?.yetkili })}
TOPLANTI NOTLARI: ${JSON.stringify(meetings.map(m => ({ problem: m.problem, hedef: m.hedef, mevcutDurum: m.mevcutDurum, butce: m.butce })))}
TEKLİF KALEMLERİ: ${JSON.stringify(p.kalemler.map(k => k.hizmet))}
HİZMET BİLGİLERİ: ${JSON.stringify(cards.map(c => ({ ad: c.ad, neSatiyoruz: c.neSatiyoruz, problem: c.problem, sonuc: c.sonuc })))}
ROI VARSAYIMLARI: ${JSON.stringify(p.roi)}

Şu şemada SADECE JSON döndür:
{"yoneticiOzeti":"müşterinin problemi + kurulacak sistem + beklenen sonuç, 3-4 cümle, müşteriye hitaben","kalemAciklamalari":{"<hizmet adı>":"bu müşteriye özel 1 cümlelik kapsam"},"roiHikayesi":"ROI tablosunu insanileştiren 2-3 cümle"}`,
      maxTokens: 1500
    })
    setP(prev => ({
      ...prev,
      aiOzet: json.yoneticiOzeti || prev.aiOzet,
      roiHikayesi: json.roiHikayesi || prev.roiHikayesi,
      kalemler: prev.kalemler.map(k => ({
        ...k,
        aciklama: k.aciklama || json.kalemAciklamalari?.[k.hizmet] || k.aciklama
      }))
    }))
  }

  const save = () => {
    dispatch({
      type: 'ADD_PROPOSAL',
      proposal: {
        ...p,
        id: uid('P'),
        status: 'Taslak',
        createdAt: new Date().toISOString(),
        kalemler: p.kalemler.map(k => ({ ...k, fiyat: Number(k.fiyat) || 0 })),
        hizmetler: p.kalemler.map(k => k.hizmet),
        fiyat: toplam
      }
    })
    toast('✓ Teklif taslak olarak kaydedildi — "Gönderildi" yapınca follow-up görevleri kurulur')
    onSaved()
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 820 }}>
        <h2>Teklif Oluştur</h2>
        <div className="grid g3">
          <label className="field"><span>Müşteri *</span>
            {fixedLead
              ? <input value={fixedLead.firma} disabled />
              : (
                <select value={p.leadId} onChange={e => set('leadId', e.target.value)}>
                  <option value="">Seçin…</option>
                  {state.leads.map(l => <option key={l.id} value={l.id}>{l.firma}</option>)}
                </select>
              )}
          </label>
          <label className="field"><span>Paket</span>
            <select value={p.paket} onChange={e => set('paket', e.target.value)}>
              <option value="">Seçin…</option>
              {['Starter', 'Growth', 'Scale', 'Özel'].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="field"><span>Teslim Süresi</span><input placeholder="örn. 14 gün kurulum" value={p.teslimSuresi} onChange={e => set('teslimSuresi', e.target.value)} /></label>
        </div>

        <h3 style={{ fontSize: 13 }}>Teklif Kalemleri *</h3>
        {p.kalemler.map((k, i) => (
          <div key={i} className="flex mb" style={{ alignItems: 'flex-start' }}>
            <select value={k.hizmet} onChange={e => setKalem(i, 'hizmet', e.target.value)} style={{ maxWidth: 190 }}>
              <option value="">Hizmet seçin…</option>
              {SERVICES_LIST.map(s => <option key={s}>{s}</option>)}
            </select>
            <input placeholder="Kapsam açıklaması (PDF'e yansır)" value={k.aciklama} onChange={e => setKalem(i, 'aciklama', e.target.value)} />
            <input type="number" placeholder="Fiyat (TL)" value={k.fiyat} onChange={e => setKalem(i, 'fiyat', e.target.value)} style={{ maxWidth: 130 }} />
            <button className="btn danger sm" onClick={() => removeKalem(i)}>✕</button>
          </div>
        ))}
        <div className="spread mb">
          <div className="flex">
            <button className="btn ghost sm" onClick={addKalem}>+ Kalem Ekle</button>
            <AiButton label="✨ AI ile Yaz" className="btn ghost sm" disabled={!p.leadId || !p.kalemler.some(k => k.hizmet)} onRun={aiYaz} title="Yönetici özeti, kalem açıklamaları ve ROI hikayesini müşteriye özel yazar" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Toplam: <span style={{ color: 'var(--lime)' }}>{fmtTL(toplam)}</span></span>
        </div>
        {p.aiOzet && (
          <label className="field"><span>Yönetici Özeti (AI — PDF ve paylaşım sayfasına akar)</span>
            <textarea value={p.aiOzet} onChange={e => set('aiOzet', e.target.value)} />
          </label>
        )}
        {p.roiHikayesi && (
          <label className="field"><span>ROI Hikayesi (AI)</span>
            <textarea value={p.roiHikayesi} onChange={e => set('roiHikayesi', e.target.value)} style={{ minHeight: 44 }} />
          </label>
        )}

        <hr className="divider" />
        <h3 style={{ fontSize: 13 }}>ROI Simülasyonu <span className="muted small">(PDF'te 3/6/12 aylık projeksiyon tablosu üretir)</span></h3>
        <div className="grid g3">
          <label className="field"><span>Beklenen Aylık Yeni Müşteri</span><input type="number" value={p.roi.aylikYeniMusteri} onChange={e => setRoi('aylikYeniMusteri', e.target.value)} /></label>
          <label className="field"><span>Ortalama Müşteri Değeri (TL)</span><input type="number" value={p.roi.ortalamaMusteriDegeri} onChange={e => setRoi('ortalamaMusteriDegeri', e.target.value)} /></label>
          <label className="field"><span>Aylık Retainer (TL, varsa)</span><input type="number" value={p.roi.aylikRetainer} onChange={e => setRoi('aylikRetainer', e.target.value)} /></label>
        </div>

        <div className="grid g2">
          <label className="field"><span>Ödeme Planı</span><input placeholder="örn. %50 peşin, %50 teslimde" value={p.odemePlani} onChange={e => set('odemePlani', e.target.value)} /></label>
          <label className="field"><span>Sözleşme Süresi</span><input placeholder="örn. 6 ay" value={p.sozlesmeSuresi} onChange={e => set('sozlesmeSuresi', e.target.value)} /></label>
        </div>

        <h3 style={{ fontSize: 13 }}>Opsiyonel Ek Hizmetler</h3>
        <div style={{ columns: 3 }}>
          {SERVICES_LIST.filter(s => !p.kalemler.some(k => k.hizmet === s)).map(s => (
            <label key={s} className="check"><input type="checkbox" checked={p.ekHizmetler.includes(s)} onChange={() => toggleEk(s)} />{s}</label>
          ))}
        </div>
        <label className="field mt"><span>Notlar / Kapsam</span><textarea value={p.notlar} onChange={e => set('notlar', e.target.value)} /></label>
        <div className="small muted mb">Teklif "Taslak" kaydedilir. Statü "Gönderildi" olduğunda 1-3-7-14-30 gün follow-up görevleri otomatik oluşur. PDF her statüde indirilebilir.</div>
        <div className="flex" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onCancel}>Vazgeç</button>
          <button className="btn" disabled={!valid} onClick={save}>Kaydet</button>
        </div>
      </div>
    </div>
  )
}

export default function Proposals({ openLead }) {
  const { state, dispatch } = useStore()
  const [show, setShow] = useState(false)
  const [shareId, setShareId] = useState(null)
  const shareP = state.proposals.find(p => p.id === shareId)
  const shareLead = shareP && state.leads.find(l => l.id === shareP.leadId)

  return (
    <div>
      <div className="spread mb">
        <div>
          <h1 className="page-title">Teklif Merkezi</h1>
          <p className="page-sub" style={{ margin: 0 }}>Kalem bazlı teklif + ROI simülasyonu + imzalı PDF çıktısı.</p>
        </div>
        <button className="btn" onClick={() => setShow(true)}>+ Yeni Teklif</button>
      </div>

      <Onboarding
        id="proposals"
        steps={[
          'Kalem kalem hizmet + fiyat gir; ROI alanlarını doldurursan PDF\'e 3/6/12 aylık simülasyon eklenir.',
          'Statüyü "Gönderildi" yap → follow-up aramaları takvimine otomatik düşer.',
          '📄 PDF müşteriye e-postayla; 🔗 Sun ekran paylaşımında/toplantıda sunum için.'
        ]}
        config="Follow-up günleri: Ayarlar → Follow-Up Takvimi · PDF'teki ajans adı: Ayarlar → Görünüm."
      />
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr><th>Müşteri</th><th>Hizmetler</th><th>Paket</th><th>Toplam</th><th>Oluşturma</th><th>Statü</th><th></th></tr>
          </thead>
          <tbody>
            {state.proposals.map(p => {
              const lead = state.leads.find(l => l.id === p.leadId)
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => lead && openLead(lead.id)}>{lead?.firma || '—'}</td>
                  <td>{(p.hizmetler || []).join(', ')}</td>
                  <td>{p.paket || '—'}</td>
                  <td style={{ fontWeight: 700 }}>{fmtTL(proposalTotal(p))}</td>
                  <td className="muted">{fmtDate(p.createdAt)}</td>
                  <td>
                    <select
                      value={p.status}
                      onChange={e => {
                        const v = e.target.value
                        dispatch({ type: 'UPDATE_PROPOSAL', id: p.id, patch: { status: v } })
                        if (v === 'Gönderildi' && p.status !== 'Gönderildi') toast(`✓ Gönderildi — ${(state.settings.followupGunleri || [1, 3, 7, 14, 30]).length} follow-up görevi kuruldu`)
                        else if (v === 'Kabul Edildi') toast('🎉 Teklif kabul edildi!')
                      }}
                      style={{ width: 'auto' }}
                    >
                      {PROPOSAL_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="flex" style={{ gap: 6 }}>
                      <button className="btn sm" onClick={() => generateProposalPdf(p, lead, state.settings)}>📄 PDF</button>
                      <button className="btn ghost sm" onClick={() => setShareId(p.id)}>🔗 Sun</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {state.proposals.length === 0 && <tr><td colSpan={7} className="empty">Henüz teklif yok</td></tr>}
          </tbody>
        </table>
      </div>

      {show && <ProposalForm onCancel={() => setShow(false)} onSaved={() => setShow(false)} />}
      {shareP && (
        <ProposalShare
          proposal={shareP}
          lead={shareLead}
          onClose={() => setShareId(null)}
          onSeen={() => dispatch({ type: 'UPDATE_PROPOSAL', id: shareP.id, patch: { status: 'Görüldü' } })}
        />
      )}
    </div>
  )
}
