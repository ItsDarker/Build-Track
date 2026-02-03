"use client";

import { CheckCircle2, Shield, FileText, Zap, Lock, Wifi } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: CheckCircle2,
    title: "Task & Issue Tracking",
    description: "Assign tasks with clear ownership and deadlines.",
    bullets: ["Project Managers", "Contractors", "Owner/Builders"],
  },
  {
    icon: Shield,
    title: "Role-Based Access Control (RBAC)",
    description: "Control who sees what with granular permissions.",
    bullets: ["Project Managers", "Contractors", "Owner/Builders"],
  },
  {
    icon: FileText,
    title: "Immutable Audit Trail",
    description: "Every change is logged. Nothing gets lost. Complete accountability.",
    bullets: ["Track all changes", "Secure records", "Full history"],
  },
];

const securityFeatures = [
  { icon: Lock, label: "Secure" },
  { icon: Shield, label: "Secure by Design" },
  { icon: Wifi, label: "Always Connected" },
];

const roadmapItems = [
  "Gantt chart views",
  "File attachments",
  "Dedicated mobile apps for iOS & Android",
];

export function FeatureCards() {
  return (
    <>
      {/* Stop the Chaos Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Stop the Chaos of Scattered Data
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The single source of truth for stakeholders. Here, the organized
              oversight of the hosted infrastructure of the tracks.
            </p>
          </div>

          {/* Decorative Line */}
          <div className="flex justify-center mb-12">
            <svg className="w-32 h-8 text-gray-300" viewBox="0 0 128 32">
              <path
                d="M0 16 Q32 0 64 16 T128 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg mb-1">
                        {feature.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Speed and Security Section */}
      <section id="security" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">
            Built for Speed and Security
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Lightning Icon Card */}
            <Card className="bg-slate-800 border-0 text-white overflow-hidden">
              <CardContent className="p-8 flex items-center justify-center min-h-[200px]">
                <div className="relative">
                  <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-12 h-12 text-orange-500" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lightning Fast Card */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 text-xl mb-4">Lightning Fast</h3>
                <ul className="space-y-3">
                  {securityFeatures.map((item) => (
                    <li key={item.label} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-gray-700">{item.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Roadmap Card */}
            <Card id="roadmap" className="bg-slate-800 border-0 text-white">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-4">The Roadmap Ahead</h3>
                <ul className="space-y-3">
                  {roadmapItems.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
