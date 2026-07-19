// AI çekirdeği — tarayıcıdan doğrudan Claude API (backend'siz mod)
// Anahtar Ayarlar'da saklanır; Supabase geçişinde bu katman edge function'a taşınır.

export function aiReady(settings) {
  return Boolean(settings?.aiKey)
}

export async function callClaude(settings, { system, user, maxTokens = 2000, useWebSearch = false }) {
  if (!aiReady(settings)) throw new Error('API anahtarı yok. Ayarlar → AI bölümünden anahtarınızı girin.')
  const body = {
    model: settings.aiModel || 'claude-sonnet-5',
    max_tokens: maxTokens,
    system: system || 'Sen Harbi Digital adlı dijital pazarlama ajansının satış asistanısın. Türkçe, net ve satış odaklı yanıt verirsin.',
    messages: Array.isArray(user) ? user : [{ role: 'user', content: user }]
  }
  if (useWebSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }]
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': settings.aiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    let detail = ''
    try { detail = (await res.json())?.error?.message || '' } catch { /* yoksay */ }
    if (res.status === 401) throw new Error('API anahtarı geçersiz. Ayarlar\'dan kontrol edin.')
    if (res.status === 429) throw new Error('Hız limiti aşıldı, biraz bekleyip tekrar deneyin.')
    throw new Error(`AI hatası (${res.status}): ${detail || 'bilinmeyen hata'}`)
  }
  const data = await res.json()
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
}

// Yanıttan JSON çıkarma — ```json bloğu veya düz metin içindeki ilk {...} toleranslı parse
export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('AI yanıtında JSON bulunamadı.')
  return JSON.parse(raw.slice(start, end + 1))
}

export async function askJson(settings, opts) {
  const text = await callClaude(settings, {
    ...opts,
    user: (Array.isArray(opts.user) ? opts.user : [{ role: 'user', content: opts.user }])
  })
  return extractJson(text)
}

// Bağlantı testi
export async function testConnection(settings) {
  const text = await callClaude(settings, {
    system: 'Kısa yanıt ver.',
    user: 'Sadece "OK" yaz.',
    maxTokens: 10
  })
  return text.includes('OK') || text.length > 0
}
