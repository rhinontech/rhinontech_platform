"use client";

import { useEffect, useState } from "react";
import { connectWhatsAppAccount } from "@/services/settings/whatsappServices";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface EmbeddedSignupProps {
  onSuccess?: (account: any) => void;
  onError?: (error: string) => void;
}

export default function EmbeddedSignup({
  onSuccess,
  onError,
}: EmbeddedSignupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "2354391968251323";
  const CONFIG_ID =
    process.env.NEXT_PUBLIC_WHATSAPP_CONFIG_ID || "988718802681268";

  // Initialize Facebook SDK
  useEffect(() => {
    // Check if SDK already loaded
    if (window.FB) {
      console.log("✅ Facebook SDK already loaded");
      setIsSdkLoaded(true);
      return;
    }

    // Check if script already exists
    if (document.getElementById("facebook-jssdk")) {
      console.log("⏳ Facebook SDK script exists, waiting for init...");
      return;
    }

    console.log("📦 Loading Facebook SDK...");

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v23.0",
      });
      console.log("✅ Facebook SDK initialized");
      setIsSdkLoaded(true);
    };

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";

    script.onerror = () => {
      console.error("❌ Failed to load Facebook SDK");
      setError("Failed to load Facebook SDK. Please refresh the page.");
    };

    document.body.appendChild(script);
  }, [APP_ID]);

  // Listen for embedded signup PostMessage events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }

      try {
        let data = JSON.parse(event.data);

        // Handle array format
        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }

        console.log("📩 PostMessage received:", data);

        if (data.type === "WA_EMBEDDED_SIGNUP") {
          if (data.event === "FINISH") {
            const phoneNumberId = data.data?.phone_number_id;
            const wabaId = data.data?.waba_id;
            const business_id = data.data?.business_id;

            console.log("✅ Embedded signup completed");
            console.log("📱 Phone Number ID:", phoneNumberId);
            console.log("🏢 WABA ID:", wabaId);

            if (phoneNumberId && wabaId) {
              sessionStorage.setItem("wa_phone_number_id", phoneNumberId);
              sessionStorage.setItem("wa_waba_id", wabaId);
              sessionStorage.setItem("wa_business_id", business_id);
            }
          }
        }
      } catch (err) {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleConnect = async () => {
    if (!window.FB) {
      setError("Facebook SDK not loaded. Please refresh the page.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🚀 Starting embedded signup...");
      console.log("Config ID:", CONFIG_ID);

      window.FB.login(
        (response: any) => {
          handleLoginResponse(response);
        },
        {
          config_id: CONFIG_ID,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
            sessionInfoVersion: "3",
          },
        }
      );
    } catch (err: any) {
      console.error("❌ FB.login error:", err);
      setError(err.message || "Failed to start login");
      setIsLoading(false);
    }
  };

  const handleLoginResponse = async (response: any) => {
    console.log("📥 FB.login response:", response);

    if (!response.authResponse) {
      console.error("❌ No authResponse in FB.login");
      setError("Login failed. Please try again.");
      setIsLoading(false);
      return;
    }

    const code = response.authResponse.code;

    if (!code) {
      console.error("❌ No code in authResponse");
      setError("Failed to get authorization code.");
      setIsLoading(false);
      return;
    }

    console.log("✅ Got authorization code");
    console.log("⏳ Waiting for credentials...");

    // Wait for PostMessage with credentials
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const phoneNumberId = sessionStorage.getItem("wa_phone_number_id");
    const wabaId = sessionStorage.getItem("wa_waba_id");
    const businessId = sessionStorage.getItem("wa_business_id");

    console.log("📱 Final credentials:");
    console.log("- Phone Number ID:", phoneNumberId || "NOT FOUND");
    console.log("- WABA ID:", wabaId || "NOT FOUND");
    console.log("- Business ID:", businessId || "NOT FOUND");

    // Exchange code for account
    try {
      const result = await connectWhatsAppAccount({
        code,
        phone_number_id: phoneNumberId || undefined,
        waba_id: wabaId || undefined,
        business_id: businessId || undefined,
      });

      // Clear session storage
      sessionStorage.removeItem("wa_phone_number_id");
      sessionStorage.removeItem("wa_waba_id");
      sessionStorage.removeItem("wa_business_id");

      if (result.success) {
        console.log("✅ Account connected successfully");
        setSuccess(true);
        setIsLoading(false);
        onSuccess?.(result.account);
      } else {
        console.error("❌ Connection failed:", result.error);
        setError(result.error || "Failed to connect account");
        setIsLoading(false);
        onError?.(result.error || "Failed to connect account");
      }
    } catch (err: any) {
      console.error("❌ Exception during connection:", err);
      setError(err.message || "Connection failed");
      setIsLoading(false);
      onError?.(err.message || "Connection failed");
    }
  };

  if (success) {
    return (
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">WhatsApp Connected!</h2>
        <p className="text-gray-600">
          Your WhatsApp Business account is now connected and ready to use.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="currentColor"
            viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.688" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect WhatsApp Business</h2>
        <p className="text-gray-600">
          Connect your WhatsApp Business account to start messaging your
          customers
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!isSdkLoaded && !error && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">Loading Facebook SDK...</p>
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={isLoading || !isSdkLoaded}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Connecting...
          </>
        ) : !isSdkLoaded ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Loading...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Connect with Facebook
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        By connecting, you agree to WhatsApp's Business Terms and Privacy Policy
      </p>
    </div>
  );
}
