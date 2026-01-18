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
  seo: {
    title: string | null;
    description: string | null;
  };
  logo: string;
  favicon: string;
  website_url: string;
  company_name: string;
  headline_text: string;
  preview_image: string;
  primary_color: string;
  help_center_url: string;
  background_image: string;
  header_text_color?: string;
}

export interface KnowledgeBaseData {
  uuid: string;
  orgId: number;
  theme: Theme;
  folders: Folder[];
}