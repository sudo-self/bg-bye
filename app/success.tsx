"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"

export default function SuccessPage() {
  const router = useRouter()

  useEffect(() => {
    if (window && window.localStorage) {
      window.localStorage.setItem("paid", "true")
    }
    router.push("/")
  }, [router])

  return <p>Processing your payment...</p>
}
