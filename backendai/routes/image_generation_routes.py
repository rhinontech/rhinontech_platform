"""
Image Generation API Routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from controller.image_generation_controller import image_generation

router = APIRouter(prefix="/api/image-generation", tags=["image-generation"])


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Description of the image to generate")
    size: Optional[str] = Field("1024x1024", description="Image size (1024x1024, 1792x1024, 1024x1792)")
    quality: Optional[str] = Field("standard", description="Image quality (standard, hd)")
    style: Optional[str] = Field("vivid", description="Image style (vivid, natural)")


class SocialMediaImageRequest(BaseModel):
    post_content: str = Field(..., description="Post content to base the image on")
    platform: Optional[str] = Field("linkedin", description="Social media platform")
    theme: Optional[str] = Field(None, description="Visual theme or style")
    include_text: Optional[bool] = Field(False, description="Include text overlay")


class CampaignImagesRequest(BaseModel):
    campaign_posts: List[Dict[str, Any]] = Field(..., description="List of campaign posts")
    platform: Optional[str] = Field("linkedin", description="Social media platform")


@router.post("/generate")
async def generate_image(payload: ImageGenerationRequest):
    """
    Generate an image using AI
    
    Example:
    ```
    {
        "prompt": "Modern professional office with AI technology",
        "size": "1024x1024",
        "quality": "standard",
        "style": "vivid"
    }
    ```
    """
    try:
        result = image_generation.generate_image(
            prompt=payload.prompt,
            size=payload.size,
            quality=payload.quality,
            style=payload.style
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Image generation failed"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-social-media")
async def generate_social_media_image(payload: SocialMediaImageRequest):
    """
    Generate an optimized image for social media posts
    
    Example:
    ```
    {
        "post_content": "Exciting news about our new AI product launch!",
        "platform": "linkedin",
        "theme": "technology and innovation",
        "include_text": false
    }
    ```
    """
    try:
        result = image_generation.generate_social_media_image(
            post_content=payload.post_content,
            platform=payload.platform,
            theme=payload.theme,
            include_text=payload.include_text
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Image generation failed"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-campaign-images")
async def generate_campaign_images(payload: CampaignImagesRequest):
    """
    Generate images for multiple campaign posts
    
    Example:
    ```
    {
        "campaign_posts": [
            {
                "post_number": 1,
                "content": "Post content...",
                "media_suggestion": "Professional office environment"
            }
        ],
        "platform": "linkedin"
    }
    ```
    """
    try:
        result = image_generation.generate_campaign_images(
            campaign_posts=payload.campaign_posts,
            platform=payload.platform
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Image generation failed"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "image-generation"}
