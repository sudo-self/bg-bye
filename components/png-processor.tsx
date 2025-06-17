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
    setDebugInfo("Connecting to BiRefNet API...")

    try {
      // Use the official Gradio client
      const { Client } = await import("@gradio/client")

      setDebugInfo("Connected! Processing PNG file...")
      const client = await Client.connect("sudo-saidso/bar")

      const result = await client.predict("/png", {
        f: inputImage, // Note: parameter name is 'f' for the PNG endpoint
      })

      setDebugInfo(`Full API Response: ${JSON.stringify(result, null, 2)}`)

      // Handle the response structure - PNG endpoint might return a file directly
      let processedFileUrl = null

      if (result && result.data) {
        // Check if data is an array
        if (Array.isArray(result.data) && result.data.length > 0) {
          const firstItem = result.data[0]

          // Case 1: Direct file object
          if (firstItem && typeof firstItem === "object" && firstItem.url) {
            processedFileUrl = firstItem.url
          }
          // Case 2: Path property
          else if (firstItem && typeof firstItem === "object" && firstItem.path) {
            processedFileUrl = firstItem.path
          }
          // Case 3: Direct URL string
          else if (typeof firstItem === "string") {
            processedFileUrl = firstItem
          }
          // Case 4: Nested array like other endpoints
          else if (Array.isArray(firstItem) && firstItem.length > 0) {
            const nestedItem = firstItem.length > 1 ? firstItem[1] : firstItem[0]
            if (nestedItem && typeof nestedItem === "object") {
              if (nestedItem.url) {
                processedFileUrl = nestedItem.url
              } else if (nestedItem.path) {
                processedFileUrl = nestedItem.path
              }
            }
          }
        }
        // Check if data is directly a file object
        else if (result.data && typeof result.data === "object" && result.data.url) {
          processedFileUrl = result.data.url
        } else if (result.data && typeof result.data === "object" && result.data.path) {
          processedFileUrl = result.data.path
        }
      }

      if (processedFileUrl) {
        setOutputFile(processedFileUrl)
        setDebugInfo(`Success! PNG file created. File URL: ${processedFileUrl}`)

        toast({
          title: "PNG Created!",
          description: "Your PNG file with transparent background is ready",
        })
      } else {
        throw new Error(`Could not find file URL in response. Full response: ${JSON.stringify(result)}`)
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

          {/* Show preview of the PNG file */}
          <div
            className="relative w-full aspect-video max-h-[300px] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 mb-4"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='a' patternUnits='userSpaceOnUse' width='20' height='20'%3e%3crect fill='%23f1f5f9' width='10' height='10'/%3e%3crect fill='%23e2e8f0' x='10' width='10' height='10'/%3e%3crect fill='%23e2e8f0' y='10' width='10' height='10'/%3e%3crect fill='%23f1f5f9' x='10' y='10' width='10' height='10'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23a)'/%3e%3c/svg%3e\")",
            }}
          >
            <Image
              src={outputFile || "/placeholder.svg"}
              alt="Processed PNG file"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

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
