"use client"

import React from "react"

import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Cookies from "js-cookie"
import { useCallback, useMemo, useRef, useState } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { OtpInput } from "@/components/ui/otp-input"
import { resendEmailForSignUp, verifyEmail } from "@/services/authServices"
import { toast } from "sonner"

function getErrorMessage(err: unknown): string {
  try {
    const anyErr = err as any
    if (anyErr?.response?.data?.message) return String(anyErr.response.data.message)
    if (anyErr?.data?.message) return String(anyErr.data.message)
    if (anyErr?.message) return String(anyErr.message)
    return "Verification failed. Please try again."
  } catch {
    return "Verification failed. Please try again."
  }
}

const VerifySchema = z.object({
  email: z.string().email("Enter a valid email"),
  otp: z.string().regex(/^[A-Z0-9]{8}$/, "Enter an 8-character code (letters or digits)"),
})

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = useMemo(() => searchParams.get("email") || "", [searchParams])

  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)

  const [isError, setIsError] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [resendDisabled, setResendDisabled] = useState(false)
  const [timer, setTimer] = useState(0)

  const submittingRef = useRef(false)

  const handleVerifyOtp = useCallback(
    async (code: string) => {
      if (loading || submittingRef.current) return

      const parsed = VerifySchema.safeParse({ email, otp: code })
      if (!parsed.success) {
        const first = parsed.error.issues.at(0)?.message ?? "Invalid input"
        setIsError(true)
        setErrorMsg(first)
        toast.error(first)
        return
      }

      try {
        submittingRef.current = true
        setLoading(true)
        setIsError(false)
        setErrorMsg("")

        const res = await verifyEmail({ email: parsed.data.email, otp: parsed.data.otp })
        if (res?.Result === "SUCCESS") {
          toast.success(res.message || "Email verified successfully!")
          Cookies.set("signupToken", res.Token)
          Cookies.set("isOnboarded", String(res.is_onboarded))
          router.push("/auth/onboarding")
        } else {
          const msg = res?.message || "Verification failed. Please try again."
          setIsError(true)
          setErrorMsg(msg)
          toast.error(msg)
        }
      } catch (error: unknown) {
        const msg = getErrorMessage(error)
        setIsError(true)
        setErrorMsg(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
        submittingRef.current = false
      }
    },
    [email, loading, router],
  )

  const handleResendOtp = useCallback(async () => {
    try {
      await resendEmailForSignUp({ email })
      setResendDisabled(true)
      setTimer(120)
      toast.message("A new confirmation code has been sent.")
    } catch (error) {
      const msg = getErrorMessage(error)
      toast.error(msg)
    }
  }, [email])

  // Countdown timer for resend
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000)
    } else {
      setResendDisabled(false)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timer])

  const emailLabel = email || "your email"

  return (
    <main className="min-h-screen w-full">
      <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
        <header className="mb-6">
          <h1 className="text-balance text-2xl font-semibold text-foreground">Enter confirmation code</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {"We sent the code to "}
            <span className="font-medium text-foreground">{emailLabel}</span>
            {". "}
            {"Go to your inbox, copy the code and paste it below to confirm your email."}
          </p>
        </header>

        <OtpInput
          length={8}
          isError={isError}
          value={otp}
          onChange={(code) => {
            setOtp(code)
            if (isError) {
              setIsError(false)
              setErrorMsg("")
            }
          }}
          onComplete={(code) => {
            setOtp(code)
            if (!loading) {
              // call with code to avoid race with state
              handleVerifyOtp(code)
            }
          }}
          className="mb-6"
        />

        {isError && !!errorMsg && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {errorMsg}
          </p>
        )}

        <Button
          asChild
          variant="outline"
          className="mb-10 bg-transparent"
          aria-disabled={loading}
          data-loading={loading ? "true" : "false"}
        >
          <Link href="https://mail.google.com" target="_blank" rel="noopener noreferrer" aria-label="Open Gmail">
            <Mail className="mr-2 h-4 w-4" />
            Open Gmail
          </Link>
        </Button>

        <p className="text-sm leading-6 text-muted-foreground">
          {"Didn't get an email? Check your "}
          <span className="font-medium text-foreground">spam folder</span>
          {" or "}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendDisabled}
            className="font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-70"
            aria-disabled={resendDisabled}
          >
            {resendDisabled
              ? `get a new confirmation code (${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, "0")})`
              : "get a new confirmation code"}
          </button>
          {"."}
        </p>

        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          <Link href="#" className="text-primary underline-offset-4 hover:underline">
            Visit Help Center
          </Link>{" "}
          to learn more.
        </p>
      </section>
    </main>
  )
}
