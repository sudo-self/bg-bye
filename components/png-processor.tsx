"use client"

import React, { useEffect, useState } from "react"
import NextImage from "next/image"
import JSZip from "jszip"

const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 ${props.className || ""}`}
  >
    {props.children}
  </button>
)

const Card = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={`p-6 rounded shadow-md bg-white dark:bg-gray-800 ${props.className || ""}`}
  />
)

const useToast = () => ({
  toast: ({ title, description }: { title: string; description?: string }) => {
    alert(`${title}${description ? "\n" + description : ""}`)
  },
})

const UploadIcon = () => <span style={{ fontSize: "24px" }}>📤</span>
const DownloadIcon = () => <span style={{ fontSize: "24px" }}>📥</span>
const RefreshCwIcon = () => <span style={{ fontSize: "24px" }}>⏳</span>

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
  const [kitImages, setKitImages] = useState<{
    facebookCover?: string
    profilePic?: string
    snapchatBubble?: string
    instagramPost?: string
    instagramStory?: string
    twitterHeader?: string
    youtubeThumb?: string
    linkedinBanner?: string
    tiktokProfile?: string
    pinterestPin?: string
    discordServerIcon?: string
    whatsappProfile?: string
    telegramProfile?: string
    redditIcon?: string
  }>({})
  const { toast } = useToast()

  useEffect(() => {
    if (!inputFile) {
      setInputPreview(null)
      setKitImages({})
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setInputPreview(reader.result as string)
    }
    reader.readAsDataURL(inputFile)
  }, [inputFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setInputFile(e.target.files[0])
    }
  }

  const processKit = async () => {
    if (!inputPreview) {
      toast({ title: "No image uploaded", description: "Please upload an image first." })
      return
    }
    setProcessing(true)
    try {
      const img = new window.Image()
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

      const facebookCover = await resizeImage(img, 820, 312, fbGradient)
      const profilePic = await resizeImage(img, 400, 400, null)
      const snapchatBubble = await resizeImage(img, 400, 400, "#FFFC00", (ctx, w, h) => {
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
      })

      const instagramPost = await resizeImage(img, 1080, 1080, "#ffffff")
      const instagramStory = await resizeImage(img, 1080, 1920, "#ffffff")
      const twitterHeader = await resizeImage(img, 1500, 500, "#1DA1F2")
      const youtubeThumb = await resizeImage(img, 1280, 720, "#000000")
      const linkedinBanner = await resizeImage(img, 1584, 396, "#0077B5")
      const tiktokProfile = await resizeImage(img, 200, 200, "#000000")
      const pinterestPin = await resizeImage(img, 1000, 1500, "#ffffff")
      const discordServerIcon = await resizeImage(img, 512, 512, "#5865F2")

      // New additions
      const whatsappProfile = await resizeImage(img, 192, 192, "#25D366") // WhatsApp green
      const telegramProfile = await resizeImage(img, 200, 200, "#0088cc") // Telegram blue
      const redditIcon = await resizeImage(img, 256, 256, "#FF4500") // Reddit orange

      setKitImages({
        facebookCover,
        profilePic,
        snapchatBubble,
        instagramPost,
        instagramStory,
        twitterHeader,
        youtubeThumb,
        linkedinBanner,
        tiktokProfile,
        pinterestPin,
        discordServerIcon,
        whatsappProfile,
        telegramProfile,
        redditIcon,
      })
      toast({ title: "Social media kit created!" })
    } catch (err) {
      console.error(err)
      toast({ title: "Processing error", description: (err as Error).message || "Unknown error" })
    } finally {
      setProcessing(false)
    }
  }

  const downloadZip = async () => {
    if (!kitImages.facebookCover) return
    setProcessing(true)
    try {
      const zip = new JSZip()
      zip.file("facebook-cover.png", kitImages.facebookCover.split(",")[1], { base64: true })
      zip.file("profile-picture.png", kitImages.profilePic!.split(",")[1], { base64: true })
      zip.file("snapchat-bubble.png", kitImages.snapchatBubble!.split(",")[1], { base64: true })
      zip.file("instagram-post.png", kitImages.instagramPost!.split(",")[1], { base64: true })
      zip.file("instagram-story.png", kitImages.instagramStory!.split(",")[1], { base64: true })
      zip.file("twitter-header.png", kitImages.twitterHeader!.split(",")[1], { base64: true })
      zip.file("youtube-thumbnail.png", kitImages.youtubeThumb!.split(",")[1], { base64: true })
      zip.file("linkedin-banner.png", kitImages.linkedinBanner!.split(",")[1], { base64: true })
      zip.file("tiktok-profile.png", kitImages.tiktokProfile!.split(",")[1], { base64: true })
      zip.file("pinterest-pin.png", kitImages.pinterestPin!.split(",")[1], { base64: true })
      zip.file("discord-server-icon.png", kitImages.discordServerIcon!.split(",")[1], { base64: true })
      zip.file("whatsapp-profile.png", kitImages.whatsappProfile!.split(",")[1], { base64: true })
      zip.file("telegram-profile.png", kitImages.telegramProfile!.split(",")[1], { base64: true })
      zip.file("reddit-icon.png", kitImages.redditIcon!.split(",")[1], { base64: true })

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
      console.error(err)
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
          <label htmlFor="upload-image" className="cursor-pointer inline-block text-gray-600 dark:text-gray-300">
            <UploadIcon />
            <p className="mt-4">Click or drag PNG file here to upload</p>
            <p className="text-xs mt-1">PNG only, max 5MB</p>
          </label>
        ) : (
          <>
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <NextImage src={inputPreview} alt="Input preview" fill className="object-contain" unoptimized />
            </div>
            <div className="mt-4 flex justify-center gap-4">
              <Button onClick={() => setInputFile(null)} disabled={processing}>
                Remove Image
              </Button>
              <label htmlFor="upload-image">
                <Button as="span" disabled={processing}>
                  Change Image
                </Button>
              </label>
            </div>
          </>
        )}
      </div>

      <Button onClick={processKit} disabled={!inputPreview || processing} className="w-full">
        {processing ? (
          <>
            <RefreshCwIcon />
            <span className="ml-2">Processing...</span>
          </>
        ) : (
          "Generate Social Media Kit"
        )}
      </Button>

      {kitImages.facebookCover && (
        <Card>
          <div className="space-y-6">
            {Object.entries({
              "Facebook Cover (820x312)": kitImages.facebookCover,
              "Profile Picture (400x400)": kitImages.profilePic,
              "Snapchat Bubble (400x400)": kitImages.snapchatBubble,
              "Instagram Post (1080x1080)": kitImages.instagramPost,
              "Instagram Story (1080x1920)": kitImages.instagramStory,
              "Twitter Header (1500x500)": kitImages.twitterHeader,
              "YouTube Thumbnail (1280x720)": kitImages.youtubeThumb,
              "LinkedIn Banner (1584x396)": kitImages.linkedinBanner,
              "TikTok Profile (200x200)": kitImages.tiktokProfile,
              "Pinterest Pin (1000x1500)": kitImages.pinterestPin,
              "Discord Server Icon (512x512)": kitImages.discordServerIcon,
              "WhatsApp Profile (192x192)": kitImages.whatsappProfile,
              "Telegram Profile (200x200)": kitImages.telegramProfile,
              "Reddit Icon (256x256)": kitImages.redditIcon,
            }).map(([label, src]) => (
              <div key={label}>
                <h4 className="mb-2 font-medium">{label}</h4>
                <div className="rounded-lg overflow-hidden border mx-auto" style={{ width: 160, height: 90 }}>
                  <img src={src} alt={label} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
                </div>
              </div>
            ))}
          </div>

          <Button onClick={downloadZip} className="mt-6 w-full bg-blue-700 hover:bg-indigo-700" disabled={processing}>
            <DownloadIcon />
            <span className="ml-2">Download All Images (ZIP)</span>
          </Button>
        </Card>
      )}
    </div>
  )
}
