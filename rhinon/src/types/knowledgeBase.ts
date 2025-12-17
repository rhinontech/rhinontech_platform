// ==================== TYPES ====================

export interface Article {
  articleId: string;
  title: string;
  content: string;
  status: string;
  views: number;
  likes: number;
  dislikes: number;
  updatedAt: string;
  createdAt: string;
  keywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface Folder {
  folder_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  articles: Article[];
}

export interface Theme {
  primary_color: string;
  header_text_color: string;

  logo: string | File | null;
  background_image: string | File | null;
  favicon: string | File | null;
  preview_image: string | File | null;

  company_name: string;
  headline_text: string;
  website_url: string;
  help_center_url: string;
  seo: {
    title: string | null;
    description: string | null;
  };
}



export interface KnowledgeBaseData {
  uuid: string;
  orgId: number;
  theme: Theme;
  folders: Folder[];
}

export type ResponsiveMode = "desktop" | "tablet" | "mobile";