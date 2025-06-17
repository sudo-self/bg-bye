"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { RefreshCwIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export function TextInput() {
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [outputImage, setOutputImage] = useState<string | null>(null)
  const { toast } = useToast()

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.details || result.error || "Failed to process image URL")
      }

      // Handle the response structure - /text endpoint also returns (processed_image, origin)
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
          description: "Background removed from URL image successfully",
        })
      } else {
        throw new Error(`Could not find image URL in response. Full response: ${JSON.stringify(result)}`)
      }
    } catch (error) {
      console.error("Error processing image URL:", error)
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
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="image-url" className="text-sm font-medium">
            Image URL
          </label>
          <Input
            id="image-url"
            placeholder="https://your-photo.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={isLoading}
          />
        </div>

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

      {imageUrl && !outputImage && !isLoading && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Preview</h3>
          <div className="relative w-full aspect-video max-h-[300px] overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized
              onError={() => {
                toast({
                  title: "Image preview failed",
                  description: "The URL may be invalid or the image is not accessible",
                  variant: "destructive",
                })
              }}
            />
          </div>
        </Card>
      )}

      {outputImage && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Background Removed</h3>
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
            className="mt-2 w-full"
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
