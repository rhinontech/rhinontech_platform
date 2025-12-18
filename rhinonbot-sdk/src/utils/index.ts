/**
 * Utilities Barrel Export
 * Exports all utility functions and helpers
 */

// Theme utilities
export { themeVars } from './theme';

// Tracking utilities
export { default as useTracking } from './useTracking';

// Campaign utilities
export { evaluateTargeting } from './campaignTargeting';
export { canShowCampaign, recordCampaignView, CampaignFrequencyManager } from './campaignFrequency';
export { trackCampaignAnalytics, CampaignAnalyticsManager } from './campaignAnalytics';

// Visitor tracking
export {
  isReturningVisitor,
  getCurrentUrl,
  getReferrerUrl,
  getPageLoadTime,
  initVisitorTracking,
} from './visitorTracking';

// Exit intent
export { ExitIntentManager } from './exitIntent';

// Time utilities
export { convertTimestamp } from './timeConvertion';

// Config store
export { getChatbotConfigFromStore, setChatbotConfigInStore } from './chatbotConfigStore';
