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
    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === "paid") {
      if (session.mode === "subscription" && session.subscription) {
        // Handle $3.99/month unlimited subscription
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        return NextResponse.json({
          isPremium: subscription.status === "active",
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          paymentType: "subscription",
        })
      } else if (session.mode === "payment") {
        // Handle $0.99 pay-per-use payments
        const amount = session.amount_total || 0

        if (amount === 99) {
          // $0.99 in cents - pay per use
          return NextResponse.json({
            isPremium: false, // Pay-per-use doesn't grant premium status
            paymentIntentId: session.payment_intent,
            customerId: session.customer,
            status: "paid",
            paymentType: "pay-per-use",
            amount: amount,
          })
        }
      }
    }

    return NextResponse.json({ isPremium: false })
  } catch (error) {
    console.error("Error checking subscription status:", error)
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 })
  }
}
