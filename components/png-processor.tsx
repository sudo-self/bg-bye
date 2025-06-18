"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Upload, Download, Loader2, Settings, Lock } from "lucide-react"
import { useUsage } from "@/components/usage-context"

export function PngProcessor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [quality, setQuality] = useState([80])
  const [transparency, setTransparency] = useState([100])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { freeUsesRemaining, hasReachedLimit, useFreeTrial } = useUsage()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === "image/png") {
        setSelectedFile(file)
      } else {
        alert("Please select a PNG file")
      }
    }
  }

  const processPng = async () => {
    if (!selectedFile) return

    if (hasReachedLimit) {
      alert("You've reached your free limit. Please upgrade to premium for unlimited removals!")
      return
    }

    setIsProcessing(true)

    // Use the free trial
    useFreeTrial()

    // Simulate PNG processing with quality and transparency adjustments
    setTimeout(() => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProcessedImage(e.target?.result as string)
        setIsProcessing(false)
      }
      reader.readAsDataURL(selectedFile)
    }, 2000)
  }

  const downloadProcessedImage = () => {
    if (processedImage) {
      const link = document.createElement("a")
      link.href = processedImage
      link.download = "processed-image.png"
      link.click()
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Label>Upload PNG File</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
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
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Processing Settings</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Quality: {quality[0]}%</Label>
                  <Slider value={quality} onValueChange={setQuality} max={100} min={10} step={10} className="mt-2" />
                </div>

                <div>
                  <Label className="text-sm font-medium">Transparency: {transparency[0]}%</Label>
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
                disabled={isProcessing || hasReachedLimit}
                className={`w-full ${
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

      {/* Original Image Preview */}
      {selectedFile && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Original PNG</h3>
            <img
              src={URL.createObjectURL(selectedFile) || "/placeholder.svg"}
              alt="Original PNG"
              className="max-w-full h-auto rounded-lg border"
            />
          </CardContent>
        </Card>
      )}

      {/* Processed Image */}
      {processedImage && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Processed PNG</h3>
              <div className="relative">
                <img
                  src={processedImage || "/placeholder.svg"}
                  alt="Processed PNG"
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
              <Button onClick={downloadProcessedImage} className="w-full bg-green-600 hover:bg-green-700">
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
