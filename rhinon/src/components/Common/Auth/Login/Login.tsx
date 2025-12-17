"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import { googleLogin, login, microsoftLogin } from "@/services/authServices";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// 👉 Import OAuth helpers
import { getAuthorizationUrl } from "@/services/settings/outlookServices";
import { GoogleIcon, MicrosoftIcon } from "@/components/Constants/SvgIcons";
import Loading from "@/app/loading";

export function Login({ className, ...props }: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get("email");
    setEmail(email || "");
  }, [searchParams]);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const provider = sessionStorage.getItem("oauth_provider");

    if (!code || !provider) return;

    if (provider === "microsoft") {
      handleMicrosoftCallback(code, state);
    } else if (provider === "google") {
      handleGoogleCallback(code);
    }

    sessionStorage.removeItem("oauth_provider"); // clean up
  }, [searchParams]);

  // Function to initiate Google OAuth login
  // const handleGoogleLogin = async () => {
  //   try {
  //     const { gapi } = await import("gapi-script");
  //     await new Promise((resolve) => gapi.load("client:auth2", resolve));

  //     const auth2 = gapi.auth2.init({
  //       client_id: process.env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID, // NEW client ID
  //       scope: "openid profile email", // Only user info
  //     });

  //     const result = await auth2.grantOfflineAccess();

  //     if (!result.code) {
  //       toast.error("Google login failed: no code returned");
  //       return;
  //     }

  //     // Send code to backend
  //     const authResponse = await googleLogin({ code: result.code });

  //     if (authResponse.Result === "SUCCESS") {
  //       Cookies.set("authToken", authResponse.Token);
  //       Cookies.set("currentRole", authResponse.Role);
  //       toast.success("Google login successful!");
  //       router.replace("/");
  //     } else {
  //       toast.error(authResponse.Data || "Google login failed.");
  //     }
  //   } catch (error) {
  //     console.error("Google login error:", error);
  //     toast.error("Google login failed");
  //   }
  // };

  const handleGoogleLogin = () => {
    try {
      // store provider in sessionStorage
      sessionStorage.setItem("oauth_provider", "google");

      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID!,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`,
        response_type: "code",
        scope: "openid profile email",
        access_type: "offline",
        prompt: "consent",
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google login failed");
    }
  };

  const handleGoogleCallback = async (code: string) => {
    try {
      setLoading(true);
      const authResponse = await googleLogin({ code });

      if (authResponse.Result === "SUCCESS") {
        if (!authResponse.is_onboarded) {
          Cookies.set("signupToken", authResponse.Token);
          Cookies.set("isOnboarded", "false");
          router.replace("/auth/onboarding");
          return;
        }
        Cookies.set("authToken", authResponse.Token);
        Cookies.set("currentRole", authResponse.Role || "");
        toast.success("Google login successful!");
        router.replace("/");
      } else if (authResponse.Result === "NotVerified") {
        router.push(`/auth/verify?email=${authResponse.Email}`);
        toast.info("Please verify your email first.");
      } else {
        toast.error(authResponse.Data || "Google login failed.");
      }
    } catch (error) {
      console.error("Google callback error:", error);
      toast.error("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  // Microsoft Login
  const handleMicrosoftLogin = async () => {
    try {
      sessionStorage.setItem("oauth_provider", "microsoft");

      const redirectPath = "/auth/login"; // must match registered URI
      const authorizationUrl = await getAuthorizationUrl(redirectPath);
      window.location.href = authorizationUrl;
    } catch (error) {
      console.error("Microsoft login error:", error);
      toast.error("Microsoft login failed");
    }
  };

  const PKCE_STORAGE_KEY = "outlook_pkce_params";

  const handleMicrosoftCallback = async (
    code: string,
    state: string | null
  ) => {
    try {
      setLoading(true);
      const storedParams = sessionStorage.getItem(PKCE_STORAGE_KEY);
      if (!storedParams) throw new Error("PKCE parameters not found");

      const pkceParams = JSON.parse(storedParams);

      const authResponse = await microsoftLogin({
        code,
        state: state || "",
        codeVerifier: pkceParams.codeVerifier,
      });

      if (authResponse.Result === "SUCCESS") {
        if (!authResponse.is_onboarded) {
          Cookies.set("signupToken", authResponse.Token);
          Cookies.set("isOnboarded", "false");
          router.replace("/auth/onboarding");
          return;
        }

        Cookies.set("authToken", authResponse.Token);
        Cookies.set("currentRole", authResponse.Role || "");
        toast.success("Microsoft login successful!");
        router.replace("/");
      } else if (authResponse.Result === "NotVerified") {
        router.push(`/auth/verify?email=${authResponse.Email}`);
        toast.info("Please verify your email first.");
      } else {
        toast.error(authResponse.Data || "Microsoft login failed.");
      }
    } catch (error) {
      console.error("Microsoft callback error:", error);
      toast.error("Microsoft login failed");
    } finally {
      sessionStorage.removeItem(PKCE_STORAGE_KEY);
      setLoading(false);
    }
  };

  //  Email login
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    let email = (formData.get("email") as string).toLowerCase();
    const password = formData.get("password") as string;

    if (!email || !password) {
      toast.error("Email or Password is missing.");
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, password });

      if (response.Result === "Warning") {
        toast.error(response.Data || "Login failed.");
        return;
      }

      if (response.Result === "NotVerified") {
        toast.info("Please verify your email first.");
        router.push(`/auth/verify?email=${response.Email}`);
        return;
      }

      // Redirect based on onboarding
      if (!response.is_onboarded) {
        Cookies.set("signupToken", response.Token!);
        Cookies.set("isOnboarded", "false");

        setTimeout(() => {
          router.replace("/auth/onboarding");
        }, 1000);
      } else {
        // Store token and onboarding status
        Cookies.set("authToken", response.Token!);
        Cookies.set("currentRole", response.Role || "");
        toast.success("Login successful!");
        router.replace("/");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.Data ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setTimeout(() => setLoading(false), 3000);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* ---- Heading ---- */}
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Rhinon Tech account
                </p>
              </div>

              {/* ---- Email ---- */}
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  defaultValue={email}
                  placeholder="Enter your Email"
                  autoComplete="email"
                  required
                />
              </div>

              {/* ---- Password ---- */}
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <p
                    onClick={() => router.push("/auth/changePassword")}
                    className="ml-auto text-sm underline-offset-2 hover:underline cursor-pointer">
                    Forgot your password?
                  </p>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    placeholder="Enter your Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-700" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-700" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Login
              </Button>

              {/* ---- OAuth Buttons ---- */}
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Google Button */}
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2">
                  <GoogleIcon /> Google
                </Button>

                {/* Microsoft Button */}
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleMicrosoftLogin}
                  className="w-full flex items-center justify-center gap-2">
                  <MicrosoftIcon />
                  Microsoft
                </Button>
              </div>

              <div className="text-center text-sm pt-2 text-gray-600">
                Don&apos;t have an account?{" "}
                <a
                  href="/auth/signup"
                  className="text-blue-600 font-medium hover:underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </form>

          {/* ---- Right Side Image ---- */}
          <div className="bg-muted relative hidden md:block">
            <img
              src="https://cdn.wallpapersafari.com/83/88/drNXzk.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.8]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
