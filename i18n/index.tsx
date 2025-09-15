"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import enFallback from "./messages/en.json"

export type AppLocale = "en" | "hi" | "or"

type Messages = Record<string, any>

type I18nContextValue = {
  locale: AppLocale
  setLocale: (next: AppLocale) => void
  t: (key: string, params?: Record<string, any>) => string
}

const I18N_STORAGE_KEY = "app_locale"

const I18nContext = createContext<I18nContextValue | null>(null)

async function loadMessages(locale: AppLocale): Promise<Messages> {
  switch (locale) {
    case "en":
      return (await import("./messages/en.json")).default
    case "hi":
      return (await import("./messages/hi.json")).default
    case "or":
      return (await import("./messages/or.json")).default
    default:
      return (await import("./messages/en.json")).default
  }
}

function formatMessage(template: string, params?: Record<string, any>): string {
  if (!params) return template
  return template.replace(/\{(.*?)\}/g, (_, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : `{${name}}`,
  )
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en")
  const [messages, setMessages] = useState<Messages>({})

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem(I18N_STORAGE_KEY) as AppLocale)) || "en"
    setLocaleState(stored)
  }, [])

  useEffect(() => {
    let isActive = true
    loadMessages(locale)
      .then((m) => {
        if (isActive) setMessages(m)
      })
      .catch((err) => {
        console.error("i18n load failed for locale", locale, err)
        if (isActive) setMessages({})
      })
    return () => {
      isActive = false
    }
  }, [locale])

  const setLocale = (next: AppLocale) => {
    setLocaleState(next)
    // Eagerly set messages for English to avoid flash of keys
    if (next === "en") {
      setMessages(enFallback as any)
    }
    if (typeof window !== "undefined") localStorage.setItem(I18N_STORAGE_KEY, next)
  }

  const t = useMemo(() => {
    const resolveFrom = (source: any, parts: string[]) => {
      let node: any = source
      for (const part of parts) {
        if (node && typeof node === "object" && part in node) {
          node = node[part]
        } else {
          return undefined
        }
      }
      return typeof node === "string" ? node : undefined
    }

    const translate = (key: string, params?: Record<string, any>) => {
      const parts = key.split(".")

      // Try current locale messages first
      let template = resolveFrom(messages, parts)

      // Fallback to English defaults if missing
      if (template === undefined) {
        template = resolveFrom(enFallback as any, parts)
      }

      if (template === undefined) return key
      return formatMessage(template, params)
    }
    return translate
  }, [messages, locale])

  const value: I18nContextValue = {
    locale,
    setLocale,
    t,
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}



