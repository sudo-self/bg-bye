"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UploadIcon, RefreshCwIcon, DownloadIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"

export function PngProcessor() {
  const [isLoading, setIsLoading] = useState(false)
  const [inputImage, setInputImage] = useState<File | null>(null)
  const [inputPreview, setInputPreview] = useState<string | null>(null)
  const [outputFile, setOutputFile] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)

  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get("paid") === "true" && outputFile) {
      setPaid(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("paid")
      router.replace(url.toString(), { scroll: false, shallow: true })
    }
  }, [searchParams, outputFile, router])

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
      setPaid(false)
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

    try {
      const formData = new FormData()
      formData.append("image", inputImage)
      formData.append("endpoint", "/png")

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      let processedFileUrl = null

      if (result.data && result.data.data) {
        if (typeof result.data.data === "string") {
          processedFileUrl = `https://sudo-saidso-bar.hf.space/gradio_api/file=${result.data.data}`
        } else if (Array.isArray(result.data.data) && result.data.data.length > 0) {
          const firstItem = result.data.data[0]
          if (firstItem && typeof firstItem === "object") {
            processedFileUrl = firstItem.url || firstItem.path
          }
        }
      }

      if (processedFileUrl) {
        setOutputFile(processedFileUrl)

        toast({
          title: "PNG Created!",
          description: "Your PNG file with transparent background is ready",
        })
      } else {
        throw new Error(`Could not find file URL in response. Full response: ${JSON.stringify(result)}`)
      }
    } catch (error) {
      console.error("Error processing PNG:", error)
      toast({
        title: "PNG processing failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStripePay = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const { url } = await response.json()
      if (url) {
        if (outputFile) {
          localStorage.setItem("pngOutputFile", outputFile)
        }
        window.location.href = url
      } else {
        throw new Error("No Stripe URL returned")
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Payment error",
        description: "Redirect to Stripe failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(outputFile!)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "processed-image.png"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
      toast({
        title: "Download failed",
        description: "Could not download the image. Please try right-clicking and saving.",
        variant: "destructive",
      })
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
                  setPaid(false)
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

      {outputFile && (
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-medium mb-4">PNG File Generated</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Your PNG file has been successfully processed.
          </p>

          <div
            className="relative w-full aspect-video max-h-[300px] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 mb-4"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='a' patternUnits='userSpaceOnUse' width='20' height='20'%3e%3crect fill='%23f1f5f9' width='10' height='10'/%3e%3crect fill='%23e2e8f0' x='10' width='10' height='10'/%3e%3crect fill='%23e2e8f0' y='10' width='10' height='10'/%3e%3crect fill='%23f1f5f9' x='10' y='10' width='10' height='10'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23a)'/%3e%3c/svg%3e\")",
            }}
          >
            <Image
              src={outputFile}
              alt="Processed PNG"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {!paid ? (
            <Button className="w-full bg-green-700 text-white hover:bg-green-600" onClick={handleStripePay}>
              Purchase Premium Image
            </Button>
          ) : (
            <Button className="w-full" onClick={handleDownload}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}

