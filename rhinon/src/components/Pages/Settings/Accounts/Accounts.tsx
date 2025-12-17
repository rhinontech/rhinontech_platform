"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { Button } from "@/components/ui/button";
import {
  getGoogleUserInfo,
  getUserTokensFromGoogle,
} from "@/services/settings/googleServices";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  deleteUser,
  getUser,
  IAuthProvider,
  updateOrCreateUser,
} from "@/services/settings/accountServices";
import {
  GoogleIcon,
  MicrosoftIcon,
  LinkedInIcon,
} from "@/components/Constants/SvgIcons";
import Loader from "@/components/Common/Loader/Loader";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getAuthorizationUrl,
  getMicrosoftUserInfo,
  getUserTokensFromOutlook,
} from "@/services/settings/outlookServices";
import {
  getLinkedInAuthUrl,
  getLinkedInStatus,
  disconnectLinkedIn,
} from "@/services/settings/linkedinServices";
import { toast } from "sonner";
import { useTokenManager } from "@/hooks/userTokenManager";
import Cookies from "js-cookie";
interface Account {
  name: string;
  email: string;
  picture: string | null;
}
export default function Accounts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggleSettingSidebar } = useSidebar();
  const [googleAccount, setGoogleAccount] = useState<Account | null>(null);
  const [microsoftAccount, setMicrosoftAccount] = useState<Account | null>(
    null
  );
  const [linkedinAccount, setLinkedinAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [googleRefreshToken, setGoogleRefreshToken] = useState<string | null>(
    null
  );
  const [microsoftRefreshToken, setMicrosoftRefreshToken] = useState<
    string | null
  >(null);
  const [googleExpiry, setGoogleExpiry] = useState<string | null>(null);
  const [microsoftExpiry, setMicrosoftExpiry] = useState<string | null>(null);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [linkedinExpiry, setLinkedinExpiry] = useState<string | null>(null);

  const role = Cookies.get("currentRole");
  // Start token managers
  useTokenManager("GOOGLE", () => console.log("Google token updated"));
  useTokenManager("MICROSOFT", () => console.log("Microsoft token updated"));

  // Google OAuth
  const handleGoogleConnect = () => {
    const loadGoogleAPI = async () => {
      const { gapi } = await import("gapi-script");
      const auth2 = gapi.auth2.getAuthInstance();
      auth2.grantOfflineAccess().then((res: any) => {
        getUserTokenDataFn(res.code);
      });
    };
    loadGoogleAPI();
  };

  // Google
  const getUserTokenDataFn = async (code: string) => {
    try {
      const data = await getUserTokensFromGoogle(code);
      const account = await getGoogleUserInfo(data.access_token);
      setGoogleAccount(account);

      // Convert expires_in to ISO string if needed
      const expiry =
        typeof data.expires_in === "number"
          ? new Date(Date.now() + data.expires_in * 1000).toISOString()
          : data.expires_in;

      // Store tokens in state + localStorage
      setGoogleRefreshToken(data.refresh_token);
      setGoogleExpiry(expiry);
      localStorage.setItem("googleRefreshToken", data.refresh_token);
      localStorage.setItem("googleTokenExpiry", expiry);

      await updateOrCreateUser({ ...data, provider: "GOOGLE" });
    } catch (error) {
      console.error("Google token error:", error);
    }
  };

  // Microsoft OAuth
  const handleOutlookConnect = async () => {
    try {
      const path = "/role/settings/accounts";
      const authorizationUrl = await getAuthorizationUrl(path);
      router.push(authorizationUrl);
    } catch (error) {
      console.error("Error generating authorization URL:", error);
    }
  };

  const exchangeCodeForToken = async () => {
    try {
      setIsLoading(true); // start loading
      const path = `/role/settings/accounts`;
      const authCode = searchParams.get("code");
      const state = searchParams.get("state");

      if (!authCode || state !== "12345") {
        setIsLoading(false);
        return;
      }

      const data = await getUserTokensFromOutlook(authCode, path);
      const account = await getMicrosoftUserInfo(data.access_token);
      setMicrosoftAccount(account);

      const expiry =
        typeof data.expires_in === "number"
          ? new Date(Date.now() + data.expires_in * 1000).toISOString()
          : data.expires_in;

      setMicrosoftRefreshToken(data.refresh_token);
      setMicrosoftExpiry(expiry);
      localStorage.setItem("microsoftRefreshToken", data.refresh_token);
      localStorage.setItem("microsoftTokenExpiry", expiry);

      await updateOrCreateUser({ ...data, provider: "MICROSOFT" });

      //  Refresh UI by re-fetching all accounts
      await getUserFn();
    } catch (error) {
      console.error("Microsoft token error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // LinkedIn OAuth
  const handleLinkedInConnect = async () => {
    try {
      const response = await getLinkedInAuthUrl();
      if (response.success && response.authUrl) {
        window.location.href = response.authUrl;
      }
    } catch (error) {
      console.error("Error initiating LinkedIn auth:", error);
      toast.error("Failed to connect LinkedIn");
    }
  };

  // Check LinkedIn connection on load
  const checkLinkedInStatus = async () => {
    try {
      const response = await getLinkedInStatus();
      if (response.success && response.connected) {
        setLinkedinConnected(true);
        setLinkedinExpiry(response.expiresAt);
        if (response.profile) {
          setLinkedinAccount({
            name:
              response.profile.name ||
              response.profile.given_name + " " + response.profile.family_name,
            email: response.profile.email,
            picture: response.profile.picture || null,
          });
        }
      } else {
        setLinkedinConnected(false);
        setLinkedinAccount(null);
      }
    } catch (error) {
      console.error("Error checking LinkedIn status:", error);
      setLinkedinConnected(false);
      setLinkedinAccount(null);
    }
  };

  // Disconnect LinkedIn
  const handleLinkedInDisconnect = async () => {
    try {
      await disconnectLinkedIn();
      setLinkedinConnected(false);
      setLinkedinAccount(null);
      setLinkedinExpiry(null);
      toast.success("LinkedIn account disconnected");
    } catch (error) {
      console.error("Error disconnecting LinkedIn:", error);
      toast.error("Failed to disconnect LinkedIn");
    }
  };

  // Delete account
  const deleteUserFn = async (provider: "GOOGLE" | "MICROSOFT") => {
    try {
      await deleteUser(provider);
      if (provider === "GOOGLE") {
        setGoogleAccount(null);
        setGoogleRefreshToken(null);
        setGoogleExpiry(null);
        localStorage.removeItem("googleRefreshToken");
        localStorage.removeItem("googleTokenExpiry");
      } else {
        setMicrosoftAccount(null);
        setMicrosoftRefreshToken(null);
        setMicrosoftExpiry(null);
        localStorage.removeItem("microsoftRefreshToken");
        localStorage.removeItem("microsoftTokenExpiry");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Load accounts
  const getUserFn = async () => {
    setIsLoading(true);
    try {
      const [googleRes, msRes] = await Promise.allSettled([
        getUser({ provider: "GOOGLE" }),
        getUser({ provider: "MICROSOFT" }),
      ]);

      // --- GOOGLE ---
      if (
        googleRes.status === "fulfilled" &&
        googleRes.value?.data?.access_token
      ) {
        const account = await getGoogleUserInfo(
          googleRes.value.data.access_token
        );
        setGoogleAccount(account);
        setGoogleRefreshToken(localStorage.getItem("googleRefreshToken"));
        setGoogleExpiry(localStorage.getItem("googleTokenExpiry"));
      } else {
        setGoogleAccount(null);
      }

      // --- MICROSOFT ---
      if (msRes.status === "fulfilled" && msRes.value?.data?.access_token) {
        const account = await getMicrosoftUserInfo(
          msRes.value.data.access_token
        );
        setMicrosoftAccount(account);
        setMicrosoftRefreshToken(localStorage.getItem("microsoftRefreshToken"));
        setMicrosoftExpiry(localStorage.getItem("microsoftTokenExpiry"));
      } else {
        setMicrosoftAccount(null);
      }

      // --- LINKEDIN ---
      await checkLinkedInStatus();
    } catch (err) {
      console.error("Unexpected error in getUserFn:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { gapi } = await import("gapi-script");
      gapi.load("client:auth2", {
        callback: () => {
          gapi.auth2.init({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID,
            scope: process.env.NEXT_PUBLIC_GOOGLE_SCOPE,
          });
        },
      });

      const code = searchParams.get("code");
      const success = searchParams.get("success");
      const provider = searchParams.get("provider");

      if (success === "true" && provider === "linkedin") {
        // LinkedIn callback
        toast.success("LinkedIn connected successfully!");
        await getUserFn();
        router.replace(`/${role}/settings/accounts`);
      } else if (code) {
        // Microsoft callback
        await exchangeCodeForToken();
        router.replace(`/${role}/settings/accounts`);
      } else {
        await getUserFn();
      }
    };

    init();
  }, [searchParams]);

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b h-[60px] p-4">
          <div className="flex items-center gap-4">
            <PanelLeft onClick={toggleSettingSidebar} className="h-4 w-4" />
            <h2 className="text-base font-bold">Accounts</h2>
          </div>
        </div>
        {isLoading ? (
          <Loader />
        ) : (
          <ScrollArea className="flex-1 h-0 p-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your email accounts to send tickets and sync calendar
                  events. Each account can be managed independently.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <GoogleIcon />
                    Google Account
                  </h3>
                  {!googleAccount && (
                    <Button
                      onClick={handleGoogleConnect}
                      size="sm"
                      variant="outline">
                      Connect Google
                    </Button>
                  )}
                </div>

                {googleAccount ? (
                  <Card className="py-5">
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            {googleAccount?.picture ? (
                              <img
                                src={googleAccount.picture}
                                alt="User"
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <AvatarFallback className="bg-muted">
                                {googleAccount?.name
                                  ?.charAt(0)
                                  ?.toUpperCase() ?? "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>

                          <div>
                            <p className="text-sm font-medium">
                              {googleAccount.email}
                            </p>
                          </div>
                        </div>
                        {googleAccount && (
                          <Button
                            onClick={() => deleteUserFn("GOOGLE")}
                            size="sm"
                            variant="outline">
                            Disconnect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed py-5">
                    <CardContent>
                      <p className="text-sm text-muted-foreground text-center">
                        No Google account connected
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <MicrosoftIcon />
                    Microsoft Account
                  </h3>
                  {!microsoftAccount && (
                    <Button
                      onClick={handleOutlookConnect}
                      size="sm"
                      variant="outline">
                      Connect Microsoft
                    </Button>
                  )}
                </div>

                {microsoftAccount ? (
                  <Card className="py-5">
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            {microsoftAccount?.picture ? (
                              <img
                                src={microsoftAccount.picture}
                                alt="User"
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <AvatarFallback className="bg-muted">
                                {microsoftAccount?.name
                                  ?.charAt(0)
                                  ?.toUpperCase() ?? "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {microsoftAccount.email}
                            </p>
                          </div>
                        </div>
                        {microsoftAccount && (
                          <Button
                            onClick={() => deleteUserFn("MICROSOFT")}
                            size="sm"
                            variant="outline">
                            Disconnect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed py-5">
                    <CardContent>
                      <p className="text-sm text-muted-foreground text-center">
                        No Microsoft account connected
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <LinkedInIcon />
                    LinkedIn Account
                  </h3>
                  {!linkedinConnected && (
                    <Button
                      onClick={handleLinkedInConnect}
                      size="sm"
                      variant="outline">
                      Connect LinkedIn
                    </Button>
                  )}
                </div>

                {linkedinConnected && linkedinAccount ? (
                  <Card className="py-5">
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            {linkedinAccount?.picture ? (
                              <img
                                src={linkedinAccount.picture}
                                alt="User"
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <AvatarFallback className="bg-muted">
                                {linkedinAccount?.name
                                  ?.charAt(0)
                                  ?.toUpperCase() ?? "L"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {linkedinAccount.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {linkedinAccount.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleLinkedInDisconnect}
                          size="sm"
                          variant="outline">
                          Disconnect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed py-5">
                    <CardContent>
                      <p className="text-sm text-muted-foreground text-center">
                        No LinkedIn account connected
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div> */}

              {(googleAccount || microsoftAccount || linkedinConnected) && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Connected accounts can be used for email integration and
                    social media campaigns.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
