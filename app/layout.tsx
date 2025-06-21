import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Head from "next/head"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BG BYE BYE",
  description: "A frontend tool for removing image backgrounds",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Background Removal</title>
        <meta name="title" content="Background Removal" />
        <meta name="description" content="Remove the background on uploaded images, URLs and generate high quality icons and social media images" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bg-bye-bye.vercel.app/" />
        <meta property="og:title" content="Background Removal" />
        <meta property="og:description" content="Remove the background on uploaded images, URLs and generate high quality icons and social media images" />
        <meta property="og:image" content="https://bg-bye-bye.vercel.app/preview.png" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://bg-bye-bye.vercel.app/" />
        <meta property="twitter:title" content="Background Removal" />
        <meta property="twitter:description" content="Remove the background on uploaded images, URLs and generate high quality icons and social media images" />
        <meta property="twitter:image" content="https://bg-bye-bye.vercel.app/preview.png" />
        <meta name="author" content="Jesse Roper" />
      </Head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
