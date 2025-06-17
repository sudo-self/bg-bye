"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UploadIcon, RefreshCwIcon, DownloadIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export function PngProcessor() {
  const [isLoading, setIsLoading] = useState(false)
  const [inputImage, setInputImage] = useState<File | null>(null)
  const [inputPreview, setInputPreview] = useState<string | null>(null)
  const [outputFile, setOutputFile] = useState<string | null>(null)
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
      setOutputFile(null)
      setDebugInfo("")
    }
  }

  const processPng = async () => {
    if (!inputImage) {
      toast({
        title: "No image selected",
        description: "Please select an image to process",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setDebugInfo("Starting PNG file processing...")

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(inputImage)
      })

      setDebugInfo("Image converted, sending to API...")

      const response = await fetch("https://sudo-saidso-bar.hf.space/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [base64],
          fn_index: 2,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setDebugInfo(`API response: ${JSON.stringify(result, null, 2)}`)

      // Handle the result - this endpoint returns a file
      if (result && result.data && result.data[0]) {
        const fileData = result.data[0]

        if (typeof fileData === "string") {
          setOutputFile(fileData)
          setDebugInfo(`Success! PNG file created.`)
          toast({
            title: "PNG Created!",
            description: "Your PNG file with transparent background is ready",
          })
        } else if (fileData && fileData.url) {
          setOutputFile(fileData.url)
          setDebugInfo(`Success! PNG file created.`)
          toast({
            title: "PNG Created!",
            description: "Your PNG file with transparent background is ready",
          })
        } else {
          throw new Error("Invalid file format in response")
        }
      } else {
        throw new Error(`Invalid response format: ${JSON.stringify(result)}`)
      }
    } catch (error) {
      console.error("Error processing PNG:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setDebugInfo(`Error: ${errorMessage}`)

      toast({
        title: "PNG processing failed",
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
          id="png-upload"
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
              onClick={() => document.getElementById("png-upload")?.click()}
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
                  setOutputFile(null)
                  setDebugInfo("")
                }}
                disabled={isLoading}
              >
                Remove
              </Button>
              <Button onClick={() => document.getElementById("png-upload")?.click()} disabled={isLoading}>
                Change Image
              </Button>
            </div>
          </div>
        )}
      </div>

      <Button className="w-full" onClick={processPng} disabled={!inputImage || isLoading}>
        {isLoading ? (
          <>
            <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Process to PNG"
        )}
      </Button>

      {debugInfo && (
        <Card className="p-4 bg-slate-50 dark:bg-slate-900">
          <h4 className="text-sm font-medium mb-2">Debug Info:</h4>
          <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{debugInfo}</pre>
        </Card>
      )}

      {outputFile && (
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-medium mb-4">PNG File Generated</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Your PNG file has been successfully processed and is ready for download.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              const link = document.createElement("a")
              link.href = outputFile
              link.download = "processed-image.png"
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download PNG
          </Button>
        </Card>
      )}
    </div>
  )
}
