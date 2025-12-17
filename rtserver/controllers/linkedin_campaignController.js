const { linkedin_campaigns } = require('../models');
const { Op } = require('sequelize');
const linkedInAuthController = require('./linkedin_authController');

/**
 * Create a new LinkedIn campaign
 */
exports.createLinkedInCampaign = async (req, res) => {
  try {
    const {
      campaign_name,
      campaign_description,
      campaign_type,
      content,
      media_urls,
      hashtags,
      target_audience,
      scheduled_time,
      is_sponsored,
      budget,
      call_to_action,
      cta_link
    } = req.body;

    const { organization_id, user_id } = req.user;

    // Validation
    if (!campaign_name || !content) {
      return res.status(400).json({
        success: false,
        message: 'Campaign name and content are required'
      });
    }

    const newCampaign = await linkedin_campaigns.create({
      organization_id,
      user_id,
      campaign_name,
      campaign_description,
      campaign_type: campaign_type || 'post',
      content,
      media_urls: media_urls || [],
      hashtags: hashtags || [],
      target_audience: target_audience || {},
      scheduled_time,
      is_sponsored: is_sponsored || false,
      budget,
      call_to_action,
      cta_link,
      status: scheduled_time ? 'scheduled' : 'draft'
    });

    res.status(201).json({
      success: true,
      message: 'LinkedIn campaign created successfully',
      data: newCampaign
    });
  } catch (error) {
    console.error('Error creating LinkedIn campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create LinkedIn campaign',
      error: error.message
    });
  }
};

/**
 * Bulk create LinkedIn campaigns
 */
exports.bulkCreateLinkedInCampaigns = async (req, res) => {
  try {
    const { campaigns } = req.body;
    const { organization_id, user_id } = req.user;

    if (!campaigns || !Array.isArray(campaigns) || campaigns.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Campaigns array is required and must not be empty'
      });
    }

    // Prepare campaigns with org and user info
    const campaignsToCreate = campaigns.map(campaign => ({
      ...campaign,
      organization_id,
      user_id,
      campaign_type: campaign.campaign_type || 'post',
      media_urls: campaign.media_urls || [],
      hashtags: campaign.hashtags || [],
      target_audience: campaign.target_audience || {},
      is_sponsored: campaign.is_sponsored || false,
      status: campaign.scheduled_time ? 'scheduled' : 'draft'
    }));

    const createdCampaigns = await linkedin_campaigns.bulkCreate(campaignsToCreate);

    res.status(201).json({
      success: true,
      message: `${createdCampaigns.length} LinkedIn campaigns created successfully`,
      data: createdCampaigns
    });
  } catch (error) {
    console.error('Error bulk creating LinkedIn campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create LinkedIn campaigns',
      error: error.message
    });
  }
};

/**
 * Get all LinkedIn campaigns for an organization
 */
exports.getAllLinkedInCampaigns = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { status, campaign_type, page = 1, limit = 10, search } = req.query;

    const whereClause = { organization_id };

    if (status) {
      whereClause.status = status;
    }

    if (campaign_type) {
      whereClause.campaign_type = campaign_type;
    }

    if (search) {
      whereClause[Op.or] = [
        { campaign_name: { [Op.like]: `%${search}%` } },
        { campaign_description: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: campaigns } = await linkedin_campaigns.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: campaigns,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching LinkedIn campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch LinkedIn campaigns',
      error: error.message
    });
  }
};

/**
 * Get a single LinkedIn campaign by ID
 */
exports.getLinkedInCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const campaign = await linkedin_campaigns.findOne({
      where: { id, organization_id }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'LinkedIn campaign not found'
      });
    }

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error fetching LinkedIn campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch LinkedIn campaign',
      error: error.message
    });
  }
};

/**
 * Update a LinkedIn campaign
 */
exports.updateLinkedInCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const updateData = req.body;

    const campaign = await linkedin_campaigns.findOne({
      where: { id, organization_id }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'LinkedIn campaign not found'
      });
    }

    // Don't allow updating published campaigns
    if (campaign.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a published campaign'
      });
    }

    await campaign.update(updateData);

    res.status(200).json({
      success: true,
      message: 'LinkedIn campaign updated successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Error updating LinkedIn campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update LinkedIn campaign',
      error: error.message
    });
  }
};

/**
 * Delete a LinkedIn campaign
 */
exports.deleteLinkedInCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const campaign = await linkedin_campaigns.findOne({
      where: { id, organization_id }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'LinkedIn campaign not found'
      });
    }

    // Don't allow deleting published campaigns
    if (campaign.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a published campaign. Cancel it first.'
      });
    }

    await campaign.destroy();

    res.status(200).json({
      success: true,
      message: 'LinkedIn campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting LinkedIn campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete LinkedIn campaign',
      error: error.message
    });
  }
};

/**
 * Publish a LinkedIn campaign immediately
 */
exports.publishLinkedInCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const campaign = await linkedin_campaigns.findOne({
      where: { id, organization_id }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'LinkedIn campaign not found'
      });
    }

    if (campaign.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is already published'
      });
    }

    // Post to LinkedIn using the OAuth token
    const postResult = await linkedInAuthController.postToLinkedIn(
      organization_id,
      req.user.user_id,
      {
        content: campaign.content,
        media_urls: campaign.media_urls || []
      }
    );

    await campaign.update({
      status: 'published',
      linkedin_post_id: postResult.postId,
      published_at: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'LinkedIn campaign published successfully',
      data: campaign,
      linkedin_response: postResult
    });
  } catch (error) {
    console.error('Error publishing LinkedIn campaign:', error);
    
    // Update campaign status to failed
    if (req.params.id) {
      await linkedin_campaigns.update(
        { 
          status: 'failed',
          error_message: error.message 
        },
        { where: { id: req.params.id } }
      );
    }

    res.status(500).json({
      success: false,
      message: 'Failed to publish LinkedIn campaign',
      error: error.message
    });
  }
};

/**
 * Schedule a LinkedIn campaign for future posting
 */
exports.scheduleLinkedInCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_time } = req.body;
    const { organization_id } = req.user;

    if (!scheduled_time) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time is required'
      });
    }

    const scheduledDate = new Date(scheduled_time);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future'
      });
    }

    const campaign = await linkedin_campaigns.findOne({
      where: { id, organization_id }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'LinkedIn campaign not found'
      });
    }

    if (campaign.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a published campaign'
      });
    }

    await campaign.update({
      scheduled_time: scheduledDate,
      status: 'scheduled'
    });

    res.status(200).json({
      success: true,
      message: 'LinkedIn campaign scheduled successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Error scheduling LinkedIn campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule LinkedIn campaign',
      error: error.message
    });
  }
};

/**
 * Cancel a scheduled LinkedIn campaign
 */
exports.cancelLinkedInCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const campaign = await linkedin_campaigns.findOne({
      where: { id, organization_id }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'LinkedIn campaign not found'
      });
    }

    if (campaign.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a published campaign'
      });
    }

    await campaign.update({
      status: 'cancelled',
      scheduled_time: null
    });

    res.status(200).json({
      success: true,
      message: 'LinkedIn campaign cancelled successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Error cancelling LinkedIn campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel LinkedIn campaign',
      error: error.message
    });
  }
};

/**
 * Update engagement metrics for a campaign
 */
exports.updateLinkedInCampaignMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { engagement_metrics } = req.body;

    const campaign = await linkedin_campaigns.findOne({
      where: { id, organization_id }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'LinkedIn campaign not found'
      });
    }

    await campaign.update({
      engagement_metrics
    });

    res.status(200).json({
      success: true,
      message: 'Campaign metrics updated successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Error updating campaign metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campaign metrics',
      error: error.message
    });
  }
};

/**
 * Get campaign analytics/statistics
 */
exports.getLinkedInCampaignAnalytics = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { start_date, end_date } = req.query;

    const whereClause = { organization_id };

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const campaigns = await linkedin_campaigns.findAll({
      where: whereClause
    });

    // Calculate statistics
    const totalCampaigns = campaigns.length;
    const publishedCampaigns = campaigns.filter(c => c.status === 'published').length;
    const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length;
    const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;
    const failedCampaigns = campaigns.filter(c => c.status === 'failed').length;

    let totalEngagement = {
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
      clicks: 0
    };

    campaigns.forEach(campaign => {
      if (campaign.engagement_metrics) {
        totalEngagement.likes += campaign.engagement_metrics.likes || 0;
        totalEngagement.comments += campaign.engagement_metrics.comments || 0;
        totalEngagement.shares += campaign.engagement_metrics.shares || 0;
        totalEngagement.impressions += campaign.engagement_metrics.impressions || 0;
        totalEngagement.clicks += campaign.engagement_metrics.clicks || 0;
      }
    });

    const totalBudget = campaigns.reduce((sum, c) => sum + (parseFloat(c.budget) || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalCampaigns,
        publishedCampaigns,
        scheduledCampaigns,
        draftCampaigns,
        failedCampaigns,
        totalEngagement,
        totalBudget,
        averageEngagementRate: publishedCampaigns > 0 
          ? ((totalEngagement.likes + totalEngagement.comments + totalEngagement.shares) / publishedCampaigns).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign analytics',
      error: error.message
    });
  }
};

/**
 * Duplicate a LinkedIn campaign
 */
exports.duplicateLinkedInCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, user_id } = req.user;

    const originalCampaign = await linkedin_campaigns.findOne({
      where: { id, organization_id }
    });

    if (!originalCampaign) {
      return res.status(404).json({
        success: false,
        message: 'LinkedIn campaign not found'
      });
    }

    const duplicatedCampaign = await linkedin_campaigns.create({
      organization_id,
      user_id,
      campaign_name: `${originalCampaign.campaign_name} (Copy)`,
      campaign_description: originalCampaign.campaign_description,
      campaign_type: originalCampaign.campaign_type,
      content: originalCampaign.content,
      media_urls: originalCampaign.media_urls,
      hashtags: originalCampaign.hashtags,
      target_audience: originalCampaign.target_audience,
      is_sponsored: originalCampaign.is_sponsored,
      budget: originalCampaign.budget,
      call_to_action: originalCampaign.call_to_action,
      cta_link: originalCampaign.cta_link,
      status: 'draft'
    });

    res.status(201).json({
      success: true,
      message: 'LinkedIn campaign duplicated successfully',
      data: duplicatedCampaign
    });
  } catch (error) {
    console.error('Error duplicating LinkedIn campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate LinkedIn campaign',
      error: error.message
    });
  }
};
