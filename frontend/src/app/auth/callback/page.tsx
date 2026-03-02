"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const dest = searchParams.get("dest") || "/app";

    if (!accessToken || !refreshToken) {
      router.push("/login");
      return;
    }

    const maxAge15Min = 15 * 60;
    const maxAge7Days = 7 * 24 * 60 * 60;
    const isSecure = window.location.protocol === "https:";
    const sameSite = isSecure ? "None" : "Lax";
    const secureFlag = isSecure ? "; Secure" : "";

    document.cookie = `accessToken=${accessToken}; Max-Age=${maxAge15Min}; Path=/; SameSite=${sameSite}${secureFlag}`;
    document.cookie = `refreshToken=${refreshToken}; Max-Age=${maxAge7Days}; Path=/; SameSite=${sameSite}${secureFlag}`;

    router.push(dest);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-500 text-sm">Signing you in...</div>
      </div>
    </div>
  );
}