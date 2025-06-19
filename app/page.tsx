"use client"

import Script from "next/script"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUploader } from "@/components/image-uploader"
import { TextInput } from "@/components/text-input"
import { PngProcessor } from "@/components/png-processor"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoonIcon, SunIcon, Crown, Zap, Lock, CheckCircle, Star } from "lucide-react"
import { useTheme } from "next-themes"
import { UsageProvider, useUsage } from "@/components/usage-context"
import { useEffect, useState } from "react"

function HomeContent() {
  const { theme, setTheme } = useTheme()
  const { freeUsesRemaining, hasReachedLimit, isPremium, isCheckingPremium } = useUsage()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for Stripe checkout completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://js.stripe.com") return

      if (event.data.type === "stripe_checkout_session_complete") {
        // Redirect to success page with session ID
        const sessionId = event.data.session.id
        window.location.href = `/success?session_id=${sessionId}`
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      <Script async src="https://js.stripe.com/v3/buy-button.js" strategy="afterInteractive" />

      <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">BG BYE BYE</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                <a href="https://bg-bye-bye.vercel.app" target="_blank" rel="noopener noreferrer">
                  🌬️ bg-bye-bye.vercel.app
                </a>
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Usage Counter */}
              {isCheckingPremium ? (
                <Badge variant="secondary" className="px-3 py-1">
                  Checking subscription...
                </Badge>
              ) : isPremium ? (
                <Badge variant="default" className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600">
                  <div className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Premium Active
                  </div>
                </Badge>
              ) : (
                <Badge variant={hasReachedLimit ? "destructive" : "secondary"} className="px-3 py-1">
                  {hasReachedLimit ? (
                    <div className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Limit Reached
                    </div>
                  ) : (
                    `${freeUsesRemaining} free removal${freeUsesRemaining !== 1 ? "s" : ""} left`
                  )}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Pricing Options - Hide if already premium */}
          {!isPremium && (
            <Card
              className={`border-2 shadow-xl mb-6 ${
                hasReachedLimit
                  ? "border-red-500 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 animate-pulse"
                  : "border-gradient-to-r from-purple-500 to-pink-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
              }`}
            >
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="h-6 w-6 text-purple-600" />
                  <CardTitle
                    className={`text-2xl bg-gradient-to-r bg-clip-text text-transparent ${
                      hasReachedLimit ? "from-red-600 to-pink-600" : "from-purple-600 to-pink-600"
                    }`}
                  >
                    {hasReachedLimit ? "Choose Your Plan!" : "Pricing Options"}
                  </CardTitle>
                  <Crown className="h-6 w-6 text-purple-600" />
                </div>
                <CardDescription className="text-lg">
                  {hasReachedLimit
                    ? "You've used your free removal. Choose a plan to continue!"
                    : "Choose the perfect plan for your background removal needs"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Pay Per Use Option */}
                  <div className="text-center p-4 border rounded-lg bg-white dark:bg-slate-800 relative">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">$0.99</div>
                      <div className="text-slate-600 dark:text-slate-400 mb-3">per removal</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">Pay as you go</div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                          <Zap className="w-3 h-3 text-green-500" />
                          High-quality removal
                        </div>
                        <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                          <Zap className="w-3 h-3 text-green-500" />
                          No commitment
                        </div>
                      </div>

                      {/* Pay Per Use Button */}
                      <Button
                        onClick={() => window.open("https://buy.stripe.com/7sY14n3ha0QV4NW2zZfw403", "_blank")}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
                      >
                        Pay $0.99
                      </Button>
                    </div>
                  </div>

                  {/* Subscription Option */}
                  <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 relative">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      >
                        Best Value
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">$3.99</div>
                      <div className="text-slate-600 dark:text-slate-400 mb-3">per month</div>
                      <div className="text-sm text-purple-600 dark:text-purple-400 mb-4">Cancel anytime</div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                          <Zap className="w-3 h-3 text-green-500" />
                          Unlimited removals
                        </div>
                        <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                          <Zap className="w-3 h-3 text-green-500" />
                          Priority processing
                        </div>
                        <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                          <Zap className="w-3 h-3 text-green-500" />
                          High-resolution
                        </div>
                      </div>

                      {/* Monthly Subscription Button */}
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `
            <stripe-buy-button
              buy-button-id="buy_btn_1RbdAgDxlwFi5k137T1c5oi0"
              publishable-key="pk_live_51RDFFrDxlwFi5k13I6H0uxEeUV4cOMgOF5Kx2tOYG7a1F7Egidw3vSRwLFgqIkYwiShiuwJ6U8QmlC1Rkj8RQeEO00hftg2cXH"
            >
            </stripe-buy-button>
          `,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Value Comparison */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <h4 className="font-semibold text-center mb-3 text-slate-900 dark:text-white">
                    Which plan is right for you?
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-blue-600 dark:text-blue-400">Pay Per Use</div>
                      <div className="text-slate-600 dark:text-slate-400">Perfect for occasional use</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-purple-600 dark:text-purple-400">Monthly</div>
                      <div className="text-slate-600 dark:text-slate-400">Great for regular users</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Premium Success Message */}
          {isPremium && (
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-xl mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-green-800 dark:text-green-400">Premium Active!</h3>
                    <p className="text-green-700 dark:text-green-300">Enjoy unlimited background removals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border border-slate-200 dark:border-slate-800 shadow-lg mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Background Removal</CardTitle>
                  <CardDescription>Upload an image bye bye background</CardDescription>
                </div>
                {hasReachedLimit && !isPremium && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Payment Required
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="image">
                <TabsList className="grid grid-cols-3 mb-8">
                  <TabsTrigger value="image" disabled={hasReachedLimit && !isPremium}>
                    BG
                  </TabsTrigger>
                  <TabsTrigger value="text" disabled={hasReachedLimit && !isPremium}>
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="png" disabled={hasReachedLimit && !isPremium}>
                    PNG
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="image" className="space-y-4">
                  <ImageUploader />
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <TextInput />
                </TabsContent>

                <TabsContent value="png" className="space-y-4">
                  <PngProcessor />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

export default function Home() {
  return (
    <UsageProvider>
      <HomeContent />
    </UsageProvider>
  )
}
