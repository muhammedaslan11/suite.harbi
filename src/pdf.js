import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { SERVICE_CARDS } from './data/seeds.js'
import { proposalTotal } from './utils.js'

// pdfmake sürümleri arasında vfs bağlama şekli değişiyor — 0.3.x: addVirtualFileSystem, 0.2.x: vfs ataması
if (typeof pdfMake.addVirtualFileSystem === 'function') {
  pdfMake.addVirtualFileSystem(pdfFonts)
} else {
  pdfMake.vfs = pdfFonts?.pdfMake?.vfs ?? pdfFonts?.vfs ?? pdfFonts
}

const LIME = '#7bb324'
const DARK = '#14170f'
const GRAY = '#666666'
const LIGHT = '#f4f7ee'

const tl = (n) => (Number(n) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' TL'
const tarih = (d = new Date()) => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })

function sectionTitle(text) {
  return {
    table: {
      widths: ['*'],
      body: [[{ text, bold: true, fontSize: 13, color: 'white', fillColor: DARK, margin: [10, 6, 10, 6] }]]
    },
    layout: 'noBorders',
    margin: [0, 18, 0, 8]
  }
}

// ROI simülasyonu: 3 / 6 / 12 ay projeksiyon
function roiRows(p) {
  const kurulum = proposalTotal(p)
  const yeniMusteri = Number(p.roi?.aylikYeniMusteri) || 0
  const musteriDegeri = Number(p.roi?.ortalamaMusteriDegeri) || 0
  const retainer = Number(p.roi?.aylikRetainer) || 0
  return [3, 6, 12].map(ay => {
    const gelir = yeniMusteri * musteriDegeri * ay
    const yatirim = kurulum + retainer * ay
    const roi = yatirim > 0 ? gelir / yatirim : 0
    return { ay, gelir, yatirim, roi }
  })
}

export { pdfMake }

export function buildProposalDoc(proposal, lead, settings = {}) {
  const ajans = settings?.ui?.ajansAdi || 'Harbi Digital'
  const marka = settings?.ui?.markaAdi || 'HARB! SUITE'
  const kalemler = proposal.kalemler?.length
    ? proposal.kalemler
    : (proposal.hizmetler || []).map(h => ({ hizmet: h, aciklama: '', fiyat: 0 }))
  const toplam = proposalTotal(proposal)
  const hasRoi = Number(proposal.roi?.aylikYeniMusteri) > 0 && Number(proposal.roi?.ortalamaMusteriDegeri) > 0
  const rows = hasRoi ? roiRows(proposal) : []
  const no = (proposal.id || 'P').replace('P-', '').toUpperCase()

  const content = [
    // ---- Kapak başlığı ----
    {
      columns: [
        [
          { text: [{ text: marka.charAt(0), color: LIME }, { text: marka.slice(1), color: DARK }], fontSize: 26, bold: true },
          { text: `${ajans.toUpperCase()} — BÜYÜME TEKLİFİ`, fontSize: 9, color: GRAY, margin: [0, 2, 0, 0], characterSpacing: 1.5 }
        ],
        [
          { text: `Teklif No: HD-${no}`, alignment: 'right', fontSize: 10, color: GRAY },
          { text: tarih(proposal.createdAt), alignment: 'right', fontSize: 10, color: GRAY }
        ]
      ]
    },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: LIME }], margin: [0, 10, 0, 0] },

    // ---- Müşteri bilgisi ----
    {
      margin: [0, 16, 0, 0],
      table: {
        widths: ['*', '*'],
        body: [[
          { stack: [
            { text: 'HAZIRLAYAN', fontSize: 8, color: GRAY, characterSpacing: 1 },
            { text: ajans, bold: true, fontSize: 12, margin: [0, 2, 0, 0] },
            { text: 'Dijital Büyüme Ajansı', fontSize: 9, color: GRAY }
          ], fillColor: LIGHT, margin: [10, 8, 10, 8] },
          { stack: [
            { text: 'MÜŞTERİ', fontSize: 8, color: GRAY, characterSpacing: 1 },
            { text: lead?.firma || '—', bold: true, fontSize: 12, margin: [0, 2, 0, 0] },
            { text: `${lead?.yetkili || ''}${lead?.pozisyon ? ' — ' + lead.pozisyon : ''}`, fontSize: 9, color: GRAY }
          ], fillColor: LIGHT, margin: [10, 8, 10, 8] }
        ]]
      },
      layout: 'noBorders'
    },

    // ---- Yönetici özeti (AI) ----
    ...(proposal.aiOzet ? [
      sectionTitle('YÖNETİCİ ÖZETİ'),
      {
        table: { widths: ['*'], body: [[{ text: proposal.aiOzet, fontSize: 10, lineHeight: 1.4, fillColor: LIGHT, margin: [12, 10, 12, 10] }]] },
        layout: 'noBorders'
      }
    ] : []),

    // ---- Hizmet kapsamı ve etkileri ----
    sectionTitle('1. HİZMET KAPSAMI VE SAĞLAYACAĞI ETKİLER'),
    ...kalemler.flatMap(k => {
      const card = SERVICE_CARDS.find(c => c.ad === k.hizmet)
      const items = [
        { text: k.hizmet, bold: true, fontSize: 12, color: DARK, margin: [0, 8, 0, 2] }
      ]
      if (card) {
        items.push(
          { columns: [
            { width: 90, text: 'Ne kuruyoruz:', fontSize: 9, color: GRAY },
            { text: card.neSatiyoruz, fontSize: 9 }
          ], margin: [0, 2, 0, 0] },
          { columns: [
            { width: 90, text: 'Çözdüğü problem:', fontSize: 9, color: GRAY },
            { text: card.problem, fontSize: 9 }
          ], margin: [0, 2, 0, 0] },
          { columns: [
            { width: 90, text: 'Beklenen etki:', fontSize: 9, color: GRAY },
            { text: card.sonuc + (card.roi ? ' ' + card.roi : ''), fontSize: 9 }
          ], margin: [0, 2, 0, 0] },
          { columns: [
            { width: 90, text: 'Teslim süresi:', fontSize: 9, color: GRAY },
            { text: card.teslimSuresi, fontSize: 9 }
          ], margin: [0, 2, 0, 0] }
        )
      }
      if (k.aciklama) {
        items.push({ columns: [
          { width: 90, text: 'Kapsam notu:', fontSize: 9, color: GRAY },
          { text: k.aciklama, fontSize: 9 }
        ], margin: [0, 2, 0, 0] })
      }
      return items
    }),

    // ---- ROI simülasyonu ----
    ...(hasRoi ? [
      sectionTitle('2. YATIRIM GERİ DÖNÜŞ (ROI) SİMÜLASYONU'),
      { text: `Varsayımlar: aylık ${proposal.roi.aylikYeniMusteri} yeni müşteri × ${tl(proposal.roi.ortalamaMusteriDegeri)} ortalama müşteri değeri${Number(proposal.roi.aylikRetainer) > 0 ? `, aylık ${tl(proposal.roi.aylikRetainer)} hizmet bedeli` : ''}. Rakamlar simülasyondur, garanti değildir.`, fontSize: 8.5, color: GRAY, margin: [0, 0, 0, 6] },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            ['Dönem', 'Beklenen Ek Gelir', 'Toplam Yatırım', 'ROI'].map(t => ({ text: t, bold: true, fontSize: 9, color: 'white', fillColor: DARK, margin: [6, 4, 6, 4] })),
            ...rows.map(r => [
              { text: `${r.ay} Ay`, fontSize: 9, margin: [6, 4, 6, 4] },
              { text: tl(r.gelir), fontSize: 9, margin: [6, 4, 6, 4] },
              { text: tl(r.yatirim), fontSize: 9, margin: [6, 4, 6, 4] },
              { text: `${r.roi.toFixed(1)}x`, bold: true, fontSize: 9, color: r.roi >= 1 ? LIME : GRAY, margin: [6, 4, 6, 4] }
            ])
          ]
        },
        layout: { hLineColor: '#dddddd', vLineColor: '#dddddd', hLineWidth: () => 0.5, vLineWidth: () => 0.5 }
      },
      ...(proposal.roiHikayesi ? [{ text: proposal.roiHikayesi, fontSize: 9, italics: true, color: GRAY, margin: [0, 6, 0, 0], lineHeight: 1.3 }] : [])
    ] : []),

    // ---- Fiyat tablosu ----
    sectionTitle(`${hasRoi ? 3 : 2}. YATIRIM TABLOSU`),
    {
      table: {
        widths: ['*', 200, 90],
        body: [
          ['Hizmet', 'Kapsam', 'Bedel'].map(t => ({ text: t, bold: true, fontSize: 9, color: 'white', fillColor: DARK, margin: [6, 4, 6, 4] })),
          ...kalemler.map(k => [
            { text: k.hizmet, fontSize: 9.5, bold: true, margin: [6, 5, 6, 5] },
            { text: k.aciklama || SERVICE_CARDS.find(c => c.ad === k.hizmet)?.neSatiyoruz || '—', fontSize: 8.5, color: GRAY, margin: [6, 5, 6, 5] },
            { text: tl(k.fiyat), fontSize: 9.5, alignment: 'right', margin: [6, 5, 6, 5] }
          ]),
          [
            { text: 'TOPLAM', bold: true, fontSize: 11, colSpan: 2, fillColor: LIGHT, margin: [6, 6, 6, 6] }, {},
            { text: tl(toplam), bold: true, fontSize: 11, alignment: 'right', fillColor: LIGHT, color: LIME, margin: [6, 6, 6, 6] }
          ]
        ]
      },
      layout: { hLineColor: '#dddddd', vLineColor: '#dddddd', hLineWidth: () => 0.5, vLineWidth: () => 0.5 }
    },
    {
      columns: [
        { text: [{ text: 'Ödeme Planı: ', bold: true }, proposal.odemePlani || '—'], fontSize: 9 },
        { text: [{ text: 'Sözleşme Süresi: ', bold: true }, proposal.sozlesmeSuresi || '—'], fontSize: 9 },
        { text: [{ text: 'Teslim: ', bold: true }, proposal.teslimSuresi || '—'], fontSize: 9 }
      ],
      margin: [0, 8, 0, 0]
    },
    ...(proposal.notlar ? [{ text: [{ text: 'Notlar: ', bold: true }, proposal.notlar], fontSize: 9, color: GRAY, margin: [0, 6, 0, 0] }] : []),
    ...((proposal.ekHizmetler || []).length ? [{ text: [{ text: 'Opsiyonel ek hizmetler: ', bold: true }, proposal.ekHizmetler.join(', ')], fontSize: 9, color: GRAY, margin: [0, 4, 0, 0] }] : []),

    // ---- Taraflar & imza ----
    sectionTitle(`${hasRoi ? 4 : 3}. TARAFLAR VE ONAY`),
    { text: 'İşbu teklif, aşağıda bilgileri yer alan taraflar arasında belirtilen kapsam, bedel ve koşullarla geçerlidir. Teklif, imza tarihinden itibaren hizmet sözleşmesinin eki niteliğindedir.', fontSize: 8.5, color: GRAY, margin: [0, 0, 0, 14] },
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: 'HİZMET VEREN', fontSize: 8, color: GRAY, characterSpacing: 1 },
            { text: ajans, bold: true, fontSize: 11, margin: [0, 2, 0, 30] },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.7, lineColor: GRAY }] },
            { text: 'Yetkili — İmza / Kaşe', fontSize: 8, color: GRAY, margin: [0, 3, 0, 0] },
            { text: 'Tarih: ____ / ____ / ________', fontSize: 8, color: GRAY, margin: [0, 8, 0, 0] }
          ]
        },
        { width: 40, text: '' },
        {
          width: '*',
          stack: [
            { text: 'HİZMET ALAN', fontSize: 8, color: GRAY, characterSpacing: 1 },
            { text: lead?.firma || '________________', bold: true, fontSize: 11, margin: [0, 2, 0, 0] },
            { text: lead?.yetkili || '', fontSize: 9, color: GRAY, margin: [0, 0, 0, 17] },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.7, lineColor: GRAY }] },
            { text: 'Yetkili — İmza / Kaşe', fontSize: 8, color: GRAY, margin: [0, 3, 0, 0] },
            { text: 'Tarih: ____ / ____ / ________', fontSize: 8, color: GRAY, margin: [0, 8, 0, 0] }
          ]
        }
      ]
    }
  ]

  const doc = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 50],
    content,
    footer: (page, total) => ({
      columns: [
        { text: `${ajans} — Agency Revenue OS ile hazırlandı`, fontSize: 7.5, color: GRAY, margin: [40, 0, 0, 0] },
        { text: `${page} / ${total}`, alignment: 'right', fontSize: 7.5, color: GRAY, margin: [0, 0, 40, 0] }
      ],
      margin: [0, 15, 0, 0]
    }),
    defaultStyle: { fontSize: 10, color: '#222222' }
  }
  return doc
}

export function generateProposalPdf(proposal, lead, settings) {
  const doc = buildProposalDoc(proposal, lead, settings)
  const fileName = `Harbi-Teklif-${(lead?.firma || 'musteri').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, '').replace(/\s+/g, '-')}.pdf`
  pdfMake.createPdf(doc).download(fileName)
}
