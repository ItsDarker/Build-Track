"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";

export default function ResendVerificationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const result = await apiClient.resendVerification(email);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-gray-900">BuildTrack</h1>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Verification Email Sent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-gray-600 text-center mb-2">
                  We&apos;ve sent a new verification link to your email.
                </p>
                <p className="text-sm text-gray-500 text-center">
                  Please check your inbox and click the link to verify your account.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/login"}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-gray-900">BuildTrack</h1>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resend Verification Email</CardTitle>
            <CardDescription>
              Enter your email address to receive a new verification link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Verification Email"}
              </Button>

              <p className="text-center text-sm text-gray-600">
                <Link href="/login" className="text-primary hover:underline">
                  Back to Login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
