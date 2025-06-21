import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image")
    const endpoint = (formData.get("endpoint") as string) || "/image"

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "No valid image provided" }, { status: 400 })
    }

    // Dynamic import (prevents bundling issues with Edge)
    const { Client } = await import("@gradio/client")

    const apiKey = process.env.GRADIO_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gradio API key not set in environment variables" },
        { status: 500 }
      )
    }

    const client = await Client.connect("sudo-saidso/bar", {
      auth: apiKey,
    })

    let result

    switch (endpoint) {
      case "/image":
        result = await client.predict("/image", { image })
        break
      case "/png":
        result = await client.predict("/png", { f: image })
        break
      default:
        return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const stack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: "Failed to process image",
        details: message,
        stack,
      },
      { status: 500 }
    )
  }
}
