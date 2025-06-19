"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Upload, Download, Loader2, Settings, Lock, AlertCircle } from "lucide-react"
import { useUsage } from "@/components/usage-context"

export function PngProcessor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [quality, setQuality] = useState([80])
  const [transparency, setTransparency] = useState([100])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { freeUsesRemaining, hasReachedLimit, useFreeTrial, isPremium, usePaidCredit, paidCredits } = useUsage()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === "image/png") {
        setSelectedFile(file)
        setError(null)
      } else {
        setError("Please select a PNG file")
      }
    }
  }

  const processPng = async () => {
    if (!selectedFile) return

    // Check if user has access
    if (!isPremium && freeUsesRemaining <= 0 && paidCredits <= 0) {
      setError("You've reached your limit. Please upgrade to continue!")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)
      formData.append("endpoint", "/png") // Use the /png endpoint for PNG processing

      const response = await fetch("/api/remove-background", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setProcessedImage(result.processedImage)

        // Deduct usage after successful processing
        if (!isPremium) {
          if (freeUsesRemaining > 0) {
            useFreeTrial()
          } else if (paidCredits > 0) {
            usePaidCredit()
          }
        }
      } else {
        setError(result.error || "Failed to process PNG")
        console.error("Processing failed:", result)
      }
    } catch (err) {
      setError("Network error. Please try again.")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadProcessedImage = async () => {
    if (processedImage) {
      try {
        // If it's a data URL, download directly
        if (processedImage.startsWith("data:")) {
          const link = document.createElement("a")
          link.href = processedImage
          link.download = "processed-image.png"
          link.click()
        } else {
          // If it's a URL, fetch and download
          const response = await fetch(processedImage)
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = "processed-image.png"
          link.click()
          window.URL.revokeObjectURL(url)
        }
      } catch (err) {
        console.error("Download failed:", err)
        setError("Failed to download image")
      }
    }
  }

  const canProcess = isPremium || freeUsesRemaining > 0 || paidCredits > 0

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Label className="text-slate-900 dark:text-white">Upload PNG File</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Upload className="w-4 h-4" />
                Choose PNG File
              </Button>
              {selectedFile && <span className="text-sm text-slate-600 dark:text-slate-400">{selectedFile.name}</span>}
            </div>
            <input ref={fileInputRef} type="file" accept=".png" onChange={handleFileSelect} className="hidden" />
          </div>
        </CardContent>
      </Card>

      {/* Processing Settings */}
      {selectedFile && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Processing Settings</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Quality: {quality[0]}%
                  </Label>
                  <Slider value={quality} onValueChange={setQuality} max={100} min={10} step={10} className="mt-2" />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Transparency: {transparency[0]}%
                  </Label>
                  <Slider
                    value={transparency}
                    onValueChange={setTransparency}
                    max={100}
                    min={0}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </div>

              <Button
                onClick={processPng}
                disabled={isProcessing || !canProcess}
                className={`w-full ${
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
                    Processing PNG...
                  </>
                ) : (
                  "Process PNG"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Previews */}
      {selectedFile && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Original PNG</h3>
                <img
                  src={URL.createObjectURL(selectedFile) || "/placeholder.svg"}
                  alt="Original PNG"
                  className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                />
              </div>

              {processedImage && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Processed PNG</h3>
                  <div className="relative">
                    <img
                      src={processedImage || "/placeholder.svg"}
                      alt="Processed PNG"
                      className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    {/* Checkerboard pattern for transparency */}
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
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">PNG Processed Successfully!</h3>
              <Button onClick={downloadProcessedImage} className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Download Processed PNG
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
