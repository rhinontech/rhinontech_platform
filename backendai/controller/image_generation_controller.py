"""
Image Generation Controller
Handles AI-powered image generation for social media posts
"""

import logging
import os
from typing import Dict, Any, Optional
from services.openai_services import client as openai_client

logger = logging.getLogger(__name__)


class ImageGenerationController:
    """Controller for AI image generation"""

    def __init__(self):
        self.openai_client = openai_client
        logger.info("Image Generation Controller initialized")

    def generate_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        quality: str = "standard",
        style: str = "vivid"
    ) -> Dict[str, Any]:
        """
        Generate an image using DALL-E
        
        Args:
            prompt: Description of the image to generate
            size: Image size (1024x1024, 1792x1024, 1024x1792)
            quality: Image quality (standard, hd)
            style: Image style (vivid, natural)
            
        Returns:
            Dict containing image URL and details
        """
        try:
            logger.info(f"Generating image with prompt: {prompt}")
            
            # Validate size
            valid_sizes = ["1024x1024", "1792x1024", "1024x1792"]
            if size not in valid_sizes:
                size = "1024x1024"
            
            # Generate image using DALL-E 3
            response = self.openai_client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=size,
                quality=quality,
                style=style,
                n=1
            )
            
            image_url = response.data[0].url
            revised_prompt = response.data[0].revised_prompt if hasattr(response.data[0], 'revised_prompt') else prompt
            
            return {
                "success": True,
                "data": {
                    "image_url": image_url,
                    "prompt": prompt,
                    "revised_prompt": revised_prompt,
                    "size": size,
                    "quality": quality,
                    "style": style
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating image: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def generate_social_media_image(
        self,
        post_content: str,
        platform: str = "linkedin",
        theme: Optional[str] = None,
        include_text: bool = False
    ) -> Dict[str, Any]:
        """
        Generate an optimized image for social media posts
        
        Args:
            post_content: The post content to base the image on
            platform: Social media platform (linkedin, twitter, facebook, instagram)
            theme: Visual theme or style
            include_text: Whether to include text overlay in image
            
        Returns:
            Dict containing generated image URL
        """
        try:
            # Platform-specific image sizes
            platform_sizes = {
                "linkedin": "1024x1024",  # LinkedIn recommended: 1200x627, but using square for versatility
                "twitter": "1024x1024",   # Twitter: 1200x675
                "facebook": "1024x1024",  # Facebook: 1200x630
                "instagram": "1024x1024"  # Instagram: 1080x1080
            }
            
            size = platform_sizes.get(platform.lower(), "1024x1024")
            
            # Build image generation prompt
            prompt_parts = []
            
            # Add platform context
            if platform.lower() == "linkedin":
                prompt_parts.append("Professional business-oriented")
            elif platform.lower() == "instagram":
                prompt_parts.append("Visually appealing, modern aesthetic")
            else:
                prompt_parts.append("Engaging social media")
            
            # Add theme if provided
            if theme:
                prompt_parts.append(f"with {theme} theme")
            
            # Extract key concepts from post content
            prompt_parts.append(f"image representing: {post_content[:200]}")
            
            # Add style instructions
            prompt_parts.append("High quality, eye-catching, modern design")
            
            if not include_text:
                prompt_parts.append("No text overlay, pure visual")
            
            final_prompt = ", ".join(prompt_parts)
            
            logger.info(f"Generating {platform} image with prompt: {final_prompt}")
            
            return self.generate_image(
                prompt=final_prompt,
                size=size,
                quality="standard",
                style="vivid"
            )
            
        except Exception as e:
            logger.error(f"Error generating social media image: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def generate_campaign_images(
        self,
        campaign_posts: list,
        platform: str = "linkedin"
    ) -> Dict[str, Any]:
        """
        Generate images for multiple campaign posts
        
        Args:
            campaign_posts: List of post objects with content
            platform: Social media platform
            
        Returns:
            Dict containing list of generated image URLs
        """
        try:
            generated_images = []
            
            for idx, post in enumerate(campaign_posts):
                content = post.get("content", "")
                media_suggestion = post.get("media_suggestion", "")
                
                # Use media suggestion if available, otherwise use content
                prompt_base = media_suggestion if media_suggestion else content
                
                logger.info(f"Generating image {idx + 1}/{len(campaign_posts)}")
                
                result = self.generate_social_media_image(
                    post_content=prompt_base,
                    platform=platform,
                    include_text=False
                )
                
                if result["success"]:
                    generated_images.append({
                        "post_number": post.get("post_number", idx + 1),
                        "image_url": result["data"]["image_url"],
                        "prompt": result["data"]["prompt"]
                    })
                else:
                    generated_images.append({
                        "post_number": post.get("post_number", idx + 1),
                        "error": result["error"]
                    })
            
            return {
                "success": True,
                "data": {
                    "images": generated_images,
                    "total_generated": len([img for img in generated_images if "image_url" in img]),
                    "total_failed": len([img for img in generated_images if "error" in img])
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating campaign images: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Global controller instance
image_generation = ImageGenerationController()
