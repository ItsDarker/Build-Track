import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            BuildTrack
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4">
            Clarity and accountability for construction workflows
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            A single place to track tasks, issues, and ownership. Maintain accountability
            with clear role boundaries and comprehensive audit history.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="/login">Log In</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-1">Clear Ownership</h3>
                <p className="text-sm text-gray-600">
                  Know who&apos;s responsible for every task and issue
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-1">Complete Visibility</h3>
                <p className="text-sm text-gray-600">
                  Track status and progress in real-time
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-1">Audit History</h3>
                <p className="text-sm text-gray-600">
                  Every change is logged and traceable
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
