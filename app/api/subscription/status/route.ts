import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === "paid" && session.subscription) {
      // Retrieve subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

      return NextResponse.json({
        isPremium: subscription.status === "active",
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
      })
    }

    return NextResponse.json({ isPremium: false })
  } catch (error) {
    console.error("Error checking subscription status:", error)
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 })
  }
}
