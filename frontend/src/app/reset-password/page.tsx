import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
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
            <CardTitle>Password Reset</CardTitle>
            <CardDescription>Reset your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>MVP Notice:</strong> Password reset functionality is not
                  implemented in this MVP slice.
                </p>
                <p className="text-sm text-gray-600">
                  This feature will be added in a future release. For now, please contact
                  support if you need to reset your password.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
