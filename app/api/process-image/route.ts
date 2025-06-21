import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const endpoint = (formData.get("endpoint") as string) || "/image"

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const { Client } = await import("@gradio/client")

    const apiKey = process.env.GRADIO_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gradio API key not found in environment" },
        { status: 500 }
      )
    }

    const client = await Client.connect("sudo-saidso/bar", {
      auth: apiKey,
    })

    let result
    if (endpoint === "/image") {
      result = await client.predict("/image", { image })
    } else if (endpoint === "/png") {
      result = await client.predict("/png", { f: image })
    } else {
      return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
