"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No verification token provided");
        return;
      }

      const result = await apiClient.verifyEmail(token);

      if (result.error) {
        setStatus("error");
        setMessage(result.error);
      } else {
        setStatus("success");
        setMessage("Email verified successfully!");
      }
    };

    verifyEmail();
  }, [token]);

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
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              {status === "loading" && "Verifying your email address..."}
              {status === "success" && "Your email has been verified"}
              {status === "error" && "Verification failed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "loading" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-gray-600">Verifying your email...</p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-gray-600 text-center">{message}</p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => router.push("/login")}
                >
                  Continue to Login
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8">
                  <XCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-gray-600 text-center mb-4">{message}</p>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/resend-verification")}
                  >
                    Request New Verification Link
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.push("/")}
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
