# Rhinonbot-SDK Restructure & Optimization Plan

## 📋 Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Type System Consolidation | ✅ COMPLETED |
| Phase 2 | Component Decomposition | ✅ COMPLETED |
| Phase 3 | Services Reorganization | ✅ COMPLETED |
| Phase 4 | State Management Cleanup | ✅ COMPLETED |
| Phase 5 | Constants & Configuration | ✅ COMPLETED |
| Phase 6 | Bundle Optimization | ✅ COMPLETED |
| Phase 7 | Code Quality | ✅ COMPLETED |
| Phase 8 | Update Imports | 🔄 IN PROGRESS |

## New Structure Created

```
src/
├── types/                    ✅ NEW
│   ├── index.ts
│   ├── message.types.ts
│   ├── config.types.ts
│   ├── campaign.types.ts
│   ├── chat.types.ts
│   ├── ticket.types.ts
│   └── help.types.ts
├── constants/                ✅ NEW
│   ├── index.ts
│   ├── defaults.ts
│   ├── urls.ts
│   ├── timing.ts
│   ├── theme.ts
│   └── storage.ts
├── services/                 ✅ NEW
│   ├── index.ts
│   ├── api/
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── chat/
│   │   ├── chatService.ts
│   │   ├── socketService.ts
│   │   └── fileService.ts
│   ├── config/
│   │   ├── chatbotConfigService.ts
│   │   └── formService.ts
│   ├── campaign/
│   │   ├── campaignService.ts
│   │   └── analyticsService.ts
│   ├── ticket/
│   │   └── ticketService.ts
│   └── help/
│       └── helpService.ts
├── store/                    ✅ NEW
│   ├── index.ts
│   ├── configStore.ts
│   ├── uiStore.ts
│   ├── userStore.ts
│   └── chatStore.ts
├── hooks/                    ✅ NEW
│   ├── index.ts
│   ├── useTheme.ts
│   ├── useWebRTC.ts
│   ├── useChatTimeout.ts
│   └── useTracking.ts
├── components/               ✅ NEW
│   ├── index.ts
│   ├── Chat/
│   │   ├── ChatHeader.tsx
│   │   ├── MessageItem.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── ChatInput.tsx
│   │   └── ActionButtons.tsx
│   ├── Forms/
│   │   ├── PreChatForm.tsx
│   │   └── PostChatForm.tsx
│   ├── Modals/
│   │   └── WhatsAppQRModal.tsx
│   ├── StarRating/
│   │   └── StarRating.tsx
│   └── ErrorBoundary/
│       └── ErrorBoundary.tsx
└── Messenger/                (original - to be updated)
```

---

## Current State Analysis

### Overview
The `rhinonbot-sdk` is a chatbot widget SDK built with React, TypeScript, and Webpack. It provides embeddable chat functionality with features like:
- Multi-screen navigation (Home, Chat, Help, Voice, News)
- Real-time chat with AI and human support
- WebRTC voice calls
- Campaigns/popups
- Ticket management
- Pre/Post chat forms
- Theme support (light/dark/system)

### Current File Structure
```
rhinonbot-sdk/
├── src/
│   ├── Messenger/
│   │   ├── Messenger.tsx (801 lines) ❌ Very large
│   │   ├── Messenger.scss (349 lines)
│   │   ├── ChatScreen/
│   │   │   ├── ChatScreen.tsx (1035 lines) ❌ Very large
│   │   │   ├── ChatComponents.tsx (1368 lines) ❌ Very large
│   │   │   ├── useChatLogic.tsx (767 lines) ❌ Large
│   │   │   └── StarRating/
│   │   ├── HomeScreen/
│   │   │   ├── HomeScreen.tsx (622 lines) ❌ Large
│   │   │   └── TicketRating/
│   │   ├── ChatHistoryScreen/
│   │   ├── HelpScreen/
│   │   ├── HelpArticlePage/
│   │   ├── NewsScreen/
│   │   ├── NewsPage/
│   │   ├── TicketScreen/
│   │   ├── Voice/
│   │   ├── Campaigns/
│   │   └── Loader/
│   ├── main.tsx (176 lines)
│   ├── types.ts
│   └── index.ts
├── tools/
│   ├── services/
│   │   ├── AiRinoAssisstant/
│   │   ├── Campaigns/
│   │   ├── chatbotConfigService.tsx
│   │   ├── formServices.tsx
│   │   ├── helpService.tsx
│   │   └── TicketServices.tsx
│   ├── utils/
│   │   ├── campaignAnalytics.ts
│   │   ├── campaignFrequency.ts
│   │   ├── campaignTargeting.ts
│   │   ├── chatbotConfigStore.ts
│   │   ├── theme.tsx
│   │   ├── useTracking.tsx
│   │   └── visitorTracking.ts
│   ├── assets/
│   │   └── svgIcons.tsx
│   └── webpack/
└── package.json
```

### Identified Issues

#### 1. **Code Duplication & Large Files**
- `Messenger.tsx` (801 lines) - Contains too much logic
- `ChatScreen.tsx` (1035 lines) - Massive component with WebRTC, socket, UI all mixed
- `ChatComponents.tsx` (1368 lines) - Multiple components in single file
- `useChatLogic.tsx` (767 lines) - Hook doing too much
- `HomeScreen.tsx` (622 lines) - Large screen component

#### 2. **Architecture Issues**
- State management scattered between Zustand, local state, refs
- No clear separation of concerns
- Business logic mixed with UI components
- Services and utils lack organization
- Duplicate interface definitions across files

#### 3. **Type Safety Issues**
- Multiple `any` types used
- Duplicate interface definitions (`Message` defined in 3+ places)
- Inconsistent type exports

#### 4. **Bundle Size Concerns**
- Heavy dependencies (emoji-picker-react, motion, socket.io-client)
- SVG icons embedded as base64 strings
- No code splitting

#### 5. **Maintainability Issues**
- Poor folder organization
- Mixed file extensions (.ts, .tsx for services)
- No clear constants/config files

---

## Proposed Restructure Plan

### Phase 1: Type System Consolidation
**Priority: HIGH | Effort: LOW**

#### Actions:
1. Create unified types directory
2. Consolidate all interfaces into organized type files
3. Remove duplicate type definitions

#### New Structure:
```
src/
├── types/
│   ├── index.ts (re-exports)
│   ├── message.types.ts
│   ├── config.types.ts
│   ├── chat.types.ts
│   ├── campaign.types.ts
│   ├── form.types.ts
│   └── api.types.ts
```

#### Changes:
```typescript
// src/types/message.types.ts
export type MessageRole = 
  | 'user' 
  | 'bot' 
  | 'separator' 
  | 'support' 
  | 'trigger' 
  | 'timeout' 
  | 'whatsapp_qr' 
  | 'phone_request' 
  | 'whatsapp_trigger';

export interface Message {
  id?: number;
  text: string;
  role: MessageRole;
  timestamp: string;
  user_email?: string;
  user_id?: string;
  chatbot_id?: string;
  chatbot_history?: string;
  isEmailForm?: boolean;
  sender_name?: string;
  sender_image?: string;
}
```

---

### Phase 2: Component Decomposition
**Priority: HIGH | Effort: MEDIUM**

#### 2.1 Split Messenger.tsx (801 lines → ~150 lines each)

**Current:** One massive component handling everything
**Proposed:** Separate into focused components

```
src/
├── components/
│   ├── Messenger/
│   │   ├── index.tsx (Main container, ~150 lines)
│   │   ├── MessengerButton.tsx (Chat toggle button)
│   │   ├── MessengerWindow.tsx (Window container)
│   │   ├── MessengerHeader.tsx (Header with minimize)
│   │   ├── MessengerFooter.tsx (Powered by)
│   │   ├── BottomNav.tsx (Navigation)
│   │   └── Messenger.module.scss
```

#### 2.2 Split ChatComponents.tsx (1368 lines → focused components)

```
src/
├── components/
│   ├── Chat/
│   │   ├── index.ts (re-exports)
│   │   ├── ChatHeader.tsx
│   │   ├── MessageList/
│   │   │   ├── index.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── Separator.tsx
│   │   ├── ChatInput/
│   │   │   ├── index.tsx
│   │   │   ├── EmojiPicker.tsx
│   │   │   └── VoiceInput.tsx
│   │   ├── Forms/
│   │   │   ├── PreChatForm.tsx
│   │   │   └── PostChatForm.tsx
│   │   └── ActionButtons.tsx
```

#### 2.3 Split ChatScreen.tsx (1035 lines)

**Extract WebRTC to custom hook:**
```
src/
├── hooks/
│   ├── useWebRTC.ts (~200 lines - voice call logic)
│   ├── useChatSocket.ts (~150 lines - socket logic)
│   ├── useChatMessages.ts (~100 lines - message handling)
│   └── useChatTimeout.ts (~80 lines - timeout logic)
```

---

### Phase 3: Services Reorganization
**Priority: MEDIUM | Effort: LOW**

#### Current Issues:
- Mixed `.ts` and `.tsx` extensions for services
- Nested folder with typo: `AiRinoAssisstant`
- No clear API layer

#### Proposed Structure:
```
src/
├── services/
│   ├── api/
│   │   ├── client.ts (axios instance with interceptors)
│   │   ├── endpoints.ts (API endpoint constants)
│   │   └── index.ts
│   ├── chat/
│   │   ├── chatService.ts (merged AI conversation services)
│   │   ├── socketService.ts (socket conversation)
│   │   └── fileService.ts (file uploads)
│   ├── config/
│   │   ├── chatbotConfigService.ts
│   │   └── formService.ts
│   ├── campaign/
│   │   ├── campaignService.ts
│   │   └── analyticsService.ts
│   ├── ticket/
│   │   └── ticketService.ts
│   └── help/
│       └── helpService.ts
```

#### API Client Example:
```typescript
// src/services/api/client.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_NEW_SERVER_API_URL;
const AI_API_URL = process.env.REACT_APP_API_URL_AI;

export const serverApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const aiApi = axios.create({
  baseURL: AI_API_URL,
  timeout: 60000,
});

// Add interceptors for error handling
serverApi.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);
```

---

### Phase 4: State Management Cleanup
**Priority: MEDIUM | Effort: MEDIUM**

#### Current Issues:
- Zustand store has defaults embedded
- Props drilling throughout components
- Mixed local state and global store

#### Proposed Changes:

##### 4.1 Split Zustand Store
```
src/
├── store/
│   ├── index.ts
│   ├── configStore.ts (chatbot configuration)
│   ├── chatStore.ts (current chat state)
│   ├── userStore.ts (user/visitor info)
│   └── uiStore.ts (UI state - isOpen, activeScreen, etc.)
```

##### 4.2 Example Refactored Store:
```typescript
// src/store/configStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatbotConfig } from '@/types';
import { DEFAULT_CONFIG } from '@/constants/defaults';

interface ConfigState {
  appId: string;
  isAdmin: boolean;
  adminTestingMode: boolean;
  config: ChatbotConfig;
  setAppId: (id: string) => void;
  setConfig: (config: Partial<ChatbotConfig>) => void;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      appId: '',
      isAdmin: false,
      adminTestingMode: false,
      config: DEFAULT_CONFIG,
      setAppId: (id) => set({ appId: id }),
      setConfig: (config) => set((state) => ({ 
        config: { ...state.config, ...config } 
      })),
      resetConfig: () => set({ config: DEFAULT_CONFIG }),
    }),
    { name: 'rhinon-config' }
  )
);
```

---

### Phase 5: Constants & Configuration
**Priority: LOW | Effort: LOW**

#### Create centralized constants:
```
src/
├── constants/
│   ├── index.ts
│   ├── defaults.ts (default config values)
│   ├── urls.ts (logo URLs, CDN paths)
│   ├── timing.ts (timeouts, intervals)
│   └── theme.ts (theme variables)
```

#### Example:
```typescript
// src/constants/defaults.ts
export const DEFAULT_CONFIG: ChatbotConfig = {
  theme: 'dark',
  isFreePlan: false,
  currentPlan: 'Trial',
  primaryColor: '#1403ac',
  secondaryColor: '#f3f6ff',
  chatbotName: 'Rhinon',
  navigationOptions: ['Home', 'Messages', 'Help'],
  // ... rest of defaults
};

// src/constants/urls.ts
export const LOGOS = {
  primaryLight: 'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_White.png',
  primaryDark: 'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_Dark+2.png',
  supportAvatar: 'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/support_avatar.png',
  botAvatar: 'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/rhinonbot.png',
};
```

---

### Phase 6: Bundle Optimization
**Priority: MEDIUM | Effort: MEDIUM**

#### 6.1 Lazy Loading Screens
```typescript
// src/components/Messenger/screens.ts
import { lazy } from 'react';

export const HomeScreen = lazy(() => import('@/screens/HomeScreen'));
export const ChatScreen = lazy(() => import('@/screens/ChatScreen'));
export const HelpScreen = lazy(() => import('@/screens/HelpScreen'));
export const VoiceScreen = lazy(() => import('@/screens/Voice'));
export const NewsScreen = lazy(() => import('@/screens/NewsScreen'));
```

#### 6.2 SVG Icons Optimization
Replace base64 encoded SVGs with proper SVG components:
```typescript
// src/components/icons/index.ts
export { HomeIcon } from './HomeIcon';
export { ChatIcon } from './ChatIcon';
export { HelpIcon } from './HelpIcon';
// etc.
```

#### 6.3 Consider Lighter Alternatives
| Current | Proposed | Savings |
|---------|----------|---------|
| `emoji-picker-react` | Load on demand only | ~200KB |
| `motion/react` | CSS animations for simple cases | ~50KB |
| Base64 SVGs | SVG components | ~10KB |

---

### Phase 7: Code Quality Improvements
**Priority: LOW | Effort: LOW**

#### 7.1 Remove Unused Code
- Commented out code in multiple files
- Unused imports
- Dead feature flags

#### 7.2 Consistent Naming
- `AiRinoAssisstant` → `AiAssistant` (fix typo)
- Service files: use `.ts` not `.tsx`
- Components: use PascalCase consistently

#### 7.3 Add Error Boundaries
```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

---

## Final Proposed Structure

```
rhinonbot-sdk/
├── src/
│   ├── components/
│   │   ├── Messenger/
│   │   │   ├── index.tsx
│   │   │   ├── MessengerButton.tsx
│   │   │   ├── MessengerWindow.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── Messenger.module.scss
│   │   ├── Chat/
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── MessageList/
│   │   │   ├── ChatInput/
│   │   │   └── Forms/
│   │   ├── icons/
│   │   └── common/
│   │       ├── Loader.tsx
│   │       └── ErrorBoundary.tsx
│   ├── screens/
│   │   ├── HomeScreen/
│   │   ├── ChatScreen/
│   │   ├── HelpScreen/
│   │   ├── NewsScreen/
│   │   ├── VoiceScreen/
│   │   └── TicketScreen/
│   ├── hooks/
│   │   ├── useWebRTC.ts
│   │   ├── useChatSocket.ts
│   │   ├── useChatMessages.ts
│   │   ├── useTracking.ts
│   │   └── useTheme.ts
│   ├── services/
│   │   ├── api/
│   │   ├── chat/
│   │   ├── config/
│   │   ├── campaign/
│   │   └── ticket/
│   ├── store/
│   │   ├── configStore.ts
│   │   ├── chatStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── message.types.ts
│   │   ├── config.types.ts
│   │   └── api.types.ts
│   ├── constants/
│   │   ├── defaults.ts
│   │   ├── urls.ts
│   │   └── theme.ts
│   ├── styles/
│   │   ├── variables.scss
│   │   └── mixins.scss
│   ├── main.tsx
│   └── index.ts
├── tools/
│   └── webpack/
├── package.json
└── tsconfig.json
```

---

## Implementation Priority

### Immediate (Week 1)
1. ✅ Phase 1: Type System Consolidation
2. ✅ Phase 5: Constants & Configuration
3. ✅ Phase 7.1-7.2: Code cleanup

### Short-term (Week 2-3)
4. Phase 2: Component Decomposition (start with ChatComponents.tsx)
5. Phase 3: Services Reorganization

### Medium-term (Week 4-5)
6. Phase 4: State Management Cleanup
7. Phase 6: Bundle Optimization

---

## Expected Benefits

| Metric | Before | After (Expected) |
|--------|--------|------------------|
| Largest Component | 1368 lines | <200 lines |
| Type Definitions | 5+ duplicates | Single source |
| Bundle Size | ~400KB | ~300KB |
| Build Time | - | -20% |
| Test Coverage | Low | Improved |
| Maintainability | Poor | Good |

---

## Risk Mitigation

1. **Breaking Changes**: Implement changes incrementally, one phase at a time
2. **Testing**: Add unit tests for extracted hooks before refactoring
3. **Backward Compatibility**: Maintain same external API (initRhinontech, ChatBotElement)
4. **Rollback Plan**: Use feature flags for major changes

---

## Next Steps

1. Get approval on this plan
2. Create feature branch `refactor/restructure-sdk`
3. Start with Phase 1 (Type System) as it's safest
4. Set up proper testing infrastructure
5. Document changes in CHANGELOG.md

---

*Document created: December 19, 2025*
*Author: GitHub Copilot*
