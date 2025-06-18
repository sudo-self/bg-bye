"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Download, Loader2, ImageIcon, Lock } from "lucide-react"
import { useUsage } from "@/components/usage-context"

export function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const { freeUsesRemaining, hasReachedLimit, useFreeTrial } = useUsage()

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

    if (hasReachedLimit) {
      alert("You've reached your free limit. Please upgrade to premium for unlimited removals!")
      return
    }

    setIsProcessing(true)

    // Simulate API call for background removal
    setTimeout(() => {
      // Use the free trial
      useFreeTrial()

      // For demo purposes, we'll just show the original image
      const reader = new FileReader()
      reader.onload = (e) => {
        setProcessedImage(e.target?.result as string)
        setIsProcessing(false)
      }
      reader.readAsDataURL(selectedFile)
    }, 3000)
  }

  const downloadImage = () => {
    if (processedImage) {
      const link = document.createElement("a")
      link.href = processedImage
      link.download = "bg-removed-image.png"
      link.click()
    }
  }

  return (
    <div className="space-y-6">
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
                disabled={isProcessing || hasReachedLimit}
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
