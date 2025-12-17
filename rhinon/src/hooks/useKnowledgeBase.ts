// import { useState, useCallback, useMemo } from 'react'
// import { Topic, Article, KnowledgeBaseState } from '../types/knowledge-base'

// const initialTopics: Topic[] = [
//   {
//     id: 'getting-started',
//     name: 'Getting started',
//     articleCount: 4,
//     createdAt: new Date('2025-06-01'),
//     updatedAt: new Date('2025-06-06'),
//     isExpanded: true,
//   },
//   {
//     id: 'general',
//     name: 'General',
//     articleCount: 0,
//     createdAt: new Date('2025-06-01'),
//     updatedAt: new Date('2025-06-01'),
//     isExpanded: false,
//   },
//   {
//     id: 'faq',
//     name: 'FAQ',
//     articleCount: 0,
//     createdAt: new Date('2025-06-01'),
//     updatedAt: new Date('2025-06-01'),
//     isExpanded: false,
//   },
// ]

// const initialArticles: Article[] = [
//   {
//     id: 'kb-intro',
//     title: 'See what KnowledgeBase can do for you',
//     content: 'Welcome to our knowledge base...',
//     topicId: 'getting-started',
//     status: 'published',
//     keywords: ['introduction', 'getting started'],
//     views: 1,
//     likes: 0,
//     dislikes: 0,
//     createdAt: new Date('2025-06-06'),
//     updatedAt: new Date('2025-06-06'),
//     author: 'Admin',
//   },
//   {
//     id: 'create-publish',
//     title: 'Step 1: Create & publish articles',
//     content: 'Learn how to create and publish articles...',
//     topicId: 'getting-started',
//     status: 'published',
//     keywords: ['create', 'publish', 'articles'],
//     views: 0,
//     likes: 0,
//     dislikes: 0,
//     createdAt: new Date('2025-06-06'),
//     updatedAt: new Date('2025-06-06'),
//     author: 'Admin',
//   },
//   {
//     id: 'launch-help',
//     title: 'Step 2: Launch your Help Center',
//     content: 'Set up your help center...',
//     topicId: 'getting-started',
//     status: 'published',
//     keywords: ['launch', 'help center'],
//     views: 0,
//     likes: 0,
//     dislikes: 0,
//     createdAt: new Date('2025-06-06'),
//     updatedAt: new Date('2025-06-06'),
//     author: 'Admin',
//   },
//   {
//     id: 'use-chat',
//     title: 'Step 3: Use articles in the chat',
//     content: 'Integrate articles with chat...',
//     topicId: 'getting-started',
//     status: 'published',
//     keywords: ['chat', 'integration'],
//     views: 0,
//     likes: 0,
//     dislikes: 0,
//     createdAt: new Date('2025-06-06'),
//     updatedAt: new Date('2025-06-06'),
//     author: 'Admin',
//   },
// ]

// export function useKnowledgeBase() {
//   const [state, setState] = useState<KnowledgeBaseState>({
//     topics: initialTopics,
//     articles: initialArticles,
//     searchQuery: '',
//     statusFilter: 'all',
//   })

//   const filteredArticles = useMemo(() => {
//     let filtered = state.articles

//     // Filter by search query
//     if (state.searchQuery) {
//       filtered = filtered.filter(
//         (article) =>
//           article.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
//           article.content.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
//           article.keywords.some((keyword) => keyword.toLowerCase().includes(state.searchQuery.toLowerCase()))
//       )
//     }

//     // Filter by status
//     if (state.statusFilter !== 'all') {
//       filtered = filtered.filter((article) => article.status === state.statusFilter)
//     }

//     return filtered
//   }, [state.articles, state.searchQuery, state.statusFilter])

//   const addTopic = useCallback((name: string, description?: string, parentId?: string) => {
//     const newTopic: Topic = {
//       id: Math.random().toString(36).substr(2, 9),
//       name,
//       description,
//       parentId,
//       articleCount: 0,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       isExpanded: false,
//     }

//     setState((prev) => ({
//       ...prev,
//       topics: [...prev.topics, newTopic],
//     }))

//     return newTopic.id
//   }, [])

//   const updateTopic = useCallback((id: string, updates: Partial<Topic>) => {
//     setState((prev) => ({
//       ...prev,
//       topics: prev.topics.map((topic) => (topic.id === id ? { ...topic, ...updates, updatedAt: new Date() } : topic)),
//     }))
//   }, [])

//   const deleteTopic = useCallback((id: string) => {
//     setState((prev) => ({
//       ...prev,
//       topics: prev.topics.filter((topic) => topic.id !== id),
//       articles: prev.articles.filter((article) => article.topicId !== id),
//     }))
//   }, [])

//   const toggleTopicExpansion = useCallback((id: string) => {
//     setState((prev) => ({
//       ...prev,
//       topics: prev.topics.map((topic) => (topic.id === id ? { ...topic, isExpanded: !topic.isExpanded } : topic)),
//     }))
//   }, [])

//   const addArticle = useCallback((article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
//     const newArticle: Article = {
//       ...article,
//       id: Math.random().toString(36).substr(2, 9),
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     }

//     setState((prev) => {
//       const updatedTopics = prev.topics.map((topic) =>
//         topic.id === article.topicId ? { ...topic, articleCount: topic.articleCount + 1 } : topic
//       )

//       return {
//         ...prev,
//         topics: updatedTopics,
//         articles: [...prev.articles, newArticle],
//       }
//     })

//     return newArticle.id
//   }, [])

//   const updateArticle = useCallback((id: string, updates: Partial<Article>) => {
//     setState((prev) => ({
//       ...prev,
//       articles: prev.articles.map((article) =>
//         article.id === id ? { ...article, ...updates, updatedAt: new Date() } : article
//       ),
//     }))
//   }, [])

//   const deleteArticle = useCallback((id: string) => {
//     setState((prev) => {
//       const article = prev.articles.find((a) => a.id === id)
//       const updatedTopics = article?.topicId
//         ? prev.topics.map((topic) =>
//             topic.id === article.topicId ? { ...topic, articleCount: Math.max(0, topic.articleCount - 1) } : topic
//           )
//         : prev.topics

//       return {
//         ...prev,
//         topics: updatedTopics,
//         articles: prev.articles.filter((article) => article.id !== id),
//       }
//     })
//   }, [])

//   const setSearchQuery = useCallback((query: string) => {
//     setState((prev) => ({ ...prev, searchQuery: query }))
//   }, [])

//   const setStatusFilter = useCallback((filter: 'all' | 'published' | 'draft') => {
//     setState((prev) => ({ ...prev, statusFilter: filter }))
//   }, [])

//   const getTopicById = useCallback(
//     (id: string) => {
//       return state.topics.find((topic) => topic.id === id)
//     },
//     [state.topics]
//   )

//   const getArticleById = useCallback(
//     (id: string) => {
//       return state.articles.find((article) => article.id === id)
//     },
//     [state.articles]
//   )

//   const getArticlesByTopic = useCallback(
//     (topicId: string) => {
//       return filteredArticles.filter((article) => article.topicId === topicId)
//     },
//     [filteredArticles]
//   )

//   return {
//     ...state,
//     filteredArticles,
//     addTopic,
//     updateTopic,
//     deleteTopic,
//     toggleTopicExpansion,
//     addArticle,
//     updateArticle,
//     deleteArticle,
//     setSearchQuery,
//     setStatusFilter,
//     getTopicById,
//     getArticleById,
//     getArticlesByTopic,
//   }
// }
