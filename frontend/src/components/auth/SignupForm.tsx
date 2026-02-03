"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "./PasswordStrength";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const confirmPassword = formData.get("confirmPassword") as string;
    const passwordValue = formData.get("password") as string;

    // Client-side validation
    if (passwordValue !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (passwordValue.length < 10) {
      setError("Password must be at least 10 characters");
      setIsLoading(false);
      return;
    }

    const result = await apiClient.signup({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: passwordValue,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setShowSuccess(true);
    }
  };

  if (showSuccess) {
    return (
      <div className="space-y-4">
        <div className="p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-semibold mb-2">Account created successfully!</h3>
          <p className="mb-3">
            We&apos;ve sent a verification email to your inbox. Please click the link in the
            email to verify your account before logging in.
          </p>
          <p className="text-xs text-green-700">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <Link href="/resend-verification" className="underline font-medium">
              request a new verification link
            </Link>
            .
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="John Doe"
          disabled={isLoading}
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          disabled={isLoading}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••••"
          required
          disabled={isLoading}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrength password={password} />
        <p className="text-xs text-gray-500">
          Must be at least 10 characters with 1 letter and 1 number
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••••"
          required
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>

      <div className="flex items-start space-x-2">
        <input
          type="checkbox"
          id="agreeToTerms"
          name="agreeToTerms"
          required
          disabled={isLoading}
          className="mt-1"
        />
        <Label htmlFor="agreeToTerms" className="text-sm font-normal cursor-pointer">
          I agree to the{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
