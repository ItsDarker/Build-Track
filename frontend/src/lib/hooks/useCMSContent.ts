"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

export interface Section {
  id: string;
  type: string;
  title: string;
  content: Record<string, any>;
  order: number;
}

// Default homepage content structure (same as in CMS editor)
const defaultSections: Section[] = [
  {
    id: "hero_1",
    type: "hero",
    title: "Hero Section",
    order: 0,
    content: {
      headline: "One Reliable Place for",
      highlightedText: "Construction Tracking",
      subheadline: "The single source of truth for status, ownership, and accountability—so nothing falls through the cracks.",
      ctaText: "Get Started",
      ctaLink: "/signup",
    },
  },
  {
    id: "features_1",
    type: "features",
    title: "Features Section",
    order: 1,
    content: {
      sectionTitle: "Stop the Chaos of Scattered Data",
      sectionSubtitle: "The single source of truth for stakeholders. Here, the organized oversight of the hosted infrastructure of the tracks.",
      features: [
        {
          icon: "CheckCircle2",
          title: "Task & Issue Tracking",
          description: "Assign tasks with clear ownership and deadlines.",
          bullets: ["Project Managers", "Contractors", "Owner/Builders"],
        },
        {
          icon: "Shield",
          title: "Role-Based Access Control (RBAC)",
          description: "Control who sees what with granular permissions.",
          bullets: ["Project Managers", "Contractors", "Owner/Builders"],
        },
        {
          icon: "FileText",
          title: "Immutable Audit Trail",
          description: "Every change is logged. Nothing gets lost. Complete accountability.",
          bullets: ["Track all changes", "Secure records", "Full history"],
        },
      ],
    },
  },
  {
    id: "security_1",
    type: "security",
    title: "Security Section",
    order: 2,
    content: {
      sectionTitle: "Built for Speed and Security",
      features: [
        { icon: "Lock", label: "Secure" },
        { icon: "Shield", label: "Secure by Design" },
        { icon: "Wifi", label: "Always Connected" },
      ],
      roadmap: [
        "Gantt chart views",
        "File attachments",
        "Dedicated mobile apps for iOS & Android",
      ],
    },
  },
];

const CMS_STORAGE_KEY = "cms_homepage_content";

// Helper to safely get localStorage (returns null on server)
function getStoredContent(): Section[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CMS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading CMS content:", e);
  }
  return null;
}

export function useCMSContent() {
  // Track if we're on the client and hydrated
  const [isHydrated, setIsHydrated] = useState(false);
  const [sections, setSections] = useState<Section[]>(defaultSections);

  // Handle hydration - only run on client after mount
  useEffect(() => {
    setIsHydrated(true);

    // Load from localStorage after hydration
    const stored = getStoredContent();
    if (stored) {
      setSections(stored);
    }
  }, []);

  // Listen for CMS updates and storage changes
  useEffect(() => {
    if (!isHydrated) return;

    // Listen for CMS updates from the same tab
    const handleCMSUpdate = (event: CustomEvent<{ page: string; sections: Section[] }>) => {
      if (event.detail.page === "home" && event.detail.sections) {
        setSections(event.detail.sections);
      }
    };

    // Listen for storage events (for cross-tab updates)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CMS_STORAGE_KEY) {
        const stored = getStoredContent();
        if (stored) {
          setSections(stored);
        }
      }
    };

    window.addEventListener("cms-content-updated" as any, handleCMSUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("cms-content-updated" as any, handleCMSUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isHydrated]);

  // Helper to get a specific section by type
  const getSection = useCallback(
    (type: string): Section | undefined => {
      return sections.find((s) => s.type === type);
    },
    [sections]
  );

  // Helper to get hero content with defaults
  const getHeroContent = useCallback(() => {
    const hero = getSection("hero");
    return {
      headline: hero?.content?.headline || "One Reliable Place for",
      highlightedText: hero?.content?.highlightedText || "Construction Tracking",
      subheadline: hero?.content?.subheadline || "The single source of truth for status, ownership, and accountability—so nothing falls through the cracks.",
      ctaText: hero?.content?.ctaText || "Get Started",
      ctaLink: hero?.content?.ctaLink || "/signup",
    };
  }, [getSection]);

  // Helper to get features content with defaults
  const getFeaturesContent = useCallback(() => {
    const features = getSection("features");
    return {
      sectionTitle: features?.content?.sectionTitle || "Stop the Chaos of Scattered Data",
      sectionSubtitle: features?.content?.sectionSubtitle || "The single source of truth for stakeholders.",
      features: features?.content?.features || defaultSections[1].content.features,
    };
  }, [getSection]);

  // Helper to get security content with defaults
  const getSecurityContent = useCallback(() => {
    const security = getSection("security");
    return {
      sectionTitle: security?.content?.sectionTitle || "Built for Speed and Security",
      features: security?.content?.features || defaultSections[2].content.features,
      roadmap: security?.content?.roadmap || defaultSections[2].content.roadmap,
    };
  }, [getSection]);

  return {
    sections,
    isHydrated,
    getSection,
    getHeroContent,
    getFeaturesContent,
    getSecurityContent,
  };
}

// Export defaults so CMS can use them
export { defaultSections };
