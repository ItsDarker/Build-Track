"use client";

import { CheckCircle2, Shield, FileText, Zap, Lock, Wifi, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useCMSContent } from "@/lib/hooks/useCMSContent";

// Icon mapping for dynamic icons from CMS
const iconMap: Record<string, LucideIcon> = {
  CheckCircle2,
  Shield,
  FileText,
  Zap,
  Lock,
  Wifi,
  Check: CheckCircle2,
};

function AnimatedCard({ children, index, shouldAnimate }: {
  children: React.ReactNode;
  index: number;
  shouldAnimate: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: shouldAnimate ? 40 : 0 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: shouldAnimate ? 40 : 0 }}
      transition={{
        duration: shouldAnimate ? 0.5 : 0.1,
        delay: shouldAnimate ? index * 0.15 : 0,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={shouldAnimate ? { y: -5, transition: { duration: 0.2 } } : {}}
    >
      {children}
    </motion.div>
  );
}

function AnimatedSection({ children, className = "", shouldAnimate }: {
  children: React.ReactNode;
  className?: string;
  shouldAnimate: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: shouldAnimate ? 0.6 : 0.1 }}
    >
      {children}
    </motion.div>
  );
}

// Define types for CMS content
interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
}

interface SecurityFeatureItem {
  icon: LucideIcon;
  label: string;
}

export function FeatureCards() {
  const [isMounted, setIsMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  // Only enable animations after hydration to prevent mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use safe motion detection - default to false during SSR
  const shouldAnimate = isMounted && !prefersReducedMotion;

  // Get CMS content
  const { getFeaturesContent, getSecurityContent } = useCMSContent();
  const featuresContent = getFeaturesContent();
  const securityContent = getSecurityContent();

  // Map CMS features to component format with icons
  const features: FeatureItem[] = featuresContent.features.map((f: { icon: string; title: string; description: string; bullets?: string[] }) => ({
    icon: iconMap[f.icon] || CheckCircle2,
    title: f.title,
    description: f.description,
    bullets: f.bullets || [],
  }));

  const securityFeatures: SecurityFeatureItem[] = securityContent.features.map((f: { icon: string; label: string }) => ({
    icon: iconMap[f.icon] || Lock,
    label: f.label,
  }));

  const roadmapItems: string[] = securityContent.roadmap || [];

  return (
    <>
      {/* Stop the Chaos Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection shouldAnimate={shouldAnimate}>
            <div className="text-center mb-12">
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
                initial={{ opacity: 0, y: shouldAnimate ? 20 : 0 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: shouldAnimate ? 0.5 : 0.1 }}
              >
                {featuresContent.sectionTitle}
              </motion.h2>
              <motion.p
                className="text-gray-600 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: shouldAnimate ? 20 : 0 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: shouldAnimate ? 0.5 : 0.1, delay: shouldAnimate ? 0.1 : 0 }}
              >
                {featuresContent.sectionSubtitle}
              </motion.p>
            </div>
          </AnimatedSection>

          {/* Decorative Line */}
          <div className="flex justify-center mb-12">
            <motion.svg
              className="w-32 h-8 text-gray-300"
              viewBox="0 0 128 32"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: shouldAnimate ? 1 : 0.1, delay: shouldAnimate ? 0.2 : 0 }}
            >
              <motion.path
                d="M0 16 Q32 0 64 16 T128 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </motion.svg>
          </div>

          {/* Feature Cards Grid */}
          <div ref={sectionRef} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <AnimatedCard key={`feature-${index}-${feature.title}`} index={index} shouldAnimate={shouldAnimate}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <motion.div
                        className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0"
                        whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : {}}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <feature.icon className="w-6 h-6 text-orange-500" />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg mb-1">
                          {feature.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.bullets.map((bullet, bulletIndex) => (
                        <motion.li
                          key={`bullet-${index}-${bulletIndex}`}
                          className="flex items-center gap-2 text-sm text-gray-600"
                          initial={{ opacity: 0, x: shouldAnimate ? -10 : 0 }}
                          animate={isInView ? { opacity: 1, x: 0 } : {}}
                          transition={{
                            duration: shouldAnimate ? 0.3 : 0.1,
                            delay: shouldAnimate ? (index * 0.15) + (bulletIndex * 0.1) + 0.3 : 0
                          }}
                        >
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                          {bullet}
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Speed and Security Section */}
      <section id="security" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <AnimatedSection shouldAnimate={shouldAnimate}>
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center"
              initial={{ opacity: 0, y: shouldAnimate ? 20 : 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldAnimate ? 0.5 : 0.1 }}
            >
              {securityContent.sectionTitle}
            </motion.h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Lightning Icon Card */}
            <AnimatedCard index={0} shouldAnimate={shouldAnimate}>
              <Card className="bg-slate-800 border-0 text-white overflow-hidden h-full">
                <CardContent className="p-8 flex items-center justify-center min-h-[200px]">
                  <div className="relative">
                    <motion.div
                      className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center"
                      animate={shouldAnimate ? {
                        scale: [1, 1.05, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(249, 115, 22, 0)",
                          "0 0 0 10px rgba(249, 115, 22, 0.1)",
                          "0 0 0 0 rgba(249, 115, 22, 0)"
                        ]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Zap className="w-12 h-12 text-orange-500" />
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Shield className="w-4 h-4 text-white" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>

            {/* Lightning Fast Card */}
            <AnimatedCard index={1} shouldAnimate={shouldAnimate}>
              <Card className="border-0 shadow-lg h-full">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 text-xl mb-4">Lightning Fast</h3>
                  <ul className="space-y-3">
                    {securityFeatures.map((item, index) => (
                      <motion.li
                        key={`security-${index}-${item.label}`}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: shouldAnimate ? -20 : 0 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: shouldAnimate ? 0.3 : 0.1,
                          delay: shouldAnimate ? 0.3 + index * 0.1 : 0
                        }}
                      >
                        <motion.div
                          className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center"
                          whileHover={shouldAnimate ? { scale: 1.1 } : {}}
                        >
                          <item.icon className="w-4 h-4 text-orange-500" />
                        </motion.div>
                        <span className="text-gray-700">{item.label}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </AnimatedCard>

            {/* Roadmap Card */}
            <AnimatedCard index={2} shouldAnimate={shouldAnimate}>
              <Card id="roadmap" className="bg-slate-800 border-0 text-white h-full">
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-4">The Roadmap Ahead</h3>
                  <ul className="space-y-3">
                    {roadmapItems.map((item, index) => (
                      <motion.li
                        key={`roadmap-${index}`}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: shouldAnimate ? -20 : 0 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: shouldAnimate ? 0.3 : 0.1,
                          delay: shouldAnimate ? 0.4 + index * 0.1 : 0
                        }}
                      >
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        <span className="text-gray-300">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>
        </div>
      </section>
    </>
  );
}
