import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Check if Stripe secret key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY environment variable is not set")
}

if (!endpointSecret) {
  console.error("STRIPE_WEBHOOK_SECRET environment variable is not set")
}

// Initialize Stripe only if the secret key is available
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    })
  : null

export async function POST(req: NextRequest) {
  // Return early if Stripe is not configured
  if (!stripe || !endpointSecret) {
    console.error("Stripe is not properly configured")
    return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 })
  }

  const body = await req.text()
  const sig = headers().get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session

      // Handle both subscription and one-time payments
      if (session.mode === "subscription") {
        console.log("Subscription completed:", session.id)
        // Handle subscription logic
      } else if (session.mode === "payment") {
        console.log("One-time payment completed:", session.id)
        // Handle one-time payment logic
      }

      break

    case "customer.subscription.created":
      const subscription = event.data.object as Stripe.Subscription
      console.log("Subscription created:", subscription.id)
      break

    case "customer.subscription.updated":
      const updatedSubscription = event.data.object as Stripe.Subscription
      console.log("Subscription updated:", updatedSubscription.id)
      break

    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object as Stripe.Subscription
      console.log("Subscription cancelled:", deletedSubscription.id)
      break

    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log("One-time payment succeeded:", paymentIntent.id)
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
