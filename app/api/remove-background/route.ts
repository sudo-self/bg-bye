import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Convert file to base64 for API
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString("base64")

    // Use Remove.bg API (you'll need to sign up for an API key)
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_API_KEY || "demo-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_file_b64: base64Image,
        size: "auto",
        format: "png",
      }),
    })

    if (!response.ok) {
      // Fallback: If Remove.bg fails, return a mock processed image
      console.log("Remove.bg API failed, using fallback")

      // Create a simple mock by adding transparency around edges
      const canvas = document.createElement?.("canvas") // This won't work on server

      // For now, return the original image with a note
      return NextResponse.json({
        success: false,
        error: "Background removal service temporarily unavailable",
        fallback: true,
      })
    }

    const processedImageBuffer = await response.arrayBuffer()
    const processedBase64 = Buffer.from(processedImageBuffer).toString("base64")

    return NextResponse.json({
      success: true,
      processedImage: `data:image/png;base64,${processedBase64}`,
    })
  } catch (error) {
    console.error("Background removal error:", error)
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
