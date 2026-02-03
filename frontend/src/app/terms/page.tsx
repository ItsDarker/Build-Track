"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <span className="text-gray-400">|</span>
          <Link href="/" className="text-primary hover:underline text-sm">
            Home
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h2>Overview</h2>
            <p>
              This is a placeholder terms of service for the BuildTrack MVP. In a production
              environment, this would contain comprehensive legal terms governing the use
              of the service.
            </p>

            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using BuildTrack, you accept and agree to be bound by the
              terms and provisions of this agreement.
            </p>

            <h2>Use License</h2>
            <p>
              BuildTrack grants you a limited, non-exclusive, non-transferable license to
              use the service for your construction workflow management needs.
            </p>

            <h2>User Responsibilities</h2>
            <p>As a user, you agree to:</p>
            <ul>
              <li>Provide accurate and current information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the service in compliance with all applicable laws</li>
              <li>Not attempt to circumvent security measures</li>
              <li>Not use disposable or temporary email addresses</li>
            </ul>

            <h2>Service Availability</h2>
            <p>
              BuildTrack is provided as an MVP (Minimum Viable Product). We do not guarantee
              uninterrupted availability and reserve the right to modify or discontinue
              features.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              BuildTrack is provided &quot;as is&quot; without warranties of any kind. We are not
              liable for any damages arising from the use or inability to use the service.
            </p>

            <h2>Contact</h2>
            <p>
              For questions about these terms, please contact us at{" "}
              <a href="mailto:legal@buildtrack.local">legal@buildtrack.local</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
