import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const endpoint = (formData.get("endpoint") as string) || "/image"

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Dynamic import to avoid build issues
    const { Client } = await import("@gradio/client")

    // Connect to the Gradio client
    const client = await Client.connect("sudo-saidso/bar")

    let result
    if (endpoint === "/image") {
      result = await client.predict("/image", {
        image: image,
      })
    } else if (endpoint === "/png") {
      result = await client.predict("/png", {
        f: image,
      })
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
      { status: 500 },
    )
  }
}
