// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Messenger from './Messenger/Messenger';

export interface RhinontechConfig {
  app_id: string;
  admin?: boolean;
  container?: HTMLElement; // Add container option
}

// Create custom element
export class ChatBotElement extends HTMLElement {
  private config: RhinontechConfig | null = null;
  private root: any = null;

  connectedCallback() {
    console.log('[chat-bot] connected');
    this.render();
  }

  private render() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: 'open' });

    if (!this.root) {
      const style = document.createElement('style');
      style.textContent = require('./Messenger/Messenger.scss').toString();
      shadow.appendChild(style);

      const container = document.createElement('div');
      shadow.appendChild(container);

      this.root = createRoot(container);
    }

    this.root.render(<Messenger config={this.config} />);
  }

  setConfig(config: RhinontechConfig) {
    console.log('[Messenger] Setting config:', config);
    this.config = config;
    if (this.root) {
      this.render();
    }
  }
}

// Define custom element once
if (!customElements.get('chat-bot')) {
  customElements.define('chat-bot', ChatBotElement);
}

// Track if manual initialization has been called
let manuallyInitialized = false;

// Updated initialization function with container support
function initRhinontech(config: RhinontechConfig): ChatBotElement {
  manuallyInitialized = true;

  const chatBotElement = document.createElement('chat-bot') as ChatBotElement;

  // Append to specified container or body
  const targetContainer = config.container || document.body;
  targetContainer.appendChild(chatBotElement);

  chatBotElement.setConfig(config);

  return chatBotElement; // Return element for further manipulation
}

// Auto-initialize only if not manually initialized
function autoInit() {
  if (!manuallyInitialized && !document.querySelector('chat-bot')) {
    if (process.env.NODE_ENV === 'development') {
      const defaultConfig = {
        app_id: 'OSFTLV',
        // admin: true,
        // chatbot_config: {
        //   isBgFade: false,
        //   isBackgroundImage: true,
        //   selectedPage: 'Home',
        //   backgroundImage:
        //     'https://rhinontech.s3.ap-south-1.amazonaws.com/new-rhinontech/attachments/Screenshot%202025-09-10%20141134-1758786082229.png',
        //   primaryColor: '#272196f5',
        //   secondaryColor: '#f3f6ff',
        //   chatbotName: 'Rhinon',
        //   navigationOptions: ['Home', 'Messages', 'Help', 'Voice'],
        //   popupMessage: 'Hey, I am Rhinon AI Assistant, How can I help you?',
        //   greetings: ['Hi there👋', 'How can we help?'],
        //   primaryLogo:
        //     'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_White.png',
        //   secondaryLogo:
        //     'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_Dark+2.png',

        //   preChatForm: [
        //     {
        //       id: 'email-1757579831083',
        //       type: 'email',
        //       label: 'Email Address',
        //       required: true,
        //       placeholder: 'Enter your email',
        //     },
        //     {
        //       id: 'name-1757592673122',
        //       type: 'name',
        //       label: 'Full Name',
        //       required: false,
        //       placeholder: 'Enter your name',
        //     },
        //     {
        //       id: 'phone-1757911406275',
        //       type: 'phone',
        //       label: 'Phone Number',
        //       required: false,
        //       placeholder: 'Enter your phone number',
        //     },
        //   ],
        //   postChatForm: {
        //     enabled: true,
        //     elements: [
        //       {
        //         id: 'rating-1757579436771',
        //         type: 'rating',
        //         label: 'Rate your experience',
        //         required: true,
        //       },
        //     ],
        //   },
        //   ticketForm: [
        //     {
        //       id: 'email-1758003244699',
        //       type: 'email',
        //       label: 'Email Address',
        //       required: true,
        //       placeholder: 'Enter your email',
        //     },
        //     {
        //       id: 'subject-1758003246765',
        //       type: 'subject',
        //       label: 'Subject',
        //       required: true,
        //       placeholder: 'Enter ticket subject',
        //     },
        //     {
        //       id: 'description-1758003249732',
        //       type: 'description',
        //       label: 'Description',
        //       required: true,
        //       placeholder: 'Describe the issue',
        //     },
        //   ],
        // },
      };
      initRhinontech(defaultConfig);
    }
  }
}

// Only auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

// Export for package consumers
export { initRhinontech };
export default initRhinontech;

if (typeof window !== 'undefined') {
  (window as any).RhinonBot = initRhinontech;
  (window as any).Rhinontech = initRhinontech;
}
