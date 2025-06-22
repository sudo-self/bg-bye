import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { FixedFooter } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BG BYE BYE",
  description: "A frontend tool for removing image backgrounds",
  generator: "v0.dev",
  authors: [{ name: "Jesse Roper" }],
  openGraph: {
    type: "website",
    url: "https://bg-bye-bye.vercel.app/",
    title: "Background Removal",
    description:
      "Remove the background on uploaded images, URLs and generate high quality icons and social media images",
    images: [
      {
        url: "https://bg-bye-bye.vercel.app/preview.png",
        width: 1200,
        height: 630,
        alt: "Background Removal Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Background Removal",
    description:
      "Remove the background on uploaded images, URLs and generate high quality icons and social media images",
    images: ["https://bg-bye-bye.vercel.app/preview.png"],
  },
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <FixedFooter />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
