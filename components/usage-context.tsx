"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface UsageContextType {
  freeUsesRemaining: number
  hasReachedLimit: boolean
  isPremium: boolean
  isCheckingPremium: boolean
  paymentType: "subscription" | "one-time" | "pay-per-use" | null
  paidCredits: number
  useFreeTrial: () => void
  usePaidCredit: () => void
  resetUsage: () => void
  checkSubscriptionStatus: (sessionId: string) => Promise<void>
  setPremiumStatus: (status: boolean, paymentType?: "subscription" | "one-time" | "pay-per-use") => void
  addPaidCredits: (credits: number) => void
}

const UsageContext = createContext<UsageContextType | undefined>(undefined)

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const [freeUsesRemaining, setFreeUsesRemaining] = useState(1)
  const [isPremium, setIsPremium] = useState(false)
  const [isCheckingPremium, setIsCheckingPremium] = useState(false)
  const [paymentType, setPaymentType] = useState<"subscription" | "one-time" | "pay-per-use" | null>(null)
  const [paidCredits, setPaidCredits] = useState(0)

  // Load usage from localStorage on mount
  useEffect(() => {
    const savedUsage = localStorage.getItem("bg-removal-usage")
    const savedPremium = localStorage.getItem("bg-removal-premium")
    const savedPaymentType = localStorage.getItem("bg-removal-payment-type")
    const savedCredits = localStorage.getItem("bg-removal-paid-credits")

    if (savedUsage) {
      setFreeUsesRemaining(Number.parseInt(savedUsage, 10))
    }

    if (savedPremium === "true") {
      setIsPremium(true)
    }

    if (savedPaymentType) {
      setPaymentType(savedPaymentType as "subscription" | "one-time" | "pay-per-use")
    }

    if (savedCredits) {
      setPaidCredits(Number.parseInt(savedCredits, 10))
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

  // Save paid credits to localStorage
  useEffect(() => {
    localStorage.setItem("bg-removal-paid-credits", paidCredits.toString())
  }, [paidCredits])

  const useFreeTrial = () => {
    if (freeUsesRemaining > 0 && !isPremium) {
      const newCount = freeUsesRemaining - 1
      setFreeUsesRemaining(newCount)
    }
  }

  const usePaidCredit = () => {
    if (paidCredits > 0) {
      setPaidCredits((prev) => prev - 1)
    }
  }

  const addPaidCredits = (credits: number) => {
    setPaidCredits((prev) => prev + credits)
  }

  const resetUsage = () => {
    setFreeUsesRemaining(1)
    setPaidCredits(0)
    localStorage.removeItem("bg-removal-usage")
    localStorage.removeItem("bg-removal-paid-credits")
  }

  const setPremiumStatus = (status: boolean, type?: "subscription" | "one-time" | "pay-per-use") => {
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

      if (data.paymentType === "pay-per-use") {
        // Add 1 credit for pay-per-use
        addPaidCredits(1)
        setPaymentType("pay-per-use")
        localStorage.removeItem("bg-removal-pending-session")
      } else if (data.isPremium) {
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

  const hasReachedLimit = freeUsesRemaining <= 0 && paidCredits <= 0 && !isPremium

  return (
    <UsageContext.Provider
      value={{
        freeUsesRemaining,
        hasReachedLimit,
        isPremium,
        isCheckingPremium,
        paymentType,
        paidCredits,
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
