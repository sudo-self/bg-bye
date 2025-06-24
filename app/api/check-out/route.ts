import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { default: Stripe } = await import("stripe")

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2024-04-10",
    })

    const { product = "icon-pack" } = await request.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID || "",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?paid=true&product=${encodeURIComponent(product)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
      metadata: { product },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("Stripe Checkout error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
