// Templates module for Chatbot campaign selection
// - Hardcoded templates (10 templates with different layouts)
// - Templates are read-only, campaign data is saved separately using template.id

export type TemplateMediaType = "image" | "video";

export interface TemplateMedia {
  type: TemplateMediaType;
  src: string;
  alt?: string;
}

export type CampaignCategory =
  | "Greet and inform"
  | "Promote and convert"
  | "Generate leads";

export type TemplateLayout =
  | "image-heading-buttons"           // Image + Heading + Multiple Buttons
  | "image-heading-subheading-button" // Image + Heading + Subheading + 1 Button
  | "heading-buttons"                 // Heading + Multiple Buttons (no image)
  | "heading-subheading-button";      // Heading + Subheading + 1 Button (no image)

export interface Template {
  id: number;
  uuid: string;
  category: CampaignCategory;
  title: string;
  description?: string;
  layout: TemplateLayout;
  placeholder?: TemplateMedia;
  heading?: string;
  subheading?: string;
  buttons?: Array<{
    id: string;
    text: string;
    url?: string;
    style?: "primary" | "secondary";
  }>;
}

// ----------------------------------------------------------------------
// HARDCODED TEMPLATES (read-only)
// ----------------------------------------------------------------------

export const TEMPLATES: Template[] = [
  // --- Greet and inform ---
  {
    id: 1,
    uuid: "0b9f3f16-8c6a-4a2d-b6e2-1f9b8b9a1c01",
    category: "Greet and inform",
    title: "Offer instant help",
    description: "Quickly connect visitors with support through clickable options.",
    layout: "image-heading-buttons",
    placeholder: {
      type: "image",
      src: "https://cdn.livechat-static.com/api/file/lc/img/targeted-messages/templates/scenarios/offer-instant-help/screenshot.png",
      alt: "Support icon"
    },
    heading: "Need help? We're here for you!",
    buttons: [
      { id: "1", text: "Chat with Support", url: "#", style: "primary" },
      { id: "2", text: "View FAQs", url: "#", style: "secondary" },
      { id: "3", text: "Schedule a Call", url: "#", style: "secondary" }
    ]
  },
  {
    id: 2,
    uuid: "2c3d5e70-9bfa-4bd1-a238-3a7f7d2a7c02",
    category: "Greet and inform",
    title: "Welcome visitors",
    description: "Send a friendly greeting and encourage users to start a chat.",
    layout: "heading-buttons",
    heading: "👋 Welcome! How can we help you today?",
    buttons: [
      { id: "1", text: "Get Started", url: "#", style: "primary" },
      { id: "2", text: "Browse Products", url: "#", style: "secondary" }
    ]
  },
  {
    id: 3,
    uuid: "6d4e9a88-2b3f-4c9e-95b8-5b6a7b3e8d03",
    category: "Greet and inform",
    title: "Share important updates",
    description: "Notify visitors about important announcements or website information.",
    layout: "image-heading-subheading-button",
    placeholder: {
      type: "image",
      src: "https://cdn.livechat-static.com/api/file/lc/img/targeted-messages/templates/scenarios/share-important-updates/screenshot.png",
      alt: "Announcement icon"
    },
    heading: "Important Update",
    subheading: "We've updated our privacy policy and terms of service. Please review the changes to continue using our services.",
    buttons: [
      { id: "1", text: "Read More", url: "#", style: "primary" }
    ]
  },

  // --- Promote and convert ---
  {
    id: 4,
    uuid: "8f7a2b33-1f6d-4c8b-8a1c-9d2e6f0b4e04",
    category: "Promote and convert",
    title: "Hook leaving visitors",
    description: "Offer a special discount before visitors leave your site.",
    layout: "image-heading-buttons",
    placeholder: {
      type: "image",
      src: "https://cdn.livechat-static.com/api/file/lc/img/targeted-messages/templates/scenarios/personalize-experience/screenshot.png",
      alt: "Discount badge"
    },
    heading: "Wait! Get 20% off your first order",
    buttons: [
      { id: "1", text: "Claim Discount", url: "#", style: "primary" },
      { id: "2", text: "No Thanks", url: "#", style: "secondary" }
    ]
  },
  {
    id: 5,
    uuid: "5945c521-cc3b-4fd9-a441-084504c207e1",
    category: "Promote and convert",
    title: "Personalize experience",
    description: "Guide visitors to discover products that match their preferences.",
    layout: "heading-subheading-button",
    heading: "Find products perfect for you",
    subheading: "Take our quick quiz to get personalized recommendations based on your preferences and style.",
    buttons: [
      { id: "1", text: "Start Quiz", url: "#", style: "primary" }
    ]
  },
  {
    id: 6,
    uuid: "c977ea8c-7af1-4afb-a4c4-638ffe41e432",
    category: "Promote and convert",
    title: "Announce new products",
    description: "Introduce new products or features to spark interest and increase sales.",
    layout: "image-heading-buttons",
    placeholder: {
      type: "image",
      src: "https://cdn.livechat-static.com/api/file/lc/img/targeted-messages/templates/scenarios/announce-new-products/screenshotv2.png",
      alt: "New product"
    },
    heading: "Introducing our latest collection!",
    buttons: [
      { id: "1", text: "Shop Now", url: "#", style: "primary" },
      { id: "2", text: "Learn More", url: "#", style: "secondary" },
      { id: "3", text: "View Catalog", url: "#", style: "secondary" }
    ]
  },
  {
    id: 7,
    uuid: "0e777c69-1cd5-4ef9-aa94-775e02eb4341",
    category: "Promote and convert",
    title: "Share valuable resources",
    description: "Provide product catalogs, guides, or documents to engage visitors.",
    layout: "image-heading-subheading-button",
    placeholder: {
      type: "image",
      src: "https://cdn.livechat-static.com/api/file/lc/img/targeted-messages/templates/scenarios/share-valuable-resources/screenshot.png",
      alt: "Resource guide"
    },
    heading: "Free Resource: Complete Buyer's Guide",
    subheading: "Download our comprehensive guide to help you make the best purchasing decision.",
    buttons: [
      { id: "1", text: "Download Now", url: "#", style: "primary" }
    ]
  },

  // --- Generate leads ---
  {
    id: 8,
    uuid: "b1a6c9f2-3e8d-4a7b-9c5f-2e6d7a8b5f05",
    category: "Generate leads",
    title: "Grow your audiences",
    description: "Encourage visitors to subscribe to newsletters or lead forms.",
    layout: "heading-buttons",
    heading: "Stay updated with our latest news and exclusive offers!",
    buttons: [
      { id: "1", text: "Subscribe Now", url: "#", style: "primary" },
      { id: "2", text: "Maybe Later", url: "#", style: "secondary" }
    ]
  },
  {
    id: 9,
    uuid: "0df7586f-bd69-4a9c-b4f9-e97dd1cbc010",
    category: "Generate leads",
    title: "Increase social engagement",
    description: "Invite visitors to follow your social media profiles.",
    layout: "image-heading-buttons",
    placeholder: {
      type: "image",
      src: "https://cdn.livechat-static.com/api/file/lc/img/targeted-messages/templates/scenarios/grow-your-audiences/screenshotv2.png",
      alt: "Social media"
    },
    heading: "Connect with us on social media",
    buttons: [
      { id: "1", text: "Follow on Instagram", url: "#", style: "primary" },
      { id: "2", text: "Like on Facebook", url: "#", style: "secondary" },
      { id: "3", text: "Follow on Twitter", url: "#", style: "secondary" }
    ]
  },
  {
    id: 10,
    uuid: "c72ad8ce-792c-4b34-8df8-9ec8a7017dd1",
    category: "Generate leads",
    title: "Invite and capture interest",
    description: "Invite users to webinars or events to increase engagement.",
    layout: "image-heading-subheading-button",
    placeholder: {
      type: "image",
      src: "https://cdn.livechat-static.com/api/file/lc/img/targeted-messages/templates/scenarios/invite-capture-interest/screenshot.png",
      alt: "Webinar invitation"
    },
    heading: "Join our exclusive webinar",
    subheading: "Learn from industry experts about the latest trends and best practices. Limited spots available!",
    buttons: [
      { id: "1", text: "Register Now", url: "#", style: "primary" }
    ]
  }
];

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------

export function getTemplates(): Template[] {
  return TEMPLATES;
}

export function getTemplateById(id: number): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}

export function getTemplateByUuid(uuid: string): Template | undefined {
  return TEMPLATES.find(t => t.uuid === uuid);
}

// Export for backward compatibility
export const DEFAULT_TEMPLATES = TEMPLATES;