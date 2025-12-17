import type { TourStep } from "./tour-provider"

/**
 * Utility function to create tour steps easily
 * Usage: createTourStep("id", ".selector", "Title", "Description")
 */
export function createTourStep(
  id: string,
  target: string,
  title: string,
  description: string,
  options?: {
    position?: "top" | "bottom" | "left" | "right" | "center"
    highlightPadding?: number
    allowClickThrough?: boolean
  },
): TourStep {
  return {
    id,
    target,
    title,
    description,
    position: options?.position || "bottom",
    highlightPadding: options?.highlightPadding || 8,
    allowClickThrough: options?.allowClickThrough || false,
  }
}

/**
 * Predefined tour step collections for common features
 */
export const tourStepCollections = {
  // Dashboard tour
  dashboard: [
    createTourStep(
      "dashboard-header",
      "[data-tour='dashboard-header']",
      "Welcome to Dashboard",
      "This is your main dashboard where you can see all your key metrics and information.",
    ),
    createTourStep(
      "dashboard-sidebar",
      "[data-tour='dashboard-sidebar']",
      "Navigation Menu",
      "Use the sidebar to navigate between different sections of the app.",
    ),
    createTourStep(
      "dashboard-stats",
      "[data-tour='dashboard-stats']",
      "Key Metrics",
      "View your important statistics and performance indicators here.",
    ),
  ],

  // Settings tour
  settings: [
    createTourStep(
      "settings-profile",
      "[data-tour='settings-profile']",
      "Profile Settings",
      "Update your personal information and preferences here.",
    ),
    createTourStep(
      "settings-security",
      "[data-tour='settings-security']",
      "Security",
      "Manage your password and security settings.",
    ),
    createTourStep(
      "settings-notifications",
      "[data-tour='settings-notifications']",
      "Notifications",
      "Control how you receive notifications.",
    ),
  ],

  // Onboarding tour
  onboarding: [
    createTourStep(
      "onboarding-welcome",
      "[data-tour='onboarding-welcome']",
      "Welcome!",
      "Let's get you started with a quick tour of the app.",
    ),
    createTourStep(
      "onboarding-setup",
      "[data-tour='onboarding-setup']",
      "Setup",
      "Complete your profile setup to get the most out of the app.",
    ),
    createTourStep(
      "onboarding-features",
      "[data-tour='onboarding-features']",
      "Key Features",
      "Explore the main features available to you.",
    ),
  ],
}
