"use client"

import React, { useEffect, useState } from "react"
import NextImage from "next/image"
import JSZip from "jszip"
import { Upload as LucideUpload, RefreshCw as RefreshCwIcon, Download as DownloadIcon } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 ${props.className || ""}`}
  >
    {props.children}
  </button>
)

const Card = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={`p-6 rounded shadow-md bg-white dark:bg-gray-800 ${props.className || ""}`} />
)

const useToast = () => ({
  toast: ({ title, description }: { title: string; description?: string }) => {
    alert(`${title}${description ? "\n" + description : ""}`)
  },
})

function resizeImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  bgColor: string | CanvasGradient | null = null,
  drawOverlay?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")!

    if (bgColor) {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.clearRect(0, 0, width, height)
    }

    const aspectRatio = image.width / image.height
    let drawWidth = width
    let drawHeight = height

    if (width / height > aspectRatio) {
      drawWidth = height * aspectRatio
    } else {
      drawHeight = width / aspectRatio
    }

    const x = (width - drawWidth) / 2
    const y = (height - drawHeight) / 2

    ctx.drawImage(image, x, y, drawWidth, drawHeight)

    if (drawOverlay) drawOverlay(ctx, width, height)

    resolve(canvas.toDataURL("image/png"))
  })
}

export function SocialMediaKitGenerator() {
  const [inputFile, setInputFile] = useState<File | null>(null)
  const [inputPreview, setInputPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [kitImages, setKitImages] = useState<{ [key: string]: string }>({})
  const [paid, setPaid] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!inputFile) {
      setInputPreview(null)
      setKitImages({})
      return
    }
    const reader = new FileReader()
    reader.onload = () => setInputPreview(reader.result as string)
    reader.readAsDataURL(inputFile)
  }, [inputFile])

  useEffect(() => {
    if (searchParams.get("paid") === "true" && searchParams.get("product") === "social-media-kit") {
      setPaid(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("paid")
      url.searchParams.delete("product")
      router.replace(url.toString(), { scroll: false })
    }
  }, [searchParams, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setInputFile(e.target.files[0])
  }

  const processKit = async () => {
    if (!inputPreview) {
      toast({ title: "No image uploaded", description: "Please upload an image first." })
      return
    }
    setProcessing(true)
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = inputPreview
      await new Promise((res) => (img.onload = res))

      const fbGradient = (() => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!
        const gradient = ctx.createLinearGradient(0, 0, 820, 312)
        gradient.addColorStop(0, "#4ade80")
        gradient.addColorStop(1, "#22d3ee")
        return gradient
      })()

      const newKit = {
        facebookCover: await resizeImage(img, 820, 312, fbGradient),
        profilePic: await resizeImage(img, 400, 400),
        snapchatBubble: await resizeImage(img, 400, 400, "#FFFC00", (ctx, w, h) => {
          ctx.fillStyle = "white"
          ctx.beginPath()
          ctx.moveTo(w * 0.1, h * 0.1)
          ctx.lineTo(w * 0.9, h * 0.1)
          ctx.lineTo(w * 0.9, h * 0.7)
          ctx.lineTo(w * 0.6, h * 0.7)
          ctx.lineTo(w * 0.5, h * 0.9)
          ctx.lineTo(w * 0.4, h * 0.7)
          ctx.lineTo(w * 0.1, h * 0.7)
          ctx.closePath()
          ctx.fill()
        }),
        instagramPost: await resizeImage(img, 1080, 1080, "#ffffff"),
        instagramStory: await resizeImage(img, 1080, 1920, "#ffffff"),
        twitterHeader: await resizeImage(img, 1500, 500, "#1DA1F2"),
        youtubeThumb: await resizeImage(img, 1280, 720, "#000000"),
        linkedinBanner: await resizeImage(img, 1584, 396, "#0077B5"),
        tiktokProfile: await resizeImage(img, 200, 200, "#000000"),
        pinterestPin: await resizeImage(img, 1000, 1500, "#ffffff"),
        discordServerIcon: await resizeImage(img, 512, 512, "#5865F2"),
        whatsappProfile: await resizeImage(img, 192, 192, "#25D366"),
        telegramProfile: await resizeImage(img, 200, 200, "#0088cc"),
        redditIcon: await resizeImage(img, 256, 256, "#FF4500"),
      }

      setKitImages(newKit)
      toast({ title: "Social media kit created!" })
    } catch (err) {
      console.error(err)
      toast({ title: "Processing error", description: (err as Error).message })
    } finally {
      setProcessing(false)
    }
  }

  const handleStripePay = async () => {
    setProcessing(true)
    try {
      const response = await fetch("/api/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "social-media-kit" }),
      })

      const { url } = await response.json()
      if (url) window.location.href = url
    } catch (err) {
      toast({ title: "Payment error", description: "Redirect to Stripe failed" })
    } finally {
      setProcessing(false)
    }
  }

  const downloadZip = async () => {
    setProcessing(true)
    try {
      const zip = new JSZip()
      Object.entries(kitImages).forEach(([key, base64]) => {
        zip.file(`${key}.png`, base64.split(",")[1], { base64: true })
      })

      const content = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(content)
      const a = document.createElement("a")
      a.href = url
      a.download = "social-media-kit.zip"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast({ title: "Download error", description: "Could not create ZIP file." })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-8 max-w-xl mx-auto p-4">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <input
          type="file"
          accept="image/png"
          className="hidden"
          id="upload-image"
          onChange={handleFileChange}
          disabled={processing}
        />
        {!inputPreview ? (
          <div className="space-y-4">
            <LucideUpload className="mx-auto h-12 w-12 text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Drag and drop or click to upload</p>
            <Button onClick={() => document.getElementById("upload-image")?.click()} disabled={processing}>
              Select Image
            </Button>
          </div>
        ) : (
          <>
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <NextImage src={inputPreview} alt="Input preview" fill className="object-contain" unoptimized />
            </div>
            <div className="mt-4 flex justify-center gap-4">
              <Button onClick={() => setInputFile(null)} disabled={processing}>
                Remove Image
              </Button>
              <Button onClick={() => document.getElementById("upload-image")?.click()} disabled={processing}>
                Change Image
              </Button>
            </div>
          </>
        )}
      </div>

      <Button onClick={processKit} disabled={!inputPreview || processing} className="w-full">
        {processing ? (
          <>
            <RefreshCwIcon className="animate-spin inline-block mr-2" />
            Processing...
          </>
        ) : (
          "Generate Social Media Kit"
        )}
      </Button>

      {Object.keys(kitImages).length > 0 && (
        <Card className="mt-6">
          <div className="space-y-4">
            {Object.entries(kitImages).map(([key, src]) => (
              <div key={key}>
                <h4 className="font-medium">{key}</h4>
                <div className="w-40 h-24 border rounded overflow-hidden">
                  <img src={src} alt={key} className="w-full h-full object-contain" />
                </div>
              </div>
            ))}
          </div>

          {!paid ? (
            <Button onClick={handleStripePay} className="mt-6 w-full bg-green-600 hover:bg-green-700">
              Purchase Social Kit
            </Button>
          ) : (
            <Button onClick={downloadZip} className="mt-6 w-full bg-blue-700 hover:bg-blue-800">
              <DownloadIcon className="inline-block mr-2" />
              Download Social Kit
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
