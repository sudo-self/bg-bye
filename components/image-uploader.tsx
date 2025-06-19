"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Download, Loader2, ImageIcon, Lock, AlertCircle } from "lucide-react"
import { useUsage } from "@/components/usage-context"

export function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { freeUsesRemaining, hasReachedLimit, useFreeTrial, isPremium, usePaidCredit, paidCredits } = useUsage()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const processImage = async () => {
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
        setError(result.error || "Failed to remove background")
      }
    } catch (err) {
      setError("Network error. Please try again.")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadImage = () => {
    if (processedImage) {
      const link = document.createElement("a")
      link.href = processedImage
      link.download = "bg-removed-image.png"
      link.click()
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

      {/* File Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-slate-300 dark:border-slate-700"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900 dark:text-white">Drop your image here</p>
              <p className="text-slate-600 dark:text-slate-400">or click to browse files</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Supports JPG, PNG, WebP (max 10MB)</p>
            </div>
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="file-upload" />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose File
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected File Preview */}
      {selectedFile && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedFile.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={processImage}
                  disabled={isProcessing || !canProcess}
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
                      Removing Background...
                    </>
                  ) : (
                    "Remove Background"
                  )}
                </Button>
              </div>

              {/* Original Image Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Original</h4>
                  <img
                    src={URL.createObjectURL(selectedFile) || "/placeholder.svg"}
                    alt="Original"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>

                {processedImage && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Background Removed</h4>
                    <div className="relative">
                      <img
                        src={processedImage || "/placeholder.svg"}
                        alt="Processed"
                        className="w-full h-48 object-cover rounded-lg border"
                        style={{ backgroundColor: "transparent" }}
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
