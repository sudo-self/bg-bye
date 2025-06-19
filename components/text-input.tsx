"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Link, Download, Loader2, Lock, AlertCircle } from "lucide-react"
import { useUsage } from "@/components/usage-context"

export function TextInput() {
  const [imageUrl, setImageUrl] = useState("")
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [deductCredit, setDeductCredit] = useState<(() => void) | null>(null)

  const { freeUsesRemaining, hasReachedLimit, useFreeTrial, isPremium, usePaidCredit, paidCredits } = useUsage()

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

    // Check if user has access
    if (!isPremium && freeUsesRemaining <= 0 && paidCredits <= 0) {
      setError("You've reached your limit. Please upgrade to continue!")
      return
    }

    setError("")
    setIsProcessing(true)

    // Determine which credit to deduct
    if (!isPremium) {
      if (freeUsesRemaining > 0) {
        setDeductCredit(() => useFreeTrial)
      } else if (paidCredits > 0) {
        setDeductCredit(() => usePaidCredit)
      } else {
        setDeductCredit(null)
      }
    } else {
      setDeductCredit(null)
    }

    try {
      // First, fetch the image from the URL
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch image from URL")
      }

      const imageBlob = await imageResponse.blob()
      const formData = new FormData()
      formData.append("image", imageBlob, "image.jpg")

      const response = await fetch("/api/remove-background", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setProcessedImage(result.processedImage)

        // Deduct usage after successful processing
        if (deductCredit) {
          deductCredit()
        }
      } else {
        setError(result.error || "Failed to remove background")
      }
    } catch (err) {
      setError("Failed to process image from URL")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadImage = async () => {
    if (processedImage) {
      try {
        const link = document.createElement("a")
        link.href = processedImage
        link.download = "bg-removed-image.png"
        link.click()
      } catch (err) {
        console.error("Download failed:", err)
      }
    }
  }

  const canProcess = isPremium || freeUsesRemaining > 0 || paidCredits > 0

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

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
                disabled={isProcessing || !imageUrl || !canProcess}
                className={`${
                  !canProcess
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                }`}
              >
                {!canProcess ? (
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
          </div>
        </CardContent>
      </Card>

      {/* Image Previews */}
      {imageUrl && isValidUrl(imageUrl) && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Original Image</h3>
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt="Original"
                  className="w-full h-48 object-cover rounded-lg border"
                  onError={() => setError("Failed to load image from URL")}
                />
              </div>

              {processedImage && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Background Removed</h3>
                  <div className="relative">
                    <img
                      src={processedImage || "/placeholder.svg"}
                      alt="Processed"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    {/* Checkerboard pattern to show transparency */}
                    <div
                      className="absolute inset-0 -z-10 rounded-lg"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                          linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                          linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                          linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                        `,
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download Button */}
      {processedImage && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Background Removed Successfully!</h3>
              <Button onClick={downloadImage} className="w-full bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Download PNG Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
