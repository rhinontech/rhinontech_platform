"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { completeOnboarding } from "@/services/authServices"

type OnboardingData = {
  organization_name: string
  organization_type: string
  first_name: string
  last_name: string
  company_size: string
}

const orgSchema = z.object({
  organization_name: z.string().trim().min(2, "Organization name must be at least 2 characters"),
})

const orgTypeSchema = z.object({
  organization_type: z.string().min(1, "Please select your organization type"),
})

const firstNameSchema = z.object({
  first_name: z.string().trim().min(2, "First name must be at least 2 characters"),
})

const lastNameSchema = z.object({
  last_name: z.string().trim().min(2, "Last name must be at least 2 characters"),
})

const companySizeSchema = z.object({
  company_size: z.string().min(1, "Please select your company size"),
})

const totalSteps = 5

export default function Onboarding() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [data, setData] = useState<OnboardingData>({
    organization_name: "",
    organization_type: "",
    first_name: "",
    last_name: "",
    company_size: "",
  })

  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null)

  // Auth guard similar to original
  useEffect(() => {
    const token = Cookies.get("signupToken")
    const isOnboarded = Cookies.get("isOnboarded")
    if (!token || isOnboarded === "true") {
      toast.error("Unauthorized access. Please login.")
      router.push("/auth/login")
    }
  }, [router])

  // Focus the field on step change
  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
    return () => clearTimeout(t)
  }, [step])

  // Step-specific field accessors
  const currentField = useMemo(() => {
    switch (step) {
      case 1:
        return {
          name: "organization_name" as const,
          label: "Organization name",
          placeholder: "Acme Inc.",
          type: "text" as const,
        }
      case 2:
        return {
          name: "organization_type" as const,
          label: "Organization type",
          placeholder: "",
          type: "select-type" as const,
        }
      case 3:
        return {
          name: "first_name" as const,
          label: "First name",
          placeholder: "John",
          type: "text" as const,
        }
      case 4:
        return {
          name: "last_name" as const,
          label: "Last name",
          placeholder: "Doe",
          type: "text" as const,
        }
      case 5:
        return {
          name: "company_size" as const,
          label: "Company size",
          placeholder: "",
          type: "select-size" as const,
        }
      default:
        return null
    }
  }, [step])

  const validateStep = useCallback(() => {
    setError(null)
    if (step === 1) {
      const res = orgSchema.safeParse({ organization_name: data.organization_name })
      if (!res.success) {
        setError(res.error.issues[0]?.message || "Invalid organization name")
        return false
      }
    } else if (step === 2) {
      const res = orgTypeSchema.safeParse({ organization_type: data.organization_type })
      if (!res.success) {
        setError(res.error.issues[0]?.message || "Invalid organization type")
        return false
      }
    } else if (step === 3) {
      const res = firstNameSchema.safeParse({ first_name: data.first_name })
      if (!res.success) {
        setError(res.error.issues[0]?.message || "Invalid first name")
        return false
      }
    } else if (step === 4) {
      const res = lastNameSchema.safeParse({ last_name: data.last_name })
      if (!res.success) {
        setError(res.error.issues[0]?.message || "Invalid last name")
        return false
      }
    } else if (step === 5) {
      const res = companySizeSchema.safeParse({ company_size: data.company_size })
      if (!res.success) {
        setError(res.error.issues[0]?.message || "Invalid company size")
        return false
      }
    }
    return true
  }, [step, data.organization_name, data.organization_type, data.first_name, data.last_name, data.company_size])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setError(null)
    const { name, value } = e.target
    setData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const next = useCallback(() => {
    if (!validateStep()) return
    if (step < totalSteps) setStep((s) => s + 1)
  }, [validateStep, step])

  const back = useCallback(() => {
    setError(null)
    if (step > 1) setStep((s) => s - 1)
  }, [step])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        if (step < totalSteps) {
          next()
        } else {
          void handleSubmit()
        }
      }
    },
    [step, next],
  )

  const submittingRef = useRef(false)
  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return
    if (!validateStep()) return

    submittingRef.current = true
    setLoading(true)
    try {
      const response = await completeOnboarding(data)
      if (response?.Result === "SUCCESS") {
        toast.success(response.message || "Onboarding completed successfully!")
        // clear old cookies
        Cookies.remove("signupToken")
        Cookies.remove("isOnboarded")

        // set cookies from API response if present
        if (response.Token) Cookies.set("authToken", response.Token)
        if (response.is_onboarded !== undefined) {
          Cookies.set("isOnboarded", response.is_onboarded ? "true" : "false")
        }
        if (response.Role) Cookies.set("currentRole", response.Role)

        router.replace("/")
      } else {
        toast.error(response?.message || "Failed to complete onboarding.")
      }
    } catch (err: any) {
      console.error("[v0] Onboarding error:", err)
      toast.error(err?.response?.data?.message || "Failed to complete onboarding.")
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }, [data, validateStep, router])

  const progressPct = useMemo(() => (step / totalSteps) * 100, [step])

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      {/* Header */}
      <header className="w-full px-6 py-5 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Onboarding</div>
        <div className="text-sm text-muted-foreground">
          Step {step} of {totalSteps}
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full px-6">
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <section className="w-full flex flex-col items-center justify-center px-6 pt-10 pb-16">
        <div className="max-w-xl w-full">
          <h1 className="text-balance text-2xl md:text-3xl font-semibold mb-6">Let’s set up your account</h1>
          <p className="text-muted-foreground mb-10">
            Provide a few details to personalize your experience. One step at a time.
          </p>

          {/* Field */}
          <div className="flex flex-col gap-2">
            {currentField?.type === "text" && (
              <>
                <label htmlFor={currentField.name} className="text-sm font-medium">
                  {currentField.label}
                </label>
                <input
                  ref={(el) => { inputRef.current = el; }}
                  id={currentField.name}
                  name={currentField.name}
                  type="text"
                  value={data[currentField.name]}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder={currentField.placeholder}
                  className="w-full rounded-md border border-input bg-background px-3 py-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  autoComplete="off"
                  aria-invalid={!!error}
                  aria-describedby={error ? "field-error" : undefined}
                />
              </>
            )}

            {currentField?.type === "select-type" && (
              <>
                <label htmlFor={currentField.name} className="text-sm font-medium">
                  {currentField.label}
                </label>
                <select
                  ref={(el) => { inputRef.current = el; }}
                  id={currentField.name}
                  name={currentField.name}
                  value={data.organization_type}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-md border border-input bg-background px-3 py-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-invalid={!!error}
                  aria-describedby={error ? "field-error" : undefined}
                >
                  <option value="" disabled>
                    Select organization type
                  </option>
                  <option value="Medical">Medical</option>
                  <option value="Automation">Automation</option>
                  <option value="Education">Education</option>
                  <option value="Software">Software</option>
                  <option value="Retail">Retail</option>
                  <option value="Finance">Finance</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Legal">Legal</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Non-profit">Non-profit</option>
                  <option value="Travel">Travel</option>
                  <option value="Construction">Construction</option>
                  <option value="Other">Other</option>
                </select>
              </>
            )}

            {currentField?.type === "select-size" && (
              <>
                <label htmlFor={currentField.name} className="text-sm font-medium">
                  {currentField.label}
                </label>
                <select
                  ref={(el) => { inputRef.current = el; }}
                  id={currentField.name}
                  name={currentField.name}
                  value={data.company_size}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-md border border-input bg-background px-3 py-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-invalid={!!error}
                  aria-describedby={error ? "field-error" : undefined}
                >
                  <option value="" disabled>
                    Select company size
                  </option>
                  <option value="1-5">1-5</option>
                  <option value="6-20">6-20</option>
                  <option value="21-50">21-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </>
            )}

            {error && (
              <p id="field-error" role="alert" className="text-sm text-destructive mt-1">
                {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" onClick={back} disabled={step === 1 || loading}>
              Back
            </Button>

            {step < totalSteps ? (
              <Button onClick={next} disabled={loading}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="inline-flex items-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Submitting..." : "Finish"}
              </Button>
            )}
          </div>

          {/* Hint */}
          <p className="mt-4 text-xs text-muted-foreground">Press Enter to continue</p>
        </div>
      </section>
    </main>
  )
}
