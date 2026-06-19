"use client";

/*
 * /admin/tutorial
 *
 * Interactive guide explaining every admin feature.
 * Organised into the same 5 sections as the sidebar.
 * Each feature card shows: what it is, when to use it,
 * step-by-step workflow, tips, and a direct link.
 */

import { useState } from 'react';
import Link from 'next/link';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Step  { icon: string; text: string }
interface Tip   { kind: 'tip' | 'warning' | 'info'; text: string }

interface Feature {
  id:       string;
  icon:     string;
  label:    string;
  href:     string;
  tagline:  string;
  what:     string;
  when:     string;
  steps:    Step[];
  tips:     Tip[];
}

interface Section {
  id:    string;
  label: string;
  icon:  string;
  color: string;
  features: Feature[];
}

/* ─── Content ────────────────────────────────────────────────────────────── */

const SECTIONS: Section[] = [
  {
    id: 'content', label: 'Content', icon: 'database', color: '#3b82f6',
    features: [
      {
        id: 'dashboard', icon: 'dashboard', label: 'Dashboard', href: '/admin',
        tagline: 'Your admin home base',
        what: 'The dashboard is the first screen you see when you log in. It shows a high-level overview of the platform — page counts, recent activity, and quick links to the most common tasks.',
        when: 'Check it any time you want a snapshot of what\'s happening on the site without drilling into individual sections.',
        steps: [
          { icon: 'login', text: 'Log in at /admin/login with your admin credentials.' },
          { icon: 'visibility', text: 'The dashboard loads automatically — scan KPI cards for totals (issues, events, pages, etc.).' },
          { icon: 'open_in_new', text: 'Use the quick-action links to jump straight to the most common tasks.' },
        ],
        tips: [
          { kind: 'tip', text: 'Bookmark /admin directly — it always redirects to the dashboard after login.' },
        ],
      },
      {
        id: 'issues', icon: 'description', label: 'Issues', href: '/admin/issues',
        tagline: 'The core wellbeing data powering the site',
        what: 'Issues are the foundation of National Check-in Week. Each issue (e.g. "Anxiety", "Loneliness") has a rank, icon, title, severity level, and an anchor statistic shown on its public page. Everything else on the site (states, areas, votes) connects back to these.',
        when: 'Use this when you need to add a new wellbeing issue, update statistics, reorder how issues are displayed, or bulk-rewrite issue descriptions with AI.',
        steps: [
          { icon: 'list', text: 'Open Issues to see all 59+ issues sorted by rank.' },
          { icon: 'add', text: 'Click "New Issue" to create one — fill in title, icon, severity, and the anchor statistic.' },
          { icon: 'edit', text: 'Click any row to edit. Change the rank number to reorder it on the public site.' },
          { icon: 'auto_awesome', text: 'Select multiple issues with the checkbox, then click "AI Rewrite" to bulk-refresh descriptions using vault-grounded content.' },
          { icon: 'save', text: 'Save — changes appear on the public site immediately.' },
        ],
        tips: [
          { kind: 'warning', text: 'Rank determines display order everywhere on the site. Duplicate ranks will cause inconsistent ordering — keep them unique.' },
          { kind: 'tip', text: 'The anchor statistic (e.g. "1 in 4 young Australians...") is the most-read text on each issue page. Make it specific and cited.' },
          { kind: 'info', text: 'AI rewrites use your Vault documents as source material — the more Vault content you have, the better the rewrites.' },
        ],
      },
      {
        id: 'votes', icon: 'thumbs_up_down', label: 'Votes & Feedback', href: '/admin/votes',
        tagline: 'Real-time public sentiment on wellbeing data',
        what: 'Every public issue page has an up/down vote mechanism. This section shows you aggregate vote counts, per-page breakdowns (upvotes %, downvotes %, support %), and individual feedback cards where visitors have written comments.',
        when: 'Review weekly to understand which issues resonate with your audience and which may need content updates. Written feedback is especially valuable for identifying gaps.',
        steps: [
          { icon: 'bar_chart', text: 'Open Votes & Feedback to see the summary table — each row is one issue page.' },
          { icon: 'filter_list', text: 'Filter to show only "negative votes with written feedback" to find the most actionable responses.' },
          { icon: 'mail', text: 'Each feedback card shows the visitor\'s email (if provided) — use this to follow up if appropriate.' },
          { icon: 'edit', text: 'If a particular issue consistently gets negative feedback, navigate to Issues to update its content.' },
        ],
        tips: [
          { kind: 'tip', text: 'High downvote rates usually mean the statistic feels outdated or doesn\'t resonate — update the anchor stat.' },
          { kind: 'info', text: 'Votes are stored per-session, so the same user can\'t vote multiple times on the same issue.' },
        ],
      },
      {
        id: 'states', icon: 'bar_chart', label: 'States & Data', href: '/admin/states',
        tagline: 'Australian state and territory pages',
        what: 'Each Australian state and territory has its own public page showing localised wellbeing data. This section lets you manage those pages — their icon, subtitle, and which issues are highlighted for that state.',
        when: 'Use when you need to update state-specific statistics, change which issues are featured for a particular state, or create a new state/territory entry.',
        steps: [
          { icon: 'list', text: 'Open States & Data — you\'ll see all 8 states/territories listed.' },
          { icon: 'edit', text: 'Click a state to edit its icon, subtitle text, and which issues are linked.' },
          { icon: 'add', text: 'Click "New State" to add a territory not yet covered (rare, but useful for future content).' },
          { icon: 'save', text: 'Save — the public state page updates immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'State pages are great for SEO — each one targets a distinct geo keyword ("mental health Queensland teens").' },
          { kind: 'info', text: 'Issues linked to a state appear in the state\'s public breakdown — prioritise the 3–5 most relevant issues per state.' },
        ],
      },
      {
        id: 'areas', icon: 'location_on', label: 'Areas', href: '/admin/content',
        tagline: 'City, region, and LGA-level pages',
        what: 'Areas are the most granular geographic level — suburbs, LGAs, and regional cities each get their own page with localised data. There are hundreds of area pages, each with SEO titles, linked issues, and optionally a GEO-targeted CMS page.',
        when: 'Use when a specific city or region needs updated content, a new LGA page is requested, or you\'re running an SEO campaign targeting a specific geographic area.',
        steps: [
          { icon: 'search', text: 'Search by suburb or filter by state to find the area you need.' },
          { icon: 'edit', text: 'Click an area to edit its name, state link, issue associations, and SEO metadata.' },
          { icon: 'add', text: 'Click "New Area" to add a location not yet in the system — enter name, state, area type (city/region/LGA).' },
          { icon: 'article', text: 'Optionally link a CMS Page (type: GEO) to the area for custom long-form content.' },
        ],
        tips: [
          { kind: 'tip', text: 'Areas without a custom CMS page use an auto-generated template — good enough for SEO but less engaging.' },
          { kind: 'info', text: 'The SEO title for each area is auto-generated in batch from the SEO Generator — no need to write them manually.' },
        ],
      },
      {
        id: 'schools', icon: 'school', label: 'Schools', href: '/admin/schools',
        tagline: 'National school database',
        what: 'A searchable database of Australian schools, each with ACARA ID, sector (government/independent/Catholic), type, year range, ICSEA score, and enrolment count. Schools can be linked to Areas for localised content.',
        when: 'Use when you need to verify a school\'s data, update enrolment figures, or bulk-import new schools from a CSV file after a data refresh from ACARA.',
        steps: [
          { icon: 'search', text: 'Search by school name, suburb, state, or postcode.' },
          { icon: 'edit', text: 'Click a school to view and edit its details.' },
          { icon: 'upload_file', text: 'To bulk-update: go to Schools → Import, download the CSV template, fill it in, and upload.' },
          { icon: 'check_circle', text: 'The import validates each row — any errors are shown inline before committing.' },
        ],
        tips: [
          { kind: 'warning', text: 'CSV imports append new schools and update existing ones matched by ACARA ID — they do not delete records. Always keep a backup.' },
          { kind: 'info', text: 'ICSEA (Index of Community Socio-Educational Advantage) scores range from ~500–1200, average ~1000. Used for demographic context.' },
        ],
      },
    ],
  },

  {
    id: 'public', label: 'Public Pages', icon: 'public', color: '#8b5cf6',
    features: [
      {
        id: 'events', icon: 'event', label: 'Events', href: '/admin/events',
        tagline: 'Webinars, workshops, and live sessions',
        what: 'Events are the public-facing schedule of National Check-in Week activities — webinars, workshops, panel discussions, and conferences. Each event has a title, date/time, format (online/in-person/hybrid), registration link, and optionally a recording URL that is shown to subscribers only after they fill in a HubSpot gate form.',
        when: 'Create events when a new session is scheduled. Update status to "published" to make it live. After the event, add the recording URL so past attendees and new visitors can access it behind the subscription gate.',
        steps: [
          { icon: 'add', text: 'Click "New Event" — fill in title, date, time, format, and a short description.' },
          { icon: 'link', text: 'Add the registration/RSVP URL (Eventbrite, Zoom, etc.) in the Registration URL field.' },
          { icon: 'toggle_on', text: 'Set Published to ON to make it visible on the public events page.' },
          { icon: 'videocam', text: 'After the event, return and paste the recording URL. The system automatically detects when the event date has passed and shows a HubSpot subscription gate — visitors must sign up before viewing the recording.' },
        ],
        tips: [
          { kind: 'info', text: 'Events are automatically marked as "past" based on the event date — you don\'t need to manually change the status.' },
          { kind: 'tip', text: 'The recording gate collects leads via HubSpot. Every person who watches a recording becomes a contact in your CRM.' },
          { kind: 'warning', text: 'If you leave recording URL blank, past event pages show "Recording coming soon" — fill it in as soon as the recording is ready.' },
        ],
      },
      {
        id: 'voice', icon: 'record_voice_over', label: 'Your Voice', href: '/admin/voice',
        tagline: 'The pink call-to-action block on every issue page',
        what: 'The "Your Voice" block is a prominent pink call-to-action that appears at the bottom of every wellbeing issue page. It invites visitors to share their perspective and is the primary conversion point on issue pages. You control the heading, body text, and button label/URL from one place.',
        when: 'Update when running a campaign ("Share your story for National Check-in Week"), changing the CTA destination, or adjusting the message for a specific period.',
        steps: [
          { icon: 'edit', text: 'Open Your Voice — you\'ll see the live preview on the right and editable fields on the left.' },
          { icon: 'title', text: 'Edit the Heading (e.g. "Share Your Experience") and Body text.' },
          { icon: 'link', text: 'Update the Button Label and URL (can link to a survey, form, or landing page).' },
          { icon: 'visibility', text: 'Toggle visibility ON/OFF — when OFF, the block is hidden from all issue pages.' },
          { icon: 'save', text: 'Save. Changes appear site-wide on every issue page immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'Keep the heading under 8 words — it\'s displayed large and truncates on mobile if too long.' },
          { kind: 'warning', text: 'This single block appears on all 59+ issue pages simultaneously. Test your copy in the preview before saving.' },
          { kind: 'info', text: 'The "Reset to defaults" button restores the original factory copy if your edits aren\'t working.' },
        ],
      },
      {
        id: 'ambassadors', icon: 'diversity_3', label: 'Ambassadors', href: '/admin/ambassadors',
        tagline: 'Program ambassador profiles',
        what: 'Manage the ambassador listings that appear on the public ambassadors page. Each ambassador has a name, photo, title/role, bio, and optionally social media links.',
        when: 'Add new ambassadors when they join the program, update bios after role changes, or remove ambassadors who have left.',
        steps: [
          { icon: 'add', text: 'Click "Add Ambassador" — fill in name, upload a headshot, and write a short bio.' },
          { icon: 'drag_indicator', text: 'Drag rows to reorder — the order here matches the public page.' },
          { icon: 'edit', text: 'Click any row to update details. Toggle visibility to temporarily hide without deleting.' },
          { icon: 'delete', text: 'Delete removes permanently — consider toggling visibility off instead for someone who may return.' },
        ],
        tips: [
          { kind: 'tip', text: 'Square headshots (at least 400×400px) look best — the display crops to a circle.' },
        ],
      },
      {
        id: 'submissions', icon: 'inbox', label: 'Submissions', href: '/admin/submissions',
        tagline: 'User-submitted stories and responses',
        what: 'When visitors click the "Your Voice" CTA and submit a story or response via a connected form, those submissions are stored here. You can review, moderate, and optionally feature them on the site.',
        when: 'Check weekly — especially during the National Check-in Week campaign period when submission volume spikes.',
        steps: [
          { icon: 'list', text: 'Open Submissions — submissions are listed newest first.' },
          { icon: 'visibility', text: 'Click any submission to read the full text and see the submitter\'s contact details.' },
          { icon: 'star', text: 'Mark notable submissions as "featured" to surface them on the public site (if your theme supports it).' },
          { icon: 'delete', text: 'Delete spam or inappropriate submissions — this action is permanent.' },
        ],
        tips: [
          { kind: 'warning', text: 'Submissions may contain sensitive personal disclosures. Handle with care and follow your organisation\'s privacy policy.' },
        ],
      },
      {
        id: 'partners', icon: 'handshake', label: 'Partners', href: '/admin/partners',
        tagline: 'Partner organisations and sponsor logos',
        what: 'The partners section manages the logos and listings for organisations that support National Check-in Week — sponsors, co-hosts, and partner organisations displayed on the public Partners page.',
        when: 'Add new partners when a sponsorship or MOU is signed. Update logos after brand refreshes. Reorder to reflect tier priority.',
        steps: [
          { icon: 'add', text: 'Click "Add Partner" — provide organisation name, logo file, website URL, and tier/category.' },
          { icon: 'drag_indicator', text: 'Drag to reorder within tiers. Order reflects display priority on the public page.' },
          { icon: 'toggle_on', text: 'Toggle visibility to show/hide a partner without deleting (useful for lapsed sponsors).' },
        ],
        tips: [
          { kind: 'tip', text: 'Use SVG or PNG logos with transparent backgrounds — they look cleanest on both light and dark backgrounds.' },
          { kind: 'info', text: 'Partner logos link to their website when clicked on the public page, so always fill in the URL.' },
        ],
      },
      {
        id: 'resources', icon: 'description', label: 'Resources', href: '/admin/resources',
        tagline: 'Downloadable guides, fact sheets, and toolkits',
        what: 'The resources section manages downloadable files and external links shown on the public Resources page — fact sheets, implementation guides, toolkits, research papers, and referral pathways.',
        when: 'Add a new resource when a document is published or a useful external link needs to be surfaced. Archive resources that are outdated.',
        steps: [
          { icon: 'add', text: 'Click "Add Resource" — enter title, description, category, and either upload a file or paste an external URL.' },
          { icon: 'category', text: 'Assign a category (e.g. "For Schools", "For Parents") — resources are grouped by category on the public page.' },
          { icon: 'drag_indicator', text: 'Reorder within categories. Featured resources appear at the top.' },
          { icon: 'archive', text: 'Archive (don\'t delete) outdated resources — archived items are hidden from public but preserved for reference.' },
        ],
        tips: [
          { kind: 'tip', text: 'Add a compelling description — it\'s the only thing users read before deciding to download.' },
          { kind: 'info', text: 'Files are stored in Supabase Storage. PDFs under 25MB upload without issues; larger files should be linked externally.' },
        ],
      },
      {
        id: 'faq', icon: 'help', label: 'FAQ', href: '/admin/faq',
        tagline: 'Frequently asked questions management',
        what: 'Manage the FAQ items displayed on the public FAQ page. Each FAQ has a question and a rich-text answer. FAQs are grouped into categories.',
        when: 'Add FAQs when new questions come in from schools, parents, or media. Update answers when policies or programs change. Reorder to surface the most common questions first.',
        steps: [
          { icon: 'add', text: 'Click "Add FAQ" — write the question exactly as a user would ask it, then write a clear answer.' },
          { icon: 'category', text: 'Assign a category (e.g. "For Schools", "About the Program").' },
          { icon: 'drag_indicator', text: 'Drag to reorder — the most-asked questions should be first.' },
          { icon: 'save', text: 'Save. Changes appear on the public FAQ page immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'FAQ content is excellent for AISEO — questions mirror exactly how people prompt AI assistants. Write each question as a complete sentence.' },
          { kind: 'info', text: 'Use plain language in answers — this page is read by parents, teachers, and students, not just professionals.' },
        ],
      },
    ],
  },

  {
    id: 'cms', label: 'CMS', icon: 'web', color: '#0891b2',
    features: [
      {
        id: 'homepage-builder', icon: 'web', label: 'Homepage Builder', href: '/admin/homepage-builder',
        tagline: 'Drag-and-drop homepage sections and global colour editor',
        what: 'The Homepage Builder has two tabs: (1) Content Blocks — add, remove, reorder, and configure the modular sections that make up the homepage (hero, stats strip, events section, partners strip, etc.); (2) Global Colors — adjust the site-wide colour palette (primary, accent, background, text).',
        when: 'Use when running a campaign that needs a homepage refresh, when the event season starts (add an events block), or when brand colours change.',
        steps: [
          { icon: 'layers', text: 'Open the Content Blocks tab — you\'ll see all current homepage sections as draggable cards.' },
          { icon: 'drag_indicator', text: 'Drag sections up/down to reorder them on the homepage.' },
          { icon: 'toggle_on', text: 'Toggle any section\'s visibility to show or hide it without deleting its configuration.' },
          { icon: 'settings', text: 'Click the gear icon on any block to edit its specific settings (headline, image, button text, etc.).' },
          { icon: 'palette', text: 'Switch to the Global Colors tab to tweak the site-wide palette. Changes apply everywhere simultaneously.' },
        ],
        tips: [
          { kind: 'warning', text: 'Global colour changes affect every page on the site instantly. Always preview on desktop and mobile before finalising.' },
          { kind: 'tip', text: 'The homepage is the highest-traffic page. Keep the primary CTA visible within the first two blocks (above the fold).' },
        ],
      },
      {
        id: 'site-settings', icon: 'image', label: 'Logo & Branding', href: '/admin/site-settings',
        tagline: 'Site logo, favicon, and brand assets',
        what: 'Upload and manage the site logo (header and footer variants), favicon, and any site-wide brand imagery used across templates.',
        when: 'Use when a new logo is delivered from your designer, after a brand refresh, or when the favicon needs updating.',
        steps: [
          { icon: 'upload', text: 'Click the upload zone for Logo, Footer Logo, or Favicon.' },
          { icon: 'image', text: 'Recommended formats: SVG for logos (crisp at all sizes), PNG for favicon (32×32px minimum).' },
          { icon: 'preview', text: 'Preview renders the logo in context (header mock-up) before you save.' },
          { icon: 'save', text: 'Save — the new logo appears on every page of the site immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'Keep a dark-mode variant of the logo — upload it separately if your theme supports it.' },
          { kind: 'info', text: 'Logo files are served from Supabase Storage with a CDN edge cache. A hard refresh (Ctrl+Shift+R) clears the browser cache for local verification.' },
        ],
      },
      {
        id: 'home-page', icon: 'settings', label: 'Hero Settings', href: '/admin/home-page',
        tagline: 'Homepage hero section and global header/footer config',
        what: 'Configure the homepage hero — the large banner at the very top of the homepage. Controls: hero headline, subheadline, background image/video, and primary CTA button. Also houses global header/footer settings like navigation style and announcement banner.',
        when: 'Update at the start of each National Check-in Week campaign to align the hero with this year\'s theme and CTA.',
        steps: [
          { icon: 'title', text: 'Set the Hero Headline — keep it under 10 words for mobile readability.' },
          { icon: 'subtitles', text: 'Write the Hero Subheadline — 1–2 sentences expanding on the headline.' },
          { icon: 'image', text: 'Upload a background image (min. 1920×1080px) or paste a video URL for motion background.' },
          { icon: 'ads_click', text: 'Set the CTA Button Label and URL (e.g. "Register Now" → Eventbrite).' },
          { icon: 'save', text: 'Save and check the live homepage link to verify it looks right.' },
        ],
        tips: [
          { kind: 'tip', text: 'Hero text must be readable against the background image. Use a solid or semi-transparent overlay colour if your image is busy.' },
          { kind: 'warning', text: 'This page also controls the global announcement banner. If an old announcement is still showing, clear it here.' },
        ],
      },
      {
        id: 'pages', icon: 'article', label: 'CMS Pages', href: '/admin/cms/pages',
        tagline: 'Static content pages (About, Contact, GEO landing pages)',
        what: 'Create and edit fully custom static pages. Two types: Standard pages (About, Contact, Privacy Policy, etc.) and GEO pages (location-specific landing pages linked to an Area). Each page has a block-based editor, SEO fields, and a status toggle.',
        when: 'Use for any standalone page that isn\'t a blog post, event, or data-driven issue page. Essential for GEO SEO — create one GEO page per region/LGA you want to rank for.',
        steps: [
          { icon: 'add', text: 'Click "New Page" — choose type (Standard or GEO), enter the title and slug.' },
          { icon: 'edit_note', text: 'Use the block editor to add content sections (text, image, CTA, stats, etc.).' },
          { icon: 'search', text: 'Fill in the SEO tab — meta title (max 60 chars), meta description (max 160 chars), and OG image.' },
          { icon: 'location_on', text: 'For GEO pages: link it to the matching Area record so the area page gains custom content.' },
          { icon: 'toggle_on', text: 'Set status to "Published" when ready. Draft pages are private.' },
        ],
        tips: [
          { kind: 'tip', text: 'GEO pages dramatically improve local SEO. Start with major capital cities, then expand to regional areas.' },
          { kind: 'info', text: 'The SEO Report (AI section) scores every published CMS page — use it to prioritise which pages need content work.' },
        ],
      },
      {
        id: 'blog', icon: 'rss_feed', label: 'Blog', href: '/admin/blog',
        tagline: 'Blog posts and articles',
        what: 'The blog is the primary editorial channel for National Check-in Week. Posts have a title, author, excerpt, body (rich text), featured image, and full SEO metadata. Posts can be drafted, then published when ready.',
        when: 'Publish posts around campaigns, research releases, events, and seasonal moments (back-to-school, Mental Health Month, etc.). Aim for at least 2 posts per month during the main campaign season.',
        steps: [
          { icon: 'add', text: 'Click "New Post" or use AI → Quick Content to draft directly from the vault.' },
          { icon: 'edit', text: 'Write in the rich-text editor. Add a featured image — it appears in social shares and listing cards.' },
          { icon: 'person', text: 'Set an Author — named authorship boosts E-E-A-T (Google\'s expertise signal) and AISEO scores.' },
          { icon: 'search', text: 'Fill in the SEO tab — always write a unique meta description (not just the first line of the post).' },
          { icon: 'toggle_on', text: 'Toggle "Published" to ON when ready. The post appears on /blog immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'Posts generated via AI → Quick Content are saved as unpublished drafts. Always review before publishing.' },
          { kind: 'info', text: 'Posts with a named author, OG image, and 600+ words score significantly higher in the SEO Report.' },
          { kind: 'warning', text: 'Do not delete old posts — unpublish them instead. Deleted posts break any inbound links from other sites.' },
        ],
      },
      {
        id: 'menu', icon: 'menu', label: 'Menu', href: '/admin/cms/menu',
        tagline: 'Site navigation builder',
        what: 'Control the navigation links shown in the site header and footer. Add, remove, and reorder items. Each item can link to a published CMS page, a blog category, an event, or a custom URL. Items can open in a new tab.',
        when: 'Update the menu when a new important page is created, a section is removed, or the information architecture changes for a campaign.',
        steps: [
          { icon: 'add', text: 'Click "Add Item" — choose the link destination (existing page or custom URL) and set the label.' },
          { icon: 'drag_indicator', text: 'Drag items up/down to reorder. The order here is exactly what visitors see.' },
          { icon: 'open_in_new', text: 'Toggle "Open in new tab" for external links (partner sites, Eventbrite registrations).' },
          { icon: 'toggle_off', text: 'Toggle inactive to hide a menu item temporarily (e.g. during event off-season) without deleting it.' },
          { icon: 'save', text: 'Save — the navigation updates on every page of the site immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'Keep the main navigation to 5–7 items. More than 7 reduces findability on mobile.' },
          { kind: 'warning', text: 'Removing a menu item doesn\'t delete the page — it just hides it from navigation. The page remains accessible via direct URL.' },
        ],
      },
      {
        id: 'redirects', icon: 'alt_route', label: 'Redirects', href: '/admin/cms/redirects',
        tagline: '301/302 URL redirects — no redeploy needed',
        what: 'Create URL redirects that run at the edge (Next.js middleware) without requiring a code deployment. A 301 is a permanent redirect (Google transfers link equity to the new URL). A 302 is temporary (Google keeps the old URL indexed).',
        when: 'Use when you rename a page slug, retire an old URL, or need a short vanity URL for a campaign (e.g. /register → /events/2025-national-check-in-week).',
        steps: [
          { icon: 'add', text: 'Click "New Redirect" — enter the source path (e.g. /old-page) and destination URL.' },
          { icon: 'swap_horiz', text: 'Choose 301 (permanent — use when the old URL will never come back) or 302 (temporary — use for campaigns).' },
          { icon: 'toggle_on', text: 'Leave it active. Use the pause toggle to temporarily disable without deleting.' },
          { icon: 'check', text: 'Test immediately by visiting the source URL in an incognito window.' },
        ],
        tips: [
          { kind: 'info', text: 'Use 301 for SEO — it passes ~95% of the original page\'s ranking power to the new URL. 302 does not.' },
          { kind: 'warning', text: 'Avoid redirect chains (A → B → C). Always point redirects directly to the final destination.' },
          { kind: 'tip', text: 'Create a vanity redirect for every major campaign: /register, /webinar, /toolkit. Easy to share in emails and social.' },
        ],
      },
    ],
  },

  {
    id: 'ai', label: 'AI', icon: 'auto_awesome', color: '#7c3aed',
    features: [
      {
        id: 'vault-sources', icon: 'lock', label: 'Vault Library', href: '/admin/vault/sources',
        tagline: 'The AI\'s knowledge base — your source of truth',
        what: 'The Vault is a library of documents that the AI reads before generating any content. Think of it as the AI\'s briefing pack. Every PDF, report, research paper, and fact sheet you upload gets chunked into small passages, converted to vector embeddings, and stored so the AI can retrieve the most relevant sections when writing.',
        when: 'Add documents to the Vault whenever you have new research, updated statistics, brand guidelines, or any information you want the AI to reference. The better the Vault, the better every AI-generated piece of content.',
        steps: [
          { icon: 'list', text: 'Open Vault Library to see all documents. A status chip shows each document\'s processing stage.' },
          { icon: 'info', text: 'Status flow: Queued → Extracting → Chunking → Embedding → Ready. Only "Ready" documents are searchable by the AI.' },
          { icon: 'filter_list', text: 'Filter by status (e.g. "Failed") to see documents that need attention.' },
          { icon: 'refresh', text: 'Click "Reindex" on a failed document to retry processing.' },
          { icon: 'delete', text: 'Delete documents that are outdated — the AI won\'t reference stale statistics if they\'re not in the Vault.' },
        ],
        tips: [
          { kind: 'info', text: 'The Vault stats strip shows total chunks and tokens — this tells you how much knowledge the AI has access to.' },
          { kind: 'tip', text: 'Category labels on documents help the AI\'s retrieval. Use consistent categories: "Research", "Statistics", "Brand Guidelines", "Program Info".' },
          { kind: 'warning', text: 'Large PDFs (50+ pages) take a few minutes to fully embed. Check the Library a few minutes after upload — don\'t use content generated from a document still showing "Chunking".' },
        ],
      },
      {
        id: 'vault-upload', icon: 'upload', label: 'Vault Upload', href: '/admin/vault/upload',
        tagline: 'Add documents to the AI\'s knowledge base',
        what: 'Three ways to add content to the Vault: (1) Drop files — drag and drop PDFs, Word docs, TXT, or Markdown files; (2) Paste text — type or paste raw text directly with a title and source URL; (3) Paste URL — give it a web page URL and it crawls, extracts, and ingests the content automatically.',
        when: 'Use after receiving a new research report, after a partner sends a fact sheet, or when you want to ingest a specific web page (e.g. a Beyond Blue report, a government stats page).',
        steps: [
          { icon: 'upload_file', text: 'For files: drag up to 10 files (max 100MB each) into the drop zone. They queue automatically.' },
          { icon: 'content_paste', text: 'For pasted text: fill in Title, Source URL (where it\'s from), Body (the text), Category, and Tags.' },
          { icon: 'language', text: 'For URLs: paste a web address. The system crawls the page, extracts the main content, and adds it.' },
          { icon: 'pending', text: 'Watch the upload queue on the right — each document shows a live status.' },
          { icon: 'check_circle', text: 'Once all documents reach "Ready", they\'re available to all AI generation tools.' },
        ],
        tips: [
          { kind: 'tip', text: 'Paste text is ideal for statistics you\'ve verified from a source — paste just the key paragraphs, not the whole document.' },
          { kind: 'info', text: 'URL crawling works best on simple article pages. Complex pages with lots of JavaScript may extract partially — verify by checking the chunk preview in Vault Library.' },
          { kind: 'warning', text: 'Don\'t upload confidential documents (internal financials, staff details) — anything in the Vault can be referenced in generated content.' },
        ],
      },
      {
        id: 'simple-content', icon: 'bolt', label: 'Quick Content', href: '/admin/simple-content',
        tagline: 'Generate a vault-grounded article in 3 steps',
        what: 'Quick Content is the fastest way to produce a finished blog post, LinkedIn update, Instagram caption, or newsletter section. You provide a brief prompt, pick from AI-suggested titles, choose a content type, and the AI writes a complete draft grounded entirely in your Vault documents — with source citations.',
        when: 'Use when you need content quickly for a campaign push, social media, or a topical blog post. Ideal for less-technical team members who want to produce quality content without understanding the full Content Pipeline.',
        steps: [
          { icon: 'edit', text: 'Step 1 — Prompt: Describe what you want in 1–3 sentences. Include any specific angle or target audience.' },
          { icon: 'list', text: 'Step 2 — Choose a content type (Blog Article, Short Article, LinkedIn Post, Instagram Caption, Newsletter Section). Then pick from 4 AI-suggested titles or type your own.' },
          { icon: 'auto_awesome', text: 'Step 3 — Generate: The AI writes the full piece grounded in Vault content. Vault references show which documents were used.' },
          { icon: 'feedback', text: 'Not happy? Use the Feedback form to say what to change (e.g. "make it more stats-heavy", "shorter sentences") and regenerate.' },
          { icon: 'check_circle', text: 'Approve to save as an unpublished blog draft. Then go to Blog to review and publish.' },
        ],
        tips: [
          { kind: 'tip', text: 'The more specific your prompt, the better the output. "Write about youth anxiety" → generic. "Write about the link between social media use and anxiety in Australian teenagers, for a school counsellor audience" → targeted and useful.' },
          { kind: 'info', text: 'All generations are saved in History (the clock icon) — you can restore any previous generation.' },
          { kind: 'warning', text: 'Quick Content requires an active, populated Vault. If you see a "Vault is empty" error, upload documents first.' },
        ],
      },
      {
        id: 'content-creator', icon: 'dashboard', label: 'Content Pipeline', href: '/admin/content-creator',
        tagline: 'Structured AI content workflow: Topics → Ideas → Drafts → Verified',
        what: 'The Content Pipeline is a structured editorial workflow for producing high-quality, vault-grounded long-form content at scale. Content moves through four stages: Topics (identify what to write about) → Ideas (briefs for specific articles) → Drafts (AI-generated content for human review) → Verified (approved and ready to publish).',
        when: 'Use the Pipeline when planning a content calendar, producing a batch of articles for SEO, or when multiple team members need to collaborate on content at different stages.',
        steps: [
          { icon: 'lightbulb', text: 'Topics: Identify broad subject areas by generating topic suggestions from the Vault, or add manually.' },
          { icon: 'emoji_objects', text: 'Ideas: Turn a topic into a specific brief — working title, target audience, key points to cover. Ideas can be bulk-generated from topics.' },
          { icon: 'edit_note', text: 'Drafts: The AI generates a full draft from each Idea. Review in the draft editor — edit, regenerate sections, or accept as-is.' },
          { icon: 'verified', text: 'Verified: Mark a draft as Verified once it\'s reviewed and approved. Verified content is ready to publish to Blog.' },
        ],
        tips: [
          { kind: 'info', text: 'Use the Pipeline for planned content (monthly SEO calendar). Use Quick Content for reactive content (news hook, social post).' },
          { kind: 'tip', text: 'The pipeline dashboard shows stage counts — aim to keep Drafts moving to Verified rather than accumulating. Old drafts go stale as Vault content updates.' },
        ],
      },
      {
        id: 'topics', icon: 'lightbulb', label: 'Topics', href: '/admin/content-creator/topics',
        tagline: 'Broad subject areas drawn from your Vault',
        what: 'Topics are the starting point of the Content Pipeline. They represent broad subject areas (e.g. "Youth Mental Health & Social Media", "School-Based Wellbeing Programs") that can each spawn multiple Ideas and Drafts.',
        when: 'Generate or curate topics at the start of each content planning cycle — monthly or quarterly.',
        steps: [
          { icon: 'auto_awesome', text: 'Click "Generate Topics" to have the AI analyse your Vault and suggest relevant topics based on what\'s in your knowledge base.' },
          { icon: 'add', text: 'Or click "Add Topic" to manually create one with a custom title and description.' },
          { icon: 'emoji_objects', text: 'From any topic card, click "Generate Ideas" to spawn article briefs from that topic.' },
          { icon: 'delete', text: 'Archive topics that are no longer relevant. Archived topics won\'t generate new ideas.' },
        ],
        tips: [
          { kind: 'tip', text: 'Topics should be broad enough to support 5+ articles each. If a topic only supports 1–2 articles, it\'s probably better as an Idea directly.' },
        ],
      },
      {
        id: 'styles', icon: 'brush', label: 'Styles', href: '/admin/content-creator/styles',
        tagline: 'Reusable tone and format templates for generated content',
        what: 'Content Styles are reusable templates that define the tone, reading level, and structure for AI-generated content. For example: "Formal — for policy stakeholders", "Accessible — plain language for parents", "Engaging — for social media".',
        when: 'Create styles once when you define your content strategy. Assign a style when generating Ideas or Drafts to ensure tone consistency across all content.',
        steps: [
          { icon: 'add', text: 'Click "Add Style" — give it a name and write a detailed description of the tone and format instructions.' },
          { icon: 'auto_awesome', text: 'When generating a Draft, select the appropriate style. The AI follows it when writing.' },
          { icon: 'edit', text: 'Update a style\'s description to refine the AI\'s output over time based on what works well.' },
        ],
        tips: [
          { kind: 'tip', text: 'The more specific your style description, the more consistent the output. Include: target reader, vocabulary level, sentence length guidance, what to avoid.' },
        ],
      },
      {
        id: 'ideas', icon: 'emoji_objects', label: 'Ideas', href: '/admin/content-creator/ideas',
        tagline: 'Article briefs waiting to become drafts',
        what: 'Ideas are specific article briefs — a working title, target audience, and key points to cover. They live between Topics and Drafts in the pipeline. An Idea can be generated by AI (from a Topic) or created manually.',
        when: 'Browse Ideas when you\'re ready to generate drafts. A healthy pipeline has 10–20 Ideas queued at any time.',
        steps: [
          { icon: 'auto_awesome', text: 'From Topics, click "Generate Ideas" on a topic card. AI creates 3–5 article briefs.' },
          { icon: 'add', text: 'Or click "New Idea" to manually write a brief.' },
          { icon: 'edit_note', text: 'Click "Generate Draft" on any idea card to move it to Drafts. The AI writes a full article from the brief.' },
          { icon: 'delete', text: 'Delete Ideas that are no longer relevant — they won\'t clutter the pipeline.' },
        ],
        tips: [
          { kind: 'info', text: 'Ideas are cheap to generate and easy to delete. Generate in bulk, then curate down to the ones worth drafting.' },
        ],
      },
      {
        id: 'drafts', icon: 'edit_note', label: 'Drafts', href: '/admin/content-creator/drafts',
        tagline: 'AI-generated content awaiting human review',
        what: 'Drafts are AI-written articles that have been generated from Ideas but not yet reviewed by a human. Each draft includes the full body text, vault citations, and metadata. A human editor reviews, edits, and either sends back for regeneration or marks as Verified.',
        when: 'Review the Drafts queue regularly — at least weekly during campaign season. Drafts that sit too long become stale as the world and your Vault move on.',
        steps: [
          { icon: 'list', text: 'Open Drafts — scan the queue. Each card shows title, source idea, generation date, and word count.' },
          { icon: 'edit', text: 'Click a draft to open the editor. Read it carefully — AI can hallucinate or miss nuance.' },
          { icon: 'refresh', text: 'If a section needs rework, select it and use "Regenerate Section" with a specific instruction.' },
          { icon: 'verified', text: 'Once satisfied, click "Mark as Verified" to move it to the Verified stage.' },
          { icon: 'archive', text: 'Archive drafts you\'re not going to use — this keeps the queue clean.' },
        ],
        tips: [
          { kind: 'warning', text: 'Always fact-check statistics in AI drafts against the source Vault documents. Hallucination is rare but possible.' },
          { kind: 'tip', text: 'Edit the title, add a featured image suggestion, and fill in the meta description before verifying — this saves time when you go to publish in Blog.' },
        ],
      },
      {
        id: 'verified', icon: 'verified', label: 'Verified', href: '/admin/content-creator/verified',
        tagline: 'Reviewed and approved content, ready to publish',
        what: 'The Verified stage is the final holding area for content that has been reviewed, edited, and approved. Verified content is considered publication-ready — it just needs to be pushed to the Blog.',
        when: 'Come here when you\'re ready to schedule or publish content. Use it as your "content calendar queue".',
        steps: [
          { icon: 'list', text: 'Browse Verified content — each card shows the article ready to go.' },
          { icon: 'publish', text: 'Click "Publish to Blog" to push the article to Blog as an unpublished draft.' },
          { icon: 'open_in_new', text: 'Go to Blog to set the featured image, author, publish date, and toggle it live.' },
        ],
        tips: [
          { kind: 'tip', text: 'Batch-verify content in advance so you always have a queue of ready-to-go articles for campaign moments.' },
        ],
      },
      {
        id: 'prompts', icon: 'smart_toy', label: 'Prompts', href: '/admin/prompts',
        tagline: 'AI prompt templates for batch generation',
        what: 'Prompt templates control exactly how the AI writes for specific content types — state pages, area pages, issue descriptions. Editing a template here changes the instructions given to Claude for every future generation of that type.',
        when: 'Edit prompts when AI output quality isn\'t meeting your standards, when tone needs to shift, or when new context needs to be baked in (e.g. "always mention the 2025 campaign date").',
        steps: [
          { icon: 'list', text: 'Open Prompts — each template is listed by type (e.g. "State Page", "Area Page", "Issue Description").' },
          { icon: 'edit', text: 'Click a template to edit. The prompt uses variables like {{title}}, {{state}}, {{issue}} — don\'t remove these.' },
          { icon: 'save', text: 'Save the prompt.' },
          { icon: 'refresh', text: 'Re-run generation for the affected content type (e.g. SEO → regenerate all state pages) to apply the new prompt.' },
        ],
        tips: [
          { kind: 'warning', text: 'Prompt changes only affect future generations — already-generated content won\'t change until regenerated.' },
          { kind: 'tip', text: 'Test prompt edits on a single record before batch-applying to all states or areas. A bad prompt at scale means a lot of rework.' },
          { kind: 'info', text: 'Prompts use the same vault-grounding system. The AI always retrieves relevant vault content first, then applies your prompt instructions on top.' },
        ],
      },
      {
        id: 'seo', icon: 'travel_explore', label: 'SEO Generator', href: '/admin/seo',
        tagline: 'Batch-generate SEO titles and descriptions at scale',
        what: 'The SEO Generator lets you select any number of events, areas, issues, or states and generate optimised meta titles (max 60 chars) and meta descriptions (max 160 chars) for all of them in one click. Progress is shown per-item with colour-coded character counts.',
        when: 'Run this after adding a batch of new Areas or States, after a content refresh, or before a campaign launch to ensure every key page is fully optimised.',
        steps: [
          { icon: 'filter_list', text: 'Choose the content type tab (Events / Areas / Issues / States).' },
          { icon: 'check_box', text: 'Select the records you want to optimise — or "Select All" for a full batch run.' },
          { icon: 'auto_awesome', text: 'Click "Generate SEO" — the system processes each record sequentially, showing progress.' },
          { icon: 'edit', text: 'Review the generated titles and descriptions — inline editing is available if any need tweaking.' },
          { icon: 'save', text: 'Save All to commit the changes. They\'re now live on the public pages.' },
        ],
        tips: [
          { kind: 'info', text: 'Character counts turn amber at 80% of the limit and red when over — red means the text will be truncated in Google search results.' },
          { kind: 'tip', text: 'Run the SEO Report after a batch generation to check scores and identify any pages that still need work.' },
          { kind: 'warning', text: 'Batch generation calls the AI per record — running 200 areas at once takes 5–10 minutes. Avoid closing the tab mid-run.' },
        ],
      },
      {
        id: 'seo-report', icon: 'analytics', label: 'SEO Report', href: '/admin/seo/report',
        tagline: 'Scored audit of every published page',
        what: 'The SEO Report analyses every published blog post, event, and CMS page and scores it on two dimensions: SEO (0–100) — traditional signals like meta title length, meta description, OG image, content depth, slug quality, and keyword coherence; and AISEO (0–100) — LLM/AI-search readiness signals like factual density, named entities, source citations, FAQ patterns, and author attribution.',
        when: 'Run weekly to monitor overall site health. Run after any content campaign to assess quality. Sort by "Combined" to find your weakest pages and prioritise fixes.',
        steps: [
          { icon: 'refresh', text: 'Click "Refresh" to run a fresh analysis — the report scans all published content live.' },
          { icon: 'filter_list', text: 'Use the type tabs (All/Blog/Events/Pages) or the Critical filter (scores < 40) to narrow focus.' },
          { icon: 'search', text: 'Search by title or slug to jump directly to a specific page.' },
          { icon: 'expand_more', text: 'Click any row to expand the full check breakdown — each check shows pass/warn/fail with points and an explanation.' },
          { icon: 'edit', text: 'Click "Edit" directly from the expanded row to fix issues without navigating away.' },
          { icon: 'download', text: 'Export CSV to share the audit with your team or track scores over time in a spreadsheet.' },
        ],
        tips: [
          { kind: 'tip', text: 'Check the Critical filter first — pages with any score below 40 have the highest SEO risk and should be fixed immediately.' },
          { kind: 'info', text: 'AISEO checks matter more each year as AI assistants (ChatGPT, Perplexity, Google AI Overviews) become primary discovery channels for young people.' },
          { kind: 'tip', text: 'The most common quick wins: add a meta description, add an OG image, and add a named author to blog posts. These three alone can push most pages from F to C.' },
        ],
      },
    ],
  },

  {
    id: 'system', label: 'System', icon: 'settings', color: '#64748b',
    features: [
      {
        id: 'typography', icon: 'font_download', label: 'Typography', href: '/admin/typography',
        tagline: 'Site-wide font families, sizes, and weights',
        what: 'Control the typefaces used across the entire site — heading font family, body font family, base size, and weight scale. Changes apply globally to every page.',
        when: 'Change during a brand refresh or when a new font licence is acquired. Rarely needed outside of major design updates.',
        steps: [
          { icon: 'edit', text: 'Open Typography — current font settings are shown with live preview text.' },
          { icon: 'text_fields', text: 'Change the Heading font (Google Fonts name or system font stack) and Body font.' },
          { icon: 'format_size', text: 'Adjust base size and scale if needed — this affects the entire type system proportionally.' },
          { icon: 'save', text: 'Save. Refresh the homepage to verify the change looks right across headings and body text.' },
        ],
        tips: [
          { kind: 'warning', text: 'Typography changes affect every page instantly. Test thoroughly on both desktop and mobile before saving in production.' },
          { kind: 'info', text: 'The page is wrapped in an error boundary — if something goes wrong, the previous settings are preserved.' },
        ],
      },
      {
        id: 'users', icon: 'group', label: 'Users', href: '/admin/users',
        tagline: 'Admin account management',
        what: 'Create, edit, and deactivate admin user accounts. Each account can log in to this admin panel. All users currently have full admin access — there is no role-based restriction between accounts.',
        when: 'Add a new user when onboarding a team member. Deactivate accounts immediately when someone leaves the organisation.',
        steps: [
          { icon: 'add', text: 'Click "Add User" — enter their email address and a temporary password.' },
          { icon: 'mail', text: 'Send the new user their credentials — they should change their password on first login.' },
          { icon: 'person_off', text: 'To deactivate: click the user and disable their account. They will be immediately unable to log in.' },
          { icon: 'delete', text: 'Delete permanently removes the account and all session history.' },
        ],
        tips: [
          { kind: 'warning', text: 'There is no granular role system — every admin can do everything. Only grant access to people who need it.' },
          { kind: 'tip', text: 'Use shared aliases (team@org.com) sparingly — individual accounts make audit trails clearer.' },
        ],
      },
      {
        id: 'api', icon: 'code', label: 'API Management', href: '/admin/api',
        tagline: 'External API key storage',
        what: 'A secure store for the API keys used by the platform\'s integrations — OpenAI, HubSpot, and others. Keys are stored encrypted and displayed masked (only the last 4 characters visible). Deactivating a key disables the associated integration without deleting the key.',
        when: 'Update when rotating API keys for security, when an integration\'s key expires, or when adding a new integration.',
        steps: [
          { icon: 'add', text: 'Click "Add Key" — enter the provider name, a human-readable label, and the key value.' },
          { icon: 'toggle_off', text: 'Deactivate any key that is no longer in use — the platform will use the active key for that provider.' },
          { icon: 'delete', text: 'Delete old or rotated keys after confirming the new one is working.' },
        ],
        tips: [
          { kind: 'warning', text: 'Never share API key values in chat, email, or documents. Anyone with a key has access to the associated service and its costs.' },
          { kind: 'info', text: 'The AI features (content generation, embedding) use the OpenAI key. If content generation stops working, check this page first — the key may have expired or hit its quota.' },
        ],
      },
      {
        id: 'settings', icon: 'settings', label: 'Settings', href: '/admin/settings',
        tagline: 'Platform configuration and environment overview',
        what: 'The Settings hub has six cards: Site Configuration (editable: site name, contact email, footer tagline, maintenance mode), Environment Variables (read-only status of infrastructure keys), Integrations & Data (quick links to API Keys, Prompts, Users), Site Links (quick links to public pages), Build Information (tech stack details), and Quick Access shortcuts.',
        when: 'Enable maintenance mode when doing major updates. Update contact email when team responsibilities change. Check environment variables if the site appears broken.',
        steps: [
          { icon: 'edit', text: 'Edit the Site Configuration card — update site name, contact email, or footer tagline.' },
          { icon: 'construction', text: 'Toggle Maintenance Mode ON to show a maintenance page to all public visitors while you work.' },
          { icon: 'key', text: 'Check Environment Variables to confirm all required keys are present (green = set, red = missing).' },
          { icon: 'save', text: 'Save changes — a Save button appears only when you\'ve made edits.' },
        ],
        tips: [
          { kind: 'warning', text: 'Maintenance mode takes the entire public site offline. Only enable it for planned, time-limited work and disable it as soon as you\'re done.' },
          { kind: 'info', text: 'Environment Variables shown here are read from the server at runtime — they come from your Vercel environment config, not this form.' },
        ],
      },
    ],
  },
];

/* ─── Tip badge ──────────────────────────────────────────────────────────── */

function TipBadge({ kind }: { kind: Tip['kind'] }) {
  const map = {
    tip:     { label: 'Tip',     bg: '#eff6ff', col: '#1d4ed8', border: '#bfdbfe' },
    warning: { label: 'Warning', bg: '#fff7ed', col: '#c2410c', border: '#fed7aa' },
    info:    { label: 'Note',    bg: '#f0fdf4', col: '#15803d', border: '#bbf7d0' },
  };
  const s = map[kind];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: s.bg, color: s.col, border: `1px solid ${s.border}`, flexShrink: 0, marginTop: 2 }}>
      {s.label}
    </span>
  );
}

/* ─── Feature card ───────────────────────────────────────────────────────── */

function FeatureCard({ f, accent }: { f: Feature; accent: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', transition: 'box-shadow .15s' }}
         onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)')}
         onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: accent }}>{f.icon}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{f.label}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{f.tagline}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href={f.href}
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: accent, color: '#fff', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Open →
          </Link>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#9ca3af', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }}>
            expand_more
          </span>
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f3f4f6' }}>
          {/* What it is */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 6 }}>What it is</div>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{f.what}</p>
          </div>

          {/* When to use */}
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#f9fafb', borderRadius: 8, borderLeft: `3px solid ${accent}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent, marginBottom: 4 }}>When to use</div>
            <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{f.when}</p>
          </div>

          {/* Steps */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8 }}>How to use it</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {f.steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: accent }}>{i + 1}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#9ca3af', marginTop: 2, flexShrink: 0 }}>{s.icon}</span>
                    <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{s.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {f.tips.length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {f.tips.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', borderRadius: 8, background: t.kind === 'warning' ? '#fff7ed' : t.kind === 'info' ? '#f0fdf4' : '#eff6ff' }}>
                  <TipBadge kind={t.kind} />
                  <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{t.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function TutorialPage() {
  const [activeSection, setActiveSection] = useState('content');
  const [search, setSearch] = useState('');

  const searchLower = search.toLowerCase().trim();

  const visibleSections = SECTIONS.map(sec => ({
    ...sec,
    features: searchLower
      ? sec.features.filter(f =>
          f.label.toLowerCase().includes(searchLower) ||
          f.tagline.toLowerCase().includes(searchLower) ||
          f.what.toLowerCase().includes(searchLower) ||
          f.when.toLowerCase().includes(searchLower),
        )
      : sec.features,
  })).filter(sec => sec.features.length > 0);

  const totalFeatures = SECTIONS.reduce((n, s) => n + s.features.length, 0);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div className="swa-page-header" style={{ marginBottom: 28, alignItems: 'flex-start' }}>
        <div>
          <h1 className="swa-page-title">Admin Tutorial</h1>
          <p className="swa-page-subtitle" style={{ maxWidth: 560 }}>
            A complete guide to every feature in this admin panel — what each tool does, when to use it, and exactly how to use it.
            {' '}<span style={{ color: 'var(--color-text-faint)' }}>{totalFeatures} features documented across 5 sections.</span>
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#9ca3af', pointerEvents: 'none' }}>
          search
        </span>
        <input
          type="search"
          placeholder={'Search features — e.g. "vault", "redirect", "SEO"…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 14, background: 'var(--color-bg-input, #fff)', boxSizing: 'border-box' }}
        />
      </div>

      {/* ── Section tabs (hidden during search) ── */}
      {!searchLower && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
                background: activeSection === s.id ? s.color : '#f3f4f6',
                color:      activeSection === s.id ? '#fff'   : '#374151',
                fontWeight: activeSection === s.id ? 700      : 500,
                transition: 'background .15s, color .15s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{s.icon}</span>
              {s.label}
              <span style={{ opacity: 0.7, fontSize: 11 }}>({s.features.length})</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Feature cards ── */}
      {visibleSections.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-faint)', fontSize: 14 }}>
          No features match "{search}".
        </div>
      )}

      {(searchLower ? visibleSections : visibleSections.filter(s => s.id === activeSection)).map(sec => (
        <div key={sec.id} style={{ marginBottom: 32 }}>
          {searchLower && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: sec.color }}>{sec.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: sec.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sec.label}</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sec.features.map(f => (
              <FeatureCard key={f.id} f={f} accent={sec.color} />
            ))}
          </div>
        </div>
      ))}

      {/* ── Footer note ── */}
      <div style={{ marginTop: 32, padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
        <strong style={{ color: '#374151' }}>Need help with something not covered here?</strong>
        {' '}Contact your platform administrator or reach out to the development team.
        Each section links directly to the feature — click "Open →" on any card to jump straight there.
      </div>
    </div>
  );
}
