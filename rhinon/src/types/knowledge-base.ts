export interface Topic {
  id: string
  name: string
  description?: string
  parentId?: string
  articleCount: number
  createdAt: Date
  updatedAt: Date
  isExpanded?: boolean
}

export interface Article {
  id: string
  title: string
  content: string
  topicId?: string
  status: 'published' | 'draft'
  keywords: string[]
  views: number
  likes: number
  dislikes: number
  createdAt: Date
  updatedAt: Date
  author: string
  seoTitle?: string
  seoDescription?: string
}

export interface KnowledgeBaseState {
  topics: Topic[]
  articles: Article[]
  selectedTopic?: string
  searchQuery: string
  statusFilter: 'all' | 'published' | 'draft'
}
