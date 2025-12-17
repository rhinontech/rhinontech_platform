const { linkedin_tokens } = require('../models');
const axios = require('axios');

/**
 * Initiate LinkedIn OAuth flow
 */
exports.initiateLinkedInAuth = async (req, res) => {
  try {
    const { organization_id, user_id } = req.user;
    
    const state = Buffer.from(JSON.stringify({ 
      organization_id, 
      user_id,
      timestamp: Date.now() 
    })).toString('base64');

    const scope = 'openid profile email w_member_social'; // Updated to v2 API scopes
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scope)}`;

    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to this URL for LinkedIn authentication'
    });
  } catch (error) {
    console.error('Error initiating LinkedIn auth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate LinkedIn authentication',
      error: error.message
    });
  }
};

/**
 * Handle LinkedIn OAuth callback
 */
exports.handleLinkedInCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.redirect(
        `${process.env.FRONT_END_URL}/superadmin/settings/accounts?error=${error}&message=${error_description}`
      );
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization code or state'
      });
    }

    // Decode state to get user info
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { organization_id, user_id } = stateData;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in, refresh_token, scope: tokenScope } = tokenResponse.data;

    // Get LinkedIn user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const linkedinProfile = profileResponse.data;

    // Calculate expiry timestamp
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Deactivate old tokens for this user
    await linkedin_tokens.update(
      { is_active: false },
      { where: { organization_id, user_id } }
    );

    // Store new token
    await linkedin_tokens.create({
      organization_id,
      user_id,
      access_token,
      refresh_token: refresh_token || null,
      token_type: 'Bearer',
      expires_in,
      expires_at: expiresAt,
      scope: tokenScope,
      linkedin_user_id: linkedinProfile.sub,
      linkedin_profile_data: linkedinProfile,
      is_active: true
    });

    // Redirect to success page
    res.redirect(
      `${process.env.FRONT_END_URL}/superadmin/settings/accounts?success=true&provider=linkedin`
    );
  } catch (error) {
    console.error('Error handling LinkedIn callback:', error.response?.data || error);
    res.redirect(
      `${process.env.FRONT_END_URL}/superadmin/settings/accounts?error=auth_failed&message=${encodeURIComponent(error.message)}`
    );
  }
};

/**
 * Get LinkedIn connection status
 */
exports.getLinkedInStatus = async (req, res) => {
  try {
    const { organization_id, user_id } = req.user;

    const token = await linkedin_tokens.findOne({
      where: {
        organization_id,
        user_id,
        is_active: true
      },
      order: [['created_at', 'DESC']]
    });

    if (!token) {
      return res.json({
        success: true,
        connected: false,
        message: 'LinkedIn not connected'
      });
    }

    // Check if token is expired
    const isExpired = new Date() >= new Date(token.expires_at);

    res.json({
      success: true,
      connected: !isExpired,
      profile: token.linkedin_profile_data,
      expiresAt: token.expires_at,
      isExpired
    });
  } catch (error) {
    console.error('Error getting LinkedIn status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get LinkedIn status',
      error: error.message
    });
  }
};

/**
 * Disconnect LinkedIn account
 */
exports.disconnectLinkedIn = async (req, res) => {
  try {
    const { organization_id, user_id } = req.user;

    await linkedin_tokens.update(
      { is_active: false },
      { where: { organization_id, user_id } }
    );

    res.json({
      success: true,
      message: 'LinkedIn account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting LinkedIn:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect LinkedIn account',
      error: error.message
    });
  }
};

/**
 * Refresh LinkedIn access token
 */
exports.refreshLinkedInToken = async (req, res) => {
  try {
    const { organization_id, user_id } = req.user;

    const token = await linkedin_tokens.findOne({
      where: {
        organization_id,
        user_id,
        is_active: true
      },
      order: [['created_at', 'DESC']]
    });

    if (!token || !token.refresh_token) {
      return res.status(404).json({
        success: false,
        message: 'No refresh token available. Please reconnect your LinkedIn account.'
      });
    }

    // Refresh the token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'refresh_token',
          refresh_token: token.refresh_token,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in, refresh_token } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Update token
    await token.update({
      access_token,
      refresh_token: refresh_token || token.refresh_token,
      expires_in,
      expires_at: expiresAt
    });

    res.json({
      success: true,
      message: 'LinkedIn token refreshed successfully',
      expiresAt
    });
  } catch (error) {
    console.error('Error refreshing LinkedIn token:', error.response?.data || error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh LinkedIn token',
      error: error.message
    });
  }
};

/**
 * Get valid LinkedIn access token (auto-refresh if expired)
 */
exports.getValidLinkedInToken = async (organization_id, user_id) => {
  try {
    const token = await linkedin_tokens.findOne({
      where: {
        organization_id,
        user_id,
        is_active: true
      },
      order: [['created_at', 'DESC']]
    });

    if (!token) {
      throw new Error('LinkedIn not connected. Please connect your LinkedIn account first.');
    }

    // Check if token is expired
    const isExpired = new Date() >= new Date(token.expires_at);

    if (isExpired) {
      if (!token.refresh_token) {
        throw new Error('LinkedIn token expired and no refresh token available. Please reconnect your LinkedIn account.');
      }

      // Auto-refresh token
      const tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        null,
        {
          params: {
            grant_type: 'refresh_token',
            refresh_token: token.refresh_token,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, expires_in, refresh_token } = tokenResponse.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      await token.update({
        access_token,
        refresh_token: refresh_token || token.refresh_token,
        expires_in,
        expires_at: expiresAt
      });

      return access_token;
    }

    return token.access_token;
  } catch (error) {
    console.error('Error getting valid LinkedIn token:', error);
    throw error;
  }
};

/**
 * Post to LinkedIn (utility function)
 */
exports.postToLinkedIn = async (organization_id, user_id, postData) => {
  try {
    const accessToken = await exports.getValidLinkedInToken(organization_id, user_id);

    // Get LinkedIn user ID
    const token = await linkedin_tokens.findOne({
      where: { organization_id, user_id, is_active: true },
      order: [['created_at', 'DESC']]
    });

    const linkedinUserId = token.linkedin_user_id;

    // Create post using LinkedIn API v2
    const postPayload = {
      author: `urn:li:person:${linkedinUserId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: postData.content
          },
          shareMediaCategory: postData.media_urls && postData.media_urls.length > 0 ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // Add media if present
    if (postData.media_urls && postData.media_urls.length > 0) {
      postPayload.specificContent['com.linkedin.ugc.ShareContent'].media = postData.media_urls.map(url => ({
        status: 'READY',
        originalUrl: url
      }));
    }

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      postPayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    return {
      success: true,
      postId: response.data.id,
      data: response.data
    };
  } catch (error) {
    console.error('Error posting to LinkedIn:', error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to post to LinkedIn');
  }
};
