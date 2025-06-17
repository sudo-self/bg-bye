"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UploadIcon, RefreshCwIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

// Remove this line: import { Client } from "@gradio/client"

export function ImageUploader() {
  const [isLoading, setIsLoading] = useState(false)
  const [inputImage, setInputImage] = useState<File | null>(null)
  const [inputPreview, setInputPreview] = useState<string | null>(null)
  const [outputImage, setOutputImage] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setInputImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setInputPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setOutputImage(null)
      setDebugInfo("")
    }
  }

  const processImage = async () => {
    if (!inputImage) {
      toast({
        title: "No image selected",
        description: "Please select an image to process",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setDebugInfo("Starting background removal...")

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(inputImage)
      })

      setDebugInfo("Image converted to base64, sending to API...")

      // Direct API call to Hugging Face Space
      const response = await fetch("https://sudo-saidso-bar.hf.space/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [base64],
          fn_index: 0,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setDebugInfo(`API response: ${JSON.stringify(result, null, 2)}`)

      // Handle the result
      if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
        // The first item should be the processed image with transparent background
        const processedImage = result.data[0]

        if (typeof processedImage === "string") {
          setOutputImage(processedImage)
          setDebugInfo(`Success! Background removed.`)
          toast({
            title: "Background Removed!",
            description: "Your image has been processed with transparent background",
          })
        } else if (processedImage && processedImage.url) {
          setOutputImage(processedImage.url)
          setDebugInfo(`Success! Background removed.`)
          toast({
            title: "Background Removed!",
            description: "Your image has been processed with transparent background",
          })
        } else {
          throw new Error("Invalid image format in response")
        }
      } else {
        throw new Error(`Invalid response format: ${JSON.stringify(result)}`)
      }
    } catch (error) {
      console.error("Error processing image:", error)
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
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 text-center">
        <input
          type="file"
          id="image-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {!inputPreview ? (
          <div className="space-y-4">
            <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Drag and drop or click to upload</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Supports JPG, PNG, GIF up to 5MB</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={isLoading}
            >
              Select Image
            </Button>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <div className="relative w-full aspect-video max-h-[300px] overflow-hidden rounded-lg">
              <Image
                src={inputPreview || "/placeholder.svg"}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setInputImage(null)
                  setInputPreview(null)
                  setOutputImage(null)
                  setDebugInfo("")
                }}
                disabled={isLoading}
              >
                Remove
              </Button>
              <Button onClick={() => document.getElementById("image-upload")?.click()} disabled={isLoading}>
                Change Image
              </Button>
            </div>
          </div>
        )}
      </div>

      <Button className="w-full" onClick={processImage} disabled={!inputImage || isLoading}>
        {isLoading ? (
          <>
            <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Process Image"
        )}
      </Button>

      {debugInfo && (
        <Card className="p-4 bg-slate-50 dark:bg-slate-900">
          <h4 className="text-sm font-medium mb-2">Debug Info:</h4>
          <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{debugInfo}</pre>
        </Card>
      )}

      {outputImage && (
        <Card className="p-4 mt-8">
          <h3 className="text-lg font-medium mb-4">Background Removed</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Your image now has a transparent background</p>
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
