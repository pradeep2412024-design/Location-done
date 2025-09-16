import { useEffect, useRef, useState } from 'react'

interface Suggestion {
  displayName: string
  score?: number
}

export function useLocationAutocomplete(initialQuery: string = '') {
  const [query, setQuery] = useState<string>(initialQuery)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true)
        if (abortRef.current) abortRef.current.abort()
        abortRef.current = new AbortController()

        // Use OpenStreetMap Nominatim autocomplete (no key, rate-limited)
        // Restrict to India using countrycodes=in and India viewbox
        const viewbox = [
          68.1766451354, // min lon (west)
          6.747139,      // min lat (south)
          97.4025614766, // max lon (east)
          35.4940095078  // max lat (north)
        ].join(',')
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10&countrycodes=in&viewbox=${viewbox}&bounded=1`
        const res = await fetch(url, {
          signal: abortRef.current.signal,
          headers: {
            'User-Agent': 'CropWise-AI/1.0',
            'Accept-Language': 'en-IN,en;q=0.9'
          }
        })
        if (!res.ok) throw new Error('Location search failed')
        const data = await res.json()

        const states = [
          'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh','Puducherry','Chandigarh','Andaman and Nicobar Islands','Dadra and Nagar Haveli and Daman and Diu','Lakshadweep'
        ]
        const odishaDistricts = [
          'Bhubaneswar','Cuttack','Puri','Rourkela','Berhampur','Sambalpur','Balasore','Bhadrak','Angul','Dhenkanal','Kendujhar','Mayurbhanj','Balangir','Bargarh','Kalahandi','Nuapada','Koraput','Malkangiri','Nabarangpur','Rayagada','Gajapati','Ganjam','Kandhamal','Boudh','Subarnapur','Sundargarh','Deogarh','Jharsuguda','Jajpur','Jagatsinghpur','Kendrapara','Khordha','Nayagarh'
        ]

        const q = query.trim().toLowerCase()

        const mapped: Suggestion[] = (data || [])
          .filter((item: any) => (item.address?.country_code || '').toLowerCase() === 'in')
          .map((item: any) => {
            const a = item.address || {}
            const locality = a.city || a.town || a.village || a.suburb || a.county || ''
            const state = a.state || ''
            const displayName = [locality || state, locality ? state : ''].filter(Boolean).join(', ')

            // Scoring: prioritize Odisha districts and exact/prefix matches
            let score = 0
            const locLower = (locality || '').toLowerCase()
            const stateLower = state.toLowerCase()
            if (odishaDistricts.map(d => d.toLowerCase()).includes(locality.toLowerCase())) score += 80
            if (stateLower === 'odisha') score += 40
            if (states.map(s => s.toLowerCase()).includes(displayName.toLowerCase())) score += 60
            if (locLower === q || stateLower === q) score += 100
            if (locLower.startsWith(q) || stateLower.startsWith(q)) score += 60
            if (locLower.includes(q) || stateLower.includes(q)) score += 20

            // Prefer city/town/village types
            const type = (item.type || '').toLowerCase()
            if (['city','town','village','suburb','district','state_district'].includes(type)) score += 10

            return { displayName: displayName || item.display_name, score }
          })
          // de-duplicate by displayName while preserving the highest score
          .reduce((acc: Suggestion[], cur: Suggestion) => {
            const idx = acc.findIndex(x => x.displayName === cur.displayName)
            if (idx === -1) acc.push(cur)
            else if ((cur.score || 0) > (acc[idx].score || 0)) acc[idx] = cur
            return acc
          }, [])
          // final sort by score desc, then by name
          .sort((a, b) => (b.score || 0) - (a.score || 0) || a.displayName.localeCompare(b.displayName))

        setSuggestions(mapped)
        setOpen(true)
      } catch (e) {
        // ignore abort errors
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [query])

  return {
    query,
    setQuery,
    suggestions,
    setSuggestions,
    open,
    setOpen,
    loading,
  }
}

