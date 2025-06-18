"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Calendar, User, Mail, Settings, ExternalLink, Loader2, ArrowLeft, Crown } from "lucide-react"
import { useUsage } from "@/components/usage-context"
import { useRouter } from "next/navigation"

interface CustomerInfo {
  customer: {
    id: string
    email: string
    name: string
  }
  subscriptions: Array<{
    id: string
    status: string
    current_period_start: number
    current_period_end: number
    cancel_at_period_end: boolean
    items: Array<{
      price: {
        unit_amount: number
        currency: string
        recurring: {
          interval: string
        }
      }
    }>
  }>
  paymentMethods: Array<{
    id: string
    type: string
    card: {
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    }
  }>
}

export default function AccountPage() {
  const { isPremium, paymentType } = useUsage()
  const router = useRouter()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)

  useEffect(() => {
    if (!isPremium) {
      router.push("/")
      return
    }

    loadCustomerInfo()
  }, [isPremium, router])

  const loadCustomerInfo = async () => {
    try {
      const customerId = localStorage.getItem("bg-removal-customer-id")

      if (!customerId) {
        console.error("No customer ID found")
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/stripe/customer-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId }),
      })

      if (response.ok) {
        const data = await response.json()
        setCustomerInfo(data)
      }
    } catch (error) {
      console.error("Failed to load customer info:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openBillingPortal = async () => {
    try {
      setIsLoadingPortal(true)
      const customerId = localStorage.getItem("bg-removal-customer-id")

      if (!customerId) {
        console.error("No customer ID found")
        return
      }

      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          returnUrl: window.location.href,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error)
    } finally {
      setIsLoadingPortal(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  if (!isPremium) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-purple-600" />
            <h2 className="text-2xl font-bold mb-2">Loading Account</h2>
            <p className="text-slate-600 dark:text-slate-400">Please wait while we load your account information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your subscription and payment methods</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Account Status */}
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-green-600" />
                  <div>
                    <CardTitle className="text-green-800 dark:text-green-400">Premium Account</CardTitle>
                    <CardDescription className="text-green-700 dark:text-green-300">
                      {paymentType === "one-time" ? "Lifetime Access" : "Active Subscription"}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Customer Information */}
          {customerInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-700 dark:text-slate-300">
                    {customerInfo.customer.email || "No email on file"}
                  </span>
                </div>
                {customerInfo.customer.name && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700 dark:text-slate-300">{customerInfo.customer.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subscription Details - Only show for subscription users */}
          {paymentType === "subscription" && customerInfo?.subscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customerInfo.subscriptions.map((subscription) => (
                  <div key={subscription.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Premium Plan</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {subscription.items[0] &&
                            formatPrice(
                              subscription.items[0].price.unit_amount,
                              subscription.items[0].price.currency,
                            )}{" "}
                          / {subscription.items[0]?.price.recurring.interval}
                        </p>
                      </div>
                      <Badge variant={subscription.cancel_at_period_end ? "destructive" : "default"}>
                        {subscription.cancel_at_period_end ? "Cancelling" : "Active"}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Current Period Start</p>
                        <p className="font-medium">{formatDate(subscription.current_period_start)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">
                          {subscription.cancel_at_period_end ? "Expires" : "Next Billing Date"}
                        </p>
                        <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
                      </div>
                    </div>

                    {subscription.cancel_at_period_end && (
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                          Your subscription will end on {formatDate(subscription.current_period_end)}. You'll still have
                          access to premium features until then.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Payment Methods - Only show for subscription users */}
          {paymentType === "subscription" && customerInfo?.paymentMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customerInfo.paymentMethods.map((paymentMethod) => (
                    <div key={paymentMethod.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="font-medium capitalize">
                            {paymentMethod.card.brand} •••• {paymentMethod.card.last4}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Expires {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Default</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Portal - Only show for subscription users */}
          {paymentType === "subscription" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Manage Subscription
                </CardTitle>
                <CardDescription>Update payment methods, view invoices, and manage your subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={openBillingPortal}
                  disabled={isLoadingPortal}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isLoadingPortal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Billing Portal
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 text-center">
                  You'll be redirected to Stripe's secure billing portal
                </p>
              </CardContent>
            </Card>
          )}

          {/* One-time Payment Info */}
          {paymentType === "one-time" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    You have lifetime access to all premium features with your one-time purchase. No recurring charges
                    or subscription management needed.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
