"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  textColor?: "white" | "dark";
  textLabel?: string;
  className?: string;
}

const sizeMap = {
  sm: { container: "w-8 h-8", image: 28, text: "text-lg" },
  md: { container: "w-10 h-10", image: 36, text: "text-xl" },
  lg: { container: "w-14 h-14", image: 52, text: "text-3xl" },
};

export function Logo({
  href = "/",
  size = "sm",
  showText = true,
  textColor = "dark",
  textLabel,
  className = "",
}: LogoProps) {
  const s = sizeMap[size];
  const textClasses = textColor === "white" ? "text-white" : "text-slate-900";
  const label = textLabel ?? "BuildTrack";

  const content = (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className={`${s.container} rounded-lg overflow-hidden flex-shrink-0 bg-white`}>
        <Image
          src="/brand/logo-mark.png"
          alt="BuildTrack"
          width={s.image}
          height={s.image}
          className="w-full h-full object-contain"
          priority
        />
      </span>
      {showText && (
        <span className={`${s.text} font-bold ${textClasses}`}>
          <span className={textColor === "white" ? "text-white" : "text-slate-800"}>
            Build
          </span>
          <span className="text-orange-500">Track</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
