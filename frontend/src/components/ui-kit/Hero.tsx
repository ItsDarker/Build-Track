"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useCMSContent } from "@/lib/hooks/useCMSContent";

export function Hero() {
  const [imgError, setImgError] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { getHeroContent } = useCMSContent();
  const heroContent = getHeroContent();

  // Only enable animations after hydration to prevent mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use safe motion detection - default to false during SSR
  const shouldAnimate = isMounted && !prefersReducedMotion;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldAnimate ? 0.2 : 0,
        delayChildren: shouldAnimate ? 0.1 : 0,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: shouldAnimate ? 30 : 0
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.6 : 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const previewVariants = {
    hidden: {
      opacity: 0,
      x: shouldAnimate ? 50 : 0,
      scale: shouldAnimate ? 0.95 : 1
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.8 : 0.1,
        delay: shouldAnimate ? 0.4 : 0,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden">
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

      {/* Subtle animated background effect - only render after mount to prevent hydration mismatch */}
      {isMounted && shouldAnimate && (
        <motion.div
          className="absolute inset-0 z-[1] opacity-30"
          initial={{ backgroundPosition: "0% 0%" }}
          animate={{ backgroundPosition: "100% 100%" }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)",
            backgroundSize: "200% 200%",
          }}
        />
      )}

      {/* Content */}
      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            className="max-w-xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              variants={itemVariants}
            >
              {heroContent.headline}{" "}
              <span className="text-orange-500">{heroContent.highlightedText}</span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed"
              variants={itemVariants}
            >
              {heroContent.subheadline}
            </motion.p>
            <motion.div variants={itemVariants}>
              <Link href={heroContent.ctaLink}>
                <motion.div
                  whileHover={shouldAnimate ? { scale: 1.05 } : {}}
                  whileTap={shouldAnimate ? { scale: 0.98 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow">
                    {heroContent.ctaText}
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Content - App Preview */}
          <motion.div
            className="hidden lg:flex justify-end"
            variants={previewVariants}
            initial="hidden"
            animate="visible"
          >
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
