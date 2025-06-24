"use client";

import { useTheme } from "next-themes"
import { Suspense } from "react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { ImageUploader } from "@/components/image-uploader"
import { TextInput } from "@/components/text-input"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon } from "lucide-react"
import { SocialMediaKitGenerator } from "@/components/png-processor"

export default function Home() {
  const { theme, setTheme } = useTheme()

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              BG <img src="/wind.svg" alt="Wind icon" className="w-8 h-8" /> bye-bye
            </h1>
            <p className="text-slate-600 dark:text-cyan-600 mt-2">
              <a
                href="https://bg-bye-bye.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                bg-bye-bye.vercel.app
              </a>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader>
            <CardTitle>Image Background Removal</CardTitle>
            <CardDescription>premium icon packs avaliable</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="image">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="image">add photo</TabsTrigger>
                <TabsTrigger value="text">image URL</TabsTrigger>
                <TabsTrigger value="png">social kit</TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="space-y-4">
                <Suspense fallback={<p>Loading image uploader…</p>}>
                  <ImageUploader />
                </Suspense>
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <Suspense fallback={<p>Loading text input…</p>}>
                  <TextInput />
                </Suspense>
              </TabsContent>

              <TabsContent value="png" className="space-y-4">
                <Suspense fallback={<p>Loading PNG processor…</p>}>
                  <SocialMediaKitGenerator />
                </Suspense>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
