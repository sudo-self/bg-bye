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
    const { customerId } = await req.json()

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID required" }, { status: 400 })
    }

    // Get customer information
    const customer = await stripe.customers.retrieve(customerId)

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    })

    // Get customer's payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    })

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
      subscriptions: subscriptions.data.map((sub: any) => ({
        id: sub.id,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        items: sub.items.data.map((item: any) => ({
          price: {
            unit_amount: item.price.unit_amount,
            currency: item.price.currency,
            recurring: item.price.recurring,
          },
        })),
      })),
      paymentMethods: paymentMethods.data.map((pm: any) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error("Error fetching customer info:", error)
    return NextResponse.json({ error: "Failed to fetch customer info" }, { status: 500 })
  }
}
