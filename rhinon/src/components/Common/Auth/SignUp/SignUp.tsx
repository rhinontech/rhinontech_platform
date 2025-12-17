"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { microsoft } from "../../../../../public/index";
import { toast } from "sonner";
import {
  signup,
  resendEmailForSignUp,
  checkEmailRegistered,
} from "@/services/authServices";
import { z } from "zod";
import { Eye, EyeClosed, EyeOff } from "lucide-react";

type Field =
  | "organization_name"
  | "first_name"
  | "last_name"
  | "email"
  | "password"
  | "company_size";

const SignUpSchema = z.object({
  organization_name: z
    .string()
    .min(2, "Organization name must be at least 2 characters."),
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "Password must contain letters.")
    .regex(/[0-9]/, "Password must contain numbers."),
  company_size: z.string().min(1, "Company size is required."),
});

const fieldSchemas: Record<Field, z.ZodTypeAny> = {
  organization_name: SignUpSchema.shape.organization_name,
  first_name: SignUpSchema.shape.first_name,
  last_name: SignUpSchema.shape.last_name,
  email: SignUpSchema.shape.email,
  password: SignUpSchema.shape.password,
  company_size: SignUpSchema.shape.company_size,
};

export function SignUp({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showError, setShowError] = useState(false);
  const [error, SetError] = useState("");
  const [step, setStep] = useState<number>(1);
  const totalSteps = 6;
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    organization_name: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    company_size: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Add state for loading & error
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const emailQP = searchParams.get("email");
    if (emailQP) {
      setFormData((prev) => ({ ...prev, email: emailQP }));
    }
  }, [searchParams]);

  const progress = useMemo(() => (step / totalSteps) * 100, [step, totalSteps]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: Field; value: string };
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const currentField: Field =
    step === 1
      ? "organization_name"
      : step === 2
      ? "first_name"
      : step === 3
      ? "last_name"
      : step === 4
      ? "email"
      : step === 5
      ? "password"
      : "company_size";

  const validateCurrentStep = async (): Promise<boolean> => {
    const schema = fieldSchemas[currentField];
    const result = schema.safeParse(formData[currentField]);
    if (!result.success) {
      setErrors((prev) => ({
        ...prev,
        [currentField]: result.error.issues[0]?.message || "Invalid value.",
      }));
      return false;
    }

    if (currentField === "email") {
      try {
        const email = formData.email.toLowerCase();
        const resp = await checkEmailRegistered({ email });
        console.log("Response", resp);

        if (resp?.isEmailAvailable === false) {
          toast.error("Email already registered.");
          //  router.push("/auth/login");
          setErrors((prev) => ({
            ...prev,
            // email: "This email is already registered.",
          }));
          return false;
        }
      } catch (err) {
        console.error("Email check failed", err);
        toast.error("Failed to check email. Please try again.");
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();
    if (!valid) return;
    if (step < totalSteps) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const parsed = SignUpSchema.safeParse(formData);
    if (!parsed.success) {
      const nextErrors: Partial<Record<Field, string>> = {};
      parsed.error.issues.forEach((iss) => {
        const path = iss.path[0] as Field;
        nextErrors[path] = iss.message;
      });
      setErrors(nextErrors);
      const order: Field[] = [
        "organization_name",
        "first_name",
        "last_name",
        "email",
        "password",
        "company_size",
      ];
      const firstInvalid = order.find((f) => nextErrors[f]);
      if (firstInvalid) {
        setStep(order.indexOf(firstInvalid) + 1);
      }
      return;
    }

    setLoading(true);
    try {
      // await signup(parsed.data);
      setSuccessMessage(
        "Sign up successful! Please check your email for verification."
      );
      setTimeout(() => {
        router.push(`/auth/verify?email=${formData.email}`);
      }, 800);
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const err = error as {
          response?: { data?: { message?: string } };
        };
        setShowError(true);
        SetError(err.response?.data?.message ?? "");
      } else {
        console.error("Sign Up failed", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 ", className)} {...props}>
      <Card className="overflow-hidden p-0 ">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground">
                  Sign up to your Rhinon Tech account
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-gray-200 rounded">
                <div
                  className="h-1.5 bg-primary rounded transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Step Fields */}
              {step === 1 && (
                <div className="grid gap-2">
                  <Label htmlFor="organization_name">Organization Name</Label>
                  <Input
                    id="organization_name"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    placeholder="Your organization name"
                    required
                  />
                  {errors.organization_name && (
                    <p className="text-sm text-red-500">
                      {errors.organization_name}
                    </p>
                  )}
                </div>
              )}
              {step === 2 && (
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Your first name"
                    required
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-500">{errors.first_name}</p>
                  )}
                </div>
              )}
              {step === 3 && (
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Your last name"
                    required
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-500">{errors.last_name}</p>
                  )}
                </div>
              )}
              {step === 4 && (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              )}
              {step === 5 && (
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-700" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-700" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
              )}
              {step === 6 && (
                <div className="grid gap-2">
                  <Label htmlFor="company_size">Company Size</Label>
                  <Input
                    id="company_size"
                    name="company_size"
                    value={formData.company_size}
                    onChange={handleChange}
                    placeholder="e.g., 1-10, 11-50"
                    required
                  />
                  {errors.company_size && (
                    <p className="text-sm text-red-500">
                      {errors.company_size}
                    </p>
                  )}
                </div>
              )}

              {successMessage && (
                <p className="text-green-600 text-sm">{successMessage}</p>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-3">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={handlePrev}>
                    Back
                  </Button>
                )}
                {step < totalSteps && (
                  <Button type="button" onClick={handleNext}>
                    Next
                  </Button>
                )}
                {step === totalSteps && (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}>
                    {loading ? "Signing up..." : "Sign Up"}
                  </Button>
                )}
              </div>

              {showError && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t mt-10">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 ml-17">
              {/* <Button variant="outline" type="button" className="w-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
                <span className="sr-only">Login with Apple</span>
              </Button> */}
              <Button variant="outline" type="button" className="w-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                <span className="sr-only">Login with Google</span>
              </Button>
              {/* <Button variant="outline" type="button" className="w-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                    fill="currentColor"
                  />
                </svg>
                <span className="sr-only">Login with Meta</span>
              </Button> */}
              <Button
                variant="outline"
                type="button"
                className="w-full flex items-center justify-center gap-2">
                <Image
                  src={microsoft}
                  alt="Microsoft Logo"
                  width={18}
                  height={18}
                  // className="w-6 h-6"
                />
                <span className="sr-only">Microsoft Logo Button</span>
              </Button>
            </div>
            <div className="text-center text-sm mt-5">
              Already have an account?{" "}
              <a href="/auth/login" className="underline underline-offset-4">
                Login
              </a>
            </div>
          </div>

          <div className="bg-muted relative hidden md:block">
            <img
              src="https://cdn.wallpapersafari.com/83/88/drNXzk.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
