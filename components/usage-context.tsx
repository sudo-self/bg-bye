"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface UsageContextType {
  freeUsesRemaining: number
  hasReachedLimit: boolean
  isPremium: boolean
  isCheckingPremium: boolean
  paymentType: "subscription" | "one-time" | null
  useFreeTrial: () => void
  resetUsage: () => void
  checkSubscriptionStatus: (sessionId: string) => Promise<void>
  setPremiumStatus: (status: boolean, paymentType?: "subscription" | "one-time") => void
}

const UsageContext = createContext<UsageContextType | undefined>(undefined)

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const [freeUsesRemaining, setFreeUsesRemaining] = useState(1)
  const [isPremium, setIsPremium] = useState(false)
  const [isCheckingPremium, setIsCheckingPremium] = useState(false)
  const [paymentType, setPaymentType] = useState<"subscription" | "one-time" | null>(null)

  // Load usage from localStorage on mount
  useEffect(() => {
    const savedUsage = localStorage.getItem("bg-removal-usage")
    const savedPremium = localStorage.getItem("bg-removal-premium")
    const savedSubscriptionId = localStorage.getItem("bg-removal-subscription-id")

    if (savedUsage) {
      setFreeUsesRemaining(Number.parseInt(savedUsage, 10))
    }

    if (savedPremium === "true") {
      setIsPremium(true)
    }

    // Check for pending subscription verification
    const pendingSessionId = localStorage.getItem("bg-removal-pending-session")
    if (pendingSessionId && !savedPremium) {
      checkSubscriptionStatus(pendingSessionId)
    }
  }, [])

  // Save usage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("bg-removal-usage", freeUsesRemaining.toString())
  }, [freeUsesRemaining])

  // Save premium status to localStorage
  useEffect(() => {
    localStorage.setItem("bg-removal-premium", isPremium.toString())
  }, [isPremium])

  const useFreeTrial = () => {
    if (freeUsesRemaining > 0 && !isPremium) {
      const newCount = freeUsesRemaining - 1
      setFreeUsesRemaining(newCount)
    }
  }

  const resetUsage = () => {
    setFreeUsesRemaining(1)
    localStorage.removeItem("bg-removal-usage")
  }

  const setPremiumStatus = (status: boolean, type?: "subscription" | "one-time") => {
    setIsPremium(status)
    if (type) {
      setPaymentType(type)
    }
    if (status) {
      localStorage.removeItem("bg-removal-pending-session")
    }
  }

  const checkSubscriptionStatus = async (sessionId: string) => {
    setIsCheckingPremium(true)

    try {
      const response = await fetch("/api/subscription/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()

      if (data.isPremium) {
        setIsPremium(true)
        setPaymentType(data.paymentType)
        localStorage.setItem("bg-removal-payment-type", data.paymentType)

        if (data.paymentType === "subscription") {
          localStorage.setItem("bg-removal-subscription-id", data.subscriptionId)
        } else {
          localStorage.setItem("bg-removal-payment-intent-id", data.paymentIntentId)
        }

        localStorage.removeItem("bg-removal-pending-session")
      } else {
        localStorage.setItem("bg-removal-pending-session", sessionId)
      }
    } catch (error) {
      console.error("Failed to check subscription status:", error)
    } finally {
      setIsCheckingPremium(false)
    }
  }

  const hasReachedLimit = freeUsesRemaining <= 0 && !isPremium

  return (
    <UsageContext.Provider
      value={{
        freeUsesRemaining,
        hasReachedLimit,
        isPremium,
        isCheckingPremium,
        paymentType,
        useFreeTrial,
        resetUsage,
        checkSubscriptionStatus,
        setPremiumStatus,
      }}
    >
      {children}
    </UsageContext.Provider>
  )
}

export function useUsage() {
  const context = useContext(UsageContext)
  if (context === undefined) {
    throw new Error("useUsage must be used within a UsageProvider")
  }
  return context
}
