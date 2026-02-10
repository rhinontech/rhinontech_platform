// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";
import Cookies from "js-cookie";

// Dummy credentials
const DUMMY_EMAIL = "admin@rhinon.tech";
const DUMMY_PASSWORD = "admin123";
const DUMMY_ROLE = "admin";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate a brief loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check dummy credentials
    if (
      formData.email === DUMMY_EMAIL &&
      formData.password === DUMMY_PASSWORD
    ) {
      // Store auth state in cookies (like the real rhinon app)
      Cookies.set("currentRole", DUMMY_ROLE);
      Cookies.set("auth-token", "dummy-token-12345");

      // Also store in localStorage as backup
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", DUMMY_ROLE);

      // Redirect to role-based dashboard
      router.push(`/${DUMMY_ROLE}/dashboard`);
    } else {
      setError("Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@rhinon.tech"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
                Demo Credentials:
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                Email: admin@rhinon.tech
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">Password: admin123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
