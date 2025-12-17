"use client"

import { useEffect, useState, useRef } from "react"
import { useTour } from "./tour-provider"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ElementPosition {
  top: number
  left: number
  width: number
  height: number
}

type TooltipPlacement = "top" | "bottom" | "left" | "right"

export function TourOverlay() {
  const { isActive, getCurrentStep, nextStep, previousStep, endTour, currentStepIndex, steps } = useTour()
  const [elementPosition, setElementPosition] = useState<ElementPosition | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [tooltipPlacement, setTooltipPlacement] = useState<TooltipPlacement>("bottom")
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStep = getCurrentStep()
  const padding = currentStep?.highlightPadding || 8
  const gap = 16

  const debounceUpdatePosition = (callback: () => void, delay = 50) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(callback, delay)
  }

  const calculateTooltipPlacement = (
    elementRect: DOMRect,
    tooltipWidth: number,
    tooltipHeight: number,
  ): { placement: TooltipPlacement; top: number; left: number } => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Try bottom first
    if (elementRect.bottom + gap + tooltipHeight < viewportHeight) {
      return {
        placement: "bottom",
        top: elementRect.bottom + gap,
        left: Math.max(
          gap,
          Math.min(elementRect.left + elementRect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - gap),
        ),
      }
    }

    // Try top
    if (elementRect.top - gap - tooltipHeight > 0) {
      return {
        placement: "top",
        top: elementRect.top - gap - tooltipHeight,
        left: Math.max(
          gap,
          Math.min(elementRect.left + elementRect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - gap),
        ),
      }
    }

    // Try right
    if (elementRect.right + gap + tooltipWidth < viewportWidth) {
      return {
        placement: "right",
        top: Math.max(
          gap,
          Math.min(elementRect.top + elementRect.height / 2 - tooltipHeight / 2, viewportHeight - tooltipHeight - gap),
        ),
        left: elementRect.right + gap,
      }
    }

    // Try left
    if (elementRect.left - gap - tooltipWidth > 0) {
      return {
        placement: "left",
        top: Math.max(
          gap,
          Math.min(elementRect.top + elementRect.height / 2 - tooltipHeight / 2, viewportHeight - tooltipHeight - gap),
        ),
        left: elementRect.left - gap - tooltipWidth,
      }
    }

    // Fallback to bottom
    return {
      placement: "bottom",
      top: elementRect.bottom + gap,
      left: Math.max(
        gap,
        Math.min(elementRect.left + elementRect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - gap),
      ),
    }
  }

  useEffect(() => {
    if (!isActive || !currentStep) return

    const updatePosition = () => {
      const element = document.querySelector(currentStep.target)
      if (!element) {
        console.warn(`Tour target not found: ${currentStep.target}`)
        return
      }

      const rect = element.getBoundingClientRect()

      const elementCenterY = window.scrollY + rect.top + rect.height / 2
      const viewportCenterY = window.innerHeight / 2
      const scrollTarget = elementCenterY - viewportCenterY

      window.scrollTo({
        top: scrollTarget,
        behavior: "smooth",
      })

      // Update after scroll
      setTimeout(() => {
        const centeredRect = element.getBoundingClientRect()

        setElementPosition({
          top: centeredRect.top - padding,
          left: centeredRect.left - padding,
          width: centeredRect.width + padding * 2,
          height: centeredRect.height + padding * 2,
        })

        const tooltipWidth = 320
        const tooltipHeight = 200
        const { placement, top, left } = calculateTooltipPlacement(centeredRect, tooltipWidth, tooltipHeight)

        setTooltipPlacement(placement)
        setTooltipPosition({ top, left })
      }, 100)
    }

    // Initial update
    const timer = setTimeout(updatePosition, 100)

    const element = document.querySelector(currentStep.target)
    if (element) {
      resizeObserverRef.current = new ResizeObserver(() => {
        debounceUpdatePosition(updatePosition, 50)
      })
      resizeObserverRef.current.observe(element)
    }

    const handleZoom = () => {
      debounceUpdatePosition(updatePosition, 100)
    }

    window.addEventListener("resize", handleZoom)
    window.addEventListener("scroll", handleZoom)
    window.addEventListener("wheel", handleZoom, { passive: true })

    return () => {
      clearTimeout(timer)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      window.removeEventListener("resize", handleZoom)
      window.removeEventListener("scroll", handleZoom)
      window.removeEventListener("wheel", handleZoom)
    }
  }, [isActive, currentStep])

  if (!isActive || !currentStep || !elementPosition) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/45 transition-opacity duration-300 animate-in fade-in"
        onClick={endTour}
      />

      <div
        className="fixed z-50 border-2 border-white rounded-lg pointer-events-none transition-all duration-300 animate-in"
        style={{
          top: `${elementPosition.top}px`,
          left: `${elementPosition.left}px`,
          width: `${elementPosition.width}px`,
          height: `${elementPosition.height}px`,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 16px rgba(255, 255, 255, 0.3)",
        }}
      />

      <div
        ref={tooltipRef}
        className="fixed z-50 bg-white dark:bg-slate-950 rounded-lg shadow-2xl pointer-events-auto transition-all duration-300 animate-in fade-in zoom-in-95"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          maxWidth: "320px",
          minWidth: "280px",
        }}
      >
        {/* Arrow indicator */}
        <div
          className="absolute w-2 h-2 bg-white dark:bg-slate-950 transform rotate-45"
          style={{
            ...(tooltipPlacement === "bottom" && {
              top: "-4px",
              left: "50%",
              marginLeft: "-4px",
            }),
            ...(tooltipPlacement === "top" && {
              bottom: "-4px",
              left: "50%",
              marginLeft: "-4px",
            }),
            ...(tooltipPlacement === "left" && {
              right: "-4px",
              top: "50%",
              marginTop: "-4px",
            }),
            ...(tooltipPlacement === "right" && {
              left: "-4px",
              top: "50%",
              marginTop: "-4px",
            }),
          }}
        />

        <div className="p-4">
          {/* Header with close button */}
          <div className="flex justify-between items-start gap-3 mb-2">
            <h3 className="font-semibold text-foreground text-base leading-tight">{currentStep.title}</h3>
            <button
              onClick={endTour}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
              aria-label="Close tour"
            >
              <X size={18} />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{currentStep.description}</p>

          <div className="flex items-center justify-between mb-4 pb-4 border-t border-border">
            <span className="text-xs text-muted-foreground font-medium">
              {currentStepIndex + 1} / {steps.length}
            </span>
            <div className="flex gap-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all ${
                    index === currentStepIndex ? "w-6 bg-blue-500" : "w-1 bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            {currentStepIndex > 0 && (
              <Button variant="outline" size="sm" onClick={previousStep} className="gap-1.5 text-xs h-8 bg-transparent">
                <ChevronLeft size={14} />
                Previous
              </Button>
            )}
            {currentStepIndex === steps.length - 1 ? (
              <Button size="sm" onClick={endTour} className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-8">
                Finish
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={nextStep}
                className="gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs h-8"
              >
                Next
                <ChevronRight size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
