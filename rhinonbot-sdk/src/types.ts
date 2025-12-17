// src/types.ts - Clean types-only file for declarations
export interface RhinontechConfig {
  app_id: string;
  admin?: boolean;
  adminTestingMode?: boolean;
  chatbot_config?: ChatbotConfig,
  container?: HTMLElement;
}

export interface ChatbotConfig {
  theme?: 'light' | 'dark' | 'system';
  isFreePlan?: boolean;
  currentPlan?: string;
  isBackgroundImage?: boolean;
  backgroundImage?: string;
  isBgFade?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  chatbotName?: string;
  navigationOptions?: string[];
  popupMessage?: string;
  greetings?: string[];
  primaryLogo?: string;
  secondaryLogo?: string;
  preChatForm?: any[];
  postChatForm?: any;
  ticketForm?: any[];
}

// Export function type
export declare function initRhinontech(config: RhinontechConfig): void;

// Export class type  
export declare class ChatBotElement extends HTMLElement {
  setConfig(config: RhinontechConfig): void;
}

// Default export
declare const _default: typeof initRhinontech;
export default _default;