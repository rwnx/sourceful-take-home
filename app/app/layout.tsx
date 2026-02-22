"use client"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { SlashIDProvider, ConfigurationProvider } from "@slashid/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "@radix-ui/themes/styles.css"
import "@slashid/react/style.css"
import { Theme } from "@radix-ui/themes"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const oid = process.env.NEXT_PUBLIC_ORG_ID

type Factors = React.ComponentPropsWithoutRef<typeof ConfigurationProvider>["factors"]
const factors: Factors = [
  {
    method: "password",
    allowedHandleTypes: ["email_address"],
  },
]

// Blank out all form text so the dialog in auth.tsx can own the heading/description
const text: Record<string, string> = {
  "initial.title": "",
  "initial.subtitle": "",
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SlashIDProvider oid={oid} tokenStorage="cookie">
          <ConfigurationProvider factors={factors} text={text} logo="">
            <QueryClientProvider client={queryClient}>
              <Theme>{children}</Theme>
            </QueryClientProvider>
          </ConfigurationProvider>
        </SlashIDProvider>
      </body>
    </html>
  )
}