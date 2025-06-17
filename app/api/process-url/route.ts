import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl } = body

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 })
    }

    // Dynamic import to avoid build issues
    const { Client } = await import("@gradio/client")

    // Connect to the Gradio client
    const client = await Client.connect("sudo-saidso/bar")

    const result = await client.predict("/text", {
      image: imageUrl,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process image URL",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
