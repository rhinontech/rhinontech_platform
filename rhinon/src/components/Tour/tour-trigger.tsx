"use client"
import { useTour, type TourStep } from "./tour-provider"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

interface TourTriggerProps {
  steps: TourStep[]
  label?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  showIcon?: boolean
}

export function TourTrigger({
  steps,
  label = "Start Tour",
  variant = "outline",
  size = "default",
  showIcon = true,
}: TourTriggerProps) {
  const { startTour } = useTour()

  return (
    <Button variant={variant} size={size} onClick={() => startTour(steps)} className="gap-2">
      {showIcon && <HelpCircle size={16} />}
      {label}
    </Button>
  )
}
