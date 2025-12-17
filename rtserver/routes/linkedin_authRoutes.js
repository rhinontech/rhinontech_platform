const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const linkedInAuthController = require('../controllers/linkedin_authController');

/**
 * @route GET /api/linkedin/auth
 * @desc Initiate LinkedIn OAuth flow
 * @access Private
 */
router.get(
  '/auth',
  verifyToken,
  linkedInAuthController.initiateLinkedInAuth
);

/**
 * @route GET /api/linkedin/callback
 * @desc Handle LinkedIn OAuth callback
 * @access Public (LinkedIn redirects here)
 */
router.get(
  '/callback',
  linkedInAuthController.handleLinkedInCallback
);

/**
 * @route GET /api/linkedin/status
 * @desc Get LinkedIn connection status
 * @access Private
 */
router.get(
  '/status',
  verifyToken,
  linkedInAuthController.getLinkedInStatus
);

/**
 * @route POST /api/linkedin/disconnect
 * @desc Disconnect LinkedIn account
 * @access Private
 */
router.post(
  '/disconnect',
  verifyToken,
  linkedInAuthController.disconnectLinkedIn
);

/**
 * @route POST /api/linkedin/refresh-token
 * @desc Refresh LinkedIn access token
 * @access Private
 */
router.post(
  '/refresh-token',
  verifyToken,
  linkedInAuthController.refreshLinkedInToken
);

module.exports = router;
