const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const linkedInCampaignController = require('../controllers/linkedin_campaignController');

/**
 * @route POST /api/linkedin-campaigns
 * @desc Create a new LinkedIn campaign
 * @access Private
 */
router.post(
  '/',
  verifyToken,
  linkedInCampaignController.createLinkedInCampaign
);

/**
 * @route POST /api/linkedin-campaigns/bulk
 * @desc Bulk create LinkedIn campaigns
 * @access Private
 */
router.post(
  '/bulk',
  verifyToken,
  linkedInCampaignController.bulkCreateLinkedInCampaigns
);

/**
 * @route GET /api/linkedin-campaigns
 * @desc Get all LinkedIn campaigns for an organization
 * @access Private
 */
router.get(
  '/',
  verifyToken,
  linkedInCampaignController.getAllLinkedInCampaigns
);

/**
 * @route GET /api/linkedin-campaigns/analytics
 * @desc Get LinkedIn campaigns analytics
 * @access Private
 */
router.get(
  '/analytics',
  verifyToken,
  linkedInCampaignController.getLinkedInCampaignAnalytics
);

/**
 * @route GET /api/linkedin-campaigns/:id
 * @desc Get a single LinkedIn campaign by ID
 * @access Private
 */
router.get(
  '/:id',
  verifyToken,
  linkedInCampaignController.getLinkedInCampaignById
);

/**
 * @route PUT /api/linkedin-campaigns/:id
 * @desc Update a LinkedIn campaign
 * @access Private
 */
router.put(
  '/:id',
  verifyToken,
  linkedInCampaignController.updateLinkedInCampaign
);

/**
 * @route DELETE /api/linkedin-campaigns/:id
 * @desc Delete a LinkedIn campaign
 * @access Private
 */
router.delete(
  '/:id',
  verifyToken,
  linkedInCampaignController.deleteLinkedInCampaign
);

/**
 * @route POST /api/linkedin-campaigns/:id/publish
 * @desc Publish a LinkedIn campaign immediately
 * @access Private
 */
router.post(
  '/:id/publish',
  verifyToken,
  linkedInCampaignController.publishLinkedInCampaign
);

/**
 * @route POST /api/linkedin-campaigns/:id/schedule
 * @desc Schedule a LinkedIn campaign for future posting
 * @access Private
 */
router.post(
  '/:id/schedule',
  verifyToken,
  linkedInCampaignController.scheduleLinkedInCampaign
);

/**
 * @route POST /api/linkedin-campaigns/:id/cancel
 * @desc Cancel a scheduled LinkedIn campaign
 * @access Private
 */
router.post(
  '/:id/cancel',
  verifyToken,
  linkedInCampaignController.cancelLinkedInCampaign
);

/**
 * @route PUT /api/linkedin-campaigns/:id/metrics
 * @desc Update engagement metrics for a campaign
 * @access Private
 */
router.put(
  '/:id/metrics',
  verifyToken,
  linkedInCampaignController.updateLinkedInCampaignMetrics
);

/**
 * @route POST /api/linkedin-campaigns/:id/duplicate
 * @desc Duplicate a LinkedIn campaign
 * @access Private
 */
router.post(
  '/:id/duplicate',
  verifyToken,
  linkedInCampaignController.duplicateLinkedInCampaign
);

module.exports = router;
