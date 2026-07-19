import React from 'react'

// Donut / halka gösterge — skorlar ve oranlar için
export function Ring({ value = 0, max = 100, size = 84, stroke = 9, label, display, color }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const col = color || (pct >= 0.7 ? 'var(--accent)' : pct >= 0.4 ? 'var(--amber)' : 'var(--red)')
  return (
    <span className="ring-wrap">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={`${label || 'Gösterge'}: ${display ?? Math.round(pct * 100) + '%'}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg2)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={col} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
        <text
          x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
          fill="var(--text)" fontSize={size / 4.4} fontWeight="800"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >
          {display ?? Math.round(pct * 100) + '%'}
        </text>
      </svg>
      {label && <span className="ring-label">{label}</span>}
    </span>
  )
}

// Sparkline — küçük trend çizgisi
export function Spark({ data = [], width = 120, height = 34, color = 'var(--accent)' }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const step = width / Math.max(1, data.length - 1)
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(height - 3 - ((v - min) / range) * (height - 6)).toFixed(1)}`)
  const area = `0,${height} ${pts.join(' ')} ${width},${height}`
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Trend: son değer ${data[data.length - 1]}`}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sparkFill)" />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// Pipeline hunisi — aşama bazlı yatay barlar
export function Funnel({ rows = [] }) {
  const max = Math.max(...rows.map(r => r.value), 1)
  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} className="funnel-row">
          <span className="funnel-label" title={r.label}>{r.label}</span>
          <div className="funnel-bar-track">
            <div className="funnel-bar" style={{ width: Math.max(6, r.value / max * 100) + '%', opacity: 0.55 + 0.45 * (r.value / max) }}>
              {r.value}
            </div>
          </div>
          {r.sub && <span className="small muted" style={{ width: 80, flexShrink: 0 }}>{r.sub}</span>}
        </div>
      ))}
    </div>
  )
}
