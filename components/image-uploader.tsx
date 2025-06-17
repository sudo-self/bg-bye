"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UploadIcon, RefreshCwIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export function ImageUploader() {
  const [isLoading, setIsLoading] = useState(false)
  const [inputImage, setInputImage] = useState<File | null>(null)
  const [inputPreview, setInputPreview] = useState<string | null>(null)
  const [outputImage, setOutputImage] = useState<string | null>(null)
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

      // Handle the response structure based on the Gradio app code
      // The /image endpoint returns (processed_image, origin) - we want the first one (processed_image)
      let processedImageUrl = null

      if (result.data && result.data.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
        const imageArray = result.data.data[0]

        if (Array.isArray(imageArray) && imageArray.length > 0) {
          // Get the FIRST image (index 0) which is the processed image with background removed
          const processedImageData = imageArray[0]
          if (processedImageData && typeof processedImageData === "object") {
            processedImageUrl = processedImageData.url || processedImageData.path
          }
        }
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
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"

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
          "Remove Background"
        )}
      </Button>

      {outputImage && (
        <Card className="p-4 mt-8">
          <h3 className="text-lg font-medium mb-4">Background Removed</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Your image now has a transparent background. The checkerboard pattern shows transparency.
          </p>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Original Image */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-center">Original</h4>
              <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-white border">
                <Image
                  src={inputPreview || "/placeholder.svg"}
                  alt="Original image"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            {/* Processed Image */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-center">Background Removed</h4>
              <div
                className="relative w-full aspect-video overflow-hidden rounded-lg border"
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
            </div>
          </div>

          {/* Background options */}
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium">Preview Background:</h4>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const container = document.getElementById("bg-preview")
                  if (container) {
                    container.style.backgroundImage =
                      "url(\"data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='a' patternUnits='userSpaceOnUse' width='20' height='20'%3e%3crect fill='%23f1f5f9' width='10' height='10'/%3e%3crect fill='%23e2e8f0' x='10' width='10' height='10'/%3e%3crect fill='%23e2e8f0' y='10' width='10' height='10'/%3e%3crect fill='%23f1f5f9' x='10' y='10' width='10' height='10'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23a)'/%3e%3c/svg%3e\")"
                  }
                }}
              >
                Transparent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const container = document.getElementById("bg-preview")
                  if (container) {
                    container.style.backgroundImage = "none"
                    container.style.backgroundColor = "#ffffff"
                  }
                }}
              >
                White
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const container = document.getElementById("bg-preview")
                  if (container) {
                    container.style.backgroundImage = "none"
                    container.style.backgroundColor = "#000000"
                  }
                }}
              >
                Black
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const container = document.getElementById("bg-preview")
                  if (container) {
                    container.style.backgroundImage = "linear-gradient(45deg, #ff6b6b, #4ecdc4)"
                    container.style.backgroundColor = "transparent"
                  }
                }}
              >
                Gradient
              </Button>
            </div>
          </div>

          {/* Large preview with changeable background */}
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-center">Full Preview</h4>
            <div
              id="bg-preview"
              className="relative w-full aspect-video max-h-[400px] overflow-hidden rounded-lg border"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='a' patternUnits='userSpaceOnUse' width='20' height='20'%3e%3crect fill='%23f1f5f9' width='10' height='10'/%3e%3crect fill='%23e2e8f0' x='10' width='10' height='10'/%3e%3crect fill='%23e2e8f0' y='10' width='10' height='10'/%3e%3crect fill='%23f1f5f9' x='10' y='10' width='10' height='10'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23a)'/%3e%3c/svg%3e\")",
              }}
            >
              <Image
                src={outputImage || "/placeholder.svg"}
                alt="Background removed image - full preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
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
              } catch (error) {
                console.error("Download failed:", error)
                toast({
                  title: "Download failed",
                  description: "Could not download the image. Please try right-clicking and saving.",
                  variant: "destructive",
                })
              }
            }}
          >
            Download PNG with Transparent Background
          </Button>
          <Button
            variant="secondary"
            className="w-full mt-2"
            onClick={async () => {
              try {
                const response = await fetch(outputImage)
                const blob = await response.blob()

                // Convert blob to base64
                const reader = new FileReader()
                reader.onload = () => {
                  const base64 = reader.result as string

                  // Create HTML content with embedded base64 image
                  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Background Removed Image</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 800px;
            width: 100%;
        }
        .image-container {
            text-align: center;
            margin: 20px 0;
        }
        .bg-removed-image {
            max-width: 100%;
            height: auto;
            border: 2px dashed #ccc;
            padding: 10px;
            background-image: 
                linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        .download-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        .download-btn:hover {
            background: #0056b3;
        }
        h1 {
            color: #333;
            text-align: center;
        }
        p {
            color: #666;
            text-align: center;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Background Removed Successfully!</h1>
        <p>Your image has been processed and the background has been removed. The checkerboard pattern shows the transparent areas.</p>
        
        <div class="image-container">
            <img src="${base64}" alt="Background Removed Image" class="bg-removed-image" id="processedImage">
        </div>
        
        <div style="text-align: center;">
            <button class="download-btn" onclick="downloadImage()">💾 Download PNG</button>
            <button class="download-btn" onclick="copyToClipboard()">📋 Copy Image</button>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <h3>💡 Tips:</h3>
            <ul style="text-align: left; color: #666;">
                <li>Right-click the image and select "Save image as..." to download</li>
                <li>The transparent background will work in most image editors</li>
                <li>Use this image for overlays, logos, or design projects</li>
            </ul>
        </div>
    </div>

    <script>
        function downloadImage() {
            const link = document.createElement('a');
            link.href = '${base64}';
            link.download = 'background-removed-' + new Date().getTime() + '.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        async function copyToClipboard() {
            try {
                const response = await fetch('${base64}');
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                alert('✅ Image copied to clipboard!');
            } catch (err) {
                alert('❌ Failed to copy image to clipboard');
            }
        }
    </script>
</body>
</html>`

                  // Create and download HTML file
                  const htmlBlob = new Blob([htmlContent], { type: "text/html" })
                  const url = window.URL.createObjectURL(htmlBlob)
                  const link = document.createElement("a")
                  link.href = url
                  link.download = "background-removed-image.html"
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  window.URL.revokeObjectURL(url)

                  toast({
                    title: "HTML File Downloaded!",
                    description: "Open the HTML file in your browser to view and download your image",
                  })
                }
                reader.readAsDataURL(blob)
              } catch (error) {
                console.error("HTML download failed:", error)
                toast({
                  title: "HTML download failed",
                  description: "Could not create HTML file. Please try the regular download.",
                  variant: "destructive",
                })
              }
            }}
          >
            📄 Download as HTML Page
          </Button>
        </Card>
      )}
    </div>
  )
}
