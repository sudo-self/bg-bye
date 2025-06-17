"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { RefreshCwIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export function TextInput() {
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [outputImage, setOutputImage] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const { toast } = useToast()

  const processImageUrl = async () => {
    if (!imageUrl) {
      toast({
        title: "No URL provided",
        description: "Please enter an image URL to process",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setDebugInfo("Connecting to BiRefNet API...")

    try {
      // Use the official Gradio client
      const { Client } = await import("@gradio/client")

      setDebugInfo("Connected! Processing image from URL...")
      const client = await Client.connect("sudo-saidso/bar")

      const result = await client.predict("/text", {
        image: imageUrl,
      })

      setDebugInfo(`Full API Response: ${JSON.stringify(result, null, 2)}`)

      // Handle the nested array response structure
      let processedImageUrl = null

      if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
        // The response has nested arrays: result.data[0] contains an array of images
        const imageArray = result.data[0]

        if (Array.isArray(imageArray) && imageArray.length > 0) {
          // Usually the last image in the array is the processed one
          // But let's try the second image first (index 1) as it's likely the background-removed version
          const processedImageData = imageArray.length > 1 ? imageArray[1] : imageArray[0]

          if (processedImageData && typeof processedImageData === "object") {
            // Check for url property first
            if (processedImageData.url) {
              processedImageUrl = processedImageData.url
            }
            // Fallback to path property
            else if (processedImageData.path) {
              processedImageUrl = processedImageData.path
            }
          }
        }
      }

      if (processedImageUrl) {
        setOutputImage(processedImageUrl)
        setDebugInfo(`Success! Background removed. Image URL: ${processedImageUrl}`)

        toast({
          title: "Background Removed!",
          description: "Background removed from URL image successfully",
        })
      } else {
        throw new Error(`Could not find image URL in response. Full response: ${JSON.stringify(result)}`)
      }
    } catch (error) {
      console.error("Error processing image URL:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setDebugInfo(`Error: ${errorMessage}`)

      toast({
        title: "Background removal failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="image-url" className="text-sm font-medium">
            Image URL
          </label>
          <Input
            id="image-url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button className="w-full" onClick={processImageUrl} disabled={!imageUrl || isLoading}>
          {isLoading ? (
            <>
              <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Process Image URL"
          )}
        </Button>
      </div>

      {imageUrl && !outputImage && !isLoading && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Preview</h3>
          <div className="relative w-full aspect-video max-h-[300px] overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized
              onError={() => {
                toast({
                  title: "Image preview failed",
                  description: "The URL may be invalid or the image is not accessible",
                  variant: "destructive",
                })
              }}
            />
          </div>
        </Card>
      )}

      {debugInfo && (
        <Card className="p-4 bg-slate-50 dark:bg-slate-900">
          <h4 className="text-sm font-medium mb-2">Debug Info:</h4>
          <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{debugInfo}</pre>
        </Card>
      )}

      {outputImage && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Background Removed</h3>
          <div
            className="relative w-full aspect-video max-h-[300px] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='a' patternUnits='userSpaceOnUse' width='20' height='20'%3e%3crect fill='%23f1f5f9' width='10' height='10'/%3e%3crect fill='%23e2e8f0' x='10' width='10' height='10'/%3e%3crect fill='%23e2e8f0' y='10' width='10' height='10'/%3e%3crect fill='%23f1f5f9' x='10' y='10' width='10' height='10'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23a)'/%3e%3c/svg%3e\")",
            }}
          >
            <Image
              src={outputImage || "/placeholder.svg"}
              alt="Background removed image"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              const link = document.createElement("a")
              link.href = outputImage
              link.download = "background-removed.png"
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
          >
            Download PNG with Transparent Background
          </Button>
        </Card>
      )}
    </div>
  )
}
