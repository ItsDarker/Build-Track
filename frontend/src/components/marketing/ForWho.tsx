import { Building2, HardHat, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ForWho() {
  const audiences = [
    {
      icon: Building2,
      title: "Builders & Owners",
      description: "Maintain visibility across all your projects. Track contractor progress and ensure accountability at every stage.",
      features: [
        "Real-time project status",
        "Contractor oversight",
        "Change order tracking"
      ],
    },
    {
      icon: HardHat,
      title: "Contractors",
      description: "Manage your tasks efficiently. Document your work and communicate progress clearly to project owners.",
      features: [
        "Task management",
        "Progress updates",
        "Issue reporting"
      ],
    },
    {
      icon: Briefcase,
      title: "Project Managers",
      description: "Coordinate between all parties seamlessly. Keep everyone aligned and projects moving forward.",
      features: [
        "Team coordination",
        "Timeline tracking",
        "Stakeholder communication"
      ],
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Who It&apos;s For
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            BuildTrack serves everyone involved in construction projects
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {audiences.map((audience, index) => {
              const Icon = audience.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {audience.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {audience.description}
                      </p>
                      <ul className="space-y-2 w-full">
                        {audience.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
