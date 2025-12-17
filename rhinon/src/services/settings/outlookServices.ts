// outlookServices.ts - Frontend Service

import axios from "axios";

// Browser-compatible PKCE implementation
function base64URLEncode(str: ArrayBuffer): string {
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(str))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array.buffer);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64URLEncode(digest);
}

interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
}

async function generatePKCE(): Promise<PKCEParams> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

const tokenRequest = {
  scopes: [
    "openid",
    "profile",
    "offline_access",
    "User.Read",
    "Mail.Send",
    "Directory.Read.All",
    "Directory.ReadWrite.All",
    "Mail.ReadWrite",
    "Mail.Read"
  ],
};

const PKCE_STORAGE_KEY = "outlook_pkce_params";

export const getUserTokensFromOutlook = async (token: string, path: string) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/get_outlook_token`;

  // Get stored PKCE params
  const storedParams = sessionStorage.getItem(PKCE_STORAGE_KEY);
  if (!storedParams) {
    throw new Error("PKCE parameters not found");
  }

  const pkceParams = JSON.parse(storedParams);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: token,
        redirectURI: String(process.env.NEXT_PUBLIC_BASE_URL) + path,
        codeVerifier: pkceParams.codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // Clear PKCE params after successful use
    sessionStorage.removeItem(PKCE_STORAGE_KEY);

    return data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const getAuthorizationUrl = async (path: string): Promise<string> => {
  // Generate new PKCE parameters
  const pkceParams = await generatePKCE();

  // Store PKCE params in sessionStorage
  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(pkceParams));

  const params = new URLSearchParams({
    client_id: String(process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID),
    response_type: "code",
    redirect_uri: String(process.env.NEXT_PUBLIC_BASE_URL) + path,
    scope: tokenRequest.scopes.join(" "),
    code_challenge: pkceParams.codeChallenge,
    code_challenge_method: "S256",
    state: "12345",
    prompt: "login",
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
};

export const getNewMicrosoftAccessToken = async (refreshToken: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/get_outlook_refresh_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to refresh Microsoft token");
    }

    const data = await response.json();

    return {
      provider: "MICROSOFT" as const,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? refreshToken,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
      id_token: data.id_token,
    };
  } catch (error) {
    console.error("Error refreshing Microsoft access token:", error);
    return null;
  }
};

export const getMicrosoftUserInfo = async (access_token: string) => {
  try {
    // 1. Get profile
    const profileResponse = await axios.get(
      "https://graph.microsoft.com/v1.0/me?$select=id,displayName,givenName,surname,mail,userPrincipalName",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const profile = profileResponse.data;

    // 2. Get photo and convert to base64
    let picture: string | null = null;
    try {
      const photoResponse = await axios.get(
        "https://graph.microsoft.com/v1.0/me/photo/$value",
        {
          headers: { Authorization: `Bearer ${access_token}` },
          responseType: "arraybuffer",
        }
      );

      const mimeType = photoResponse.headers["content-type"]; // usually "image/jpeg"
      const base64 = Buffer.from(photoResponse.data, "binary").toString(
        "base64"
      );

      picture = `data:${mimeType};base64,${base64}`;
    } catch (err: any) {
      if (err.response?.status === 404) {
        console.warn("User has no profile photo set");
      } else {
        console.error("Error fetching Microsoft user photo:", err);
      }
    }

    // 3. Return Google-style JSON
    return {
      //   sub: profile.id,
      name: profile.displayName,
      //   given_name: profile.givenName,
      //   family_name: profile.surname,
      email: profile.mail || profile.userPrincipalName,
      //   email_verified: true, // Graph doesn’t expose this
      picture, // Base64 string (usable directly in <img src="..." />)
    };
  } catch (error) {
    console.error("Error fetching Microsoft user info:", error);
    throw error;
  }
};
