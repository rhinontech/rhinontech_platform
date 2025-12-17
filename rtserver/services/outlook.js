const axios = require("axios");
const querystring = require("querystring");

const CLIENT_ID = process.env.CLIENT_ID;
const SCOPE = process.env.SCOPE;
const TOKEN_END_POINT = process.env.TOKEN_END_POINT;

module.exports.outlook = {
  getToken: async function (req, res) {
    const { code, redirectURI, codeVerifier } = req.body;

    console.log("Token request received:", {
      code: code ? "present" : "missing",
      redirectURI,
      codeVerifier: codeVerifier ? "present" : "missing",
    });

    try {
      const tokenParams = querystring.stringify({
        client_id: CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
        scope: SCOPE,
        redirect_uri: redirectURI,
        code_verifier: codeVerifier,
        grant_type: "authorization_code",
      });

      console.log("Making token request to Microsoft...");

      const tokenResponse = await axios.post(TOKEN_END_POINT, tokenParams, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      });

      const token = tokenResponse.data;
      console.log("Token exchange successful");
      res.send(token);
    } catch (error) {
      console.error("Token exchange error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      res.status(500).send({
        error: "Error exchanging authorization code for access token",
        details: error.response?.data || error.message,
      });
    }
  },

  refreshToken: async function (req, res) {
    try {
      const { refresh_token } = req.body;

      const tokenParams = querystring.stringify({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token,
        grant_type: "refresh_token",
        scope: SCOPE,
      });

      const tokenResponse = await axios.post(TOKEN_END_POINT, tokenParams, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      });

      res.send(tokenResponse.data);
    } catch (error) {
      console.error("Error refreshing Microsoft token:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      res.status(500).send({
        error: "Error refreshing Microsoft token",
        details: error.response?.data || error.message,
      });
    }
  },
};
