"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Link, Download, Loader2, Lock } from "lucide-react"
import { useUsage } from "@/components/usage-context"

export function TextInput() {
  const [imageUrl, setImageUrl] = useState("")
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")

  const { freeUsesRemaining, hasReachedLimit, useFreeTrial } = useUsage()

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return url.match(/\.(jpeg|jpg|gif|png|webp)$/i)
    } catch {
      return false
    }
  }

  const processImageFromUrl = async () => {
    if (!imageUrl) {
      setError("Please enter an image URL")
      return
    }

    if (!isValidUrl(imageUrl)) {
      setError("Please enter a valid image URL")
      return
    }

    if (hasReachedLimit) {
      setError("You've reached your free limit. Please upgrade to premium for unlimited removals!")
      return
    }

    setError("")
    setIsProcessing(true)

    // Use the free trial
    // useFreeTrial() // Moved to the top level to adhere to hook rules

    try {
      // Simulate API call for background removal
      setTimeout(() => {
        setProcessedImage(imageUrl) // For demo, showing original image
        setIsProcessing(false)
      }, 3000)
    } catch (err) {
      setError("Failed to process image")
      setIsProcessing(false)
    } finally {
      useFreeTrial() // Ensure free trial is used regardless of success or failure
    }
  }

  const downloadImage = async () => {
    if (processedImage) {
      try {
        const response = await fetch(processedImage)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "bg-removed-image.png"
        link.click()
        window.URL.revokeObjectURL(url)
      } catch (err) {
        console.error("Download failed:", err)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={processImageFromUrl}
                disabled={isProcessing || !imageUrl || hasReachedLimit}
                className={`${
                  hasReachedLimit
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                }`}
              >
                {hasReachedLimit ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Upgrade Required
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Remove Background"
                )}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Original Image Preview */}
      {imageUrl && isValidUrl(imageUrl) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Original Image</h3>
            <img
              src={imageUrl || "/placeholder.svg"}
              alt="Original"
              className="max-w-full h-auto rounded-lg border"
              onError={() => setError("Failed to load image from URL")}
            />
          </CardContent>
        </Card>
      )}

      {/* Processed Image */}
      {processedImage && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Background Removed!</h3>
              <div className="relative">
                <img
                  src={processedImage || "/placeholder.svg"}
                  alt="Processed"
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
              <Button onClick={downloadImage} className="w-full bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
