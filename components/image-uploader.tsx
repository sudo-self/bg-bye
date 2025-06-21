"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UploadIcon, RefreshCwIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"

export function ImageUploader() {
  const [isLoading, setIsLoading] = useState(false)
  const [inputImage, setInputImage] = useState<File | null>(null)
  const [inputPreview, setInputPreview] = useState<string | null>(null)
  const [outputImage, setOutputImage] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const [bgOption, setBgOption] = useState<"transparent" | "white" | "black" | "gradient">("transparent")
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const savedOutput = localStorage.getItem("outputImage")
    if (savedOutput) {
      setOutputImage(savedOutput)
    }
  }, [])

  useEffect(() => {
    if (outputImage) {
      localStorage.setItem("outputImage", outputImage)
    } else {
      localStorage.removeItem("outputImage")
    }
  }, [outputImage])

  useEffect(() => {
    if (searchParams.get("paid") === "true" && outputImage) {
      setPaid(true)
      setTimeout(() => {
        const downloadLink = document.createElement("a")
        downloadLink.href = outputImage
        downloadLink.download = "background-removed.png"
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)

        const url = new URL(window.location.href)
        url.searchParams.delete("paid")
        router.replace(url.toString(), { scroll: false, shallow: true })
      }, 500)
    }
  }, [searchParams, outputImage, router])

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
      localStorage.removeItem("outputImage")
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
        processedImageUrl = result.data.data[0][0].url || result.data.data[0][0].path
      }

      if (processedImageUrl) {
        setOutputImage(processedImageUrl)
        toast({
          title: "Background Removed!",
          description: "Premium Icon Pack Available",
        })
      } else {
        throw new Error(`Image URL missing in response: ${JSON.stringify(result)}`)
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
      const response = await fetch("/api/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const { url } = await response.json()
      if (url) {
        if (outputImage) {
          localStorage.setItem("outputImage", outputImage)
        }
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
          <>
            <div className="flex justify-center gap-4 mb-4">
              {(["transparent", "white", "black", "gradient"] as const).map((bg) => (
                <Button
                  key={bg}
                  variant={bgOption === bg ? "default" : "outline"}
                  onClick={() => setBgOption(bg)}
                  disabled={isLoading}
                  className="capitalize"
                >
                  {bg}
                </Button>
              ))}
            </div>

            <div
              className="relative w-full aspect-video max-h-[300px] overflow-hidden rounded-lg border"
              style={{
                background:
                  bgOption === "white"
                    ? "#fff"
                    : bgOption === "black"
                    ? "#000"
                    : bgOption === "gradient"
                    ? "linear-gradient(135deg, #4ade80, #22d3ee)"
                    : "transparent",
              }}
            >
              <Image
                src={inputPreview}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            <div className="flex justify-center gap-4 mt-4 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setInputImage(null)
                  setInputPreview(null)
                  setOutputImage(null)
                  setPaid(false)
                  localStorage.removeItem("outputImage")
                }}
                disabled={isLoading}
              >
                Remove
              </Button>
              <Button
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={isLoading}
              >
                Replace
              </Button>
            </div>
          </>
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
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Premium Pack includes original + favicon (32x32) + icon (64x64) + Apple icon (180x180)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-6">
            {/* Original */}
            <div className="relative aspect-video border rounded overflow-hidden">
              <Image
                src={outputImage}
                alt="Original"
                fill
                className="object-contain"
                unoptimized
              />
              <div className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-2 py-1 rounded">
                Original
              </div>
            </div>

            {/* favicon-32.png */}
            <div className="flex flex-col items-center">
              <div className="relative w-[32px] h-[32px] border rounded overflow-hidden">
                <Image
                  src={outputImage}
                  alt="Favicon 32x32"
                  width={32}
                  height={32}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <p className="text-xs mt-2 text-center text-slate-500">Favicon</p>
            </div>

            {/* icon-64.png */}
            <div className="flex flex-col items-center">
              <div className="relative w-[64px] h-[64px] border rounded overflow-hidden">
                <Image
                  src={outputImage}
                  alt="Icon 64x64"
                  width={64}
                  height={64}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <p className="text-xs mt-2 text-center text-slate-500">Web App</p>
            </div>

            {/* apple-touch-icon.png (180x180) */}
            <div className="flex flex-col items-center">
              <div className="relative w-[180px] h-[180px] border rounded overflow-hidden">
                <Image
                  src={outputImage}
                  alt="Apple Icon 180x180"
                  width={180}
                  height={180}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <p className="text-xs mt-2 text-center text-slate-500">Mobile Device</p>
            </div>
          </div>

          {!paid ? (
            <Button
              className="w-full mt-4 bg-green-700 hover:bg-indigo-600 text-white"
              onClick={handleStripePay}
              disabled={isLoading}
            >
              Purchase Premium Icons
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
                link.download = "premium-image.png"
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
              }}
            >
              Download Premium Pack
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
