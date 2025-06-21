import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image")
    const endpoint = (formData.get("endpoint") as string) || "/image"

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "No valid image file provided" }, { status: 400 })
    }

    const { Client } = await import("@gradio/client")
    const apiKey = process.env.GRADIO_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Gradio API key missing" }, { status: 500 })
    }

    const client = await Client.connect("sudo-saidso/bar", { auth: apiKey })

    // Optional: Wrap in timeout
    async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Request timed out")), ms)
        promise
          .then((res) => {
            clearTimeout(timer)
            resolve(res)
          })
          .catch((err) => {
            clearTimeout(timer)
            reject(err)
          })
      })
    }

    let result
    if (endpoint === "/image") {
      result = await withTimeout(client.predict("/image", { image }), 20000)
    } else if (endpoint === "/png") {
      result = await withTimeout(client.predict("/png", { f: image }), 20000)
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
