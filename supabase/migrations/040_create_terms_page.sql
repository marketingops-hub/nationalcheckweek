-- Create Terms of Service CMS page
-- This creates a terms page that can be managed through the CMS

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
  'terms',
  'Terms of Service',
  '<h1>Terms of Service</h1>

<p><strong>Effective Date:</strong> March 2026</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing and using the National Check-in Week website and services, you accept and agree to be bound by the terms and provision of this agreement.</p>

<h2>2. Use License</h2>
<p>Permission is granted to temporarily access the materials (information or software) on National Check-in Week''s website for personal, non-commercial transitory viewing only.</p>

<p>This is the grant of a license, not a transfer of title, and under this license you may not:</p>
<ul>
  <li>Modify or copy the materials</li>
  <li>Use the materials for any commercial purpose or for any public display</li>
  <li>Attempt to reverse engineer any software contained on National Check-in Week''s website</li>
  <li>Remove any copyright or other proprietary notations from the materials</li>
  <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
</ul>

<h2>3. Registration and Account</h2>
<p>When you register for National Check-in Week events or services:</p>
<ul>
  <li>You must provide accurate and complete information</li>
  <li>You are responsible for maintaining the confidentiality of your account</li>
  <li>You are responsible for all activities that occur under your account</li>
  <li>You must notify us immediately of any unauthorized use of your account</li>
</ul>

<h2>4. User Content and Conduct</h2>
<p>You agree not to use our services to:</p>
<ul>
  <li>Upload or transmit any unlawful, harmful, or offensive content</li>
  <li>Impersonate any person or entity</li>
  <li>Interfere with or disrupt the services or servers</li>
  <li>Violate any applicable laws or regulations</li>
  <li>Collect or store personal data about other users without their consent</li>
</ul>

<h2>5. Intellectual Property</h2>
<p>The content, organization, graphics, design, and other matters related to National Check-in Week are protected under applicable copyrights and other proprietary laws. Copying, redistribution, use or publication of any such matters or any part of the site is prohibited.</p>

<h2>6. Educational Content and Resources</h2>
<p>All webinars, resources, and educational materials provided through National Check-in Week are for informational and educational purposes only. They do not constitute professional advice and should not be relied upon as such.</p>

<h2>7. Third-Party Links and Services</h2>
<p>Our website may contain links to third-party websites or services. We are not responsible for the content, accuracy, or practices of these external sites. Your use of third-party websites is at your own risk.</p>

<h2>8. Disclaimer of Warranties</h2>
<p>The materials on National Check-in Week''s website are provided on an "as is" basis. National Check-in Week makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

<h2>9. Limitations of Liability</h2>
<p>In no event shall National Check-in Week or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on National Check-in Week''s website.</p>

<h2>10. Event Registration and Cancellation</h2>
<p>For events and webinars:</p>
<ul>
  <li>Registration is subject to availability</li>
  <li>We reserve the right to cancel or reschedule events</li>
  <li>Participants will be notified of any changes via email</li>
  <li>No refunds are applicable as all events are free</li>
</ul>

<h2>11. Data Protection and Privacy</h2>
<p>Your use of our services is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.</p>

<h2>12. Modifications to Terms</h2>
<p>National Check-in Week may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.</p>

<h2>13. Governing Law</h2>
<p>These terms and conditions are governed by and construed in accordance with the laws of Australia, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>

<h2>14. Termination</h2>
<p>We reserve the right to terminate or suspend access to our services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

<h2>15. Severability</h2>
<p>If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the Terms will otherwise remain in full force and effect.</p>

<h2>16. Contact Information</h2>
<p>If you have any questions about these Terms of Service, please contact us at:</p>
<p>
  <strong>Email:</strong> events@nationalcheckinweek.com<br>
  <strong>Website:</strong> <a href="https://nationalcheckinweek.com">nationalcheckinweek.com</a>
</p>

<hr>

<p><em>These terms of service were last updated on March 31, 2026.</em></p>',
  'Terms of Service — National Check-in Week',
  'Read the terms of service for National Check-in Week. Learn about your rights and responsibilities when using our website and services.',
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
  SELECT EXISTS(SELECT 1 FROM cms_pages WHERE slug = 'terms') INTO page_exists;
  
  IF page_exists THEN
    RAISE NOTICE 'SUCCESS: Terms of service page created at /terms';
  ELSE
    RAISE WARNING 'Terms of service page was not created';
  END IF;
END $$;
