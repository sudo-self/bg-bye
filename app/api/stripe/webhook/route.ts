import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Only import and initialize Stripe if environment variables are available
let stripe: any = null
let endpointSecret: string | undefined = undefined

// Check if we're in a build environment or if env vars are missing
const isBuilding = process.env.NODE_ENV === "production" && !process.env.VERCEL
const hasStripeConfig = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET

if (hasStripeConfig && !isBuilding) {
  try {
    const Stripe = require("stripe")
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-06-20",
    })
    endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!
  } catch (error) {
    console.error("Failed to initialize Stripe:", error)
  }
}

export async function POST(req: NextRequest) {
  // Return early if Stripe is not configured
  if (!stripe || !endpointSecret) {
    console.error("Stripe is not properly configured")
    return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 })
  }

  try {
    const body = await req.text()
    const sig = headers().get("stripe-signature")

    if (!sig) {
      return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 })
    }

    let event: any

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object
        console.log("Checkout session completed:", session.id)
        break

      case "customer.subscription.created":
        const subscription = event.data.object
        console.log("Subscription created:", subscription.id)
        break

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object
        console.log("Subscription updated:", updatedSubscription.id)
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object
        console.log("Subscription cancelled:", deletedSubscription.id)
        break

      case "payment_intent.succeeded":
        const paymentIntent = event.data.object
        console.log("Payment succeeded:", paymentIntent.id)
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
