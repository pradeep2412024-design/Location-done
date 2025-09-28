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
      recognition.onresult = async (e: any) => {
        const text = e.results[0][0].transcript
        setQuery(text)
        setIsListening(false)
        await runLocalSearch(text)
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
      const normalized = String(text || '').toLowerCase().trim()
      const tokens = normalized.split(/\s+/).filter(Boolean)

      const combined: Record<string, any> = {
        userData,
        analysisData,
        ...dataSources,
        ...savedSources,
      }

      const ranked: Array<{ score: number; source: string; snippet: string }> = []

      for (const [name, data] of Object.entries(combined)) {
        const lines = flatten(data)
        for (const line of lines) {
          const hay = line.toLowerCase()
          const hits = tokens.reduce((acc, tk) => acc + (hay.includes(tk) ? 1 : 0), 0)
          if (hits > 0) {
            const firstIdx = Math.min(...tokens.map(tk => Math.max(0, hay.indexOf(tk))).filter(n => !isNaN(n)))
            const score = hits * 10 + Math.max(0, 10 - firstIdx)
            ranked.push({ score, source: name, snippet: line.slice(0, 240) })
          }
        }
      }

      ranked.sort((a, b) => b.score - a.score)
      const top = ranked.slice(0, 5)
      let summary = ''
      if (top.length) {
        summary = `Found ${top.length} relevant matches.\n` + top.map(r => `• (${r.source}) ${r.snippet}`).join("\n")
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
        summary = data?.answer || 'No direct matches found in current data.'
        setSources(Array.isArray(data?.matches) ? data.matches : [])
      } else {
        summary = 'No direct matches found in current data.'
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
        <Button size="sm" variant="outline" onClick={() => runLocalSearch(query)} disabled={!query || loading}>Search</Button>
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
                <div className="text-sm whitespace-pre-wrap">{answer}</div>
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


