"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState, useEffect } from "react";
import { eyeopen, eyeclose } from "../../../../../public/index";
import {
  sendForgotPasswordEmail,
  verifyChangePasswordToken,
  changePasswordWithToken,
} from "@/services/authServices";
import { useSearchParams, useRouter } from "next/navigation";
import { CircleCheckBig, Mail } from "lucide-react";
import { Label } from "recharts";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    console.log("Component mounted, checking for token...");
    console.log("Current URL:", window.location.href);
    console.log("Token from searchParams:", token);

    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      console.log("No token found");
      return;
    }

    console.log("Starting token verification for:", token);
    // setLoading(true);
    setError("");

    try {
      const res = await verifyChangePasswordToken({ token });
      console.log("Token verification response:", res);

      // Check multiple possible success indicators
      const isSuccess =
        res &&
        (res.Result === "SUCCESS" ||
          res.success === true ||
          res.status === "success" ||
          res.message === "Token verified successfully" ||
          !res.error);

      if (isSuccess) {
        console.log("Token verified successfully, showing password form");
        setShowPasswordForm(true);
        setSubmitted(false);
        // setSuccess("Token verified! Please set your new password.");
      } else {
        console.log("Token verification failed based on response:", res);
        setError("Invalid or expired reset link");
        setShowPasswordForm(false);
      }
    } catch (error: any) {
      console.error("Token verification failed:", error);
      console.error("Error details:", error.response?.data);

      // For testing - if API returns 200 but throws error, still show form
      if (error.response?.status === 200) {
        console.log("API returned 200, showing password form anyway");
        setShowPasswordForm(true);
        setSubmitted(false);
        // setSuccess("Token verified! Please set your new password.");
      } else {
        setError("Invalid or expired reset link");
        setShowPasswordForm(false);
      }
    } finally {
      // setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    console.log("Sending forgot password email to:", email);
    // console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

    try {
      const result = await sendForgotPasswordEmail({ email });
      console.log("Forgot password response:", result);

      // Consider it successful if we get any response without error
      setSubmitted(true);
      // setSuccess("Reset link sent to your email!");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      console.error("Error response:", error.response);

      // Check if it's actually a successful response disguised as an error
      if (error.response && error.response.status === 200) {
        setSubmitted(true);
        // setSuccess("Reset link sent to your email!");
        return;
      }

      let errorMessage = "Failed to send reset email.";

      if (error.message?.includes("timeout")) {
        errorMessage =
          "Server is not responding. Please check your backend server.";
      } else if (error.response?.status === 404) {
        errorMessage =
          "API endpoint not found. Please check your backend routes.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Invalid email address.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // setLoading(true);
    setError("");

    console.log("Resending forgot password email to:", email);

    try {
      const result = await sendForgotPasswordEmail({ email });
      console.log("Resend response:", result);
      setSuccess("Reset link sent again!");
    } catch (error: any) {
      console.error("Resend error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to resend email. Please try again."
      );
    } finally {
      // setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      await changePasswordWithToken({
        token: token || "",
        password,
      });
      setPasswordChangeSuccess(true);
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#E4E8ED]">
      <Card className="overflow-hidden p-0 w-full max-w-3xl bg-[#F5F9FE] ">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left side (Form) */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            {/* {loading && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                {token ? "Verifying reset link..." : "Loading..."}
              </div>
            )} */}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            {showPasswordForm ? (
              passwordChangeSuccess ? (
                <div className="text-center space-y-6  py-8">
                  <div className="flex justify-center">
                    <CircleCheckBig className="w-20 h-20 text-green-500" />
                  </div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Verified
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Your password has been successfully reset.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    {/* Create Password */}
                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="text-xl font-medium text-gray-900"
                      >
                        Create Password
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Minimum length (8–12 chars)
                        <br />
                        At least 1 uppercase, 1 lowercase, 1 number, 1 symbol
                      </p>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-12 border border-gray-300 rounded-md px-3 pr-12"
                          placeholder="Enter new password"
                          required
                          // disabled={loading}
                        />
                        {password && (
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            onClick={() => setShowPassword((prev) => !prev)}
                          >
                            <Image
                              src={showPassword ? eyeopen : eyeclose}
                              alt="toggle password"
                              width={20}
                              height={20}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label
                        htmlFor="confirmPassword"
                        className="text-xl font-medium text-gray-900"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full h-12 border border-gray-300 rounded-md px-3 pr-12"
                           placeholder="Confirm new password"
                          required
                          disabled={loading}
                        />
                        {confirmPassword && (
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                          >
                            <Image
                              src={showConfirmPassword ? eyeopen : eyeclose}
                              alt="toggle confirm password"
                              width={20}
                              height={20}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full h-12 bg-[#1a2b5c] hover:bg-[#162455] text-white rounded-md font-medium mt-6"
                      disabled={loading}
                    >
                      {loading ? "Continue..." : "Continue"}
                    </Button>
                  </form>
                </div>
              )
            ) : !submitted ? (
              <div>
                <div className="space-y-2 pb-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Forgot Password?
                  </h1>
                  <p className="text-gray-600">
                    No worries, we'll send you reset instructions
                  </p>
                </div>

                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 mt-[3px]" />
                  Email Address
                </label>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full  border border-gray-300 rounded-md px-3"
                    required
                    // disabled={loading}
                  />
                  <Button
                    type="submit"
                    className={`w-full  rounded-md font-medium `}
                    disabled={loading}
                  >
                    {loading ? "Continue..." : "Send Reset Link"}
                  </Button>
                </form>

                
                <div className="text-center pt-6 ">
                  <button
                    type="button"
                    onClick={() => router.push("/auth/login")}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <h1 className="text-xl font-semibold text-gray-900 mb-4">
                  Verify Your Email
                </h1>
                <p className="text-gray-900 font-medium mb-6">
                  We have sent the reset link to{" "}
                  <span className="text-gray-500">{email}</span>
                </p>
                <p className="text-gray-900 font-medium">
                  Didn't receive the email?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-blue-600 underline hover:text-blue-700"
                    // disabled={loading}
                  >
                    Send It Again
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Right side (Image) */}
          <div className="bg-muted hidden md:block">
            <img
              src="https://cdn.wallpapersafari.com/83/88/drNXzk.jpg"
              alt="Image"
              className="h-[500px] w-full object-cover rounded-r-lg"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
