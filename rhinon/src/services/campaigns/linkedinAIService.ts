import { PrivateAxios } from '@/helpers/PrivateAxios'

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:5002'

export interface GenerateContentRequest {
  topic: string
  tone?: 'professional' | 'casual' | 'inspirational' | 'educational'
  length?: 'short' | 'medium' | 'long'
  include_emoji?: boolean
  target_audience?: string
  additional_context?: string
}

export interface GenerateHashtagsRequest {
  content: string
  industry?: string
  num_hashtags?: number
}

export interface OptimizeContentRequest {
  content: string
  optimization_focus?: 'engagement' | 'clarity' | 'professionalism' | 'conversion'
}

export interface SuggestPostingTimeRequest {
  target_audience: Record<string, any>
  timezone?: string
}

export interface GenerateIdeasRequest {
  industry: string
  target_audience: string
  num_ideas?: number
}

export interface AnalyzePerformanceRequest {
  content: string
  engagement_metrics: {
    likes?: number
    comments?: number
    shares?: number
    impressions?: number
    clicks?: number
  }
}

export interface GenerateCampaignRequest {
  campaign_goal: string
  industry: string
  target_audience: string
  duration_days?: number
  posts_per_week?: number
}

// Generate LinkedIn post content using AI
export const generatePostContent = async (data: GenerateContentRequest) => {
  try {
    const response = await fetch(`${AI_API_URL}/api/linkedin-ai/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate content')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error generating content:', error)
    throw error
  }
}

// Generate hashtags for LinkedIn post
export const generateHashtags = async (data: GenerateHashtagsRequest) => {
  try {
    const response = await fetch(`${AI_API_URL}/api/linkedin-ai/generate-hashtags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate hashtags')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error generating hashtags:', error)
    throw error
  }
}

// Optimize existing content
export const optimizeContent = async (data: OptimizeContentRequest) => {
  try {
    const response = await fetch(`${AI_API_URL}/api/linkedin-ai/optimize-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to optimize content')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error optimizing content:', error)
    throw error
  }
}

// Suggest optimal posting time
export const suggestPostingTime = async (data: SuggestPostingTimeRequest) => {
  try {
    const response = await fetch(`${AI_API_URL}/api/linkedin-ai/suggest-posting-time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to suggest posting time')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error suggesting posting time:', error)
    throw error
  }
}

// Generate content ideas
export const generateContentIdeas = async (data: GenerateIdeasRequest) => {
  try {
    const response = await fetch(`${AI_API_URL}/api/linkedin-ai/generate-ideas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate ideas')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error generating ideas:', error)
    throw error
  }
}

// Analyze content performance
export const analyzePerformance = async (data: AnalyzePerformanceRequest) => {
  try {
    const response = await fetch(`${AI_API_URL}/api/linkedin-ai/analyze-performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to analyze performance')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error analyzing performance:', error)
    throw error
  }
}

// Generate complete campaign
export const generateCompleteCampaign = async (data: GenerateCampaignRequest) => {
  try {
    const response = await fetch(`${AI_API_URL}/api/linkedin-ai/generate-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate campaign')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error generating campaign:', error)
    throw error
  }
}

// Health check
export const checkLinkedInAIHealth = async () => {
  try {
    const response = await fetch(`${AI_API_URL}/api/linkedin-ai/health`)
    return await response.json()
  } catch (error) {
    console.error('Error checking AI health:', error)
    throw error
  }
}
