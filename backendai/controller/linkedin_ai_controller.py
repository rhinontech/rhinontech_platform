"""
LinkedIn AI Automation Controller
Handles AI-powered content generation for LinkedIn campaigns
"""

import json
import logging
from typing import Dict, Any, List, Optional
from services.ai_provider import get_ai_provider

logger = logging.getLogger(__name__)


class LinkedInAIController:
    """Controller for LinkedIn AI automation features"""

    def __init__(self):
        self.ai_provider = get_ai_provider()
        logger.info(f"LinkedIn AI Controller initialized with {self.ai_provider.get_provider_name()}")

    def generate_post_content(
        self,
        topic: str,
        tone: str = "professional",
        length: str = "medium",
        include_emoji: bool = True,
        target_audience: Optional[str] = None,
        additional_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate LinkedIn post content using AI
        
        Args:
            topic: The main topic or theme of the post
            tone: Tone of the post (professional, casual, inspirational, educational)
            length: Length of the post (short, medium, long)
            include_emoji: Whether to include emojis
            target_audience: Target audience description
            additional_context: Any additional context or requirements
            
        Returns:
            Dict containing generated content and variations
        """
        try:
            # Build the prompt
            length_guide = {
                "short": "50-100 words, punchy and concise",
                "medium": "100-200 words, balanced detail",
                "long": "200-300 words, comprehensive and detailed"
            }
            
            prompt = f"""
            Generate a professional LinkedIn post with the following specifications:
            
            Topic: {topic}
            Tone: {tone}
            Length: {length_guide.get(length, length_guide['medium'])}
            Include Emojis: {'Yes' if include_emoji else 'No'}
            {f'Target Audience: {target_audience}' if target_audience else ''}
            {f'Additional Context: {additional_context}' if additional_context else ''}
            
            Requirements:
            1. Write an engaging LinkedIn post that captures attention
            2. Make it relevant and valuable for the target audience
            3. Include a call-to-action at the end
            4. Use appropriate formatting (line breaks, bullet points if needed)
            5. Keep it professional yet engaging
            6. Make it authentic and relatable
            
            Return the response in JSON format with these fields:
            {{
                "main_content": "The primary post content",
                "variations": ["Alternative version 1", "Alternative version 2"],
                "key_points": ["Main point 1", "Main point 2", "Main point 3"],
                "suggested_cta": "Suggested call-to-action"
            }}
            """
            
            result_text = self.ai_provider.generate_content(prompt).strip()
            
            # Try to parse JSON response
            if result_text.startswith("```json"):
                result_text = result_text[7:-3].strip()
            elif result_text.startswith("```"):
                result_text = result_text[3:-3].strip()
                
            result = json.loads(result_text)
            
            return {
                "success": True,
                "data": result
            }
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return the raw content
            logger.warning(f"JSON parse error: {e}. Returning raw response.")
            return {
                "success": True,
                "data": {
                    "main_content": result_text,
                    "variations": [],
                    "key_points": [],
                    "suggested_cta": ""
                }
            }
        except Exception as e:
            logger.error(f"Error generating post content: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def generate_hashtags(
        self,
        content: str,
        industry: Optional[str] = None,
        num_hashtags: int = 10
    ) -> Dict[str, Any]:
        """
        Generate relevant hashtags for LinkedIn post
        
        Args:
            content: The post content
            industry: Industry or niche
            num_hashtags: Number of hashtags to generate
            
        Returns:
            Dict containing hashtag suggestions
        """
        try:
            prompt = f"""
            Analyze this LinkedIn post content and generate {num_hashtags} relevant hashtags:
            
            Content: {content}
            {f'Industry: {industry}' if industry else ''}
            
            Requirements:
            1. Mix of popular and niche hashtags
            2. Include branded and industry-specific tags
            3. Ensure hashtags are relevant to LinkedIn audience
            4. Balance between high-volume and low-competition tags
            
            Return as JSON array:
            {{
                "hashtags": ["#hashtag1", "#hashtag2", ...],
                "trending": ["#trending1", "#trending2"],
                "niche": ["#niche1", "#niche2"],
                "recommended_count": "Recommended number to use (typically 3-5)"
            }}
            """
            
            result_text = self.ai_provider.generate_content(prompt).strip()
            
            if result_text.startswith("```json"):
                result_text = result_text[7:-3].strip()
            elif result_text.startswith("```"):
                result_text = result_text[3:-3].strip()
                
            result = json.loads(result_text)
            
            return {
                "success": True,
                "data": result
            }
            
        except Exception as e:
            logger.error(f"Error generating hashtags: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def optimize_content(
        self,
        content: str,
        optimization_focus: str = "engagement"
    ) -> Dict[str, Any]:
        """
        Optimize existing LinkedIn post content
        
        Args:
            content: Original post content
            optimization_focus: What to optimize for (engagement, clarity, professionalism, conversion)
            
        Returns:
            Dict containing optimized content and suggestions
        """
        try:
            prompt = f"""
            Optimize this LinkedIn post for {optimization_focus}:
            
            Original Content:
            {content}
            
            Provide:
            1. An optimized version of the content
            2. Specific improvements made
            3. Suggestions for further enhancement
            4. Engagement tips
            
            Return as JSON:
            {{
                "optimized_content": "The improved version",
                "improvements": ["Improvement 1", "Improvement 2", ...],
                "suggestions": ["Suggestion 1", "Suggestion 2", ...],
                "engagement_score": "Estimated score out of 10",
                "tips": ["Tip 1", "Tip 2", ...]
            }}
            """
            
            result_text = self.ai_provider.generate_content(prompt).strip()
            
            if result_text.startswith("```json"):
                result_text = result_text[7:-3].strip()
            elif result_text.startswith("```"):
                result_text = result_text[3:-3].strip()
                
            result = json.loads(result_text)
            
            return {
                "success": True,
                "data": result
            }
            
        except Exception as e:
            logger.error(f"Error optimizing content: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def suggest_optimal_posting_time(
        self,
        target_audience: Dict[str, Any],
        timezone: str = "UTC"
    ) -> Dict[str, Any]:
        """
        Suggest optimal posting times based on audience insights
        
        Args:
            target_audience: Target audience information
            timezone: Timezone for scheduling
            
        Returns:
            Dict containing optimal posting time suggestions
        """
        try:
            prompt = f"""
            Based on this LinkedIn target audience information, suggest the best times to post:
            
            Target Audience: {json.dumps(target_audience)}
            Timezone: {timezone}
            
            Consider:
            1. Professional audience behavior on LinkedIn
            2. Time zones and working hours
            3. Industry-specific patterns
            4. Day of week preferences
            
            Return as JSON:
            {{
                "optimal_times": [
                    {{"day": "Monday", "time": "09:00", "reason": "Why this time"}},
                    {{"day": "Wednesday", "time": "12:00", "reason": "Why this time"}}
                ],
                "avoid_times": ["Times to avoid"],
                "best_days": ["Best days of the week"],
                "engagement_insights": "Additional insights"
            }}
            """
            
            result_text = self.ai_provider.generate_content(prompt).strip()
            
            if result_text.startswith("```json"):
                result_text = result_text[7:-3].strip()
            elif result_text.startswith("```"):
                result_text = result_text[3:-3].strip()
                
            result = json.loads(result_text)
            
            return {
                "success": True,
                "data": result
            }
            
        except Exception as e:
            logger.error(f"Error suggesting posting time: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def generate_content_ideas(
        self,
        industry: str,
        target_audience: str,
        num_ideas: int = 10
    ) -> Dict[str, Any]:
        """
        Generate content ideas for LinkedIn campaigns
        
        Args:
            industry: Industry or business niche
            target_audience: Description of target audience
            num_ideas: Number of ideas to generate
            
        Returns:
            Dict containing content ideas
        """
        try:
            prompt = f"""
            Generate {num_ideas} LinkedIn content ideas for:
            
            Industry: {industry}
            Target Audience: {target_audience}
            
            Requirements:
            1. Diverse content types (posts, articles, videos, polls)
            2. Mix of educational, inspirational, and promotional content
            3. Trending topics in the industry
            4. Engagement-focused ideas
            
            Return as JSON:
            {{
                "ideas": [
                    {{
                        "title": "Content title",
                        "type": "post/article/video/poll/carousel",
                        "description": "Brief description",
                        "key_points": ["Point 1", "Point 2"],
                        "estimated_engagement": "low/medium/high"
                    }}
                ]
            }}
            """
            
            result_text = self.ai_provider.generate_content(prompt).strip()
            
            if result_text.startswith("```json"):
                result_text = result_text[7:-3].strip()
            elif result_text.startswith("```"):
                result_text = result_text[3:-3].strip()
                
            result = json.loads(result_text)
            
            return {
                "success": True,
                "data": result
            }
            
        except Exception as e:
            logger.error(f"Error generating content ideas: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def analyze_content_performance(
        self,
        content: str,
        engagement_metrics: Dict[str, int]
    ) -> Dict[str, Any]:
        """
        Analyze content performance and provide insights
        
        Args:
            content: The post content
            engagement_metrics: Metrics like likes, comments, shares, impressions
            
        Returns:
            Dict containing performance analysis
        """
        try:
            prompt = f"""
            Analyze this LinkedIn post performance:
            
            Content: {content}
            
            Metrics:
            - Likes: {engagement_metrics.get('likes', 0)}
            - Comments: {engagement_metrics.get('comments', 0)}
            - Shares: {engagement_metrics.get('shares', 0)}
            - Impressions: {engagement_metrics.get('impressions', 0)}
            - Clicks: {engagement_metrics.get('clicks', 0)}
            
            Provide:
            1. Performance assessment
            2. What worked well
            3. Areas for improvement
            4. Recommendations for future posts
            
            Return as JSON:
            {{
                "performance_score": "Score out of 10",
                "assessment": "Overall assessment",
                "strengths": ["Strength 1", "Strength 2"],
                "weaknesses": ["Weakness 1", "Weakness 2"],
                "recommendations": ["Recommendation 1", "Recommendation 2"],
                "engagement_rate": "Calculated rate",
                "insights": "Key insights"
            }}
            """
            
            result_text = self.ai_provider.generate_content(prompt).strip()
            
            if result_text.startswith("```json"):
                result_text = result_text[7:-3].strip()
            elif result_text.startswith("```"):
                result_text = result_text[3:-3].strip()
                
            result = json.loads(result_text)
            
            return {
                "success": True,
                "data": result
            }
            
        except Exception as e:
            logger.error(f"Error analyzing content performance: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def generate_complete_campaign(
        self,
        campaign_goal: str,
        industry: str,
        target_audience: str,
        duration_days: int = 7,
        posts_per_week: int = 3
    ) -> Dict[str, Any]:
        """
        Generate a complete LinkedIn campaign with multiple posts
        
        Args:
            campaign_goal: Main goal of the campaign
            industry: Industry or niche
            target_audience: Target audience description
            duration_days: Campaign duration in days
            posts_per_week: Number of posts per week
            
        Returns:
            Dict containing complete campaign plan
        """
        try:
            total_posts = (duration_days // 7) * posts_per_week
            
            prompt = f"""
            Create a complete LinkedIn campaign plan:
            
            Goal: {campaign_goal}
            Industry: {industry}
            Target Audience: {target_audience}
            Duration: {duration_days} days
            Posts per Week: {posts_per_week}
            Total Posts: {total_posts}
            
            For each post, provide:
            1. Post content
            2. Posting schedule (day and time)
            3. Hashtags
            4. Media suggestions (image/video description)
            5. Expected outcome
            
            Return as JSON:
            {{
                "campaign_overview": {{
                    "name": "Campaign name",
                    "description": "Campaign description",
                    "kpis": ["KPI 1", "KPI 2"]
                }},
                "posts": [
                    {{
                        "post_number": 1,
                        "content": "Post content",
                        "schedule": {{"day": "Monday", "time": "09:00"}},
                        "hashtags": ["#hashtag1", "#hashtag2"],
                        "media_suggestion": "Description of visual",
                        "call_to_action": "CTA text",
                        "expected_outcome": "What to expect"
                    }}
                ],
                "success_metrics": "How to measure success",
                "tips": ["Tip 1", "Tip 2"]
            }}
            """
            
            result_text = self.ai_provider.generate_content(prompt).strip()
            
            if result_text.startswith("```json"):
                result_text = result_text[7:-3].strip()
            elif result_text.startswith("```"):
                result_text = result_text[3:-3].strip()
                
            result = json.loads(result_text)
            
            return {
                "success": True,
                "data": result
            }
            
        except Exception as e:
            logger.error(f"Error generating campaign: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instance
linkedin_ai = LinkedInAIController()
