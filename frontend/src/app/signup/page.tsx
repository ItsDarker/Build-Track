"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { apiClient } from "@/lib/api/client";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [imgError, setImgError] = useState(false);

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

  const handleOAuthSignIn = (provider: "google" | "microsoft") => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    window.location.href = `${API_URL}/api/auth/oauth/${provider}`;
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          {!imgError ? (
            <Image
              src="/brand/hero-bg.jpg"
              alt="Construction site"
              fill
              className="object-cover"
              priority
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-600 to-orange-800" />
          )}
          <div className="absolute inset-0 bg-slate-900/30" />
        </div>

        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Created!</h2>
              <p className="text-gray-600 mb-6">
                We&apos;ve sent a verification email to your inbox. Please click the link to verify your account.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <Link href="/resend-verification" className="text-orange-600 hover:underline">
                  request a new link
                </Link>
                .
              </p>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => router.push("/login")}
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {!imgError ? (
          <Image
            src="/brand/hero-bg.jpg"
            alt="Construction site"
            fill
            className="object-cover"
            priority
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-600 to-orange-800" />
        )}
        <div className="absolute inset-0 bg-slate-900/30" />
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-col justify-between relative z-10 w-full items-center justify-center lg:w-1/2 p-12">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M4 21V10.5M20 21V10.5" />
              </svg>
            </div>
          </Link>
          <h1 className="text-5xl font-bold text-white mt-8 leading-tight">
            BuildTrack
          </h1>
          <p className="text-xl text-white/80 mt-4">
            One Reliable Place for Construction Tracking
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white/80">Track tasks and issues</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white/80">Role-based access control</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white/80">Immutable audit trail</span>
          </div>
        </div>

        <p className="text-white/60 text-lg">
          Secure. Accountable. Transparent.
        </p>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-start relative z-10 p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 my-6 lg:ml-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M4 21V10.5M20 21V10.5" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">BuildTrack</span>
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">
            Create Your Account
          </h2>

          {error && (
            <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              className="w-full h-12 border-gray-300 hover:bg-gray-50"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={() => handleOAuthSignIn("microsoft")}
              className="w-full h-12 border-gray-300 hover:bg-gray-50"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Continue with Microsoft
            </Button>
          </div>

          <div className="relative mb-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-gray-500">
              OR
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">
                Name (optional)
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                disabled={isLoading}
                autoComplete="name"
                className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={isLoading}
                autoComplete="email"
                className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">
                Password
              </Label>
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
                className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
              <PasswordStrength password={password} />
              <p className="text-xs text-gray-500">
                Must be at least 10 characters with 1 letter and 1 number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••••"
                required
                disabled={isLoading}
                autoComplete="new-password"
                className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="agreeToTerms"
                name="agreeToTerms"
                required
                disabled={isLoading}
                className="mt-0.5"
              />
              <div className="text-sm text-gray-600 leading-relaxed">
                <label htmlFor="agreeToTerms" className="cursor-pointer">
                  I agree to the
                </label>{" "}
                <Link
                  href="/terms"
                  className="text-orange-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </Link>{" "}
                <label htmlFor="agreeToTerms" className="cursor-pointer">
                  and
                </label>{" "}
                <Link
                  href="/privacy"
                  className="text-orange-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
