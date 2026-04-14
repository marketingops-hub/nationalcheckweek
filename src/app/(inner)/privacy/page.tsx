import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RenderBlock, type Block } from "@/components/cms/CmsPageBlocks";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy Policy | National Check-In Week",
  description: "How National Check-In Week collects, uses, and protects your personal information.",
};

export default async function PrivacyPage() {
  const sb = await createClient();
  const { data: cmsPage } = await sb
    .from("pages")
    .select("title, description, content")
    .eq("slug", "privacy")
    .eq("status", "published")
    .single();

  const blocks = cmsPage ? (cmsPage.content ?? []) as Block[] : null;

  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">Legal</div>
          <h1 className="page-hero__title">Privacy Policy</h1>
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
          <h2>1. Introduction</h2>
          <p>
            National Check-In Week (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your
            personal information in accordance with the <em>Privacy Act 1988</em> (Cth) and the
            Australian Privacy Principles (APPs). This policy explains how we collect, use,
            disclose, and safeguard your information when you visit{" "}
            <a href="https://nationalcheckinweek.com">nationalcheckinweek.com</a>.
          </p>
        </section>

        <section className="event-section">
          <h2>2. Information We Collect</h2>
          <p>We may collect the following types of personal information:</p>
          <ul>
            <li><strong>Contact information</strong> — name, email address, school name, and role when you register for an event or contact us.</li>
            <li><strong>Usage data</strong> — pages visited, time on site, browser type, and referring URL, collected via analytics tools.</li>
            <li><strong>Event registrations</strong> — information you provide when registering for webinars or professional learning sessions.</li>
          </ul>
          <p>We do not knowingly collect personal information from individuals under the age of 18.</p>
        </section>

        <section className="event-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Process event registrations and send confirmations</li>
            <li>Send updates about National Check-In Week events and resources</li>
            <li>Improve our website and services</li>
            <li>Respond to enquiries and provide support</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>We will not sell, trade, or rent your personal information to third parties.</p>
        </section>

        <section className="event-section">
          <h2>4. Disclosure of Information</h2>
          <p>
            We may share your information with trusted third-party service providers who assist us in
            operating our website and conducting our events (such as HubSpot for event registration),
            provided they agree to keep this information confidential. We may also disclose information
            where required by law or to protect the rights, property, or safety of our organisation,
            participants, or the public.
          </p>
        </section>

        <section className="event-section">
          <h2>5. Data Storage and Security</h2>
          <p>
            Your personal information is stored on secure servers hosted within Australia and managed
            through Supabase. We implement industry-standard security measures including encryption,
            access controls, and regular security reviews. However, no method of transmission over
            the internet is 100% secure and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="event-section">
          <h2>6. Cookies and Analytics</h2>
          <p>
            Our website uses cookies and similar tracking technologies to analyse site traffic and
            improve user experience. You can instruct your browser to refuse all cookies or to
            indicate when a cookie is being sent. However, some site features may not function
            properly without cookies.
          </p>
        </section>

        <section className="event-section">
          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information (subject to legal obligations)</li>
            <li>Opt out of marketing communications at any time</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{" "}
            <a href="mailto:events@nationalcheckinweek.com">events@nationalcheckinweek.com</a>.
          </p>
        </section>

        <section className="event-section">
          <h2>8. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We have no control over the
            content or privacy practices of those sites and encourage you to review their privacy
            policies independently.
          </p>
        </section>

        <section className="event-section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes by posting the new policy on this page with an updated date. Your continued use
            of the site after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="event-section">
          <h2>10. Contact Us</h2>
          <p>
            If you have questions or complaints about this Privacy Policy or our privacy practices,
            please contact us:
          </p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:events@nationalcheckinweek.com">events@nationalcheckinweek.com</a></li>
            <li><strong>Phone:</strong> <a href="tel:1300889018">1300 889 018</a></li>
            <li><strong>Address:</strong> 4/597 Darling Street, Rozelle NSW 2039, Australia</li>
          </ul>
          <p>
            If you are not satisfied with our response, you may lodge a complaint with the{" "}
            <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">
              Office of the Australian Information Commissioner (OAIC)
            </a>.
          </p>
        </section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/terms" style={{ color: "var(--primary)" }}>Terms and Conditions →</Link>
          <Link href="/contact" style={{ color: "var(--primary)" }}>Contact Us →</Link>
        </div>
        </>)}

      </main>
    </>
  );
}
