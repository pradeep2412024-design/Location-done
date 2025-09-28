"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/i18n"

export default function VoiceSearch() {
  const { locale } = useI18n()
  const [isListening, setIsListening] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const startVoice = () => {
    try {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) {
        alert("Speech recognition not supported in this browser")
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
        await runSearch(text)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      setIsListening(true)
      recognition.start()
    } catch (e) {
      setIsListening(false)
    }
  }

  const runSearch = async (text: string) => {
    try {
      setLoading(true)
      setOpen(true)
      const res = await fetch('/api/voice-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, locale })
      })
      const data = await res.json()
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={startVoice} className={isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}>
          {isListening ? 'Listening…' : 'Voice'}
        </Button>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask by voice or type…" className="h-8" />
        <Button size="sm" variant="outline" onClick={() => runSearch(query)} disabled={!query || loading}>Search</Button>
      </div>
      {open && (
        <Card className="absolute right-0 mt-2 w-[360px] max-h-[60vh] overflow-auto shadow-2xl z-50">
          <CardContent className="p-3 space-y-3">
            {loading && <div className="text-sm text-gray-600">Searching…</div>}
            {!loading && results && (
              <div className="space-y-2">
                {results.answer && <div className="text-sm whitespace-pre-wrap">{results.answer}</div>}
                {results.matches && results.matches.length > 0 && (
                  <div className="text-xs text-gray-600">Sources: {results.matches.join(', ')}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}


