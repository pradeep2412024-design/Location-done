import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
// import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { I18nProvider } from "@/i18n"
import { AppProvider } from "@/contexts/AppContext"
import { AuthProvider } from "@/app/contexts/AuthContext"

export const metadata: Metadata = {
  title: "CropWise AI - Smart Farming Solutions",
  description: "AI-powered crop yield prediction and optimization platform for farmers",
  icons: {
    icon: "/favicon.svg",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <I18nProvider>
          <AppProvider>
            <AuthProvider>
              <Suspense fallback={null}>{children}</Suspense>
            </AuthProvider>
          </AppProvider>
        </I18nProvider>
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
