// Configuration store - handles chatbot settings
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatbotConfig, FormField, PostChatFormConfig } from '@/types';
import { DEFAULT_CONFIG } from '@/constants/defaults';

interface ConfigState {
  appId: string;
  isAdmin: boolean;
  adminTestingMode: boolean;
  config: ChatbotConfig;
  
  // Actions
  setAppId: (id: string) => void;
  setAdmin: (isAdmin: boolean, testingMode?: boolean) => void;
  setConfig: (config: Partial<ChatbotConfig>) => void;
  updateForms: (
    preChatForm: FormField[],
    postChatForm: PostChatFormConfig,
    ticketForm: FormField[]
  ) => void;
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
      
      setAdmin: (isAdmin, testingMode = false) => 
        set({ isAdmin, adminTestingMode: testingMode }),
      
      setConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
      
      updateForms: (preChatForm, postChatForm, ticketForm) =>
        set((state) => ({
          config: {
            ...state.config,
            preChatForm,
            postChatForm,
            ticketForm,
          },
        })),
      
      resetConfig: () => set({ config: DEFAULT_CONFIG }),
    }),
    { name: 'rhinon-config' }
  )
);

// Legacy export for backward compatibility
export const useStore = useConfigStore;
