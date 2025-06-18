"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface UsageContextType {
  freeUsesRemaining: number
  hasReachedLimit: boolean
  isPremium: boolean
  isCheckingPremium: boolean
  paymentType: "subscription" | "one-time" | "budget" | null
  paidUsesRemaining: number
  useFreeTrial: () => void
  usePaidCredit: () => void
  resetUsage: () => void
  checkSubscriptionStatus: (sessionId: string) => Promise<void>
  setPremiumStatus: (status: boolean, paymentType?: "subscription" | "one-time" | "budget") => void
  addPaidCredits: (amount: number) => void
}

const UsageContext = createContext<UsageContextType | undefined>(undefined)

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const [freeUsesRemaining, setFreeUsesRemaining] = useState(1)
  const [paidUsesRemaining, setPaidUsesRemaining] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [isCheckingPremium, setIsCheckingPremium] = useState(false)
  const [paymentType, setPaymentType] = useState<"subscription" | "one-time" | "budget" | null>(null)

  // Load usage from localStorage on mount
  useEffect(() => {
    const savedUsage = localStorage.getItem("bg-removal-usage")
    const savedPaidUsage = localStorage.getItem("bg-removal-paid-usage")
    const savedPremium = localStorage.getItem("bg-removal-premium")
    const savedPaymentType = localStorage.getItem("bg-removal-payment-type")

    if (savedUsage) {
      setFreeUsesRemaining(Number.parseInt(savedUsage, 10))
    }

    if (savedPaidUsage) {
      setPaidUsesRemaining(Number.parseInt(savedPaidUsage, 10))
    }

    if (savedPremium === "true") {
      setIsPremium(true)
    }

    if (savedPaymentType) {
      setPaymentType(savedPaymentType as "subscription" | "one-time" | "budget")
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

  useEffect(() => {
    localStorage.setItem("bg-removal-paid-usage", paidUsesRemaining.toString())
  }, [paidUsesRemaining])

  // Save premium status to localStorage
  useEffect(() => {
    localStorage.setItem("bg-removal-premium", isPremium.toString())
  }, [isPremium])

  const useFreeTrial = () => {
    if (freeUsesRemaining > 0 && !isPremium && paidUsesRemaining === 0) {
      const newCount = freeUsesRemaining - 1
      setFreeUsesRemaining(newCount)
    }
  }

  const usePaidCredit = () => {
    if (paidUsesRemaining > 0 && !isPremium) {
      const newCount = paidUsesRemaining - 1
      setPaidUsesRemaining(newCount)
    }
  }

  const addPaidCredits = (amount: number) => {
    setPaidUsesRemaining((prev) => prev + amount)
  }

  const resetUsage = () => {
    setFreeUsesRemaining(1)
    setPaidUsesRemaining(0)
    localStorage.removeItem("bg-removal-usage")
    localStorage.removeItem("bg-removal-paid-usage")
  }

  const setPremiumStatus = (status: boolean, type?: "subscription" | "one-time" | "budget") => {
    setIsPremium(status)
    if (type) {
      setPaymentType(type)
      localStorage.setItem("bg-removal-payment-type", type)
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

  const hasReachedLimit = freeUsesRemaining <= 0 && paidUsesRemaining <= 0 && !isPremium

  return (
    <UsageContext.Provider
      value={{
        freeUsesRemaining,
        hasReachedLimit,
        isPremium,
        isCheckingPremium,
        paymentType,
        paidUsesRemaining,
        useFreeTrial,
        usePaidCredit,
        resetUsage,
        checkSubscriptionStatus,
        setPremiumStatus,
        addPaidCredits,
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
