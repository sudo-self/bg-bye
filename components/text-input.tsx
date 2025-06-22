"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { RefreshCwIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import JSZip from "jszip"

export function TextInput() {
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [outputImage, setOutputImage] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const savedOutput = localStorage.getItem("outputImage")
    if (savedOutput) setOutputImage(savedOutput)
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
      const url = new URL(window.location.href)
      url.searchParams.delete("paid")
      router.replace(url.toString(), { scroll: false, shallow: true })
    }
  }, [searchParams, outputImage, router])

  const processImageUrl = async () => {
    if (!imageUrl) {
      toast({
        title: "No URL provided",
        description: "Please enter an image URL to process",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/process-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      })

      const result = await response.json()

      const processedImageUrl = result?.data?.data?.[0]?.[0]?.url || result?.data?.data?.[0]?.[0]?.path

      if (processedImageUrl) {
        setOutputImage(processedImageUrl)
        toast({ title: "Background Removed!", description: "Premium Icon Pack Available" })
      } else {
        throw new Error(`No URL in response: ${JSON.stringify(result)}`)
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Processing failed",
        description: err instanceof Error ? err.message : "Unknown error",
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
        throw new Error("No Stripe URL returned")
      }
    } catch (err) {
      toast({
        title: "Payment error",
        description: "Redirect to Stripe failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadZipPack = async () => {
    if (!outputImage) return

    setIsLoading(true)
    try {
      const sizes = [
        { size: 32, name: "favicon-32.png" },
        { size: 64, name: "icon-64.png" },
        { size: 180, name: "apple-touch-icon.png" },
        { size: 512, name: "icon-512.png" },
      ]

      const zip = new JSZip()

      await Promise.all(
        sizes.map(async ({ size, name }) => {
          const res = await fetch(outputImage!)
          const blob = await res.blob()
          const bitmap = await createImageBitmap(blob)
          const canvas = document.createElement("canvas")
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext("2d")!
          ctx.clearRect(0, 0, size, size)
          ctx.drawImage(bitmap, 0, 0, size, size)
          const blobOut = await new Promise<Blob>((resolve) => canvas.toBlob(resolve!, "image/png")!)
          zip.file(name, blobOut)
        })
      )

      const premiumTxt = `
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="64x64" href="/icon-64.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">
<!-- https://bg-bye-bye.vercel.app/ -->
`.trim()

      zip.file("premium.txt", premiumTxt)

      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "premium-pack.zip"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      toast({
        title: "ZIP error",
        description: "Could not create icon ZIP",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const previews = [
    { size: 32, name: "favicon-32.png" },
    { size: 64, name: "icon-64.png" },
    { size: 180, name: "apple-touch-icon.png" },
    { size: 512, name: "icon-512.png" },
  ]

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4 py-6">
      <div className="space-y-4">
        <Input
          id="image-url"
          placeholder="https://website.com/picture.png"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={isLoading}
        />
        <Button className="w-full" onClick={processImageUrl} disabled={!imageUrl || isLoading}>
          {isLoading ? (
            <>
              <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Process Image URL"
          )}
        </Button>
      </div>

          {outputImage && (
            <Card className="p-4 mt-8">
              <h3 className="text-lg font-medium mb-4">Background Removed</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Premium Pack includes 4 HQ icons and 1 SVG
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 mb-6">
                {[32, 64, 180, 512].map((size) => (
                  <div className="flex flex-col items-center" key={size}>
                                                   <div
                                                     className="relative border rounded overflow-hidden"
                                                     style={{ width: `${size}px`, height: `${size}px` }}
                                                   >

                      <div className="relative w-full h-full">
                        <Image
                          src={outputImage}
                          alt={`icon-${size}`}
                          width={size}
                          height={size}
                          className="object-contain w-full h-full"
                          unoptimized
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Image
                            src="/wind.svg"
                            alt="Watermark"
                            width={size * 1.0}
                            height={size * 1.0}
                            className="opacity-40"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs mt-2 text-center text-slate-500">{`icon-${size}.png`}</p>
                  </div>
                ))}
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
                <Button className="w-full mt-4" onClick={downloadZipPack} disabled={isLoading}>
                  Download Premium Pack
                </Button>
              )}
            </Card>
          )}
        </div>
      )
    }
