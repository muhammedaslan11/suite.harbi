import React, { useRef, useState } from 'react'
import { useStore } from '../store.jsx'
import { aiReady, callClaude, askJson } from '../ai.js'
import { createOfflineSession, offlineOpening, offlineReply, offlineIdeal, offlineScore } from '../dojoEngine.js'
import { OBJECTIONS } from '../data/seeds.js'
import { SERVICES_LIST } from '../data/constants.js'
import { uid, fmtDate } from '../utils.js'
import Onboarding from '../components/Onboarding.jsx'

const ZORLUKLAR = ['Kolay (açık fikirli müşteri)', 'Orta (şüpheci müşteri)', 'Zor (dirençli, kısa cevaplı müşteri)']

function personaSystem(senaryo) {
  return `Sen bir satış eğitim simülasyonunda MÜŞTERİ rolündesin. Karakterin:
${JSON.stringify(senaryo.persona)}
Zorluk: ${senaryo.zorluk}
Odak itirazların: ${senaryo.itirazlar.join(', ')}

KURALLAR:
- Sadece müşteri olarak konuş, asla rolden çıkma, koçluk yapma.
- Gerçekçi, kısa (1-3 cümle) Türkçe cevaplar ver.
- İtirazlarını doğal akışta öne sür; satışçı iyi cevap verirse yumuşa, kötü cevap verirse diren.
- Zorluk "Zor" ise kolay ikna olma; "Kolay" ise makul argümanlara açık ol.
- Satışçı net bir sonraki adım (toplantı/teklif) önerirse ve seni ikna ettiyse kabul edebilirsin.`
}

export default function Dojo() {
  const { state, dispatch } = useStore()
  const s = state.settings
  const [senaryo, setSenaryo] = useState(null)
  const [kurulum, setKurulum] = useState({ leadId: '', zorluk: ZORLUKLAR[1], itirazlar: ['Çok Pahalı'], uye: s.ekip[0]?.ad || '' })
  const [mesajlar, setMesajlar] = useState([]) // {rol: 'musteri'|'satisci', metin}
  const [giris, setGiris] = useState('')
  const [busy, setBusy] = useState(false)
  const [hata, setHata] = useState('')
  const [skor, setSkor] = useState(null)
  const [ideal, setIdeal] = useState('')
  const bottomRef = useRef(null)
  const offlineRef = useRef(null) // çevrimdışı motorun oturum durumu

  const ready = aiReady(s)
  const [mod, setMod] = useState(ready ? 'ai' : 'offline') // 'ai' | 'offline'
  const scroll = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

  const toApiMessages = (msgs) => msgs.map(m => ({ role: m.rol === 'musteri' ? 'assistant' : 'user', content: m.metin }))

  const secilenItirazlar = () => OBJECTIONS.filter(o => kurulum.itirazlar.includes(o.itiraz))

  const basla = async () => {
    setHata(''); setBusy(true); setSkor(null); setIdeal('')
    try {
      const lead = state.leads.find(l => l.id === kurulum.leadId)
      const persona = lead
        ? { firma: lead.firma, rol: lead.pozisyon || 'Yetkili', sektor: lead.sektor, ilgilendigiHizmetler: lead.ilgiHizmetler }
        : { firma: 'Rastgele KOBİ', rol: 'Genel Müdür', sektor: SERVICES_LIST[Math.floor(Math.random() * 3)] ? 'E-Ticaret' : 'Hizmet', ilgilendigiHizmetler: ['Meta Ads'] }
      const sc = { persona, zorluk: kurulum.zorluk, itirazlar: kurulum.itirazlar, uye: kurulum.uye, mod }
      let acilis
      if (mod === 'offline') {
        offlineRef.current = createOfflineSession(secilenItirazlar(), kurulum.zorluk)
        acilis = offlineOpening(offlineRef.current)
      } else {
        acilis = await callClaude(s, {
          system: personaSystem(sc),
          user: 'Satışçı seni yeni aradı ve kendini tanıttı. İlk cümleni söyle — ilgisiz olma ama bir çekince/itirazla başla.',
          maxTokens: 300
        })
      }
      setSenaryo(sc)
      setMesajlar([{ rol: 'musteri', metin: acilis }])
      scroll()
    } catch (e) { setHata(e.message) } finally { setBusy(false) }
  }

  const gonder = async (metin) => {
    if (!metin.trim() || busy) return
    setHata(''); setBusy(true); setGiris(''); setIdeal('')
    const yeni = [...mesajlar, { rol: 'satisci', metin }]
    setMesajlar(yeni); scroll()
    try {
      if (senaryo.mod === 'offline') {
        const r = offlineReply(offlineRef.current, metin)
        setMesajlar([...yeni, { rol: 'musteri', metin: r.metin }])
        if (r.done) setTimeout(() => bitir([...yeni, { rol: 'musteri', metin: r.metin }]), 400)
        scroll()
      } else {
        const cevap = await callClaude(s, {
          system: personaSystem(senaryo),
          user: toApiMessages(yeni),
          maxTokens: 300
        })
        setMesajlar([...yeni, { rol: 'musteri', metin: cevap }]); scroll()
      }
    } catch (e) { setHata(e.message) } finally { setBusy(false) }
  }

  const idealGoster = async () => {
    setBusy(true); setHata('')
    try {
      if (senaryo.mod === 'offline') {
        setIdeal(offlineIdeal(offlineRef.current))
      } else {
        const kutuphane = OBJECTIONS.map(o => `${o.itiraz}: ${o.cevap} | Devam sorusu: ${o.devamSorusu}`).join('\n')
        const metin = await callClaude(s, {
          system: 'Sen usta bir satış koçusun. Ajansın itiraz kütüphanesi yapısını (cevap + devam sorusu) kullanarak İDEAL satışçı cevabını yazarsın. Sadece cevabın kendisini yaz, açıklama ekleme.',
          user: `İTİRAZ KÜTÜPHANESİ:\n${kutuphane}\n\nGÖRÜŞME:\n${mesajlar.map(m => (m.rol === 'musteri' ? 'MÜŞTERİ: ' : 'SATIŞÇI: ') + m.metin).join('\n')}\n\nMüşterinin son söylediğine ideal satışçı cevabını yaz (2-4 cümle, devam sorusuyla bitir).`,
          maxTokens: 400
        })
        setIdeal(metin.trim())
      }
    } catch (e) { setHata(e.message) } finally { setBusy(false) }
  }

  const bitir = async (sonMesajlar) => {
    const konusma = sonMesajlar || mesajlar
    setBusy(true); setHata('')
    try {
      let json
      if (senaryo.mod === 'offline') {
        json = offlineScore(offlineRef.current, konusma)
      } else {
        json = await askJson(s, {
          system: 'Sen bir satış eğitmenisin. Görüşme transkriptini değerlendirip puanlarsın. Adil ama yapıcı ol. SADECE JSON döndür.',
          user: `GÖRÜŞME (satış antrenmanı):\n${konusma.map(m => (m.rol === 'musteri' ? 'MÜŞTERİ: ' : 'SATIŞÇI: ') + m.metin).join('\n')}\n\nOdak itirazlar: ${senaryo.itirazlar.join(', ')}\n\nŞu şemada SADECE JSON döndür (her puan 0-25):\n{"itirazKarsilama":0,"devamSorusu":0,"kapanisDenemesi":0,"tonGuven":0,"oneriler":["3 somut geliştirme önerisi"]}`,
          maxTokens: 800
        })
      }
      const toplam = ['itirazKarsilama', 'devamSorusu', 'kapanisDenemesi', 'tonGuven'].reduce((a, k) => a + (Number(json[k]) || 0), 0)
      const sonuc = { ...json, toplam }
      setSkor(sonuc)
      dispatch({
        type: 'ADD_DOJO_SESSION',
        session: { id: uid('D'), uye: senaryo.uye, senaryo: `${senaryo.persona.firma} · ${senaryo.itirazlar.join(', ')}${senaryo.mod === 'offline' ? ' · çevrimdışı' : ''}`, skor: toplam, at: new Date().toISOString() }
      })
    } catch (e) { setHata(e.message) } finally { setBusy(false) }
  }

  const sifirla = () => { setSenaryo(null); setMesajlar([]); setSkor(null); setIdeal(''); setHata('') }

  return (
    <div>
      <h1 className="page-title">🥊 Satış Dojo'su</h1>
      <p className="page-sub">AI müşteri rolü oynar, sen itirazları karşılarsın. Gerçek müşteriye çıkmadan önce antrenman yap.</p>
      <Onboarding
        id="dojo"
        steps={[
          'Zorlandığın itirazları seç, antrenmanı başlat — çevrimdışı motor anahtar gerektirmez.',
          'Takıldığında "💡 İdeal" butonu itiraz kütüphanesinden örnek cevap gösterir.',
          'Görüşmeyi somut bir adımla (toplantı/teklif) kapatmayı dene — skor kartı 4 kriterde puanlar.'
        ]}
        config="Skorlar Command Center leaderboard'una işlenir · AI modu için Ayarlar → AI'ya anahtar girin."
      />

      {!senaryo && (
        <div className="card" style={{ maxWidth: 640 }}>
          <h3>Senaryo Kur</h3>
          <label className="field"><span>Müşteri Motoru</span></label>
          <div className="flex mb" style={{ gap: 8 }}>
            <button className={'btn sm ' + (mod === 'offline' ? '' : 'ghost')} onClick={() => setMod('offline')}>
              📚 Çevrimdışı (itiraz kütüphanesi — anahtar gerekmez)
            </button>
            <button
              className={'btn sm ' + (mod === 'ai' ? '' : 'ghost')}
              onClick={() => ready ? setMod('ai') : setHata('AI modu için Ayarlar → AI bölümünden anahtar girin. Çevrimdışı mod anahtarsız çalışır.')}
              title={ready ? '' : 'API anahtarı gerekli'}
            >
              🤖 AI (Claude — daha doğal){!ready && ' 🔒'}
            </button>
          </div>
          {mod === 'offline' && <p className="small muted">Çevrimdışı motor, itiraz kütüphanenizi kullanarak müşteri rolü oynar: iyi cevaba yumuşar, zayıf cevaba direnir, skoru kendi hesaplar. İnternet/anahtar gerekmez.</p>}
          <div className="grid g2">
            <label className="field"><span>Müşteri (gerçek lead veya rastgele)</span>
              <select value={kurulum.leadId} onChange={e => setKurulum({ ...kurulum, leadId: e.target.value })}>
                <option value="">🎲 Rastgele persona</option>
                {state.leads.map(l => <option key={l.id} value={l.id}>{l.firma}</option>)}
              </select>
            </label>
            <label className="field"><span>Zorluk</span>
              <select value={kurulum.zorluk} onChange={e => setKurulum({ ...kurulum, zorluk: e.target.value })}>
                {ZORLUKLAR.map(z => <option key={z}>{z}</option>)}
              </select>
            </label>
            <label className="field"><span>Antrenman yapan</span>
              <select value={kurulum.uye} onChange={e => setKurulum({ ...kurulum, uye: e.target.value })}>
                {s.ekip.map(u => <option key={u.id} value={u.ad}>{u.ad}</option>)}
              </select>
            </label>
          </div>
          <h3 style={{ fontSize: 13 }}>Odak İtirazlar</h3>
          <div style={{ columns: 2 }}>
            {OBJECTIONS.map(o => (
              <label key={o.id} className="check">
                <input
                  type="checkbox"
                  checked={kurulum.itirazlar.includes(o.itiraz)}
                  onChange={() => setKurulum(k => ({
                    ...k,
                    itirazlar: k.itirazlar.includes(o.itiraz) ? k.itirazlar.filter(x => x !== o.itiraz) : [...k.itirazlar, o.itiraz]
                  }))}
                />{o.itiraz}
              </label>
            ))}
          </div>
          <button className="btn mt" disabled={busy || !kurulum.itirazlar.length || (mod === 'ai' && !ready)} onClick={basla}>
            {busy ? '⏳ Müşteri hazırlanıyor…' : '🥊 Antrenmanı Başlat'}
          </button>
          {hata && <div className="small mt" style={{ color: 'var(--red)' }}>{hata}</div>}

          {state.dojoSessions.length > 0 && (
            <>
              <hr className="divider" />
              <h3>Son Antrenmanlar</h3>
              {state.dojoSessions.slice(0, 5).map(d => (
                <div key={d.id} className="spread small" style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{d.uye} · {d.senaryo}</span>
                  <span className={'score-ring ' + (d.skor >= 70 ? 'score-hi' : d.skor >= 40 ? 'score-mid' : 'score-lo')}>{d.skor}/100</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {senaryo && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 300px', alignItems: 'start' }}>
          <div className="card">
            <div className="spread mb">
              <span><b>{senaryo.persona.firma}</b> <span className="muted small">· {senaryo.persona.rol} · {senaryo.zorluk.split(' ')[0]}</span></span>
              <div className="flex" style={{ gap: 6 }}>
                {!skor && <button className="btn ghost sm" disabled={busy || mesajlar.length < 3} onClick={() => bitir()}>🏁 Görüşmeyi Bitir & Puanla</button>}
                <button className="btn danger sm" onClick={sifirla}>✕</button>
              </div>
            </div>

            <div style={{ maxHeight: 420, overflowY: 'auto', padding: '4px 2px' }}>
              {mesajlar.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.rol === 'satisci' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                  <div style={{
                    maxWidth: '75%', padding: '8px 12px', borderRadius: 12, fontSize: 13.5, lineHeight: 1.5,
                    background: m.rol === 'satisci' ? 'rgba(163,230,53,.15)' : 'var(--bg2)',
                    border: '1px solid ' + (m.rol === 'satisci' ? 'rgba(163,230,53,.3)' : 'var(--border)')
                  }}>
                    <div className="small muted" style={{ marginBottom: 2 }}>{m.rol === 'satisci' ? '🧑‍💼 Sen' : '👤 Müşteri'}</div>
                    {m.metin}
                  </div>
                </div>
              ))}
              {busy && <div className="small muted">⏳ …</div>}
              <div ref={bottomRef} />
            </div>

            {ideal && (
              <div className="script-box mb" style={{ marginTop: 8 }}>
                <div className="small" style={{ color: 'var(--lime)', fontWeight: 700 }}>💡 İDEAL CEVAP (itiraz kütüphanesinden)</div>
                {ideal}
                <div><button className="btn sm mt" style={{ marginTop: 6 }} onClick={() => gonder(ideal)}>Bu cevabı gönder</button></div>
              </div>
            )}

            {!skor && (
              <div className="flex mt">
                <textarea
                  placeholder="Cevabını yaz… (Enter ile gönder)"
                  value={giris}
                  onChange={e => setGiris(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); gonder(giris) } }}
                  style={{ minHeight: 44 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="btn sm" disabled={busy || !giris.trim()} onClick={() => gonder(giris)}>Gönder</button>
                  <button className="btn ghost sm" disabled={busy} onClick={idealGoster} title="AI, itiraz kütüphanesine göre ideal cevabı önerir">💡 İdeal</button>
                </div>
              </div>
            )}
            {hata && <div className="small mt" style={{ color: 'var(--red)' }}>{hata}</div>}
          </div>

          <div>
            {skor ? (
              <div className="card" style={{ borderColor: 'var(--lime-dim)' }}>
                <h3>🏆 Skor Kartı</h3>
                <div style={{ textAlign: 'center', margin: '10px 0' }}>
                  <span className={'score-ring ' + (skor.toplam >= 70 ? 'score-hi' : skor.toplam >= 40 ? 'score-mid' : 'score-lo')} style={{ fontSize: 40 }}>{skor.toplam}</span>
                  <span className="muted">/100</span>
                </div>
                {[['İtiraz karşılama', 'itirazKarsilama'], ['Devam sorusu', 'devamSorusu'], ['Kapanış denemesi', 'kapanisDenemesi'], ['Ton & güven', 'tonGuven']].map(([label, k]) => (
                  <div key={k} className="mb" style={{ marginBottom: 8 }}>
                    <div className="spread small"><span>{label}</span><span>{skor[k]}/25</span></div>
                    <div className="progress"><div style={{ width: (skor[k] / 25 * 100) + '%' }} /></div>
                  </div>
                ))}
                <hr className="divider" />
                <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10.5 }}>Geliştirme Önerileri</div>
                {(skor.oneriler || []).map((o, i) => <div key={i} className="small" style={{ padding: '4px 0' }}>→ {o}</div>)}
                <button className="btn mt" onClick={sifirla}>🔄 Yeni Antrenman</button>
              </div>
            ) : (
              <div className="card">
                <h3>🎯 Hedefler</h3>
                <div className="small muted">Bu antrenmanda:</div>
                {senaryo.itirazlar.map(i => <span key={i} className="pill amber" style={{ margin: '4px 4px 0 0' }}>{i}</span>)}
                <hr className="divider" />
                <div className="small muted">İpucu: itirazı kabullenme, anlamaya çalış → cevapla → devam sorusuyla topu geri at → net sonraki adım öner.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
