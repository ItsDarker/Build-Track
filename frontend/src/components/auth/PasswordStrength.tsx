"use client";

import { calculatePasswordStrength } from "@/lib/schemas/authSchemas";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, feedback } = calculatePasswordStrength(password);

  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
  ];

  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-all ${
              index <= score ? colors[score] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${score >= 3 ? "text-green-600" : "text-gray-600"}`}>
          {labels[score]}
        </span>
        <span className="text-gray-500">{feedback}</span>
      </div>
    </div>
  );
}
