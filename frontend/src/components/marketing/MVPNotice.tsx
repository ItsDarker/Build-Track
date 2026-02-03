import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MVPNotice() {
  return (
    <section className="py-16 bg-blue-50">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto border-blue-200 bg-white">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  MVP Status
                </h3>
                <p className="text-gray-700 mb-4">
                  This is a <strong>Minimum Viable Product</strong>. Some features are
                  intentionally disabled while we validate core functionality and gather
                  user feedback.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Currently available:</strong> User authentication, email
                    verification, and account management
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Coming soon:</strong> Project tracking, task management,
                    and audit history
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
