"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h2>Overview</h2>
            <p>
              This is a placeholder privacy policy for the BuildTrack MVP. In a production
              environment, this would contain comprehensive information about how we collect,
              use, and protect your personal data.
            </p>

            <h2>Information We Collect</h2>
            <p>BuildTrack collects the following information:</p>
            <ul>
              <li>Email address (for authentication and communication)</li>
              <li>Name (optional)</li>
              <li>IP address (for rate limiting and security)</li>
              <li>Session data (for authentication)</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide authentication and account management services</li>
              <li>Send verification emails and account-related communications</li>
              <li>Protect against spam and abuse</li>
              <li>Improve our services</li>
            </ul>

            <h2>Data Storage</h2>
            <p>
              Your data is stored securely using industry-standard encryption. Passwords are
              hashed using bcrypt and never stored in plain text.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy-related questions, please contact us at{" "}
              <a href="mailto:privacy@buildtrack.local">privacy@buildtrack.local</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
