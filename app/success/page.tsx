"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, Crown } from "lucide-react"
import { useUsage } from "@/components/usage-context"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { checkSubscriptionStatus, isPremium, isCheckingPremium, paymentType } = useUsage()
  const [isVerifying, setIsVerifying] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const sessionId = searchParams.get("session_id")

    if (sessionId) {
      // Verify the subscription
      checkSubscriptionStatus(sessionId).finally(() => {
        setIsVerifying(false)
      })
    } else {
      setIsVerifying(false)
    }
  }, [searchParams, checkSubscriptionStatus])

  const handleContinue = () => {
    router.push("/")
  }

  if (!mounted) {
    return null
  }

  if (isVerifying || isCheckingPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Verifying Your Subscription</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Please wait while we confirm your premium subscription...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md border-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {isPremium ? (
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            ) : (
              <Crown className="w-16 h-16 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <CardTitle className="text-2xl text-green-800 dark:text-green-300">
            {isPremium ? "Welcome to Premium!" : "Payment Successful!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            {isPremium ? (
              <>
                <p className="text-green-700 dark:text-green-300 font-medium">
                  {isPremium
                    ? "Your premium subscription is now active!"
                    : "Your payment was successful. You now have additional removal credits!"}
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-2 border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                    {isPremium ? "Unlimited background removals" : "Additional removal credits added"}
                  </div>
                  {isPremium && (
                    <>
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                        High-resolution downloads
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                        Priority processing
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="text-slate-600 dark:text-slate-400">
                Your payment was successful. Your premium features will be activated shortly.
              </p>
            )}
          </div>

          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {isPremium ? "Start Using Premium Features" : "Continue to App"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
