"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UploadIcon, RefreshCwIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

export function ImageUploader() {
  const [isLoading, setIsLoading] = useState(false)
  const [inputImage, setInputImage] = useState<File | null>(null)
  const [inputPreview, setInputPreview] = useState<string | null>(null)
  const [outputImage, setOutputImage] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setPaid(true)
      toast({
        title: "Payment successful",
        description: "You may now download your image.",
      })
    }
  }, [searchParams, toast])

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
      setPaid(false)
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

    try {
      const formData = new FormData()
      formData.append("image", inputImage)
      formData.append("endpoint", "/image")

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.details || result.error || "Failed to process image")
      }

      let processedImageUrl = null

      if (result.data?.data?.[0]?.[0]) {
        const processed = result.data.data[0][0]
        processedImageUrl = processed?.url || processed?.path
      }

      if (processedImageUrl) {
        setOutputImage(processedImageUrl)
        toast({
          title: "Background Removed!",
          description: "Your image has been processed with transparent background",
        })
      } else {
        throw new Error(`Could not find image URL in response. Full response: ${JSON.stringify(result)}`)
      }
    } catch (error) {
      console.error("Error processing image:", error)
      toast({
        title: "Background removal failed",
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
      const response = await fetch("/api/check-out/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error("Stripe checkout URL not received")
      }
    } catch (err) {
      console.error("Stripe error", err)
      toast({
        title: "Payment error",
        description: "There was an error redirecting to payment",
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
            <p className="text-sm text-slate-600 dark:text-slate-400">Drag and drop or click to upload</p>
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
                src={inputPreview}
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
                  setPaid(false)
                }}
                disabled={isLoading}
              >
                Remove
              </Button>
              <Button
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={isLoading}
              >
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
          "Remove Background"
        )}
      </Button>

      {outputImage && (
        <Card className="p-4 mt-8">
          <h3 className="text-lg font-medium mb-4">Background Removed</h3>
          <div className="relative w-full aspect-video overflow-hidden rounded-lg border">
            <Image
              src={outputImage}
              alt="Processed image"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {!paid ? (
            <Button
              className="w-full mt-4 bg-blue-600 text-white"
              onClick={handleStripePay}
            >
              Premium Package
            </Button>
          ) : (
            <Button
              className="w-full mt-4"
              onClick={async () => {
                const response = await fetch(outputImage)
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = "background-removed.png"
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
              }}
            >
              Download PNG
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
