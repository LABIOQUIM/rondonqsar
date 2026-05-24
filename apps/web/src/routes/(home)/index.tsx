import { createFileRoute } from "@tanstack/react-router";

import { buildSeoHead, DEFAULT_SITE_URL } from "@/lib/seo";
import { loadRuntimeSeoData } from "@/lib/seo.runtime";

import { LanderBackingSection } from "./-components/BackingSection";
import { LanderCallToActionSection } from "./-components/CallToActionSection";
import { LanderFeaturesSection } from "./-components/FeaturesSection";
import { LanderHeroSection } from "./-components/HeroSection";
import { LanderLayout } from "./-components/Layout";
import { LanderResearchSection } from "./-components/ResearchSection";
import { LanderResultsSection } from "./-components/ResultsSection";

export const Route = createFileRoute("/(home)/")({
  loader: () => loadRuntimeSeoData(),
  head: ({ loaderData }) =>
    buildSeoHead({
      title: "Malaria and Leishmaniasis QSAR Application",
      description:
        "RondonQSAR is a browser-based application for malaria and leishmaniasis QSAR screening, SDF submission, descriptor-driven prediction, and result review.",
      path: "/",
      index: true,
      siteUrl: loaderData?.siteUrl ?? DEFAULT_SITE_URL,
    }),
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <LanderLayout>
      <LanderHeroSection />
      <LanderResearchSection />
      <LanderFeaturesSection />
      <LanderResultsSection />
      <LanderBackingSection />
      <LanderCallToActionSection />
    </LanderLayout>
  );
}
