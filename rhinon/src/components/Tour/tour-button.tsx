"use client"

import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { useTourSteps } from "./use-tour-steps"
import type { TourStep } from "./tour-provider"

interface TourButtonProps {
  steps: TourStep[]
  label?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg"
  showIcon?: boolean
  className?: string
}

/**
 * Simple tour button component
 * Usage: <TourButton steps={mySteps} label="Start Tour" />
 */
export function TourButton({
  steps,
  label = "Tour",
  variant = "outline",
  size = "default",
  showIcon = true,
  className,
}: TourButtonProps) {
  const { start } = useTourSteps()

  return (
    <Button variant={variant} size={size} onClick={() => start(steps)} className={`gap-2 ${className || ""}`}>
      {showIcon && <HelpCircle size={16} />}
      {label}
    </Button>
  )
}
