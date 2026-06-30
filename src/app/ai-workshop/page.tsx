import type { Metadata } from "next";
import WorkshopHeader from "@/components/workshop/Header";
import SocialProof from "@/components/workshop/SocialProof";
import RegistrationForm from "@/components/workshop/RegistrationForm";
import TopicsSection from "@/components/workshop/TopicsSection";
import ScrollToTop from "@/components/workshop/ScrollToTop";
import { getWorkshopConfig } from "@/lib/workshop-supabase";

export const metadata: Metadata = {
  title: "ABTalks | FREE AI Bootcamp - Live Workshop",
  description:
    "Join ABTalks FREE 1-Hour Live AI Bootcamp on Zoom. Learn practical AI skills through hands-on demonstrations.",
  keywords:
    "AI, bootcamp, workshop, ChatGPT, Claude, Gemini, prompt engineering, ABTalks",
  openGraph: {
    title: "ABTalks | FREE AI Bootcamp",
    description: "Join the FREE 1-Hour Live AI Bootcamp on Zoom",
    type: "website",
  },
};

export default async function AIWorkshopPage() {
  const config = await getWorkshopConfig();
  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        background: "linear-gradient(to right, #ffe8d6 0%, #ffffff 50%, #ffe0ec 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: "fixed",
          top: "-100px",
          left: "-100px",
          width: "500px",
          height: "500px",
          zIndex: -1,
          opacity: 0.2,
          borderRadius: "50%",
          filter: "blur(90px)",
          background: "#ffdcca",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-100px",
          right: "-80px",
          width: "400px",
          height: "400px",
          zIndex: -1,
          opacity: 0.18,
          borderRadius: "50%",
          filter: "blur(90px)",
          background: "#fbcfe8",
        }}
      />

      <WorkshopHeader targetUtc={config.webinarTargetUtc} />
      <SocialProof />

      <section style={{ padding: "24px 0 40px" }}>
        <RegistrationForm whatsappLink={config.whatsappLink} />
      </section>

      <TopicsSection />

      <section style={{ textAlign: "center", paddingBottom: "64px" }}>
        <ScrollToTop />
      </section>
    </div>
  );
}
