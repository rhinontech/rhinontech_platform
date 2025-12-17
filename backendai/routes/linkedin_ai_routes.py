"""
LinkedIn AI Automation Routes
FastAPI routes for LinkedIn campaign AI automation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from controller.linkedin_ai_controller import linkedin_ai

router = APIRouter(prefix="/linkedin-ai", tags=["LinkedIn AI Automation"])


# Request Models
class GenerateContentRequest(BaseModel):
    topic: str
    tone: str = "professional"  # professional, casual, inspirational, educational
    length: str = "medium"  # short, medium, long
    include_emoji: bool = True
    target_audience: Optional[str] = None
    additional_context: Optional[str] = None


class GenerateHashtagsRequest(BaseModel):
    content: str
    industry: Optional[str] = None
    num_hashtags: int = 10


class OptimizeContentRequest(BaseModel):
    content: str
    optimization_focus: str = "engagement"  # engagement, clarity, professionalism, conversion


class SuggestPostingTimeRequest(BaseModel):
    target_audience: Dict[str, Any]
    timezone: str = "UTC"


class GenerateIdeasRequest(BaseModel):
    industry: str
    target_audience: str
    num_ideas: int = 10


class AnalyzePerformanceRequest(BaseModel):
    content: str
    engagement_metrics: Dict[str, int]


class GenerateCampaignRequest(BaseModel):
    campaign_goal: str
    industry: str
    target_audience: str
    duration_days: int = 7
    posts_per_week: int = 3


# Endpoints

@router.post("/generate-content")
async def generate_post_content(payload: GenerateContentRequest):
    """
    Generate LinkedIn post content using AI
    """
    try:
        result = linkedin_ai.generate_post_content(
            topic=payload.topic,
            tone=payload.tone,
            length=payload.length,
            include_emoji=payload.include_emoji,
            target_audience=payload.target_audience,
            additional_context=payload.additional_context
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to generate content"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-hashtags")
async def generate_hashtags(payload: GenerateHashtagsRequest):
    """
    Generate relevant hashtags for LinkedIn post
    """
    try:
        result = linkedin_ai.generate_hashtags(
            content=payload.content,
            industry=payload.industry,
            num_hashtags=payload.num_hashtags
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to generate hashtags"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize-content")
async def optimize_content(payload: OptimizeContentRequest):
    """
    Optimize existing LinkedIn post content using AI
    """
    try:
        result = linkedin_ai.optimize_content(
            content=payload.content,
            optimization_focus=payload.optimization_focus
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to optimize content"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-posting-time")
async def suggest_posting_time(payload: SuggestPostingTimeRequest):
    """
    Suggest optimal posting times based on audience insights
    """
    try:
        result = linkedin_ai.suggest_optimal_posting_time(
            target_audience=payload.target_audience,
            timezone=payload.timezone
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to suggest posting time"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-ideas")
async def generate_content_ideas(payload: GenerateIdeasRequest):
    """
    Generate content ideas for LinkedIn campaigns
    """
    try:
        result = linkedin_ai.generate_content_ideas(
            industry=payload.industry,
            target_audience=payload.target_audience,
            num_ideas=payload.num_ideas
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to generate ideas"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-performance")
async def analyze_performance(payload: AnalyzePerformanceRequest):
    """
    Analyze LinkedIn post performance and provide insights
    """
    try:
        result = linkedin_ai.analyze_content_performance(
            content=payload.content,
            engagement_metrics=payload.engagement_metrics
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to analyze performance"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-campaign")
async def generate_complete_campaign(payload: GenerateCampaignRequest):
    """
    Generate a complete LinkedIn campaign with multiple posts
    """
    try:
        result = linkedin_ai.generate_complete_campaign(
            campaign_goal=payload.campaign_goal,
            industry=payload.industry,
            target_audience=payload.target_audience,
            duration_days=payload.duration_days,
            posts_per_week=payload.posts_per_week
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to generate campaign"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "success": True,
        "message": "LinkedIn AI Automation API is running",
        "features": [
            "Content Generation",
            "Hashtag Generation",
            "Content Optimization",
            "Posting Time Suggestions",
            "Content Ideas",
            "Performance Analysis",
            "Campaign Generation"
        ]
    }
