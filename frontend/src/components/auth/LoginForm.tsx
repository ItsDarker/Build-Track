"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setShowResend(false);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await apiClient.login({ email, password });

    if (result.error) {
      if (result.error.includes("verify your email")) {
        setError("Please verify your email before logging in.");
        setShowResend(true);
        setResendEmail(email);
      } else if (result.error.includes("Too many attempts")) {
        setError(result.error);
      } else {
        setError("Invalid email or password. Please try again.");
      }
      setIsLoading(false);
    } else {
      router.push("/app");
      router.refresh();
    }
  };

  const handleResend = async () => {
    const result = await apiClient.resendVerification(resendEmail);
    if (result.error) {
      setError(result.error);
    } else {
      setError(null);
      setShowResend(false);
      alert("Verification email sent! Check your inbox.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
          {showResend && (
            <button
              type="button"
              onClick={handleResend}
              className="block mt-2 text-primary underline"
            >
              Resend verification email
            </button>
          )}
        </div>
      )}

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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/reset-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••••"
          required
          disabled={isLoading}
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </form>
  );
}
