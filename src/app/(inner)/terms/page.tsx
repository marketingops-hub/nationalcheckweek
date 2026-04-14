import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RenderBlock, type Block } from "@/components/cms/CmsPageBlocks";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terms and Conditions | National Check-In Week",
  description: "Terms and conditions governing your use of the National Check-In Week website and participation in our events.",
};

export default async function TermsPage() {
  const sb = await createClient();
  const { data: cmsPage } = await sb
    .from("pages")
    .select("title, description, content")
    .eq("slug", "terms")
    .eq("status", "published")
    .single();

  const blocks = cmsPage ? (cmsPage.content ?? []) as Block[] : null;

  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">Legal</div>
          <h1 className="page-hero__title">Terms and Conditions</h1>
          <p className="page-hero__subtitle">
            Last updated: May 2026
          </p>
        </div>
      </div>

      <main className="inner-content" id="main-content" style={{ maxWidth: 800, margin: "0 auto" }}>

        {blocks && blocks.length > 0 ? (
          <>
            {blocks.map(block => <RenderBlock key={block.id} block={block} />)}
          </>
        ) : null}

        {(!blocks || blocks.length === 0) && (<><section className="event-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the National Check-In Week website at{" "}
            <a href="https://nationalcheckinweek.com">nationalcheckinweek.com</a> (&quot;Site&quot;),
            or by registering for or participating in any National Check-In Week event, you agree to
            be bound by these Terms and Conditions. If you do not agree, please do not use the Site
            or participate in our events.
          </p>
        </section>

        <section className="event-section">
          <h2>2. About National Check-In Week</h2>
          <p>
            National Check-In Week (&quot;NCIW&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a free initiative
            operated by Life Skills Group, aimed at improving student wellbeing in Australian schools.
            Our registered address is 4/597 Darling Street, Rozelle NSW 2039, Australia.
          </p>
        </section>

        <section className="event-section">
          <h2>3. Use of the Site</h2>
          <p>You agree to use this Site only for lawful purposes and in a manner that does not:</p>
          <ul>
            <li>Infringe the rights of others</li>
            <li>Restrict or inhibit anyone&apos;s use or enjoyment of the Site</li>
            <li>Transmit any unsolicited or unauthorised advertising or promotional material</li>
            <li>Introduce any malware, viruses, or other harmful material</li>
            <li>Attempt to gain unauthorised access to any part of the Site or its related systems</li>
          </ul>
        </section>

        <section className="event-section">
          <h2>4. Event Participation</h2>
          <p>
            All events offered through National Check-In Week are provided free of charge to eligible
            Australian school leaders, educators, and wellbeing professionals. By registering for an
            event, you agree to:
          </p>
          <ul>
            <li>Provide accurate registration information</li>
            <li>Use event access links solely for your own attendance</li>
            <li>Not record, reproduce, or distribute event content without our prior written consent</li>
            <li>Conduct yourself professionally and respectfully during all sessions</li>
          </ul>
          <p>
            We reserve the right to cancel or reschedule events. Registered participants will be
            notified by email where possible.
          </p>
        </section>

        <section className="event-section">
          <h2>5. Intellectual Property</h2>
          <p>
            All content on this Site — including text, data, graphics, logos, icons, images, audio
            clips, and software — is the property of National Check-In Week or its content suppliers
            and is protected by Australian and international copyright law. You may not reproduce,
            distribute, or create derivative works from any content on this Site without our express
            written permission.
          </p>
          <p>
            Resources and materials made available for download are provided for educational purposes
            only and may not be used for commercial purposes.
          </p>
        </section>

        <section className="event-section">
          <h2>6. Data and Statistics</h2>
          <p>
            Wellbeing data, statistics, and insights presented on this Site are derived from
            anonymised and aggregated sources, including the Life Skills GO platform. While we take
            care to ensure accuracy, this information is provided for general educational purposes
            only and should not be relied upon as professional advice. All sources are listed on our{" "}
            <Link href="/sources">Sources page</Link>.
          </p>
        </section>

        <section className="event-section">
          <h2>7. Disclaimers and Limitation of Liability</h2>
          <p>
            This Site and all content are provided &quot;as is&quot; without warranty of any kind, either
            express or implied. To the maximum extent permitted by applicable law, we exclude all
            liability for any loss or damage arising from your use of the Site or reliance on any
            information contained on it.
          </p>
          <p>
            Nothing in these Terms excludes, restricts, or modifies any consumer guarantee, right,
            or remedy conferred by the <em>Australian Consumer Law</em> that cannot be excluded,
            restricted, or modified.
          </p>
        </section>

        <section className="event-section">
          <h2>8. Third-Party Links</h2>
          <p>
            The Site may contain links to third-party websites. These links are provided for
            convenience only. We have no control over the content of linked sites and accept no
            responsibility for them or for any loss or damage that may arise from your use of them.
          </p>
        </section>

        <section className="event-section">
          <h2>9. Privacy</h2>
          <p>
            Your use of this Site is also governed by our{" "}
            <Link href="/privacy">Privacy Policy</Link>, which is incorporated into these Terms by
            reference.
          </p>
        </section>

        <section className="event-section">
          <h2>10. Changes to These Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be effective
            immediately upon posting to the Site. Your continued use of the Site following the
            posting of revised Terms constitutes your acceptance of the changes.
          </p>
        </section>

        <section className="event-section">
          <h2>11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of New South Wales, Australia. Any disputes arising
            under these Terms are subject to the exclusive jurisdiction of the courts of New South
            Wales.
          </p>
        </section>

        <section className="event-section">
          <h2>12. Contact Us</h2>
          <p>For questions about these Terms, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:events@nationalcheckinweek.com">events@nationalcheckinweek.com</a></li>
            <li><strong>Phone:</strong> <a href="tel:1300889018">1300 889 018</a></li>
            <li><strong>Address:</strong> 4/597 Darling Street, Rozelle NSW 2039, Australia</li>
          </ul>
        </section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ color: "var(--primary)" }}>Privacy Policy →</Link>
          <Link href="/contact" style={{ color: "var(--primary)" }}>Contact Us →</Link>
        </div>
        </>)}

      </main>
    </>
  );
}
