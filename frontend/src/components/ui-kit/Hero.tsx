"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Hero() {
  const [imgError, setImgError] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {!imgError ? (
          <Image
            src="/brand/hero-bg.jpg"
            alt="Construction site"
            fill
            className="object-cover"
            priority
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-orange-900" />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/40" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              One Reliable Place for{" "}
              <span className="text-orange-500">Construction Tracking</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              The single source of truth for status, ownership, and accountability—so nothing falls through the cracks.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Right Content - App Preview */}
          <div className="hidden lg:flex justify-end">
            <div className="relative w-full max-w-lg">
              {/* Laptop Frame */}
              <div className="relative bg-slate-800 rounded-t-xl p-2 shadow-2xl">
                <div className="flex items-center gap-1.5 mb-2 px-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <div className="bg-white rounded-lg overflow-hidden aspect-[16/10]">
                  {!previewError ? (
                    <Image
                      src="/brand/app-preview.png"
                      alt="BuildTrack Dashboard Preview"
                      width={600}
                      height={375}
                      className="w-full h-full object-cover"
                      onError={() => setPreviewError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">Dashboard Preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Laptop Base */}
              <div className="bg-slate-700 h-4 rounded-b-lg mx-8" />
              <div className="bg-slate-600 h-2 rounded-b-xl mx-16" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
