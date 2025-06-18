import { type NextRequest, NextResponse } from "next/server"

// Only import and initialize Stripe if environment variables are available
let stripe: any = null

// Check if we're in a build environment or if env vars are missing
const isBuilding = process.env.NODE_ENV === "production" && !process.env.VERCEL
const hasStripeConfig = process.env.STRIPE_SECRET_KEY

if (hasStripeConfig && !isBuilding) {
  try {
    const Stripe = require("stripe")
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-06-20",
    })
  } catch (error) {
    console.error("Failed to initialize Stripe:", error)
  }
}

export async function POST(req: NextRequest) {
  // Return early if Stripe is not configured
  if (!stripe) {
    console.error("Stripe is not properly configured")
    return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 })
  }

  try {
    const { customerId, returnUrl } = await req.json()

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID required" }, { status: 400 })
    }

    // Create a portal session for the customer
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/account`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
