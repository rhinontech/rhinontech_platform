"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";
import {
  setPasswordForTeam,
  verifyTeamToken,
} from "@/services/teamsOnboarding";
import Cookies from "js-cookie";

interface PasswordCriteria {
  hasLetter: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  isValidLength: boolean;
}

export function TeamsOnboarding({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"verify" | "setPassword">("verify");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
    hasLetter: false,
    hasNumber: false,
    hasSymbol: false,
    isValidLength: false,
  });

  const validatePassword = (pwd: string) => {
    setPasswordCriteria({
      hasLetter: /[a-zA-Z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSymbol: /[@$!%*?&]/.test(pwd),
      isValidLength: pwd.length >= 8,
    });
  };

  const getPasswordStrength = () => {
    const { hasLetter, hasNumber, hasSymbol, isValidLength } = passwordCriteria;
    const criteriaCount = [
      hasLetter,
      hasNumber,
      hasSymbol,
      isValidLength,
    ].filter(Boolean).length;
    return (criteriaCount / 4) * 100;
  };

  const getStrengthLabel = () => {
    const strength = getPasswordStrength();
    if (strength === 0) return "";
    if (strength <= 25) return "Weak";
    if (strength <= 50) return "Fair";
    if (strength <= 75) return "Good";
    return "Strong";
  };

  const getStrengthColor = () => {
    const strength = getPasswordStrength();
    if (strength <= 25) return "bg-red-500";
    if (strength <= 50) return "bg-orange-500";
    if (strength <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const isPasswordValid = () => {
    const { hasLetter, hasNumber, hasSymbol, isValidLength } = passwordCriteria;
    return hasLetter && hasNumber && hasSymbol && isValidLength;
  };

  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    if (!token) {
      setError("Missing or invalid token.");
      setTimeout(() => router.push("/auth/login"), 3000);
      Cookies.remove("authToken");
      Cookies.remove("currentRole");
      return;
    }

    const verify = async () => {
      setLoading(true);
      try {
        const response = await verifyTeamToken(token);
        setEmail(response.supportEmail);
        setStep("setPassword");
      } catch (err: any) {
        setError(err?.response?.data?.message || "Token verification failed");
        Cookies.remove("authToken");
        Cookies.remove("currentRole");
        setTimeout(() => router.push("/auth/login"), 3000);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, router]);

  const handleSetPassword = async () => {
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    if (!isPasswordValid()) {
      setError("Password does not meet the required criteria.");
      return;
    }

    const value = {
      token: token,
      password: password,
    };

    setLoading(true);
    setError(null);

    try {
      await setPasswordForTeam(value);
      Cookies.remove("authToken");
      Cookies.remove("currentRole");
      router.push("/auth/login");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to set password.");
    } finally {
      setLoading(false);
    }
  };

  const CriteriaItem = ({
    met,
    children,
  }: {
    met: boolean;
    children: React.ReactNode;
  }) => (
    <div
      className={`flex items-center gap-2 text-sm transition-colors ${
        met ? "text-green-600" : "text-gray-500"
      }`}
    >
      <div
        className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
          met ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        {met ? (
          <Check className="w-2.5 h-2.5 text-white" />
        ) : (
          <X className="w-2.5 h-2.5 text-white" />
        )}
      </div>
      <span>{children}</span>
    </div>
  );

  if (loading && step === "verify") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Verifying your invitation
            </h3>
            <p className="text-sm text-gray-500 text-center">
              Please wait while we validate your team invitation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">{error}</p>
            <Button
              onClick={() => router.push("/auth/login")}
              variant="outline"
              className="bg-white text-black"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold">Join Your Team</h1>
                <p className="text-muted-foreground text-balance">
                  Set up your password to complete your team onboarding
                </p>
              </div>

              {/* Email Field */}
              <div className="grid gap-3">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="pl-10 bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Password strength
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          getPasswordStrength() <= 25
                            ? "text-red-500"
                            : getPasswordStrength() <= 50
                            ? "text-orange-500"
                            : getPasswordStrength() <= 75
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {getStrengthLabel()}
                      </span>
                    </div>
                    <Progress value={getPasswordStrength()} className="h-2" />
                  </div>
                )}
              </div>

              {/* Password Criteria */}
              {password && (
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Requirements</Label>
                  <div className="grid gap-1">
                    <CriteriaItem met={passwordCriteria.isValidLength}>
                      At least 8 characters
                    </CriteriaItem>
                    <CriteriaItem met={passwordCriteria.hasLetter}>
                      Contains a letter
                    </CriteriaItem>
                    <CriteriaItem met={passwordCriteria.hasNumber}>
                      Contains a number
                    </CriteriaItem>
                    <CriteriaItem met={passwordCriteria.hasSymbol}>
                      Contains a symbol (@$!%*?&)
                    </CriteriaItem>
                  </div>
                </div>
              )}

              {/* Confirm Password Field */}
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Confirm your password"
                    className={`pl-10 pr-10 ${
                      confirmPassword && !passwordsMatch
                        ? "border-red-300 focus:border-red-500"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && passwordsMatch && (
                  <p className="text-sm text-green-500 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                className="w-full"
                onClick={handleSetPassword}
                disabled={loading || !isPasswordValid() || !passwordsMatch}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting Password...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <a href="/auth/login" className="underline underline-offset-4">
                  Sign in
                </a>
              </div>
            </div>
          </div>
          <div className="bg-muted relative hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
              alt="Team collaboration"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.8]"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By completing setup, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
}
