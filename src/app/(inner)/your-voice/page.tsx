import type { Metadata } from "next";
import YourVoiceFormClient from "@/components/YourVoiceFormClient";

export const metadata: Metadata = {
  title: "Your Voice | National Check-in Week",
  description: "Share what you are seeing in the lives of children and young people today. Your perspective helps shape a stronger response.",
};

export default function YourVoicePage() {

  return (
    <>
      {/* HERO */}
      <div className="page-hero" style={{ borderBottomColor: "#E5007E" }}>
        <div className="page-hero__inner">
          <div style={{
            display: "inline-block",
            background: "rgba(229,0,126,0.1)",
            color: "#E5007E",
            borderRadius: 999,
            padding: "4px 14px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}>
            🎤 Have Your Say
          </div>
          <div className="page-hero__icon">🗣️</div>
          <h1 className="page-hero__title page-hero__title--detail">
            Your voice matters
          </h1>
          <p className="page-hero__subtitle page-hero__subtitle--detail">
            We are inviting educators, parents and carers to share what they are
            seeing in the lives of children and young people today.
          </p>
        </div>
      </div>

      <main id="main-content" className="inner-content">
        {/* Intro */}
        <section className="inner-section" style={{ maxWidth: 720 }}>
          <p className="body-text" style={{ fontSize: "1.1rem", lineHeight: 1.8 }}>
            Your perspective is valuable. Your insight is important. What you
            share can help shape a stronger response for young people across
            Australia.
          </p>
          <p className="body-text" style={{ marginTop: 16 }}>
            The conversation below takes just a few minutes and your responses
            are completely confidential. Every submission is reviewed by our
            team and contributes directly to the evidence base behind National
            Check-in Week.
          </p>
        </section>

        {/* HubSpot form embed */}
        <section className="inner-section" style={{ padding: "0 0 48px" }}>
          <YourVoiceFormClient 
            formId="a3eee4c7-5885-4b56-b530-ff1079a17e1a"
            portalId="4596264"
            region="ap1"
          />
        </section>
      </main>
    </>
  );
}
