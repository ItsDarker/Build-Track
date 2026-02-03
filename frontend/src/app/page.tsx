import { TopNav } from "@/components/ui-kit/TopNav";
import { Hero } from "@/components/ui-kit/Hero";
import { FeatureCards } from "@/components/ui-kit/FeatureCards";
import { Footer } from "@/components/ui-kit/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <TopNav />
      <Hero />
      <FeatureCards />
      <Footer />
    </main>
  );
}
