import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Check if Stripe secret key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY environment variable is not set")
}

// Initialize Stripe only if the secret key is available
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    })
  : null

export async function POST(req: NextRequest) {
  // Return early if Stripe is not configured
  if (!stripe) {
    console.error("Stripe is not properly configured")
    return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 })
  }

  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === "paid") {
      if (session.mode === "subscription" && session.subscription) {
        // Handle subscription
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        return NextResponse.json({
          isPremium: subscription.status === "active",
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          paymentType: "subscription",
        })
      } else if (session.mode === "payment") {
        // Handle one-time payment
        return NextResponse.json({
          isPremium: true,
          paymentIntentId: session.payment_intent,
          customerId: session.customer,
          status: "paid",
          paymentType: "one-time",
        })
      }
    }

    return NextResponse.json({ isPremium: false })
  } catch (error) {
    console.error("Error checking subscription status:", error)
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 })
  }
}
