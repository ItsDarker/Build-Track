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
import { apiClient } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await apiClient.login({ email, password });

    if (result.error) {
      if (result.error.includes("verify your email")) {
        setError("Please verify your email before logging in.");
      } else if (result.error.includes("blocked")) {
        setError("Your account has been blocked. Please contact support.");
      } else if (result.error.includes("Too many attempts")) {
        setError(result.error);
      } else {
        setError("Invalid email or password. Please try again.");
      }
      setIsLoading(false);
    } else {
      // Check user role and redirect accordingly
      const user = (result.data as any)?.user;
      if (user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/app");
      }
      router.refresh();
    }
  };

  const handleOAuthSignIn = (provider: "google" | "microsoft") => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    window.location.href = `${API_URL}/api/auth/oauth/${provider}`;
  };

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

        {/* Laptop Mockup */}
        <div className="relative w-full max-w-xl">
          <div className="bg-slate-800 rounded-t-xl p-2 shadow-2xl">
            <div className="flex items-center gap-1.5 mb-2 px-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <div className="bg-gray-100 rounded w-full aspect-video flex items-center justify-center">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-700 h-3 rounded-b-lg mx-6" />
          <div className="bg-slate-600 h-1.5 rounded-b-xl mx-12" />
        </div>

        {/* Bottom Tagline */}
        <p className="text-white/60 text-lg">
          Secure. Accountable. Transparent.
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-start relative z-10 p-6 lg:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 lg:ml-10">
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

          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Welcome Back
          </h2>

          {error && (
            <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
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
                placeholder="••••••••"
                required
                disabled={isLoading}
                autoComplete="current-password"
                className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm text-gray-600 font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Link
                href="/reset-password"
                className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Log In"}
            </Button>
          </form>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-gray-500">
              OR
            </span>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              className="w-full h-12 border-gray-300 hover:bg-gray-50"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
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

          <p className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
              Sign Up
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-4">
            Admin users will be redirected to the admin dashboard automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
