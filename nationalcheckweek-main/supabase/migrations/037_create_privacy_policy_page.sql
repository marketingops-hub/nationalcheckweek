-- Create Privacy Policy CMS page
-- This creates a privacy policy page that can be managed through the CMS

INSERT INTO cms_pages (
  slug,
  title,
  content,
  meta_title,
  meta_description,
  published,
  created_at,
  updated_at
) VALUES (
  'privacy',
  'Privacy Policy',
  '<h1>Privacy Policy</h1>

<p><strong>Effective Date:</strong> March 2026</p>

<h2>1. Introduction</h2>
<p>National Check-in Week ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>

<h2>2. Information We Collect</h2>

<h3>Personal Information</h3>
<p>We may collect personal information that you voluntarily provide to us when you:</p>
<ul>
  <li>Register for events or webinars</li>
  <li>Subscribe to our newsletter</li>
  <li>Fill out forms on our website</li>
  <li>Contact us directly</li>
</ul>

<p>This information may include:</p>
<ul>
  <li>Name</li>
  <li>Email address</li>
  <li>School or organization name</li>
  <li>Phone number</li>
  <li>Job title or role</li>
</ul>

<h3>Automatically Collected Information</h3>
<p>When you visit our website, we may automatically collect certain information about your device, including:</p>
<ul>
  <li>IP address</li>
  <li>Browser type</li>
  <li>Operating system</li>
  <li>Access times</li>
  <li>Pages viewed</li>
  <li>Referring website addresses</li>
</ul>

<h2>3. How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
  <li>Provide, operate, and maintain our website and services</li>
  <li>Process your registrations for events and webinars</li>
  <li>Send you information about National Check-in Week activities</li>
  <li>Respond to your inquiries and provide customer support</li>
  <li>Improve our website and services</li>
  <li>Send you newsletters and marketing communications (with your consent)</li>
  <li>Analyze usage patterns and trends</li>
  <li>Comply with legal obligations</li>
</ul>

<h2>4. Disclosure of Your Information</h2>
<p>We may share your information in the following circumstances:</p>

<h3>Service Providers</h3>
<p>We may share your information with third-party service providers who perform services on our behalf, such as:</p>
<ul>
  <li>Email marketing platforms</li>
  <li>Event management systems</li>
  <li>Analytics providers</li>
  <li>Hosting services</li>
</ul>

<h3>Legal Requirements</h3>
<p>We may disclose your information if required to do so by law or in response to valid requests by public authorities.</p>

<h3>Business Transfers</h3>
<p>If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>

<h2>5. Cookies and Tracking Technologies</h2>
<p>We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>

<h2>6. Third-Party Links</h2>
<p>Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.</p>

<h2>7. Data Security</h2>
<p>We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>

<h2>8. Your Rights</h2>
<p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
<ul>
  <li>Access to your personal information</li>
  <li>Correction of inaccurate information</li>
  <li>Deletion of your information</li>
  <li>Objection to processing</li>
  <li>Data portability</li>
  <li>Withdrawal of consent</li>
</ul>

<h2>9. Children''s Privacy</h2>
<p>Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.</p>

<h2>10. International Data Transfers</h2>
<p>Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ.</p>

<h2>11. Changes to This Privacy Policy</h2>
<p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date."</p>

<h2>12. Contact Us</h2>
<p>If you have questions or concerns about this Privacy Policy, please contact us at:</p>
<p>
  <strong>Email:</strong> events@nationalcheckinweek.com<br>
  <strong>Website:</strong> <a href="https://nationalcheckinweek.com">nationalcheckinweek.com</a>
</p>

<hr>

<p><em>This privacy policy was last updated on March 31, 2026.</em></p>',
  'Privacy Policy — National Check-in Week',
  'Learn how National Check-in Week collects, uses, and protects your personal information. Read our privacy policy for details on data handling and your rights.',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  updated_at = NOW();

-- Verify the page was created
DO $$
DECLARE
  page_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM cms_pages WHERE slug = 'privacy') INTO page_exists;
  
  IF page_exists THEN
    RAISE NOTICE 'SUCCESS: Privacy policy page created at /privacy';
  ELSE
    RAISE WARNING 'Privacy policy page was not created';
  END IF;
END $$;
