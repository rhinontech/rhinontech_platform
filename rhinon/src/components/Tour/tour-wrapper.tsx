"use client"

import { useState, useEffect, type ReactNode } from "react"
import { TourProvider } from "./tour-provider"
import { TourOverlay } from "./tour-overlay"
import type { TourStep } from "./tour-provider"

interface TourWrapperProps {
  children: ReactNode
}

export function TourWrapper({ children }: TourWrapperProps) {
  const [autoStart, setAutoStart] = useState(false)
  const [autoStartSteps, setAutoStartSteps] = useState<TourStep[]>([])

  useEffect(() => {
    const savedAutoStart = localStorage.getItem("tourAutoStart") === "true"
    setAutoStart(savedAutoStart)
  }, [])

  return (
    <TourProvider autoStart={autoStart} autoStartSteps={autoStartSteps}>
      {children}
      <TourOverlay />
    </TourProvider>
  )
}
