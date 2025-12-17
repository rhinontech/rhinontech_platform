import { useTour, type TourStep } from "./tour-provider"

/**
 * Custom hook to easily start a tour with predefined steps
 * Usage: const startTour = useTourSteps(mySteps)
 */
export function useTourSteps() {
  const { startTour } = useTour()

  return {
    start: (steps: TourStep[], startIndex?: number) => startTour(steps, startIndex),
    startFrom: (steps: TourStep[], stepId: string) => {
      const index = steps.findIndex((s) => s.id === stepId)
      if (index !== -1) {
        startTour(steps, index)
      }
    },
  }
}
