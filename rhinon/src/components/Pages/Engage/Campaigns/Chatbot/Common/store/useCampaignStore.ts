import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TemplateLayout, TemplateMedia } from '../TemplateSelection/templates';

export interface ButtonElement {
    id: string;
    text: string;
    url: string;
    style: "primary" | "secondary" | "danger";
    actionType?: "open-url" | "send-message" | "phone-call" | "open-moment" | "dismiss" | "copy-coupon";
}

interface CampaignState {
    id: string | null;
    templateId: string | null;
    layout: TemplateLayout;
    heading: string;
    subheading: string;
    media: TemplateMedia | null;
    buttons: ButtonElement[];
    hasImage: boolean;

    // Actions
    setCampaignData: (data: Partial<CampaignState>) => void;
    updateField: (field: keyof CampaignState, value: any) => void;
    reset: () => void;
}

export const useCampaignStore = create<CampaignState>()(
    persist(
        (set) => ({
            id: null,
            templateId: null,
            layout: "image-heading-buttons",
            heading: "",
            subheading: "",
            media: null,
            buttons: [],
            hasImage: true,

            setCampaignData: (data) => set((state) => ({ ...state, ...data })),
            updateField: (field, value) => set((state) => ({ ...state, [field]: value })),
            reset: () => set({
                id: null,
                templateId: null,
                layout: "image-heading-buttons",
                heading: "",
                subheading: "",
                media: null,
                buttons: [],
                hasImage: true,
            }),
        }),
        {
            name: 'chatbot-campaign-storage',
        }
    )
);
