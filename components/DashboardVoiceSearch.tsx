"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/i18n"
import { useToast } from "@/hooks/use-toast"
import { useAppContext } from "@/contexts/AppContext"

interface DashboardVoiceSearchProps {
  dataSources?: Record<string, any>
}

function flatten(obj: any, prefix = "", out: string[] = []) {
  if (!obj) return out
  if (typeof obj !== "object") {
    out.push(`${prefix}${String(obj)}`)
    return out
  }
  if (Array.isArray(obj)) {
    obj.forEach((val, idx) => {
      const newPrefix = prefix ? `${prefix}[${idx}]` : `[${idx}]`
      if (typeof val === "object" && val !== null) {
        flatten(val, newPrefix, out)
      } else {
        out.push(`${newPrefix}: ${String(val)}`)
      }
    })
  } else {
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      const newPrefix = prefix ? `${prefix}.${key}` : key
      if (typeof val === "object" && val !== null) {
        flatten(val, newPrefix, out)
      } else {
        out.push(`${newPrefix}: ${String(val)}`)
      }
    }
  }
  return out
}

export default function DashboardVoiceSearch({ dataSources = {} }: DashboardVoiceSearchProps) {
  const { locale } = useI18n()
  const { toast } = useToast()
  const { analysisData, userData } = useAppContext()

  const [isListening, setIsListening] = useState(false)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<string>("")
  const [sources, setSources] = useState<string[]>([])
  const [savedSources, setSavedSources] = useState<Record<string, any>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return
      const el = containerRef.current
      if (el && !el.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    // pull persisted dashboard/context data if present
    try {
      const lsAnalysis = localStorage.getItem('cropwise_analysisData')
      const lsUser = localStorage.getItem('cropwise_userData')
      const lsDashboard = localStorage.getItem('dashboardData')
      const lsRecs = localStorage.getItem('dashboardRecommendations')
      const merged: Record<string, any> = {}
      if (lsAnalysis) merged.persistedAnalysis = JSON.parse(lsAnalysis)
      if (lsUser) merged.persistedUser = JSON.parse(lsUser)
      if (lsDashboard) merged.persistedDashboard = JSON.parse(lsDashboard)
      if (lsRecs) merged.persistedRecommendations = JSON.parse(lsRecs)
      setSavedSources(merged)
    } catch {}
  }, [])

  const startVoice = async () => {
    try {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) {
        toast({ title: "Voice unsupported", description: "Your browser does not support voice recognition." })
        return
      }
      try {
        if (navigator?.mediaDevices?.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true })
        }
      } catch (e) {
        toast({ title: "Microphone blocked", description: "Please allow microphone access and try again." })
        return
      }
      const recognition = new SR()
      recognition.lang = locale || 'en-IN'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      const sanitizeInput = (s: string) => s.replace(/[\s\u00A0]+$/, '').replace(/[\.!;:,]+$/, '')
      recognition.onresult = async (e: any) => {
        const text = e.results[0][0].transcript
        const clean = sanitizeInput(text)
        setQuery(clean)
        setIsListening(false)
        await runLocalSearch(clean)
      }
      recognition.onerror = (err: any) => {
        setIsListening(false)
        const code = err?.error || 'unknown'
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          toast({ title: "Microphone blocked", description: "Please allow microphone access in your browser settings." })
        } else if (code === 'no-speech') {
          toast({ title: "No speech detected", description: "Please try speaking again." })
        }
      }
      recognition.onend = () => setIsListening(false)
      setIsListening(true)
      recognition.start()
    } catch (e) {
      setIsListening(false)
      toast({ title: "Voice start failed", description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  const runLocalSearch = async (text: string) => {
    setLoading(true)
    setOpen(true)
    try {
      const normalizeStr = (s: string) => String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9%\.\-\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      const normalized = normalizeStr(text)
      const baseTokens = normalized.split(/\s+/).filter(Boolean)
      // Synonym expansion for more forgiving search
      const synonymMap: Record<string, string[]> = {
        rain: ['rainfall', 'precipitation', 'baarish', 'mausam'],
        rainfall: ['rain', 'precipitation', 'baarish'],
        price: ['market price', 'rate', 'mdp', 'pricing'],
        demand: ['market demand', 'buyers', 'orders'],
        yield: ['production', 'output', 'utpaadan'],
        improvement: ['increase', 'gain', 'boost', 'potential'],
        score: ['suitability', 'rating', 'fit'],
        moisture: ['soil moisture', 'paaneeki matra'],
        ph: ['soil ph', 'acidity', 'alkalinity'],
        nitrogen: ['n', 'n-level'],
        phosphorus: ['p', 'p-level'],
        potassium: ['k', 'k-level'],
        temperature: ['temp', 'garmi', 'taapman'],
        humidity: ['humid', 'nami'],
        duration: ['days', 'time', 'period']
      }
      const tokens = Array.from(new Set(baseTokens.flatMap(t => [t, ...(synonymMap[t] || [])].map(normalizeStr))))

      const combined: Record<string, any> = {
        userData,
        analysisData,
        analysisPredictions: (analysisData as any)?.predictions || null,
        analysisMarket: (analysisData as any)?.marketAnalysis || null,
        analysisRecs: (analysisData as any)?.recommendations || null,
        persistedRecommendations: (savedSources as any)?.persistedRecommendations || null,
        ...dataSources,
        ...savedSources,
      }

      const ranked: Array<{ score: number; source: string; snippet: string }> = []

      const sourceWeight = (src: string) => {
        const s = src.toLowerCase()
        if (s.startsWith('live')) return 1.5
        if (s.includes('analysis')) return 1.3
        if (s.includes('recommend')) return 1.25
        if (s.includes('weather') || s.includes('soil')) return 1.2
        return 1.0
      }

      const rankFromObject = (obj: any, sourceName: string) => {
        const lines = flatten(obj)
        for (const line of lines) {
          const hay = normalizeStr(line)
          const hits = tokens.reduce((acc, tk) => acc + (hay.includes(tk) ? 1 : 0), 0)
          if (hits > 0) {
            const firstIdx = Math.min(...tokens.map(tk => Math.max(0, hay.indexOf(tk))).filter(n => !isNaN(n)))
            const base = hits * 10 + Math.max(0, 10 - firstIdx)
            const weighted = base * sourceWeight(sourceName)
            ranked.push({ score: weighted, source: sourceName, snippet: line.slice(0, 240) })
          }
        }
      }

      for (const [name, data] of Object.entries(combined)) {
        rankFromObject(data, name)
      }

      ranked.sort((a, b) => b.score - a.score)
      let top = ranked.slice(0, 7)
      
      // Enrich dynamically from live APIs if results are sparse
      if (top.length < 5) {
        const ctx = (userData || {}) as any
        const location = ctx.location || (savedSources as any)?.persistedUser?.location || ''
        const month = ctx.month || (savedSources as any)?.persistedUser?.month || ''
        const crop = ctx.crop || (savedSources as any)?.persistedUser?.crop || ''
        const hectare = ctx.hectare || (savedSources as any)?.persistedUser?.hectare || ''
        const bodyCommon: any = { location, month }
        if (crop) bodyCommon.crop = crop
        if (hectare) bodyCommon.hectare = hectare

        try {
          const [soilRes, weatherRes, recsRes, analysisRes] = await Promise.all([
            fetch('/api/soil', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyCommon) }).catch(() => null),
            fetch('/api/weather', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, month }) }).catch(() => null),
            fetch('/api/crop-recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, month }) }).catch(() => null),
            fetch('/api/crop-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, month, crop, hectare }) }).catch(() => null)
          ])
          if (soilRes && soilRes.ok) { const j = await soilRes.json(); rankFromObject(j?.data, 'liveSoil') }
          if (weatherRes && weatherRes.ok) { const j = await weatherRes.json(); rankFromObject(j?.weatherData, 'liveWeather') }
          if (recsRes && recsRes.ok) { const j = await recsRes.json(); rankFromObject(j?.recommendations, 'liveRecs') }
          if (analysisRes && analysisRes.ok) { const j = await analysisRes.json(); rankFromObject(j, 'liveAnalysis') }
          ranked.sort((a, b) => b.score - a.score)
          top = ranked.slice(0, 10)
        } catch {}
      }
      let summary = ''
      if (top.length) {
        // Special friendly formatting for recommendations if available
        const recs: any[] = Array.isArray((savedSources as any)?.persistedRecommendations)
          ? (savedSources as any).persistedRecommendations
          : []
        const loweredTokens = new Set(tokens)
        if (recs.length > 0) {
          const scoredRecs = recs.map((rec: any) => {
            const hay = [rec?.name, rec?.marketDemand, rec?.duration, rec?.yield, rec?.price, rec?.profitability]
              .filter(Boolean)
              .join(' ') + ' ' + (Array.isArray(rec?.reasons) ? rec.reasons.join(' ') : '')
            const lhay = hay.toLowerCase()
            const hits = Array.from(loweredTokens).reduce((acc, tk) => acc + (lhay.includes(tk) ? 1 : 0), 0)
            return { rec, hits }
          }).filter(r => r.hits > 0)
            .sort((a, b) => b.hits - a.hits)
            .slice(0, 5)

          if (scoredRecs.length > 0) {
            summary = scoredRecs.map(({ rec }) => {
              const name = rec?.name || 'Crop'
              const parts: string[] = []
              if (rec?.yield) parts.push(`${rec.yield}`)
              if (rec?.price) parts.push(`${rec.price}`)
              if (rec?.marketDemand) parts.push(`${rec.marketDemand}`)
              if (rec?.score != null) parts.push(`${rec.score}%`)
              if (rec?.duration) parts.push(`${rec.duration}`)
              return `• ${name} — ${parts.join('; ')}`
            }).join('\n')
            // Strip any trailing punctuation from each line
            summary = summary
              .split('\n')
              .map((l: string) => l.replace(/[\s\u00A0]+$/,'').replace(/[\.!;:,]+$/,''))
              .join('\n')
            setAnswer(summary)
            setSources(['recommendations'])
            return
          }
        }

        // Generic friendly formatting with sectioned human sentences
        const sectionFor = (src: string) => {
          const s = src.toLowerCase()
          if (s.includes('recommend')) return 'Recommendations'
          if (s.includes('weather')) return 'Weather'
          if (s.includes('soil')) return 'Soil Health'
          if (s.includes('analysispred')) return 'Analysis'
          if (s.includes('analysismarket')) return 'Market Analysis'
          if (s.includes('analysisrecs')) return 'Recommendations'
          if (s.includes('analysis')) return 'Analysis'
          if (s.includes('user')) return 'Profile'
          if (s.includes('dashboard')) return 'Dashboard'
          return 'Info'
        }

        const makeFriendly = (line: string, src: string) => {
          const parts = line.split(':')
          const keyRaw = parts.length > 1 ? parts[0] : ''
          const valueRaw = parts.length > 1 ? parts.slice(1).join(':') : parts[0]
          const key = String(keyRaw || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
          let value = String(valueRaw || '').replace(/[\[\]\{\}"]/g, '').trim()
          const context = normalizeStr(line)

          const labelFor = (k: string) => {
            // Order matters: detect specific intents before generic 'yield'
            if (/(improvement|increase|potential)/.test(k) || /(improvement|increase|potential)/.test(context)) return 'Yield Improvement'
            if (/(score|suitability)/.test(k) || /(score|suitability)/.test(context)) return 'Suitability Score'
            if (/(profit|profitability|margin)/.test(k) || /(profit|profitability|margin)/.test(context)) return 'Profitability'
            if (/(demand)/.test(k) || /(demand)/.test(context)) return 'Market Demand'
            if (/(yield|expected yield|avg yield)/.test(k) || /(yield)/.test(context)) return 'Yield'
            if (/(duration|days)/.test(k) || /(duration|days)/.test(context)) return 'Duration'
            if (/ph\b/.test(k) || /\bph\b/.test(context)) return 'Soil pH'
            if (/(moisture)/.test(k) || /(moisture)/.test(context)) return 'Soil Moisture'
            if (/(nitrogen|\bn\b)/.test(k) || /(nitrogen|\bn\b)/.test(context)) return 'Soil Nitrogen'
            if (/(phosphorus|\bp\b)/.test(k) || /(phosphorus|\bp\b)/.test(context)) return 'Soil Phosphorus'
            if (/(potassium|\bk\b)/.test(k) || /(potassium|\bk\b)/.test(context)) return 'Soil Potassium'
            if (/(rain|precip)/.test(k) || /(rain|precip)/.test(context)) return 'Rainfall'
            if (/(temp|temperature)/.test(k) || /(temp|temperature)/.test(context)) return 'Temperature'
            if (/(humidity)/.test(k) || /(humidity)/.test(context)) return 'Humidity'
            if (/(wind)/.test(k) || /(wind)/.test(context)) return 'Wind'
            if (/(advice|reason|note)/.test(k) || /(advice|reason|note)/.test(context)) return 'Note'
            if (/(name|crop)/.test(k) || /(name|crop)/.test(context)) return 'Crop'
            return keyRaw || 'Info'
          }

          // Add units/context to bare numbers but return only value
          const isBareNumber = /^\d+(?:\.\d+)?$/.test(value)
          const label = labelFor(key)
          if (isBareNumber) {
            if (label === 'Yield') value = `${value} t/ha`
            else if (label === 'Profitability' || label === 'Suitability Score' || label === 'Yield Improvement') value = `${value}%`
            else if (label === 'Rainfall') value = `${value} mm`
            else if (label === 'Temperature') value = `${value}°C`
            else if (label === 'Humidity') value = `${value}%`
            else if (label === 'Soil pH') value = `${value} pH`
          }
          if ((/percent|%|score|improvement|increase/.test(key) || /score|improv|increase/.test(context)) && !/%$/.test(value)) {
            const num = parseFloat(value)
            if (!isNaN(num)) value = `${num}%`
          }
          const section = sectionFor(src)
          // Sentence form with section context
          const sentenceFor = (label: string, val: string) => {
            switch (label) {
              case 'Yield': return `${section}: Expected yield is ${val}`
              case 'Yield Improvement': return `${section}: Potential yield increase is ${val}`
              case 'Market Price': return `${section}: Market price is ${val}`
              case 'Market Demand': return `${section}: Market demand is ${val}`
              case 'Profitability': return `${section}: Profitability is ${val}`
              case 'Suitability Score': return `${section}: Crop suitability is ${val}`
              case 'Duration': return `${section}: Crop duration is ${val}`
              case 'Soil pH': return `Soil Health: Soil pH is ${val}`
              case 'Soil Moisture': return `Soil Health: Soil moisture is ${val}`
              case 'Soil Nitrogen': return `Soil Health: Nitrogen level is ${val}`
              case 'Soil Phosphorus': return `Soil Health: Phosphorus level is ${val}`
              case 'Soil Potassium': return `Soil Health: Potassium level is ${val}`
              case 'Rainfall': return `Weather: Expected rainfall is ${val}`
              case 'Temperature': return `Weather: Temperature is ${val}`
              case 'Humidity': return `Weather: Humidity is ${val}`
              case 'Wind': return `Weather: Wind is ${val}`
              case 'Note': return `${section}: ${val}`
              default: return `${section}: ${val}`
            }
          }

          return { label, section, sentence: sentenceFor(label, value).slice(0, 200) }
        }
        // Deduplicate by section+label to avoid repeated lines like multiple Yield Improvements
        const seen = new Set<string>()
        const sentences: string[] = []
        for (const r of top) {
          const { label, section, sentence } = makeFriendly(r.snippet, r.source)
          const keyUniq = `${section}:${label}`
          if (seen.has(keyUniq)) continue
          seen.add(keyUniq)
          const clean = sentence.replace(/[\s\u00A0]+$/,'').replace(/[\.!;:,]+$/,'')
          sentences.push(`• ${clean}`)
          if (sentences.length >= 5) break
        }
        summary = sentences.join('\n')
        setAnswer(summary)
        setSources([...new Set(top.map(r => r.source))])
        return
      }

      // Fallback: ask server voice-search aggregator for a synthesized answer
      const res = await fetch('/api/voice-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, locale })
      })
      if (res.ok) {
        const data = await res.json()
        summary = (data?.answer || 'No direct matches found in current data.')
          .split('\n')
          .map((l: string) => l.replace(/[\s\u00A0]+$/,'').replace(/[\.!;:,]+$/,''))
          .join('\n')
        setSources(Array.isArray(data?.matches) ? data.matches : [])
      } else {
        summary = 'No direct matches found in current data'
      }

      setAnswer(summary)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={startVoice} className={isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}>
          {isListening ? 'Listening…' : 'Voice'}
        </Button>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Quick search…" className="h-8 w-44" />
        <Button size="sm" variant="outline" onClick={() => runLocalSearch(query.replace(/[\s\u00A0]+$/, '').replace(/[\.!;:,]+$/, ''))} disabled={!query || loading}>Search</Button>
      </div>
      {open && (
        <Card className="absolute right-0 mt-2 w-[380px] max-h-[60vh] overflow-auto shadow-2xl z-50">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium">Search Results</div>
              <button className="text-xs px-2 py-1 rounded-md border" onClick={() => setOpen(false)}>Close</button>
            </div>
            {loading && <div className="text-sm text-gray-600">Searching…</div>}
            {!loading && (
              <div className="space-y-2">
                <div className="text-sm whitespace-pre-wrap">{
                  answer
                    .split('\n')
                    .map((l) => l.replace(/[\s\u00A0]+$/,'').replace(/[\.!;:,]+$/,''))
                    .join('\n')
                }</div>
                {sources.length > 0 && (
                  <div className="text-xs text-gray-600">From: {sources.join(', ')}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}


