export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const { query, locale } = await request.json()
    const { origin } = new URL(request.url)

    // fan-out to sibling data routes as needed
    const calls = [
      fetch(`${origin}/api/crop-analysis`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }).catch(() => null),
      fetch(`${origin}/api/crop-recommendations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: '', month: '' }) }).catch(() => null),
      fetch(`${origin}/api/weather`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: '', month: '' }) }).catch(() => null),
      fetch(`${origin}/api/soil`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: '' }) }).catch(() => null),
    ]

    const [analysisRes, recRes, weatherRes, soilRes] = await Promise.all(calls)

    let matches = []
    if (analysisRes?.ok) matches.push('analysis')
    if (recRes?.ok) matches.push('recommendations')
    if (weatherRes?.ok) matches.push('weather')
    if (soilRes?.ok) matches.push('soil')

    // Very simple intent-based response for now; reuse chatbot generator if available later
    const lowered = String(query || '').toLowerCase()
    let answer = ''
    if (lowered.includes('weather') || lowered.includes('baarish') || lowered.includes('mausam')) {
      answer = 'Showing weather-related insights for your farm context.'
    } else if (lowered.includes('soil') || lowered.includes('mitti') || lowered.includes('mati')) {
      answer = 'Here are soil health and fertilizer insights.'
    } else if (lowered.includes('recommend') || lowered.includes('suggest') || lowered.includes('beej') || lowered.includes('fasal')) {
      answer = 'Recommended crops based on season, soil and market.'
    } else {
      answer = 'Here is the best information I found from your farm data.'
    }

    return Response.json({ success: true, answer, matches, locale })
  } catch (e) {
    return Response.json({ success: false, error: 'Failed to process voice search' }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ ok: true, route: 'voice-search' })
}


