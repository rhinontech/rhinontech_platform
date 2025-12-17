import { useEffect, useRef, useState } from "react";
import {
  updateOrCreateUser,
  getUser,
} from "@/services/settings/accountServices";
import { getNewAccessToken as getNewGoogleAccessToken } from "@/services/settings/googleServices";
import { getNewMicrosoftAccessToken } from "@/services/settings/outlookServices";

type Provider = "GOOGLE" | "MICROSOFT";

export function useTokenManager(
  provider: Provider,
  onAccessTokenUpdate: (token: string) => void
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const fetchTokenFromDB = async () => {
    try {
      const res = await getUser({ provider });
      const data = res?.data;

      if (data?.refresh_token && data?.expires_in && data?.access_token) {
        const expiresAt = new Date(data.expires_in).getTime();

        setRefreshToken(data.refresh_token);
        setExpiry(data.expires_in);
        setAccessToken(data.access_token);

        // If token is still valid → immediately use it
        if (expiresAt > Date.now()) {
          onAccessTokenUpdate(data.access_token);
          scheduleRefresh(data.expires_in);
        } else {
          // expired → refresh immediately
          doRefresh(data.refresh_token);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${provider} token from DB`, err);
    }
  };

  const doRefresh = async (manualRefreshToken?: string) => {
    const tokenToUse = manualRefreshToken || refreshToken;
    if (!tokenToUse) return;

    try {
      let refreshed;
      if (provider === "GOOGLE") {
        refreshed = await getNewGoogleAccessToken(tokenToUse);
      } else {
        refreshed = await getNewMicrosoftAccessToken(tokenToUse);
      }

      if (refreshed?.access_token) {
        onAccessTokenUpdate(refreshed.access_token);
        await updateOrCreateUser(refreshed);

        const expiresInSec = Number(refreshed.expires_in) || 3600;
        const newExpiry = new Date(
          Date.now() + expiresInSec * 1000
        ).toISOString();

        setRefreshToken(refreshed.refresh_token || tokenToUse);
        setExpiry(newExpiry);
        setAccessToken(refreshed.access_token);

        scheduleRefresh(newExpiry);
      }
    } catch (err) {
      console.error(`${provider} token refresh failed`, err);
    }
  };

  const scheduleRefresh = (expiryISO: string) => {
    if (!expiryISO) return;
    const expiryTime = new Date(expiryISO).getTime();
    const delay = Math.max(expiryTime - Date.now() - 60 * 1000, 0); // 1 min before expiry

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doRefresh(), delay);
  };

  useEffect(() => {
    fetchTokenFromDB();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
