import { Client } from "@gradio/client"

// Singleton pattern to avoid creating multiple clients
let client: any = null

export async function getApiClient() {
  if (!client) {
    client = await Client.connect("sudo-saidso/bar")
  }
  return client
}

export async function processImage(image: File) {
  const client = await getApiClient()
  return client.predict("/image", { image })
}

export async function processImageUrl(url: string) {
  const client = await getApiClient()
  return client.predict("/text", { image: url })
}

export async function processToPng(image: File) {
  const client = await getApiClient()
  return client.predict("/png", { f: image })
}
