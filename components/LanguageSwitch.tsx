"use client"

import { useI18n } from "@/i18n"
import type { AppLocale } from "@/i18n"
import { Globe, ChevronDown } from "lucide-react"

export default function LanguageSwitch() {
  const { locale, setLocale } = useI18n()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as AppLocale
    console.log("Changing language to:", value) // Debug log
    setLocale(value)
  }

  const getLanguageLabel = (locale: AppLocale) => {
    switch (locale) {
      case "en":
        return "English"
      case "hi":
        return "हिंदी"
      case "or":
        return "ଓଡ଼ିଆ"
      default:
        return "English"
    }
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={handleChange}
        className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm font-medium min-w-[120px] cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी</option>
        <option value="or">ଓଡ଼ିଆ</option>
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </div>
    </div>
  )
}


