import axios from "axios";

const getNewAccessToken = async (refreshToken: string) => {
  const url = "https://www.googleapis.com/oauth2/v4/token";
  const body = new URLSearchParams();
  body.set("refresh_token", refreshToken);
  body.set("client_id", String(process.env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID));
  body.set("client_secret", String(process.env.NEXT_PUBLIC_GOOGLE_SECRET_KEY));
  body.set("grant_type", "refresh_token");

  const finalUrl = `${url}?${body.toString()}`;

  try {
    const response = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = await response.json();

    return {
      provider: "GOOGLE",
      access_token: data.access_token,
      id_token: data.id_token,
      refresh_token: refreshToken, // reuse old one
      scope: data.scope,
      token_type: data.token_type,
      expires_in: data.expires_in, // seconds
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return null;
  }
};

const getUserTokensFromGoogle = async (token: string) => {
  const url = "https://www.googleapis.com/oauth2/v4/token";

  const body = new URLSearchParams();
  body.set("code", token);
  body.set("client_id", String(process.env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID));
  body.set("client_secret", String(process.env.NEXT_PUBLIC_GOOGLE_SECRET_KEY));
  body.set("redirect_uri", String(process.env.NEXT_PUBLIC_BASE_URL));
  body.set("grant_type", "authorization_code");

  const finalUrl = `${url}?${body.toString()}`;

  try {
    const response = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = await response.json(); // Await the JSON parsing

    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};

const getGoogleUserInfo = async (access_token: string) => {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching Google user info:", error);
    throw error;
  }
};

export { getNewAccessToken, getUserTokensFromGoogle, getGoogleUserInfo };
