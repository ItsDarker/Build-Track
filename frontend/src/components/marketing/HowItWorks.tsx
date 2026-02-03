import { ClipboardList, Users, FileText } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: ClipboardList,
      title: "Track tasks and issues",
      description: "Create and organize all project tasks, issues, and change orders in one centralized location.",
    },
    {
      icon: Users,
      title: "Assign ownership with role boundaries",
      description: "Clearly define who's responsible for what. Set permissions based on roles to maintain accountability.",
    },
    {
      icon: FileText,
      title: "Maintain audit history",
      description: "Every change is automatically logged with timestamps and user details for complete transparency.",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            BuildTrack simplifies construction project management with a straightforward workflow
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
