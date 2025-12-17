"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import { GoogleIcon, MicrosoftIcon } from "@/components/Constants/SvgIcons";
import { googleSignup, microsoftSignup, signup } from "@/services/authServices";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getAuthorizationUrl } from "@/services/settings/outlookServices";
import Loading from "@/app/loading";

const SignupSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Business email is required")
    .email("Please enter a valid business email"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .refine(
      (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v),
      "Must include at least 1 special character"
    )
    .refine((v) => /\d/.test(v), "Must include at least 1 number")
    .refine((v) => /[A-Z]/.test(v), "Must include at least 1 uppercase letter"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Mobile phone number is required")
    .refine(
      (v) => v.replace(/\D/g, "").length >= 7,
      "Please enter a valid phone number"
    ),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof SignupSchema>, string>>;

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle OAuth callback from Google/Microsoft
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const provider = sessionStorage.getItem("oauth_provider");

    if (!code || !provider) return;

    // we're in OAuth callback mode
    setIsOAuthCallback(true);

    if (provider === "microsoft") handleMicrosoftCallback(code, state);
    if (provider === "google") handleGoogleCallback(code);

    sessionStorage.removeItem("oauth_provider"); // clean up
  }, [searchParams]);

  const passwordChecks = {
    length: password.length >= 12,
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    number: /\d/.test(password),
    uppercase: /[A-Z]/.test(password),
  };

  // Google Signup
  const handleGoogleSignup = () => {
    try {
      sessionStorage.setItem("oauth_provider", "google");

      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID!,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/signup`,
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

  // Google OAuth callback handler
  const handleGoogleCallback = async (code: string) => {
    try {
      setLoading(true);
      const authResponse = await googleSignup({ code });

      if (authResponse.Result === "SUCCESS") {
        toast.success("Google signup successful! Please verify your email.");
        router.push(`/auth/verify?email=${authResponse.Email}`);
        return;
      }
      if (authResponse.Result === "AlreadyRegistered") {
        toast.info("Account already exists. Please log in.");
        router.push("/auth/login");
        return;
      }
      if (authResponse.Result === "NotOnboarded") {
        toast.info("Please complete onboarding.");
        router.push("/auth/onboarding");
        return;
      }
      if (authResponse.Result === "NotVerified") {
        toast.info("Please verify your email.");
        router.push(`/auth/verify?email=${authResponse.Email}`);
        return;
      }

      toast.error("Unexpected server response.");
    } catch (error) {
      console.error("Google callback error:", error);
      toast.error("Google Signup failed.");
      setIsOAuthCallback(false); // show form again if error
    } finally {
      setLoading(false);
    }
  };

  // Microsoft Signup
  const handleMicrosoftSignup = async () => {
    try {
      sessionStorage.setItem("oauth_provider", "microsoft");
      const redirectPath = "/auth/signup"; // must match registered URI
      const authorizationUrl = await getAuthorizationUrl(redirectPath);
      window.location.href = authorizationUrl;
    } catch (error) {
      console.error("Microsoft Signup error:", error);
      toast.error("Microsoft Signup failed");
    }
  };

  // Microsoft OAuth callback handler
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
      const authResponse = await microsoftSignup({
        code,
        state: state || "",
        codeVerifier: pkceParams.codeVerifier,
      });

      if (authResponse.Result === "SUCCESS") {
        toast.success("Microsoft signup successful! Please verify your email.");
        router.push(`/auth/verify?email=${authResponse.Email}`);
        return;
      }
      if (authResponse.Result === "AlreadyRegistered") {
        toast.info("Account already exists. Please log in.");
        router.push("/auth/login");
        return;
      }
      if (authResponse.Result === "NotOnboarded") {
        toast.info("Please complete onboarding.");
        router.push("/auth/onboarding");
        return;
      }
      if (authResponse.Result === "NotVerified") {
        toast.info("Please verify your email.");
        router.push(`/auth/verify?email=${authResponse.Email}`);
        return;
      }

      toast.error("Unexpected server response.");
    } catch (error) {
      console.error("Microsoft callback error:", error);
      toast.error("Microsoft Signup failed.");
      setIsOAuthCallback(false); // show form again if error
    } finally {
      sessionStorage.removeItem(PKCE_STORAGE_KEY);
      setLoading(false);
    }
  };

  // Email + Password signup
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const result = SignupSchema.safeParse({ email, password, phoneNumber });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof FieldErrors;
        fieldErrors[path] = issue.message;
        toast.error(issue.message);
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setLoading(true);
      const response = await signup({
        email,
        password,
        phone_number: phoneNumber,
      });

      if (response.Result === "SUCCESS") {
        toast.success("Account created! Please verify your email.");
        router.push(`/auth/verify?email=${response.Email}`);
        return;
      }
      if (response.Result === "AlreadyRegistered") {
        toast.info("Account already exists. Please log in.");
        router.push("/auth/login");
        return;
      }
      if (response.Result === "NotOnboarded") {
        toast.info("Please complete onboarding.");
        router.push("/auth/onboarding");
        return;
      }
      if (response.Result === "NotVerified") {
        toast.info("Please verify your email.");
        router.push(`/auth/verify?email=${response.Email}`);
        return;
      }

      toast.error("Unexpected server response.");
    } catch (error) {
      console.error("Signup failed", error);
      toast.error("Sign up failed! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show loader when OAuth callback is being processed
  if (isOAuthCallback || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loading />
        <p className="text-muted-foreground mt-4">Processing your signup...</p>
      </div>
    );
  }

  // ✅ Default signup form (when not processing callback)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Start for free
          </h1>
          <p className="text-muted-foreground text-lg">
            No credit card required
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Business email
            </label>
            <input
              type="email"
              placeholder="name@work-email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-input text-foreground placeholder:text-muted-foreground ${
                errors.email
                  ? "border-destructive focus:ring-destructive"
                  : "border-border focus:ring-ring"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Set your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 bg-input text-foreground placeholder:text-muted-foreground ${
                  errors.password
                    ? "border-destructive focus:ring-destructive"
                    : "border-border focus:ring-ring"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password checks */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {Object.entries(passwordChecks).map(([key, ok]) => (
                <div key={key} className="flex items-center gap-2">
                  {ok ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <Circle size={16} className="text-muted-foreground" />
                  )}
                  <span
                    className={ok ? "text-foreground" : "text-muted-foreground"}
                  >
                    {key === "length"
                      ? "min. 12 characters"
                      : key === "special"
                      ? "min. 1 special character"
                      : key === "number"
                      ? "min. 1 number"
                      : "min. 1 uppercase letter"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Mobile phone number
            </label>
            <input
              type="tel"
              placeholder="081234 56789"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-input text-foreground placeholder:text-muted-foreground ${
                errors.phoneNumber
                  ? "border-destructive focus:ring-destructive"
                  : "border-border focus:ring-ring"
              }`}
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-destructive">
                {errors.phoneNumber}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3 rounded-lg text-primary-foreground ${
              loading
                ? "bg-muted cursor-not-allowed"
                : "bg-primary hover:bg-primary/80"
            }`}
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>

          {/* Social logins */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              <GoogleIcon />
              <span className="font-medium text-foreground">
                Sign up with Google
              </span>
            </button>
            <button
              type="button"
              onClick={handleMicrosoftSignup}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              <MicrosoftIcon />
              <span className="font-medium text-foreground">
                Sign up with Microsoft
              </span>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center text-sm pt-4 text-muted-foreground">
            Already have an account?{" "}
            <a
              href="/auth/login"
              className="text-primary font-medium hover:underline"
            >
              Log in
            </a>
          </div>
          <div className="text-center text-xs text-muted-foreground pt-4">
            You agree to our{" "}
            <a href="https://rhinon.tech/terms-and-conditions" className="text-primary hover:underline">
              Terms of Use
            </a>{" "}
            and{" "}
            <a href="https://rhinon.tech/terms-and-conditions" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </div>
          <div className="text-center text-xs text-muted-foreground pt-3">
            powered by{" "}
            <span className="font-semibold text-foreground">Rhinon Tech</span>
          </div>
        </form>
      </div>
    </div>
  );
}
