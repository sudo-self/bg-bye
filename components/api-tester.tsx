"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export function ApiTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [inputImage, setInputImage] = useState<File | null>(null)
  const [allImages, setAllImages] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setInputImage(file)
      setAllImages([])
      setDebugInfo("")
    }
  }

  const testApi = async () => {
    if (!inputImage) return

    setIsLoading(true)
    setDebugInfo("Testing API...")

    try {
      const { Client } = await import("@gradio/client")
      const client = await Client.connect("sudo-saidso/bar")

      const result = await client.predict("/image", {
        image: inputImage,
      })

      setDebugInfo(`Full API Response: ${JSON.stringify(result, null, 2)}`)

      if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const imageArray = result.data[0]
        if (Array.isArray(imageArray)) {
          setAllImages(imageArray)
          toast({
            title: "API Test Complete",
            description: `Found ${imageArray.length} images in response`,
          })
        }
      }
    } catch (error) {
      console.error("Error testing API:", error)
      setDebugInfo(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">API Response Tester</h3>

      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        <Button onClick={testApi} disabled={!inputImage || isLoading}>
          {isLoading ? "Testing..." : "Test API Response"}
        </Button>

        {debugInfo && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded">
            <h4 className="text-sm font-medium mb-2">Debug Info:</h4>
            <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap overflow-auto max-h-40">
              {debugInfo}
            </pre>
          </div>
        )}

        {allImages.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">All Images Returned ({allImages.length}):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allImages.map((img, index) => (
                <div key={index} className="space-y-2">
                  <h5 className="text-xs font-medium">Image {index}</h5>
                  <div
                    className="relative w-full aspect-square overflow-hidden rounded border"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='a' patternUnits='userSpaceOnUse' width='20' height='20'%3e%3crect fill='%23f1f5f9' width='10' height='10'/%3e%3crect fill='%23e2e8f0' x='10' width='10' height='10'/%3e%3crect fill='%23e2e8f0' y='10' width='10' height='10'/%3e%3crect fill='%23f1f5f9' x='10' y='10' width='10' height='10'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23a)'/%3e%3c/svg%3e\")",
                    }}
                  >
                    <Image
                      src={img.url || img.path || "/placeholder.svg"}
                      alt={`API response image ${index}`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    URL: {img.url ? "✓" : "✗"} | Path: {img.path ? "✓" : "✗"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
