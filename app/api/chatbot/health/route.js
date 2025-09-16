export const runtime = 'nodejs'

export async function GET() {
  try {
    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return Response.json({ ok: true, groqWorking: false, reason: 'GROQ_API_KEY not set' }, { status: 200 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const models = [
        'meta-llama/llama-4-scout-17b-16e-instruct',
        'llama-3.1-70b-versatile',
        'llama-3.1-8b-instant'
      ]
      let lastStatus = null
      let lastBody = null
      for (const model of models) {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are a health-check probe. Reply with OK only.' },
              { role: 'user', content: 'Ping' }
            ],
            max_tokens: 4,
            temperature: 0
          }),
          signal: controller.signal
        })
        if (resp.ok) {
          const data = await resp.json()
          const content = data?.choices?.[0]?.message?.content || ''
          return Response.json({ ok: true, groqWorking: true, model, sample: content }, { status: 200 })
        }
        lastStatus = resp.status
        lastBody = await resp.text().catch(() => '<no body>')
      }
      return Response.json({ ok: true, groqWorking: false, reason: `Groq HTTP ${lastStatus}: ${lastBody}` }, { status: 200 })
    } catch (err) {
      return Response.json({ ok: true, groqWorking: false, reason: err?.message || 'unknown error' }, { status: 200 })
    }
  } catch (e) {
    return Response.json({ ok: false, error: 'Health check failed to execute' }, { status: 500 })
  }
}

export async function POST(request) {
  // Alias POST to GET for convenience
  return GET()
}


