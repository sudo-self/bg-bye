"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUploader } from "@/components/image-uploader"
import { TextInput } from "@/components/text-input"
import { PngProcessor } from "@/components/png-processor"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

export default function Home() {
  const { theme, setTheme } = useTheme()

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">BG BYE BYE</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">bg-bye-bye.vercel.app</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader>
            <CardTitle>Background Removal</CardTitle>
            <CardDescription>Upload an image bye bye background</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="image">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="image">BG</TabsTrigger>
                <TabsTrigger value="text">URL</TabsTrigger>
                <TabsTrigger value="png">PNG</TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="space-y-4">
                <ImageUploader />
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <TextInput />
              </TabsContent>

              <TabsContent value="png" className="space-y-4">
                <PngProcessor />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
