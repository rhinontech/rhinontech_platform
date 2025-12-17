"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export interface TourStep {
  id: string
  target: string // CSS selector for the element to highlight
  title: string
  description: string
  position?: "top" | "bottom" | "left" | "right" | "center"
  highlightPadding?: number
  allowClickThrough?: boolean
}

interface TourContextType {
  steps: TourStep[]
  currentStepIndex: number
  isActive: boolean
  startTour: (steps: TourStep[], startIndex?: number) => void
  endTour: () => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (index: number) => void
  getCurrentStep: () => TourStep | null
}

const TourContext = createContext<TourContextType | undefined>(undefined)

interface TourProviderProps {
  children: ReactNode
  autoStart?: boolean
  autoStartSteps?: TourStep[]
}

export function TourProvider({ children, autoStart = false, autoStartSteps = [] }: TourProviderProps) {
  const [steps, setSteps] = useState<TourStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const startTour = useCallback((newSteps: TourStep[], startIndex = 0) => {
    setSteps(newSteps)
    setCurrentStepIndex(startIndex)
    setIsActive(true)
  }, [])

  const endTour = useCallback(() => {
    setIsActive(false)
    setSteps([])
    setCurrentStepIndex(0)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = prev + 1
      if (next >= steps.length) {
        endTour()
        return prev
      }
      return next
    })
  }, [steps.length, endTour])

  const previousStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < steps.length) {
        setCurrentStepIndex(index)
      }
    },
    [steps.length],
  )

  const getCurrentStep = useCallback(() => {
    return steps[currentStepIndex] || null
  }, [steps, currentStepIndex])

  useEffect(() => {
    if (autoStart && autoStartSteps.length > 0) {
      startTour(autoStartSteps)
    }
  }, [autoStart, autoStartSteps, startTour])

  const value: TourContextType = {
    steps,
    currentStepIndex,
    isActive,
    startTour,
    endTour,
    nextStep,
    previousStep,
    goToStep,
    getCurrentStep,
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error("useTour must be used within a TourProvider")
  }
  return context
}
