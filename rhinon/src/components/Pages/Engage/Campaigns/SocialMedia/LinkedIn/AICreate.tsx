"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Sparkles, 
  ArrowLeft, 
  Wand2, 
  Calendar, 
  Hash, 
  TrendingUp,
  Lightbulb,
  Zap,
  RefreshCw
} from "lucide-react";
import {
  generatePostContent,
  generateHashtags,
  optimizeContent,
  suggestPostingTime,
  generateContentIdeas,
  generateCompleteCampaign,
} from "@/services/campaigns/linkedinAIService";
import { createLinkedInCampaign, bulkCreateLinkedInCampaigns } from "@/services/campaigns/linkedinCampaignService";
import Loader from "@/components/Common/Loader/Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { format, parse } from "date-fns";

export default function AILinkedInCampaignCreate() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [campaignType, setCampaignType] = useState<"post" | "article" | "video" | "carousel" | "poll">("post");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [includeEmoji, setIncludeEmoji] = useState(true);
  
  // AI generation state
  const [aiTopic, setAiTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [industry, setIndustry] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  
  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);

  // AI results
  const [contentVariations, setContentVariations] = useState<string[]>([]);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [contentIdeas, setContentIdeas] = useState<any[]>([]);
  const [postingTimeSuggestions, setPostingTimeSuggestions] = useState<any>(null);
  const [campaignPlan, setCampaignPlan] = useState<any>(null);

  const handleGenerateContent = async () => {
    if (!aiTopic) {
      toast.error("Please enter a topic to generate content");
      return;
    }

    try {
      setIsGenerating(true);
      const response = await generatePostContent({
        topic: aiTopic,
        tone: tone as any,
        length: length as any,
        include_emoji: includeEmoji,
        target_audience: targetAudience || undefined,
        additional_context: additionalContext || undefined,
      });

      if (response.success) {
        const data = response.data;
        setContent(data.main_content);
        setContentVariations(data.variations || []);
        toast.success("Content generated successfully!");
        
        // Auto-generate hashtags
        if (data.main_content) {
          handleGenerateHashtags(data.main_content);
        }
      }
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateHashtags = async (customContent?: string) => {
    const textToAnalyze = customContent || content;
    
    if (!textToAnalyze) {
      toast.error("Please generate or write content first");
      return;
    }

    try {
      setIsGeneratingHashtags(true);
      const response = await generateHashtags({
        content: textToAnalyze,
        industry: industry || undefined,
        num_hashtags: 10,
      });

      if (response.success) {
        const data = response.data;
        setSuggestedHashtags(data.hashtags || []);
        setHashtags(data.hashtags?.slice(0, 5) || []);
        toast.success("Hashtags generated successfully!");
      }
    } catch (error) {
      console.error("Error generating hashtags:", error);
      toast.error("Failed to generate hashtags");
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  const handleOptimizeContent = async () => {
    if (!content) {
      toast.error("Please generate or write content first");
      return;
    }

    try {
      setIsOptimizing(true);
      const response = await optimizeContent({
        content,
        optimization_focus: "engagement",
      });

      if (response.success) {
        const data = response.data;
        setContent(data.optimized_content);
        toast.success("Content optimized for better engagement!");
      }
    } catch (error) {
      console.error("Error optimizing content:", error);
      toast.error("Failed to optimize content");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!industry || !targetAudience) {
      toast.error("Please provide industry and target audience");
      return;
    }

    try {
      setIsGeneratingIdeas(true);
      const response = await generateContentIdeas({
        industry,
        target_audience: targetAudience,
        num_ideas: 10,
      });

      if (response.success) {
        setContentIdeas(response.data.ideas || []);
        toast.success("Content ideas generated!");
      }
    } catch (error) {
      console.error("Error generating ideas:", error);
      toast.error("Failed to generate ideas");
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleGenerateCompleteCampaign = async () => {
    if (!aiTopic || !industry || !targetAudience) {
      toast.error("Please provide campaign goal, industry, and target audience");
      return;
    }

    try {
      setIsGeneratingCampaign(true);
      const response = await generateCompleteCampaign({
        campaign_goal: aiTopic,
        industry,
        target_audience: targetAudience,
        duration_days: 7,
        posts_per_week: 3,
      });

      if (response.success) {
        setCampaignPlan(response.data);
        
        // Set the first post as initial content
        if (response.data.posts && response.data.posts.length > 0) {
          const firstPost = response.data.posts[0];
          setContent(firstPost.content);
          setHashtags(firstPost.hashtags || []);
          setCampaignName(response.data.campaign_overview?.name || aiTopic);
          setCampaignDescription(response.data.campaign_overview?.description || "");
        }
        
        toast.success("Complete campaign generated!");
      }
    } catch (error) {
      console.error("Error generating campaign:", error);
      toast.error("Failed to generate campaign");
    } finally {
      setIsGeneratingCampaign(false);
    }
  };

  const handleSaveCampaign = async () => {
    if (!campaignName || !content) {
      toast.error("Campaign name and content are required");
      return;
    }

    try {
      setIsSaving(true);
      const response = await createLinkedInCampaign({
        campaign_name: campaignName,
        campaign_description: campaignDescription,
        campaign_type: campaignType,
        content,
        hashtags,
        target_audience: { description: targetAudience, industry },
      });

      if (response.success) {
        toast.success("Campaign created successfully!");
        router.push(`/${role}/engage/campaigns/social-media/linkedin`);
      }
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast.error(error.response?.data?.message || "Failed to create campaign");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectVariation = (variation: string) => {
    setContent(variation);
    toast.success("Content variation selected");
  };

  const handleToggleHashtag = (hashtag: string) => {
    if (hashtags.includes(hashtag)) {
      setHashtags(hashtags.filter(h => h !== hashtag));
    } else {
      setHashtags([...hashtags, hashtag]);
    }
  };

  const handleSelectIdea = (idea: any) => {
    setAiTopic(idea.title);
    setContent(idea.description);
    setCampaignType(idea.type || "post");
    toast.success("Idea selected! Click generate to create full content.");
  };

  const handleSaveCampaignAsDrafts = async () => {
    if (!campaignPlan || !campaignPlan.posts || campaignPlan.posts.length === 0) {
      toast.error("No campaign posts to save");
      return;
    }

    try {
      setIsSaving(true);
      
      const campaigns = campaignPlan.posts.map((post: any) => ({
        campaign_name: `${campaignPlan.campaign_overview?.name || "AI Campaign"} - Post ${post.post_number}`,
        campaign_description: post.expected_outcome || campaignPlan.campaign_overview?.description,
        campaign_type: "post" as const,
        content: post.content,
        hashtags: post.hashtags || [],
        call_to_action: post.call_to_action,
      }));

      const response = await bulkCreateLinkedInCampaigns(campaigns);
      
      if (response.success) {
        toast.success(`${campaigns.length} posts saved as drafts!`);
        router.push(`/${role}/engage/campaigns/social-media/linkedin`);
      }
    } catch (error) {
      console.error("Error saving campaigns:", error);
      toast.error("Failed to save campaigns");
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleFullCampaign = async () => {
    if (!campaignPlan || !campaignPlan.posts || campaignPlan.posts.length === 0) {
      toast.error("No campaign posts to schedule");
      return;
    }

    try {
      setIsSaving(true);
      
      const campaigns = campaignPlan.posts.map((post: any) => {
        // Parse schedule (e.g., "Monday 09:00")
        let scheduledTime = null;
        if (post.schedule?.day && post.schedule?.time) {
          // Get the next occurrence of the day
          const now = new Date();
          const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const targetDay = daysOfWeek.indexOf(post.schedule.day);
          const currentDay = now.getDay();
          
          let daysToAdd = targetDay - currentDay;
          if (daysToAdd <= 0) daysToAdd += 7; // Next week
          
          const scheduleDate = new Date(now);
          scheduleDate.setDate(now.getDate() + daysToAdd);
          
          const [hours, minutes] = post.schedule.time.split(':');
          scheduleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          scheduledTime = scheduleDate.toISOString();
        }

        return {
          campaign_name: `${campaignPlan.campaign_overview?.name || "AI Campaign"} - Post ${post.post_number}`,
          campaign_description: post.expected_outcome || campaignPlan.campaign_overview?.description,
          campaign_type: "post" as const,
          content: post.content,
          hashtags: post.hashtags || [],
          call_to_action: post.call_to_action,
          scheduled_time: scheduledTime,
        };
      });

      const response = await bulkCreateLinkedInCampaigns(campaigns);
      
      if (response.success) {
        toast.success(`${campaigns.length} posts scheduled successfully!`);
        router.push(`/${role}/engage/campaigns/social-media/linkedin`);
      }
    } catch (error) {
      console.error("Error scheduling campaigns:", error);
      toast.error("Failed to schedule campaigns");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b h-[60px] px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold">AI-Powered Campaign</h2>
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                Beta
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${role}/engage/campaigns/social-media/linkedin`)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCampaign}
              disabled={isSaving || !campaignName || !content}
            >
              {isSaving ? "Saving..." : "Save Campaign"}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="p-6 space-y-6">
            {/* AI Campaign Generator Banner */}
            <Card className="border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">AI-Powered LinkedIn Campaign Generator</h3>
                    <p className="text-sm text-muted-foreground">
                      Let our AI help you create engaging LinkedIn content. Generate posts, optimize for engagement,
                      suggest hashtags, and even create complete campaign strategies powered by advanced AI.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="single">
                  <Zap className="h-4 w-4 mr-2" />
                  Single Post
                </TabsTrigger>
                <TabsTrigger value="ideas">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Content Ideas
                </TabsTrigger>
                <TabsTrigger value="campaign">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Full Campaign
                </TabsTrigger>
              </TabsList>

              {/* Single Post Generation */}
              <TabsContent value="single" className="space-y-6">
                {/* AI Input Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wand2 className="h-5 w-5" />
                      AI Content Generator
                    </CardTitle>
                    <CardDescription>
                      Provide some details and let AI create engaging content for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aiTopic">Topic / Campaign Goal *</Label>
                        <Input
                          id="aiTopic"
                          placeholder="e.g., Product launch, hiring announcement, industry insights"
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          placeholder="e.g., Technology, Healthcare, Finance"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tone">Tone</Label>
                        <Select value={tone} onValueChange={setTone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="inspirational">Inspirational</SelectItem>
                            <SelectItem value="educational">Educational</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="length">Length</Label>
                        <Select value={length} onValueChange={setLength}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">Short (50-100 words)</SelectItem>
                            <SelectItem value="medium">Medium (100-200 words)</SelectItem>
                            <SelectItem value="long">Long (200-300 words)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetAudience">Target Audience</Label>
                      <Input
                        id="targetAudience"
                        placeholder="e.g., Marketing professionals, C-level executives, Small business owners"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
                      <Textarea
                        id="additionalContext"
                        placeholder="Any specific points, keywords, or requirements..."
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="emoji"
                        checked={includeEmoji}
                        onCheckedChange={setIncludeEmoji}
                      />
                      <Label htmlFor="emoji">Include emojis</Label>
                    </div>

                    <Button
                      onClick={handleGenerateContent}
                      disabled={isGenerating || !aiTopic}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Content with AI
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Content Variations */}
                {contentVariations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Variations</CardTitle>
                      <CardDescription>
                        Click on a variation to use it
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {contentVariations.map((variation, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border cursor-pointer hover:border-primary transition-colors"
                          onClick={() => handleSelectVariation(variation)}
                        >
                          <p className="text-sm whitespace-pre-wrap">{variation}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Main Campaign Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>
                      Review and edit your campaign before saving
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaignName">Campaign Name *</Label>
                      <Input
                        id="campaignName"
                        placeholder="Enter campaign name"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campaignDescription">Description</Label>
                      <Textarea
                        id="campaignDescription"
                        placeholder="Brief description of your campaign"
                        value={campaignDescription}
                        onChange={(e) => setCampaignDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campaignType">Campaign Type</Label>
                      <Select value={campaignType} onValueChange={(value) => setCampaignType(value as "post" | "article" | "video" | "carousel" | "poll")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="post">Post</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="carousel">Carousel</SelectItem>
                          <SelectItem value="poll">Poll</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="content">Content *</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOptimizeContent}
                          disabled={isOptimizing || !content}
                        >
                          {isOptimizing ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                              Optimizing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-2" />
                              Optimize
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        id="content"
                        placeholder="Your post content will appear here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                      />
                      <p className="text-xs text-muted-foreground">
                        {content.length} characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Hashtags</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateHashtags()}
                          disabled={isGeneratingHashtags || !content}
                        >
                          {isGeneratingHashtags ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Hash className="h-3 w-3 mr-2" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {suggestedHashtags.length > 0 && (
                        <div className="p-4 rounded-lg border space-y-2">
                          <p className="text-sm font-medium">Suggested Hashtags</p>
                          <div className="flex flex-wrap gap-2">
                            {suggestedHashtags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant={hashtags.includes(tag) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => handleToggleHashtag(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {hashtags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Ideas Generation */}
              <TabsContent value="ideas" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Generate Content Ideas
                    </CardTitle>
                    <CardDescription>
                      Get AI-powered content ideas for your LinkedIn campaigns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ideasIndustry">Industry *</Label>
                        <Input
                          id="ideasIndustry"
                          placeholder="e.g., Technology, Healthcare"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ideasAudience">Target Audience *</Label>
                        <Input
                          id="ideasAudience"
                          placeholder="e.g., Marketing professionals"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerateIdeas}
                      disabled={isGeneratingIdeas || !industry || !targetAudience}
                      className="w-full"
                    >
                      {isGeneratingIdeas ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating Ideas...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Generate Content Ideas
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {contentIdeas.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contentIdeas.map((idea, index) => (
                      <Card 
                        key={index} 
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleSelectIdea(idea)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{idea.title}</CardTitle>
                            <Badge variant="outline">{idea.type}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground">{idea.description}</p>
                          {idea.key_points && (
                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                              {idea.key_points.map((point: string, i: number) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          )}
                          <Badge 
                            variant="secondary" 
                            className={
                              idea.estimated_engagement === 'high' ? 'bg-green-500/20 text-green-500' :
                              idea.estimated_engagement === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-gray-500/20 text-gray-500'
                            }
                          >
                            {idea.estimated_engagement} engagement
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Full Campaign Generation */}
              <TabsContent value="campaign" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Generate Complete Campaign
                    </CardTitle>
                    <CardDescription>
                      Generate a multi-post campaign strategy with AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaignGoal">Campaign Goal *</Label>
                      <Input
                        id="campaignGoal"
                        placeholder="e.g., Increase brand awareness, Generate leads"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="campaignIndustry">Industry *</Label>
                        <Input
                          id="campaignIndustry"
                          placeholder="e.g., Technology"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="campaignAudience">Target Audience *</Label>
                        <Input
                          id="campaignAudience"
                          placeholder="e.g., Business owners"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerateCompleteCampaign}
                      disabled={isGeneratingCampaign || !aiTopic || !industry || !targetAudience}
                      className="w-full"
                    >
                      {isGeneratingCampaign ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating Campaign...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Generate Complete Campaign
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {campaignPlan && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{campaignPlan.campaign_overview?.name}</CardTitle>
                      <CardDescription>{campaignPlan.campaign_overview?.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {campaignPlan.campaign_overview?.kpis && (
                        <div>
                          <p className="text-sm font-medium mb-2">Key Performance Indicators:</p>
                          <div className="flex flex-wrap gap-2">
                            {campaignPlan.campaign_overview.kpis.map((kpi: string, index: number) => (
                              <Badge key={index} variant="secondary">{kpi}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <p className="text-sm font-medium">Campaign Posts ({campaignPlan.posts?.length || 0}):</p>
                        {campaignPlan.posts?.map((post: any, index: number) => (
                          <Card key={index}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Post #{post.post_number}</CardTitle>
                                <Badge variant="outline">
                                  {post.schedule?.day} @ {post.schedule?.time}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                              <div className="flex flex-wrap gap-2">
                                {post.hashtags?.map((tag: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                              {post.media_suggestion && (
                                <p className="text-xs text-muted-foreground">
                                  📷 {post.media_suggestion}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {campaignPlan.tips && campaignPlan.tips.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Pro Tips:</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                            {campaignPlan.tips.map((tip: string, index: number) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <Button
                          variant="outline"
                          onClick={handleSaveCampaignAsDrafts}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save All as Drafts"
                          )}
                        </Button>
                        <Button
                          onClick={handleScheduleFullCampaign}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Scheduling...
                            </>
                          ) : (
                            <>
                              <Calendar className="h-4 w-4 mr-2" />
                              Save & Schedule All
                            </>
                          )}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
