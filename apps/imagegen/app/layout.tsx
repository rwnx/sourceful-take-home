import { Space_Grotesk } from "next/font/google"
import "@radix-ui/themes/styles.css"
import "@slashid/react/style.css"
import "./globals.css"
import AppProviders from "@/app/components/AppProviders"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <title>ImageGen</title>
      </head>
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
