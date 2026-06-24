"use client";

/*
 * /admin/tutorial
 *
 * Comprehensive interactive guide explaining every admin feature.
 * Organised into the same sections as the sidebar.
 * Each feature card shows: what it is, when to use it, a step-by-step
 * workflow, tips, what success looks like, related features, and FAQs.
 *
 * Someone completely new to this admin should be able to run the entire
 * platform just by reading this tutorial.
 */

import { useState } from 'react';
import Link from 'next/link';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Step { icon: string; text: string }
interface Tip  { kind: 'tip' | 'warning' | 'info'; text: string }
interface Faq  { q: string; a: string }

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
  faqs?:    Faq[];
  combos?:  string;
  outcome?: string;
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
        what: 'The dashboard is the first screen you see when you log in, and it acts as mission control for the whole platform. It aggregates live counts from across the database — issues, events, blog posts, areas, votes — into KPI cards, and surfaces recent activity so you can see what changed since you last logged in. It exists to give you a single-glance health check without having to drill into each individual section.',
        when: 'Check it at the start of every session for a snapshot of the site. It is also useful after a campaign push or batch operation to confirm counts moved as expected, and as a launch pad — the quick-action links jump you straight to the most common tasks like creating an event or a blog post.',
        steps: [
          { icon: 'login', text: 'Log in at /admin/login with your admin credentials. You are redirected here automatically.' },
          { icon: 'visibility', text: 'Scan the KPI cards across the top — these show totals for issues, events, pages, areas and more, pulled live from the database.' },
          { icon: 'history', text: 'Review the recent activity feed to see what content was created or edited most recently.' },
          { icon: 'open_in_new', text: 'Use the quick-action buttons to jump straight to New Event, New Blog Post, or the SEO Report.' },
          { icon: 'trending_up', text: 'Note any KPI that looks unexpectedly high or low — it often points to a data issue worth investigating.' },
          { icon: 'refresh', text: 'Refresh the page to re-pull all counts if you have just completed a bulk import or batch generation.' },
        ],
        tips: [
          { kind: 'tip', text: 'Bookmark /admin directly — it always lands on the dashboard after login, so it is the fastest way back to a clean starting point.' },
          { kind: 'info', text: 'KPI counts reflect all records including drafts and unpublished items, not just what is public-facing.' },
          { kind: 'tip', text: 'If a count looks wrong, navigate into that section and use its filters to verify — the dashboard is a summary, not the source of truth for individual records.' },
          { kind: 'warning', text: 'The dashboard does not auto-refresh. After a long-running batch job (like SEO generation), reload to see updated numbers.' },
          { kind: 'info', text: 'The dashboard is read-only — nothing you do here changes data. It is safe to explore.' },
        ],
        faqs: [
          { q: 'Why do the dashboard counts differ from what I see on the public site?', a: 'The dashboard counts every record in the database, including unpublished drafts, hidden items, and archived content. The public site only shows published, visible records. A difference is normal and expected.' },
          { q: 'Can I customise which KPIs appear?', a: 'The KPI set is fixed in the current build. If you need a metric that is not shown, navigate to the relevant section and use its filters and counts there.' },
          { q: 'The recent activity feed is empty — is something broken?', a: 'No. The feed only populates when content has been created or edited recently. On a quiet site it can legitimately be empty. Make an edit anywhere and it will appear.' },
        ],
        combos: 'Issues, Events, SEO Report, Settings',
        outcome: 'You can open the admin and within ten seconds know the overall state of the platform — how much content exists, what changed recently, and where to go next.',
      },
      {
        id: 'issues', icon: 'description', label: 'Issues', href: '/admin/issues',
        tagline: 'The core wellbeing data powering the site',
        what: 'Issues are the foundation of National Check-in Week — every other piece of content (states, areas, votes, much of the SEO surface) connects back to them. Each issue is a structured record with a rank, a Material Symbols icon, a title, a severity level (1–5), and an anchor statistic that becomes the headline fact on its public page. The data model is deliberately small and rigid so that the AI tooling, SEO scoring, and public templates can all rely on the same consistent shape.',
        when: 'Use this when adding a new wellbeing issue, correcting or refreshing a statistic, reordering how issues are displayed, or bulk-rewriting descriptions with AI. Plan a full review at least quarterly to keep statistics current as new ABS/AIHW data is released, and immediately whenever the Votes & Feedback section shows an issue is underperforming.',
        steps: [
          { icon: 'list', text: 'Open Issues to see all 59+ issues sorted by rank. The list is the authoritative display order used across the public site.' },
          { icon: 'add', text: 'Click "New Issue" to create one. Fill in the title (think of it as the public H1), the icon name, severity 1–5, and the anchor statistic.' },
          { icon: 'category', text: 'Choose an icon from the Material Symbols Outlined library — e.g. psychology, favorite, bolt — and type the exact name.' },
          { icon: 'priority_high', text: 'Set severity 1–5: 5 is most severe and ranks the issue most prominently with a red badge. Calibrate against ABS/AIHW prevalence data.' },
          { icon: 'edit', text: 'Click any existing row to edit. Change the rank number to reorder it everywhere on the public site at once.' },
          { icon: 'auto_awesome', text: 'Select one or more issues with the checkboxes, then click "AI Rewrite" to refresh descriptions using vault-grounded content. Review the diff before committing.' },
          { icon: 'save', text: 'Save — changes appear on the public site immediately, with no deploy required.' },
        ],
        tips: [
          { kind: 'warning', text: 'Rank determines display order everywhere on the site. Duplicate ranks cause inconsistent, unpredictable ordering — always keep ranks unique.' },
          { kind: 'tip', text: 'The anchor statistic is the most-read text on each issue page. Make it specific, recent, and cited — e.g. include the source and year inline.' },
          { kind: 'info', text: 'AI rewrites use your Vault documents as source material. The richer the Vault, the more accurate and better-cited the rewrites.' },
          { kind: 'tip', text: 'Title length matters: keep it under 60 characters so it works cleanly as the public H1 and as the basis for the SEO title.' },
          { kind: 'warning', text: 'Deleting an issue removes it from every state and area it was linked to. Prefer lowering its rank or severity over deletion unless it is truly retired.' },
          { kind: 'info', text: 'Severity 4–5 is appropriate for issues affecting more than ~20% of young Australians; use 1–2 for lower-prevalence or emerging issues.' },
        ],
        faqs: [
          { q: 'How do I add a new issue?', a: 'Click New Issue, fill in title (max 60 chars, think of it as the H1 on the public page), choose an icon name from the Material Symbols Outlined library (e.g. psychology, favorite, bolt), set severity 1–5 (5 = most severe, affects prominence in listings), write the anchor stat as a specific cited fact (e.g. "1 in 4 Australian young people aged 15–24 experience a mental health condition annually — ABS 2023"), then Save. The new issue appears in the rank order you set.' },
          { q: 'What do the severity levels mean?', a: '1 = Low prevalence/impact, shown with minimal visual emphasis. 5 = Critical, shown with a red severity badge and ranked prominently. Use the ABS/AIHW data to calibrate — issues affecting more than 20% of young Australians are typically severity 4–5.' },
          { q: 'How does the AI rewrite work?', a: 'Select issues using the checkboxes, click AI Rewrite. The system fetches relevant Vault documents for each issue\'s topic, then sends them with the existing anchor stat to Claude. Claude rewrites using only vault-sourced statistics. Results are shown in a diff view — accept or reject per issue before committing.' },
          { q: 'Can I reorder issues by dragging?', a: 'Ordering is controlled by the numeric rank field, not drag-and-drop. Edit a row and change its rank to move it. Lower numbers appear first. Keep ranks unique to avoid ties.' },
        ],
        combos: 'Vault Library, SEO Report, LLM Optimiser, Votes & Feedback',
        outcome: 'All 59+ issues have accurate, cited anchor statistics with severity levels set. Public issue pages show compelling, data-grounded headlines that drive engagement and pass the SEO/AISEO report with scores above 70.',
      },
      {
        id: 'votes', icon: 'thumbs_up_down', label: 'Votes & Feedback', href: '/admin/votes',
        tagline: 'Real-time public sentiment on wellbeing data',
        what: 'Every public issue page carries an up/down vote control and an optional written-feedback field, and this section is where that signal is aggregated. It shows total vote counts, per-page breakdowns (upvote %, downvote %, net support %), and a stream of individual feedback cards where visitors left comments. It exists to close the loop between the content you publish and how real visitors react to it, so you can prioritise content fixes by evidence rather than guesswork.',
        when: 'Review at least weekly, and daily during the active campaign window. Pull it up specifically after publishing or rewriting an issue to watch how sentiment shifts, and any time you are deciding which issues deserve a content refresh next.',
        steps: [
          { icon: 'bar_chart', text: 'Open Votes & Feedback to see the summary table — each row is one issue page with its vote tallies and support percentage.' },
          { icon: 'sort', text: 'Sort by net support or by downvote rate to surface the best- and worst-performing pages immediately.' },
          { icon: 'filter_list', text: 'Filter to show only "negative votes with written feedback" — these are the most actionable responses worth reading in full.' },
          { icon: 'visibility', text: 'Open a feedback card to read the full comment and any contact details the visitor chose to provide.' },
          { icon: 'mail', text: 'Where an email was provided and follow-up is appropriate, reach out — but handle every comment under your privacy policy.' },
          { icon: 'edit', text: 'When a pattern emerges (e.g. one issue consistently downvoted), jump to Issues and update its anchor statistic or description.' },
          { icon: 'refresh', text: 'Re-check the page after your edit ships to confirm sentiment is recovering.' },
        ],
        tips: [
          { kind: 'tip', text: 'High downvote rates usually mean the statistic feels outdated or does not resonate — refreshing the anchor stat is the single most effective fix.' },
          { kind: 'info', text: 'Votes are stored per session, so the same visitor cannot stuff the ballot by voting repeatedly on one issue.' },
          { kind: 'tip', text: 'Treat written feedback as free user research — even a handful of comments often reveals exactly what wording is confusing.' },
          { kind: 'warning', text: 'Feedback can contain sensitive personal disclosures. Read with care, never publish a comment verbatim without consent, and follow your safeguarding policy.' },
          { kind: 'info', text: 'A low total vote count on a page usually means low traffic, not low quality — cross-check against your analytics before acting.' },
        ],
        faqs: [
          { q: 'A page has zero votes — does that mean it is broken?', a: 'Not necessarily. Zero votes most often means the page simply has not had traffic, or visitors read it without interacting. Check your analytics for pageviews before assuming the voting widget is broken.' },
          { q: 'Can I delete or hide an abusive comment?', a: 'Yes — open the feedback card and remove it. Abusive or identifying content should be removed promptly in line with your moderation and privacy policies.' },
          { q: 'Do votes affect SEO or ranking on the site?', a: 'Votes are a sentiment signal for your editorial decisions only. They do not directly change public display order — that is controlled by issue rank — but they should inform which issues you prioritise rewriting.' },
        ],
        combos: 'Issues, Submissions, Your Voice, SEO Report',
        outcome: 'You know, per issue, which pages resonate and which need work — and your content backlog is prioritised by real audience sentiment rather than assumptions.',
      },
      {
        id: 'states', icon: 'bar_chart', label: 'States & Data', href: '/admin/states',
        tagline: 'Australian state and territory pages',
        what: 'Each Australian state and territory has a dedicated public page that localises the national wellbeing story, and this section manages those pages. A state record carries an icon, a subtitle, descriptive copy, and a curated set of linked issues that drive the state-specific breakdown. These pages exist both to make the data feel relevant to local audiences and to capture geo-targeted search demand (e.g. "youth mental health Queensland").',
        when: 'Use when updating state-specific statistics or copy, changing which issues are featured for a particular state, or — rarely — creating a new territory entry. Refresh state copy at the start of each campaign and whenever you regenerate state SEO in bulk.',
        steps: [
          { icon: 'list', text: 'Open States & Data — all 8 states/territories are listed with their current status.' },
          { icon: 'edit', text: 'Click a state to edit its icon, subtitle text, and descriptive body copy.' },
          { icon: 'link', text: 'Manage which issues are linked to the state — these populate the state\'s public issue breakdown.' },
          { icon: 'priority_high', text: 'Prioritise the 3–5 most locally relevant issues; too many linked issues dilutes the page\'s focus.' },
          { icon: 'add', text: 'Click "New State" only if you need a territory not yet covered (uncommon, but available for future content).' },
          { icon: 'auto_awesome', text: 'Use the SEO Generator (AI section) to batch-write meta titles and descriptions for all states at once.' },
          { icon: 'save', text: 'Save — the public state page updates immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'State pages are strong SEO assets — each targets a distinct geo keyword. Make the subtitle naturally include the state name.' },
          { kind: 'info', text: 'Issues linked to a state appear in that state\'s public breakdown. Curate deliberately rather than linking everything.' },
          { kind: 'warning', text: 'If a linked issue is later deleted in the Issues section, the state\'s breakdown will lose it silently — re-check linked issues after any issue cleanup.' },
          { kind: 'tip', text: 'Keep state subtitles consistent in tone across all 8 so the set reads as one coherent series.' },
          { kind: 'info', text: 'There are only 8 state/territory records, so it is realistic to keep all of them at a high standard rather than triaging.' },
        ],
        faqs: [
          { q: 'Why would I link an issue to a state instead of just letting all issues show?', a: 'Linking lets you tell a focused, locally relevant story. A state page that highlights the 3–5 issues most pressing for that state reads as more credible and ranks better than one that simply mirrors the full national list.' },
          { q: 'How many issues should I link per state?', a: 'Aim for 3–5. That is enough to feel substantive without diluting the page. If you find yourself linking everything, the page loses its local angle.' },
          { q: 'Do I need to write SEO titles for states manually?', a: 'No — use the SEO Generator in the AI section to batch-generate optimised meta titles and descriptions for all states, then review and tweak any that need it.' },
        ],
        combos: 'Issues, Areas, SEO Generator, SEO Report',
        outcome: 'All 8 state pages have current, locally relevant data, a curated set of linked issues, and optimised SEO metadata — each ranking for its own geo keyword.',
      },
      {
        id: 'areas', icon: 'location_on', label: 'Areas', href: '/admin/content',
        tagline: 'City, region, and LGA-level pages',
        what: 'Areas are the most granular geographic layer — suburbs, LGAs, and regional cities each get a page with localised data, SEO metadata, and optional long-form CMS content. There are hundreds of area records, which makes this the largest content surface on the site and the backbone of the local-SEO strategy. The data model links each area to a state and to a set of issues, and optionally to a GEO-type CMS page for bespoke copy.',
        when: 'Use when a specific city or region needs updated content, when a new LGA page is requested, or when running an SEO campaign targeting a geographic area. Because of the volume, most area work happens in batches via the SEO Generator rather than one record at a time.',
        steps: [
          { icon: 'search', text: 'Search by suburb or filter by state to locate the area you need among the hundreds of records.' },
          { icon: 'edit', text: 'Click an area to edit its name, state link, issue associations, and SEO metadata.' },
          { icon: 'add', text: 'Click "New Area" to add a location not yet in the system — enter name, state, and area type (city / region / LGA).' },
          { icon: 'link', text: 'Associate the most relevant issues so the area\'s public breakdown reflects local priorities.' },
          { icon: 'article', text: 'Optionally link a CMS Page of type GEO for custom long-form content on high-priority areas.' },
          { icon: 'auto_awesome', text: 'For SEO at scale, use the SEO Generator to batch-write titles and descriptions across many areas at once.' },
          { icon: 'save', text: 'Save — the area page goes live immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'Areas without a custom CMS page use an auto-generated template — good enough for SEO, but link a GEO page for your most strategic locations.' },
          { kind: 'info', text: 'SEO titles for areas are generated in batch from the SEO Generator — you rarely need to write them by hand.' },
          { kind: 'warning', text: 'With hundreds of records, avoid editing areas one-by-one for SEO. Batch operations are far faster and keep tone consistent.' },
          { kind: 'tip', text: 'Prioritise capital cities and high-population LGAs first; they carry the most search demand.' },
          { kind: 'info', text: 'Area type (city/region/LGA) affects how the page is templated and described — set it correctly when creating the record.' },
        ],
        faqs: [
          { q: 'There are hundreds of areas — how do I keep them all good?', a: 'You do not optimise them individually. Use the SEO Generator to batch-write metadata, link a GEO CMS page only to your highest-priority areas, and let the auto-generated template carry the long tail.' },
          { q: 'What is the difference between an Area and a GEO CMS page?', a: 'An Area is the structured data record (name, state, linked issues, SEO fields). A GEO CMS page is optional bespoke long-form content you can link to an Area for richer, hand-written copy on strategic locations.' },
          { q: 'Why is this section at /admin/content and not /admin/areas?', a: 'Historic routing — the Areas manager lives at /admin/content. The "Open" button on this card takes you to the right place regardless of the URL.' },
        ],
        combos: 'States & Data, CMS Pages, SEO Generator, Schools',
        outcome: 'Every strategic area page has accurate metadata and linked issues, high-priority locations have bespoke GEO content, and the site captures local search demand across hundreds of suburbs and regions.',
      },
      {
        id: 'schools', icon: 'school', label: 'Schools', href: '/admin/schools',
        tagline: 'National school database',
        what: 'This is a searchable database of Australian schools, each record carrying an ACARA ID, sector (government / independent / Catholic), school type, year range, ICSEA score, and enrolment count. Schools can be linked to Areas to enrich local content. It exists as a reference dataset and demographic-context layer that other parts of the site and your outreach team can draw on.',
        when: 'Use when verifying a school\'s details, updating enrolment figures, or — most commonly — bulk-importing new or refreshed school data from a CSV after an ACARA data release.',
        steps: [
          { icon: 'search', text: 'Search by school name, suburb, state, or postcode to find a record.' },
          { icon: 'edit', text: 'Click a school to view and edit its details — sector, type, year range, ICSEA, enrolment.' },
          { icon: 'download', text: 'For bulk work, go to Schools → Import and download the CSV template so your columns match exactly.' },
          { icon: 'upload_file', text: 'Fill in the template and upload it. The importer matches existing schools by ACARA ID.' },
          { icon: 'check_circle', text: 'Review the inline validation — any row errors are flagged before anything is committed.' },
          { icon: 'save', text: 'Confirm the import. New schools are added and matched ones are updated in a single pass.' },
        ],
        tips: [
          { kind: 'warning', text: 'CSV imports append new schools and update existing ones matched by ACARA ID — they never delete records. Always keep a backup of the prior dataset.' },
          { kind: 'info', text: 'ICSEA (Index of Community Socio-Educational Advantage) ranges roughly 500–1200 with an average near 1000, used purely for demographic context.' },
          { kind: 'tip', text: 'Always start from the downloaded template — a mismatched column header is the most common cause of a failed import.' },
          { kind: 'warning', text: 'Double-check ACARA IDs before importing; a wrong ID creates a duplicate school instead of updating the intended one.' },
          { kind: 'info', text: 'Linking schools to Areas enriches local pages, but is optional — the database is useful as a standalone reference too.' },
        ],
        faqs: [
          { q: 'Will importing a CSV delete schools not in the file?', a: 'No. The importer only appends new records and updates existing ones matched by ACARA ID. It never deletes. To remove a school you must do it manually.' },
          { q: 'My import failed validation — what is the usual cause?', a: 'Almost always a column header that does not match the template, or a malformed ACARA ID. Re-download the template, paste your data into it, and re-upload. Errors are shown inline per row before anything commits.' },
          { q: 'What is ICSEA used for?', a: 'ICSEA is a demographic-context score (roughly 500–1200, average ~1000). It helps contextualise a school community\'s socio-educational profile. It is reference data only and does not drive any public-facing logic.' },
        ],
        combos: 'Areas, States & Data',
        outcome: 'The school database is current after each ACARA release, searchable, and — where useful — linked to Areas to strengthen local content and outreach targeting.',
      },
    ],
  },

  {
    id: 'public', label: 'Public Pages', icon: 'public', color: '#8b5cf6',
    features: [
      {
        id: 'events', icon: 'event', label: 'Events', href: '/admin/events',
        tagline: 'Webinars, workshops, and live sessions',
        what: 'Events power the public schedule of National Check-in Week activities — webinars, workshops, panels, and conferences. Each event is a record with a title, date/time, format (online / in-person / hybrid), a registration link, and optionally a recording URL that is revealed only after a visitor completes a HubSpot gate form. The system automatically flips an event from "upcoming" to "past" based on its date, and switches the public page from a registration CTA to a gated recording view.',
        when: 'Create an event as soon as a session is scheduled and publish it to make it live. Update the recording URL promptly once a session ends so the gated recording becomes available. Review the events list before each campaign to ensure the schedule is accurate and nothing stale is still published.',
        steps: [
          { icon: 'add', text: 'Click "New Event" — fill in title, date, time, format, and a short description.' },
          { icon: 'link', text: 'Add the registration / RSVP URL (Eventbrite, Zoom, etc.) in the Registration URL field.' },
          { icon: 'search', text: 'Complete the SEO fields — a unique meta description per event improves discoverability.' },
          { icon: 'toggle_on', text: 'Set Published to ON to make the event visible on the public events page.' },
          { icon: 'videocam', text: 'After the event date passes, return and paste the recording URL. The page automatically swaps to a HubSpot-gated recording view.' },
          { icon: 'rocket_launch', text: 'For high-priority events, run the page through the LLM Optimiser so AI assistants surface it accurately.' },
        ],
        tips: [
          { kind: 'info', text: 'Events are automatically marked "past" based on their date — you never need to flip the status manually.' },
          { kind: 'tip', text: 'The recording gate collects leads via HubSpot, so every viewer of a past recording becomes a CRM contact.' },
          { kind: 'warning', text: 'If you leave the recording URL blank, past event pages show "Recording coming soon" — fill it in as soon as the recording is ready.' },
          { kind: 'info', text: 'For events, the LLM Optimiser patches only the body field, not the short description — the description stays concise as a teaser.' },
          { kind: 'tip', text: 'Pair each event with a vanity Redirect (e.g. /webinar) so it is trivial to share in emails and social posts.' },
        ],
        faqs: [
          { q: 'Do I need to change the event status to "past" after it happens?', a: 'No. The system compares the event date to the current date and automatically marks it past, switching the public page from a registration CTA to the gated recording view. You only need to add the recording URL.' },
          { q: 'Why is my recording asking visitors to sign up?', a: 'That is the intended behaviour. Past-event recordings sit behind a HubSpot gate form so each viewer becomes a tracked CRM contact. The gate appears automatically once the event date has passed and a recording URL is present.' },
          { q: 'Can I have an event that is in-person and online at once?', a: 'Yes — set the format to "hybrid". The public page presents both attendance options and a single registration link.' },
          { q: 'How do I make sure an event shows up in AI assistant answers?', a: 'Fill in strong SEO fields, then run the event through the LLM Optimiser (it patches the body field) and confirm it appears in the GEO/LLM Indexing manifest preview.' },
        ],
        combos: 'Redirects, LLM Optimiser, SEO Report, GEO/LLM Indexing',
        outcome: 'The events schedule is always accurate, registration links work, and past sessions convert visitors into HubSpot leads via gated recordings — with each event page discoverable by both search engines and AI assistants.',
      },
      {
        id: 'voice', icon: 'record_voice_over', label: 'Your Voice', href: '/admin/voice',
        tagline: 'The pink call-to-action block on every issue page',
        what: 'The "Your Voice" block is the prominent pink call-to-action that appears at the bottom of every wellbeing issue page, and it is the primary conversion point on those pages. From this one place you control its heading, body text, button label, button URL, and visibility — and your changes propagate instantly to all 59+ issue pages. It exists so that a single campaign message can be rolled out (or rolled back) site-wide in seconds.',
        when: 'Update it whenever you run a campaign ("Share your story for National Check-in Week"), need to change the CTA destination, or want to tune the message for a particular period. Toggle it off if a campaign ends and no replacement is ready.',
        steps: [
          { icon: 'edit', text: 'Open Your Voice — the editable fields are on the left, a live preview on the right.' },
          { icon: 'title', text: 'Edit the Heading (keep it short) and the Body text.' },
          { icon: 'link', text: 'Set the Button Label and URL — this can point at a survey, form, or landing page.' },
          { icon: 'visibility', text: 'Use the live preview to check wording and length before committing.' },
          { icon: 'toggle_on', text: 'Toggle visibility ON/OFF — when OFF, the block is hidden from every issue page at once.' },
          { icon: 'save', text: 'Save. Changes appear site-wide on all issue pages immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'Keep the heading under 8 words — it is displayed large and truncates on mobile if too long.' },
          { kind: 'warning', text: 'This single block appears on all 59+ issue pages simultaneously. Always check the preview before saving — a typo ships everywhere at once.' },
          { kind: 'info', text: 'The "Reset to defaults" button restores the original factory copy if your edits are not working out.' },
          { kind: 'tip', text: 'Test your button URL in an incognito window after saving — a broken CTA undermines every issue page at once.' },
          { kind: 'info', text: 'Because this is global, it is a great lever for time-boxed campaigns: turn it on at launch, off at the end.' },
        ],
        faqs: [
          { q: 'I changed the text but the public page still shows the old version — why?', a: 'Changes are immediate, so this is almost always browser or CDN caching. Hard-refresh the public page (Ctrl+Shift+R) or check in an incognito window. If it still shows the old copy, confirm you clicked Save and that visibility is ON.' },
          { q: 'Can I have different Your Voice text on different issues?', a: 'No — this block is intentionally global so one campaign message can be deployed everywhere instantly. For issue-specific calls to action, use the issue\'s own body content.' },
          { q: 'I broke the copy and cannot get it right — can I undo?', a: 'Use the "Reset to defaults" button to restore the original factory heading, body, and button. Then re-apply your changes carefully, checking the live preview as you go.' },
        ],
        combos: 'Issues, Submissions, Votes & Feedback',
        outcome: 'The site-wide call-to-action is on-message for the current campaign, the button works, and visitors are converting into stories and submissions across every issue page.',
      },
      {
        id: 'ambassadors', icon: 'diversity_3', label: 'Ambassadors', href: '/admin/ambassadors',
        tagline: 'Program ambassador profiles',
        what: 'This section manages the ambassador profiles shown on the public ambassadors page. Each ambassador record holds a name, photo, title/role, bio, and optional social links, and the display order is controlled by drag-and-drop. It exists to put a human face on the program and lend credibility through the people who champion it.',
        when: 'Add ambassadors as they join the program, update bios after role changes, reorder to feature key voices during a campaign, and hide (rather than delete) anyone whose involvement is paused.',
        steps: [
          { icon: 'add', text: 'Click "Add Ambassador" — fill in name and role, upload a headshot, and write a short bio.' },
          { icon: 'share', text: 'Add any social links you want displayed alongside the profile.' },
          { icon: 'drag_indicator', text: 'Drag rows to reorder — the order here is exactly the order shown on the public page.' },
          { icon: 'edit', text: 'Click any row to update details at any time.' },
          { icon: 'visibility_off', text: 'Toggle visibility off to temporarily hide a profile without losing its data.' },
          { icon: 'delete', text: 'Delete only when an ambassador is permanently gone — otherwise prefer hiding.' },
        ],
        tips: [
          { kind: 'tip', text: 'Square headshots (at least 400×400px) look best — the public display crops to a circle.' },
          { kind: 'info', text: 'Display order is set by dragging here; there is no separate rank field to manage.' },
          { kind: 'warning', text: 'Deleting is permanent and removes the photo too. Hide instead if there is any chance the person returns.' },
          { kind: 'tip', text: 'Keep bios to 2–3 sentences for a clean, scannable grid on the public page.' },
          { kind: 'info', text: 'Lead with your most recognisable ambassadors — the top of the list draws the most attention.' },
        ],
        faqs: [
          { q: 'My ambassador photo looks cropped or stretched — how do I fix it?', a: 'The public page crops photos to a circle, so upload a square image at least 400×400px with the face centred. Portrait or landscape images will be cropped to fit and may cut off the subject.' },
          { q: 'How do I change the order ambassadors appear in?', a: 'Drag the rows up or down in the list. The order you set here is the exact order shown publicly. There is no numeric rank to edit.' },
          { q: 'An ambassador is on a break — should I delete them?', a: 'No. Toggle their visibility off instead. That hides them from the public page while preserving their photo, bio, and links so you can bring them back instantly.' },
        ],
        combos: 'Partners, Submissions',
        outcome: 'The ambassadors page shows a current, well-ordered set of credible faces with clean headshots and concise bios that build trust in the program.',
      },
      {
        id: 'submissions', icon: 'inbox', label: 'Submissions', href: '/admin/submissions',
        tagline: 'User-submitted stories and responses',
        what: 'When a visitor responds via a connected form — usually through the "Your Voice" CTA — their submission lands here. Each submission stores the text and any contact details the person provided, and you can review, moderate, delete, or (where supported) feature it on the site. It exists as the safe inbox for sensitive, user-generated content that needs human judgement before it goes anywhere.',
        when: 'Check at least weekly, and daily during the campaign window when volume spikes. Review promptly so genuine stories are acknowledged quickly and anything inappropriate is removed before it lingers.',
        steps: [
          { icon: 'list', text: 'Open Submissions — entries are listed newest first.' },
          { icon: 'visibility', text: 'Click a submission to read the full text and view the submitter\'s contact details.' },
          { icon: 'flag', text: 'Triage each one: keep, feature, or remove. Apply your safeguarding lens before anything else.' },
          { icon: 'star', text: 'Mark notable, consent-appropriate submissions as "featured" to surface them publicly (if your theme supports it).' },
          { icon: 'mail', text: 'Where follow-up is appropriate and contact details exist, reach out in line with your privacy policy.' },
          { icon: 'delete', text: 'Delete spam or inappropriate submissions — this action is permanent.' },
        ],
        tips: [
          { kind: 'warning', text: 'Submissions may contain sensitive personal disclosures. Handle with care and follow your organisation\'s privacy and safeguarding policies.' },
          { kind: 'tip', text: 'Never publish a submission verbatim without explicit consent — even a featured story should be cleared first.' },
          { kind: 'info', text: 'Submissions arrive via connected forms, so volume tracks your campaign promotion and the Your Voice CTA.' },
          { kind: 'warning', text: 'Deletion is permanent with no recovery — export anything you may need for records before removing it.' },
          { kind: 'info', text: 'A sudden spike usually maps to a campaign push or a high-traffic moment, not a bug.' },
        ],
        faqs: [
          { q: 'Where do submissions come from?', a: 'They arrive from connected public forms, most commonly the "Your Voice" call-to-action on issue pages. If submissions stop arriving, check that the Your Voice button URL still points at a working form.' },
          { q: 'Can I feature a submission on the public site?', a: 'If your theme supports it, mark the submission as "featured". Always obtain explicit consent before publishing anyone\'s words, even anonymised.' },
          { q: 'Is a deleted submission recoverable?', a: 'No. Deletion is permanent. If you might need a submission for safeguarding records or follow-up, export or note it before deleting.' },
        ],
        combos: 'Your Voice, Votes & Feedback, Ambassadors',
        outcome: 'Every incoming story is reviewed promptly and respectfully, inappropriate content is removed quickly, and the best consented stories are surfaced to strengthen the public site.',
      },
      {
        id: 'partners', icon: 'handshake', label: 'Partners', href: '/admin/partners',
        tagline: 'Partner organisations and sponsor logos',
        what: 'The partners section manages the logos and listings for organisations backing National Check-in Week — sponsors, co-hosts, and partner organisations shown on the public Partners page. Each record carries an organisation name, logo, website URL, and a tier/category that groups it on the public page. It exists to recognise supporters and to lend the program institutional credibility.',
        when: 'Add a partner whenever a sponsorship or MOU is signed, update logos after brand refreshes, reorder within tiers to reflect priority, and hide lapsed sponsors rather than deleting them.',
        steps: [
          { icon: 'add', text: 'Click "Add Partner" — provide organisation name, logo file, website URL, and tier/category.' },
          { icon: 'category', text: 'Set the tier correctly — partners are grouped by tier on the public page.' },
          { icon: 'drag_indicator', text: 'Drag to reorder within a tier; order reflects display priority.' },
          { icon: 'link', text: 'Always fill in the website URL — public logos link to it on click.' },
          { icon: 'visibility_off', text: 'Toggle visibility off for a lapsed sponsor instead of deleting their record.' },
          { icon: 'save', text: 'Save — the Partners page updates immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'Use SVG or transparent PNG logos — they sit cleanly on both light and dark backgrounds.' },
          { kind: 'info', text: 'Partner logos link to their website on click, so a missing URL leaves a dead logo.' },
          { kind: 'tip', text: 'Group partners by tier consistently so the page communicates sponsorship hierarchy at a glance.' },
          { kind: 'warning', text: 'Confirm you have permission to display each partner\'s logo and that you are using their current brand mark.' },
          { kind: 'info', text: 'Hiding a partner keeps the record (logo, URL, tier) intact for an easy return.' },
        ],
        faqs: [
          { q: 'What logo format should I upload?', a: 'Use SVG where possible, or a PNG with a transparent background. These render crisply at any size and look clean on both light and dark sections of the page. Avoid logos with a baked-in white box.' },
          { q: 'How are partners grouped on the public page?', a: 'By the tier/category you assign to each one. Within a tier, the order is whatever you set by dragging. Set tiers deliberately to communicate your sponsorship hierarchy.' },
          { q: 'A sponsor lapsed — delete or hide?', a: 'Hide. Toggling visibility off keeps the logo, URL, and tier on file so you can reinstate the partner instantly if they renew, without re-entering anything.' },
        ],
        combos: 'Ambassadors, Resources, Logo & Branding',
        outcome: 'The Partners page presents current, correctly tiered logos that all link to live websites, communicating the program\'s backing at a glance.',
      },
      {
        id: 'resources', icon: 'description', label: 'Resources', href: '/admin/resources',
        tagline: 'Downloadable guides, fact sheets, and toolkits',
        what: 'The resources section manages downloadable files and curated external links shown on the public Resources page — fact sheets, implementation guides, toolkits, research papers, and referral pathways. Each resource has a title, description, category, and either an uploaded file (stored in Supabase Storage) or an external URL. It exists to give schools, parents, and partners a single trusted place to find practical materials.',
        when: 'Add a resource when a document is published or a useful external link should be surfaced. Archive resources that are outdated rather than deleting them, so historic links do not 404.',
        steps: [
          { icon: 'add', text: 'Click "Add Resource" — enter title, description, and category, then either upload a file or paste an external URL.' },
          { icon: 'category', text: 'Assign a category (e.g. "For Schools", "For Parents") — resources group by category publicly.' },
          { icon: 'edit', text: 'Write a compelling description — it is the only thing users read before deciding to download.' },
          { icon: 'drag_indicator', text: 'Reorder within categories; featured resources appear at the top.' },
          { icon: 'star', text: 'Mark a key resource as featured to give it prominence during a campaign.' },
          { icon: 'archive', text: 'Archive outdated resources instead of deleting — archived items are hidden but preserved.' },
        ],
        tips: [
          { kind: 'tip', text: 'A strong description does the selling — front-load the benefit ("A 5-minute classroom check-in script").' },
          { kind: 'info', text: 'Files live in Supabase Storage. PDFs under 25MB upload reliably; link larger files externally instead.' },
          { kind: 'warning', text: 'Test external links periodically — partner sites move documents and a dead link reflects poorly on the program.' },
          { kind: 'tip', text: 'Keep category names consistent with the rest of the site (matching the FAQ categories where possible) for a coherent experience.' },
          { kind: 'info', text: 'Archiving preserves the record so an inbound link to that resource keeps working until you decide otherwise.' },
        ],
        faqs: [
          { q: 'Should I upload a file or link externally?', a: 'Upload files under 25MB you control and want to keep available. Link externally for very large files, or for documents owned by a partner where you want them to manage the canonical version.' },
          { q: 'How do I retire an old resource without breaking links?', a: 'Archive it rather than deleting. Archiving hides the resource from the public page while preserving the record, so any existing inbound links degrade gracefully instead of returning a hard 404.' },
          { q: 'Why is my uploaded PDF not appearing?', a: 'Check it is under the 25MB practical limit, that it finished uploading, and that the resource is not archived. Very large or interrupted uploads are the usual culprits — link those externally instead.' },
        ],
        combos: 'FAQ, Partners, Blog',
        outcome: 'The Resources page is a current, well-categorised library with compelling descriptions and working links, and outdated material is archived cleanly rather than left to rot.',
      },
      {
        id: 'faq', icon: 'help', label: 'FAQ', href: '/admin/faq',
        tagline: 'Frequently asked questions management',
        what: 'This manages the FAQ items on the public FAQ page. Each item is a question paired with a rich-text answer, grouped into categories. Beyond serving visitors, FAQ content is one of the strongest AISEO assets on the site — question-and-answer pairs mirror exactly how people prompt AI assistants, making this content highly citable by ChatGPT, Perplexity, and Google AI Overviews.',
        when: 'Add FAQs as new questions arrive from schools, parents, or media. Update answers when policies or programs change. Reorder to put the most common questions first, and review the set before each campaign so the answers reflect current dates and offers.',
        steps: [
          { icon: 'add', text: 'Click "Add FAQ" — write the question exactly as a user would phrase it, then a clear answer.' },
          { icon: 'category', text: 'Assign a category (e.g. "For Schools", "About the Program") to group it on the public page.' },
          { icon: 'format_quote', text: 'Phrase each question as a complete, natural sentence — this maximises AISEO value.' },
          { icon: 'drag_indicator', text: 'Drag to reorder; the most-asked questions should sit first.' },
          { icon: 'rocket_launch', text: 'Run high-value FAQ pages through the LLM Optimiser to sharpen citations and structure.' },
          { icon: 'save', text: 'Save — changes appear on the public FAQ page immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'FAQ content is excellent for AISEO — questions mirror how people prompt AI assistants. Write each as a complete sentence.' },
          { kind: 'info', text: 'Use plain language; this page is read by parents, teachers, and students, not only professionals.' },
          { kind: 'tip', text: 'Where an answer cites a statistic, include the source — cited facts score higher in the SEO Report\'s AISEO checks.' },
          { kind: 'warning', text: 'Keep answers current with dates and program details — a stale FAQ answer is worse than none during a campaign.' },
          { kind: 'info', text: 'Categories group questions publicly, so keep them aligned with how your audiences actually segment (schools, parents, students).' },
        ],
        faqs: [
          { q: 'Why does the phrasing of FAQ questions matter so much?', a: 'AI assistants match content to user prompts. When your question is written as a complete, natural sentence ("How do schools register for National Check-in Week?"), it closely matches how people actually ask, making your answer far more likely to be cited verbatim.' },
          { q: 'How many FAQs should I have?', a: 'Cover every genuine question your audiences ask — there is no hard limit. Quality and accuracy beat quantity. Group them by category and order so the most common questions surface first.' },
          { q: 'Can FAQ content help with AI search visibility?', a: 'Yes, strongly. Question-and-answer structure is one of the AISEO signals the SEO Report scores. Pair clear Q&A phrasing with cited statistics and run the page through the LLM Optimiser for the best results.' },
        ],
        combos: 'SEO Report, LLM Optimiser, GEO/LLM Indexing, Resources',
        outcome: 'The FAQ page answers every common question in plain, cited language, and its question-answer structure makes the content highly citable by AI assistants — driving AISEO scores above 70.',
      },
    ],
  },

  {
    id: 'cms', label: 'CMS', icon: 'web', color: '#0891b2',
    features: [
      {
        id: 'homepage-builder', icon: 'web', label: 'Homepage Builder', href: '/admin/homepage-builder',
        tagline: 'Drag-and-drop homepage sections and global colour editor',
        what: 'The Homepage Builder has two tabs that together control the highest-traffic page on the site. The Content Blocks tab lets you add, remove, reorder, and configure the modular sections of the homepage (hero, stats strip, events section, partners strip, and more). The Global Colors tab adjusts the site-wide colour palette — primary, accent, background, and text — which applies everywhere at once. It exists so you can re-theme and re-arrange the homepage for a campaign without touching code.',
        when: 'Use it when a campaign needs a homepage refresh, when event season starts and you want an events block surfaced, or when brand colours change. Plan colour changes carefully — they are global and immediate.',
        steps: [
          { icon: 'layers', text: 'Open the Content Blocks tab — every homepage section appears as a draggable card.' },
          { icon: 'drag_indicator', text: 'Drag sections up or down to reorder them on the live homepage.' },
          { icon: 'toggle_on', text: 'Toggle any section\'s visibility to show or hide it without losing its configuration.' },
          { icon: 'settings', text: 'Click the gear on any block to edit its specific settings (headline, image, button text, etc.).' },
          { icon: 'palette', text: 'Switch to Global Colors to tweak the site-wide palette; changes apply across every page instantly.' },
          { icon: 'preview', text: 'Open the live homepage in another tab and verify on both desktop and mobile before considering it done.' },
        ],
        tips: [
          { kind: 'warning', text: 'Global colour changes affect every page instantly. Always preview on desktop and mobile before finalising.' },
          { kind: 'tip', text: 'The homepage is the highest-traffic page — keep the primary CTA within the first two blocks (above the fold).' },
          { kind: 'info', text: 'Hiding a block preserves its settings, so seasonal sections (like an events strip) can be toggled on and off without reconfiguring.' },
          { kind: 'tip', text: 'Reorder for the season: surface the events block during campaign weeks, then drop it down again afterwards.' },
          { kind: 'warning', text: 'Extreme colour choices can fail accessibility contrast. Check text legibility against the new background before saving.' },
        ],
        faqs: [
          { q: 'I changed a global colour and now text is hard to read — how do I recover?', a: 'Re-open the Global Colors tab and adjust the text or background colour back toward a high-contrast pairing. Because changes are global and immediate, fix it promptly. Always check legibility in the preview before saving future changes.' },
          { q: 'What is the difference between hiding a block and deleting it?', a: 'Hiding toggles visibility off but keeps all the block\'s settings, so you can bring it back instantly. Deleting removes the block and its configuration. For seasonal sections, always hide rather than delete.' },
          { q: 'Will reordering blocks affect mobile?', a: 'Yes — the order applies to both desktop and mobile. After reordering, preview the homepage on a narrow viewport to confirm the sequence still makes sense on small screens.' },
        ],
        combos: 'Hero Settings, Logo & Branding, Typography, Menu',
        outcome: 'The homepage is arranged for the current campaign with the primary CTA above the fold, the palette is on-brand and accessible, and it looks right on both desktop and mobile.',
      },
      {
        id: 'site-settings', icon: 'image', label: 'Logo & Branding', href: '/admin/site-settings',
        tagline: 'Site logo, favicon, and brand assets',
        what: 'This section manages the core brand assets used across every template — the header logo, footer logo variant, favicon, and any site-wide brand imagery. Assets are stored in Supabase Storage and served via a CDN edge cache, so they load fast everywhere. It exists as the single place to swap brand marks after a redesign without redeploying.',
        when: 'Use it when a new logo arrives from your designer, after a brand refresh, or when the favicon needs updating. This is infrequent, deliberate work — changes are global.',
        steps: [
          { icon: 'upload', text: 'Click the upload zone for Logo, Footer Logo, or Favicon.' },
          { icon: 'image', text: 'Use SVG for logos (crisp at any size) and PNG for the favicon (32×32px minimum).' },
          { icon: 'preview', text: 'Use the in-context preview (header mock-up) to confirm the asset looks right before saving.' },
          { icon: 'save', text: 'Save — the new asset appears on every page immediately.' },
          { icon: 'refresh', text: 'Hard-refresh (Ctrl+Shift+R) to clear the CDN/browser cache when verifying locally.' },
        ],
        tips: [
          { kind: 'tip', text: 'Keep a dark-mode logo variant and upload it separately if your theme supports it.' },
          { kind: 'info', text: 'Assets are CDN-cached, so a hard refresh is needed to see a change immediately during verification.' },
          { kind: 'warning', text: 'A logo with too much padding looks tiny in the header — crop tight whitespace before uploading.' },
          { kind: 'tip', text: 'Favicons should be simple and high-contrast — fine detail disappears at 16–32px.' },
          { kind: 'info', text: 'The footer logo can differ from the header (e.g. a monochrome version) for a cleaner footer.' },
        ],
        faqs: [
          { q: 'I uploaded a new logo but still see the old one — why?', a: 'Brand assets are served through a CDN edge cache. Hard-refresh the page (Ctrl+Shift+R) or wait briefly for the cache to expire. Confirm you saved, and check you uploaded to the correct slot (header vs footer).' },
          { q: 'What format should the logo be?', a: 'SVG is best — it stays crisp at every size and on any background. If you only have raster, use a high-resolution transparent PNG. For the favicon, use a PNG at 32×32px or larger with a simple, high-contrast mark.' },
          { q: 'Can the header and footer logos be different?', a: 'Yes. There are separate upload slots, so you can use a full-colour mark in the header and a monochrome or simplified version in the footer.' },
        ],
        combos: 'Homepage Builder, Hero Settings, Typography, Partners',
        outcome: 'The header logo, footer variant, and favicon are all current and on-brand, render crisply at every size, and appear consistently across the entire site.',
      },
      {
        id: 'home-page', icon: 'settings', label: 'Hero Settings', href: '/admin/home-page',
        tagline: 'Homepage hero and global header/footer config',
        what: 'This configures the homepage hero — the large banner at the very top of the homepage — including the headline, subheadline, background image or video, and primary CTA button. It also houses global header/footer settings such as navigation style and the site-wide announcement banner. As the first thing every homepage visitor sees, the hero carries most of the page\'s persuasive weight.',
        when: 'Update it at the start of each National Check-in Week campaign to align the hero with this year\'s theme and CTA. Also use it to set or clear the announcement banner around key moments.',
        steps: [
          { icon: 'title', text: 'Set the Hero Headline — keep it under 10 words for mobile readability.' },
          { icon: 'subtitles', text: 'Write the Hero Subheadline — 1–2 sentences expanding the headline.' },
          { icon: 'image', text: 'Upload a background image (min. 1920×1080px) or paste a video URL for a motion background.' },
          { icon: 'ads_click', text: 'Set the CTA Button Label and URL (e.g. "Register Now" → Eventbrite).' },
          { icon: 'campaign', text: 'Set or clear the global announcement banner from the header/footer settings here.' },
          { icon: 'save', text: 'Save, then open the live homepage to verify the hero reads well over the background.' },
        ],
        tips: [
          { kind: 'tip', text: 'Hero text must stay readable over the image — add a solid or semi-transparent overlay if the background is busy.' },
          { kind: 'warning', text: 'This page also controls the global announcement banner. If an old announcement is still showing, clear it here.' },
          { kind: 'info', text: 'Video backgrounds add weight to the page — prefer a short, compressed clip and always provide a fallback image.' },
          { kind: 'tip', text: 'Match the hero CTA destination to the current campaign goal (registration, story submission, donation) and test the link.' },
          { kind: 'warning', text: 'Long headlines wrap awkwardly on mobile — preview at a narrow width before publishing.' },
        ],
        faqs: [
          { q: 'My hero text is hard to read over the background image — what do I do?', a: 'Apply a solid or semi-transparent overlay colour over the background, or choose a calmer image with clear negative space where the text sits. Always check legibility on the live homepage across devices.' },
          { q: 'An old announcement banner is still showing — where do I remove it?', a: 'The announcement banner is controlled from the header/footer settings on this Hero Settings page. Clear the banner text (or toggle it off) here and save; it updates site-wide.' },
          { q: 'Should I use a video or an image background?', a: 'An image is lighter and safer for performance and accessibility. Use video only for a short, well-compressed clip with a strong reason, and always set a fallback image for devices that do not autoplay video.' },
        ],
        combos: 'Homepage Builder, Logo & Branding, Events, Redirects',
        outcome: 'The homepage hero is on-message for the current campaign, the CTA points at the right destination and works, and the headline reads cleanly over the background on every device.',
      },
      {
        id: 'pages', icon: 'article', label: 'CMS Pages', href: '/admin/cms/pages',
        tagline: 'Static content pages (About, Contact, GEO landing pages)',
        what: 'This is the builder for fully custom static pages. There are two types: Standard pages (About, Contact, Privacy Policy, and similar) and GEO pages (location-specific landing pages linked to an Area). Each page uses a block-based editor, carries full SEO fields, and has a status toggle for draft vs published. GEO pages are central to the local-SEO strategy — one bespoke page per region you want to rank for.',
        when: 'Use it for any standalone page that is not a blog post, event, or data-driven issue page. Create GEO pages when running a local SEO campaign, starting with major capital cities and expanding into regional areas.',
        steps: [
          { icon: 'add', text: 'Click "New Page" — choose type (Standard or GEO), then enter the title and slug.' },
          { icon: 'edit_note', text: 'Use the block editor to add content sections (text, image, CTA, stats, and more).' },
          { icon: 'search', text: 'Fill in the SEO tab — meta title (max 60 chars), meta description (max 160 chars), and an OG image.' },
          { icon: 'location_on', text: 'For GEO pages, link the page to the matching Area record so that area gains custom content.' },
          { icon: 'rocket_launch', text: 'Run the page through the LLM Optimiser if its AISEO score is low.' },
          { icon: 'toggle_on', text: 'Set status to Published when ready — draft pages remain private.' },
        ],
        tips: [
          { kind: 'tip', text: 'GEO pages dramatically improve local SEO. Start with major capital cities, then expand to regional areas.' },
          { kind: 'info', text: 'The SEO Report scores every published CMS page — use it to prioritise which pages need content work.' },
          { kind: 'warning', text: 'Choose the slug carefully before publishing — changing it later means creating a Redirect to avoid breaking inbound links.' },
          { kind: 'tip', text: 'Reuse a consistent block structure across GEO pages so the set is fast to produce and coherent to read.' },
          { kind: 'info', text: 'A GEO page linked to an Area overrides that area\'s auto-generated template with your bespoke content.' },
        ],
        faqs: [
          { q: 'When should I use a CMS Page versus a Blog post?', a: 'Use a CMS Page for evergreen, standalone content (About, Contact, Privacy) and for GEO landing pages tied to an Area. Use Blog for time-based editorial content like campaign updates and research write-ups.' },
          { q: 'How do GEO pages help SEO?', a: 'Each GEO page targets a specific location and links to its Area record, replacing the auto-generated template with richer, hand-written content. A page per region you want to rank for builds strong local search coverage.' },
          { q: 'I need to change a published page\'s slug — is that safe?', a: 'Changing a slug breaks any existing inbound links and bookmarks. If you must change it, create a 301 Redirect from the old slug to the new one in the Redirects section so traffic and SEO equity carry over.' },
        ],
        combos: 'Areas, Redirects, SEO Report, LLM Optimiser',
        outcome: 'Standard pages are complete and on-brand, and a growing set of GEO pages — each linked to its Area with strong SEO and AISEO scores — captures local search demand city by city.',
      },
      {
        id: 'blog', icon: 'rss_feed', label: 'Blog', href: '/admin/blog',
        tagline: 'Blog posts and articles',
        what: 'The blog is the primary editorial channel for National Check-in Week. Each post carries a title, named author, excerpt, rich-text body, featured image, and full SEO metadata, and can be drafted then published when ready. Posts are first-class SEO and AISEO surfaces — named authorship, an OG image, and depth all feed directly into the SEO Report\'s scoring. It exists to publish timely, credible, vault-grounded content that draws traffic and earns AI citations.',
        when: 'Publish around campaigns, research releases, events, and seasonal moments (back-to-school, Mental Health Month). Aim for at least 2 posts per month during the main campaign season, and run every post through the LLM Optimiser before launch.',
        steps: [
          { icon: 'add', text: 'Click "New Post", or use AI → Quick Content to draft directly from the Vault.' },
          { icon: 'edit', text: 'Write in the rich-text editor and add a featured image — it appears in social shares and listing cards.' },
          { icon: 'person', text: 'Set a named Author — authorship boosts E-E-A-T and AISEO scores.' },
          { icon: 'search', text: 'Fill in the SEO tab — always write a unique meta description rather than reusing the first line.' },
          { icon: 'rocket_launch', text: 'Run the post through the LLM Optimiser to lift its AISEO score before publishing.' },
          { icon: 'toggle_on', text: 'Toggle Published to ON when ready — the post appears on /blog immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'Posts drafted via AI → Quick Content save as unpublished drafts. Always review before publishing.' },
          { kind: 'info', text: 'Posts with a named author, an OG image, and 600+ words score significantly higher in the SEO Report.' },
          { kind: 'warning', text: 'Do not delete old posts — unpublish them instead. Deleting breaks inbound links from other sites.' },
          { kind: 'tip', text: 'Write the meta description as a standalone summary with a hook — it is the snippet searchers and AI assistants read first.' },
          { kind: 'info', text: 'A post\'s body is what the GEO/LLM Indexing endpoint serves to AI bots, so depth and clear statistics pay off twice.' },
        ],
        faqs: [
          { q: 'A post is published but not appearing on /blog — what is wrong?', a: 'Confirm the Published toggle is ON and that the post has a valid slug and publish date. Browser caching can also hide a fresh post — hard-refresh or check in incognito. If it still does not show, verify it is not still a draft from a Quick Content generation.' },
          { q: 'How do I get a post to rank and be cited by AI?', a: 'Give it a named author, a featured/OG image, and 600+ words of substantive, cited content. Write a unique meta description. Then run it through the LLM Optimiser and confirm in the SEO Report that both SEO and AISEO scores clear 70.' },
          { q: 'Why should I unpublish instead of delete an old post?', a: 'Deleting breaks every inbound link pointing at that URL, losing SEO equity and creating 404s. Unpublishing hides the post from readers while keeping the record so the URL can be restored or redirected later.' },
        ],
        combos: 'Quick Content, LLM Optimiser, SEO Report, GEO/LLM Indexing',
        outcome: 'A steady cadence of credible, vault-grounded posts with named authors, OG images, and strong SEO/AISEO scores — driving search traffic and earning citations from AI assistants.',
      },
      {
        id: 'menu', icon: 'menu', label: 'Menu', href: '/admin/cms/menu',
        tagline: 'Site navigation builder',
        what: 'This controls the navigation links in the site header and footer. You can add, remove, and reorder items, and each item can point at a published CMS page, a blog category, an event, or a custom URL, optionally opening in a new tab. It exists so the site\'s information architecture can be reshaped for a campaign without touching code.',
        when: 'Update the menu when a new important page is created, a section is retired, or the navigation needs to change for a campaign. Keep the main navigation lean year-round.',
        steps: [
          { icon: 'add', text: 'Click "Add Item" — choose the destination (existing page or custom URL) and set the label.' },
          { icon: 'drag_indicator', text: 'Drag items up or down to reorder; the order here is exactly what visitors see.' },
          { icon: 'open_in_new', text: 'Toggle "Open in new tab" for external links (partner sites, Eventbrite registrations).' },
          { icon: 'toggle_off', text: 'Toggle an item inactive to hide it temporarily (e.g. event off-season) without deleting it.' },
          { icon: 'save', text: 'Save — navigation updates on every page immediately.' },
        ],
        tips: [
          { kind: 'tip', text: 'Keep the main navigation to 5–7 items. More than 7 reduces findability on mobile.' },
          { kind: 'warning', text: 'Removing a menu item does not delete the page — it just hides it from navigation. The page stays reachable by direct URL.' },
          { kind: 'info', text: 'Items can link to CMS pages, blog categories, events, or any custom URL, giving you flexible navigation.' },
          { kind: 'tip', text: 'Use "Open in new tab" for external destinations so visitors do not lose the site when they leave.' },
          { kind: 'info', text: 'Toggling inactive is ideal for seasonal links like an events menu item that only matters during campaign weeks.' },
        ],
        faqs: [
          { q: 'I removed a page from the menu — is it deleted?', a: 'No. Removing a menu item only takes it out of the navigation. The underlying page still exists and is reachable by its direct URL. To take the page down entirely, unpublish it in CMS Pages or Blog.' },
          { q: 'How many top-level menu items should I have?', a: 'Aim for 5–7. Beyond that, navigation becomes hard to scan and especially cramped on mobile. Group related destinations or move secondary links to the footer.' },
          { q: 'Can a menu item link somewhere off-site?', a: 'Yes — choose a custom URL and enable "Open in new tab" so visitors keep your site open in their original tab while the external page loads separately.' },
        ],
        combos: 'CMS Pages, Blog, Redirects, Homepage Builder',
        outcome: 'The header and footer navigation is lean, logically ordered, and reflects the current campaign — with seasonal links toggled on and off rather than rebuilt each time.',
      },
      {
        id: 'redirects', icon: 'alt_route', label: 'Redirects', href: '/admin/cms/redirects',
        tagline: '301/302 URL redirects — no redeploy needed',
        what: 'This creates URL redirects that run at the edge in Next.js middleware, with no code deployment required. A 301 is a permanent redirect that transfers Google\'s link equity to the new URL; a 302 is temporary and leaves the old URL indexed. It exists so you can rename slugs, retire URLs, and create campaign vanity links instantly and safely.',
        when: 'Use it when you rename a page slug, retire an old URL, or need a short vanity URL for a campaign (e.g. /register → /events/2025-national-check-in-week). Always pair a slug change in CMS Pages or Blog with a matching 301 here.',
        steps: [
          { icon: 'add', text: 'Click "New Redirect" — enter the source path (e.g. /old-page) and the destination URL.' },
          { icon: 'swap_horiz', text: 'Choose 301 (permanent — the old URL is gone for good) or 302 (temporary — for campaigns).' },
          { icon: 'toggle_on', text: 'Leave it active; use the pause toggle to disable temporarily without deleting.' },
          { icon: 'link_off', text: 'Avoid chains — point the redirect directly at the final destination, not at another redirect.' },
          { icon: 'check', text: 'Test immediately by visiting the source URL in an incognito window.' },
        ],
        tips: [
          { kind: 'info', text: 'Use 301 for SEO — it passes roughly 95% of the original page\'s ranking power to the new URL. 302 does not.' },
          { kind: 'warning', text: 'Avoid redirect chains (A → B → C). Always point a redirect directly at the final destination.' },
          { kind: 'tip', text: 'Create a vanity redirect for every major campaign: /register, /webinar, /toolkit. They are easy to share in emails and social.' },
          { kind: 'warning', text: 'Do not create a loop (A → B and B → A) — it makes the page unreachable. Double-check both directions.' },
          { kind: 'info', text: 'Redirects apply instantly because they run in middleware at the edge — no deploy and no cache wait.' },
        ],
        faqs: [
          { q: 'When should I use a 301 versus a 302?', a: 'Use 301 (permanent) whenever the old URL is gone for good — it passes about 95% of ranking power to the new URL. Use 302 (temporary) for short-lived campaign or vanity links where you intend the original URL to come back later.' },
          { q: 'Do redirects require a deployment?', a: 'No. Redirects run in Next.js middleware at the edge and take effect instantly the moment you save — no code deploy and no waiting for a cache to clear.' },
          { q: 'My redirect is not working — what should I check?', a: 'Confirm the source path is exact (leading slash, no trailing typo), the redirect is active (not paused), and you are testing in incognito to avoid a cached page. Also check you have not created a chain or loop with another redirect.' },
        ],
        combos: 'CMS Pages, Blog, Events, Menu',
        outcome: 'Renamed and retired URLs never 404, SEO equity is preserved via 301s, and every campaign has a clean shareable vanity link — all without a deployment.',
      },
    ],
  },

  {
    id: 'ai', label: 'AI', icon: 'auto_awesome', color: '#7c3aed',
    features: [
      {
        id: 'vault-sources', icon: 'lock', label: 'Vault Library', href: '/admin/vault/sources',
        tagline: 'The AI\'s knowledge base — your source of truth',
        what: 'The Vault is the library of documents the AI reads before generating any content — think of it as the AI\'s briefing pack. Every PDF, report, and fact sheet you add is chunked into small passages, converted to vector embeddings, and stored so the system can retrieve the most semantically relevant sections on demand. The Library view is where you manage, monitor, and audit those documents, and the quality of everything the AI produces is bounded by the quality and breadth of what lives here.',
        when: 'Add documents whenever you have new research, updated statistics, brand guidelines, or anything you want the AI to reference. Audit the Library before any major content batch, and remove outdated documents so stale statistics never resurface in generated content.',
        steps: [
          { icon: 'list', text: 'Open Vault Library to see all documents, each with a status chip showing its processing stage.' },
          { icon: 'info', text: 'Understand the status flow: Queued → Extracting → Chunking → Embedding → Ready. Only "Ready" documents are searchable.' },
          { icon: 'filter_list', text: 'Filter by status (e.g. "Failed") to spot documents that need attention.' },
          { icon: 'category', text: 'Keep category labels consistent — they improve retrieval and make the Library auditable.' },
          { icon: 'refresh', text: 'Click "Reindex" on a failed or stuck document to retry processing.' },
          { icon: 'visibility', text: 'Inspect chunk previews to confirm a document\'s text extracted correctly (important for complex PDFs).' },
          { icon: 'delete', text: 'Delete outdated documents so the AI cannot reference stale figures.' },
        ],
        tips: [
          { kind: 'info', text: 'The stats strip shows total chunks and tokens — a direct measure of how much knowledge the AI can draw on.' },
          { kind: 'tip', text: 'Use consistent categories ("Research", "Statistics", "Brand Guidelines", "Program Info") to sharpen retrieval.' },
          { kind: 'warning', text: 'Large PDFs (50+ pages) take a few minutes to embed. Do not generate from a document still showing "Chunking".' },
          { kind: 'tip', text: 'Breadth beats depth — broad topic coverage helps more than many copies of one report, since only the top chunks are retrieved per generation.' },
          { kind: 'warning', text: 'A "Failed" document contributes nothing. Reindex it, and if it keeps failing, the source file is likely scanned, encrypted, or corrupted.' },
        ],
        faqs: [
          { q: 'What file formats are supported?', a: 'PDFs (best for research reports), Word .docx, plain text .txt, and Markdown .md. The system extracts raw text from each — tables and figures in PDFs are partially extracted but complex layouts may lose formatting. For best results, save research reports as text-heavy PDFs without heavy graphics.' },
          { q: 'How many documents should be in the vault?', a: 'The more the better — aim for 50+ documents covering your core topic areas: youth mental health statistics, school wellbeing research, program outcomes, partner data, brand guidelines. The AI retrieves the 5 most semantically relevant chunks per generation, so breadth of coverage matters more than depth of any single document.' },
          { q: 'Why is a document stuck on "Chunking"?', a: 'Large PDFs (50+ pages) can take 2–5 minutes to fully process. If it has been more than 10 minutes, click Reindex to retry. Common failure causes: scanned PDFs (no extractable text), password-protected files, or corrupted uploads. Convert scanned PDFs to text-layer PDFs using Adobe Acrobat before uploading.' },
          { q: 'What is the difference between Vault Library and Vault Upload?', a: 'They are two views of the same system. Upload is where you add new documents. Library is where you manage, monitor, and search existing documents. Use Upload to add, Library to audit.' },
        ],
        combos: 'Vault Upload, Quick Content, Content Pipeline, LLM Optimiser',
        outcome: 'Every document shows "Ready" status. Categories are consistent. The token count shown in the stats strip is 500k+. When you run Quick Content or Pipeline, vault references cite specific, credible sources.',
      },
      {
        id: 'vault-upload', icon: 'upload', label: 'Vault Upload', href: '/admin/vault/upload',
        tagline: 'Add documents to the AI\'s knowledge base',
        what: 'Vault Upload offers three ways to feed the Vault: drop files (drag PDFs, Word docs, TXT, or Markdown), paste text (type or paste raw text with a title and source URL), or paste a URL (the system crawls the page, extracts the main content, and ingests it). It is the front door to the same system the Vault Library manages, and every document added here flows through the chunk-and-embed pipeline before becoming searchable.',
        when: 'Use it after receiving a new research report, when a partner sends a fact sheet, or when you want to ingest a specific web page such as a Beyond Blue report or a government statistics page. Add early and often — content campaigns are only as good as the Vault behind them.',
        steps: [
          { icon: 'upload_file', text: 'For files: drag up to 10 files (max 100MB each) into the drop zone; they queue automatically.' },
          { icon: 'content_paste', text: 'For pasted text: fill in Title, Source URL, Body, Category, and Tags.' },
          { icon: 'language', text: 'For URLs: paste a web address — the system crawls, extracts the main content, and adds it.' },
          { icon: 'category', text: 'Assign a consistent category as you add so retrieval stays sharp.' },
          { icon: 'pending', text: 'Watch the upload queue on the right; each document shows a live status.' },
          { icon: 'check_circle', text: 'Once all documents reach "Ready", they are available to every AI generation tool.' },
        ],
        tips: [
          { kind: 'tip', text: 'Paste text is ideal for verified statistics — paste just the key paragraphs, not an entire document.' },
          { kind: 'info', text: 'URL crawling works best on simple article pages. JavaScript-heavy pages may extract partially — verify via the chunk preview in Vault Library.' },
          { kind: 'warning', text: 'Never upload confidential material (internal financials, staff details) — anything in the Vault can surface in generated content.' },
          { kind: 'tip', text: 'Always include a real Source URL when pasting text — it lets generated content cite back to the original.' },
          { kind: 'warning', text: 'Scanned PDFs with no text layer will fail to embed. Convert them to text-layer PDFs before uploading.' },
        ],
        faqs: [
          { q: 'What file formats are supported?', a: 'PDFs (best for research reports), Word .docx, plain text .txt, and Markdown .md. The system extracts raw text from each — tables and figures in PDFs are partially extracted but complex layouts may lose formatting. For best results, save research reports as text-heavy PDFs without heavy graphics.' },
          { q: 'Which upload method should I use?', a: 'Drop files for whole documents you have on disk. Paste text when you only want a few verified paragraphs (and can supply the source URL). Paste a URL when the content lives on a simple public web page you want crawled automatically.' },
          { q: 'A pasted URL only captured part of the page — why?', a: 'URL crawling extracts the main article content and works best on simple pages. JavaScript-heavy or paywalled pages may extract partially. Verify the result via the chunk preview in Vault Library, and fall back to pasting the key text manually if needed.' },
          { q: 'Is there a size limit per file?', a: 'Yes — up to 10 files at once, 100MB each. Very large PDFs take several minutes to embed; for anything bigger, split it or link the source and paste the key sections.' },
        ],
        combos: 'Vault Library, Quick Content, Content Pipeline, Prompts',
        outcome: 'New research and source material is ingested promptly, every document reaches "Ready" with a source URL and consistent category, and the AI always has current, citable knowledge to draw on.',
      },
      {
        id: 'simple-content', icon: 'bolt', label: 'Quick Content', href: '/admin/simple-content',
        tagline: 'Generate a vault-grounded article in 3 steps',
        what: 'Quick Content is the fastest path to a finished blog post, LinkedIn update, Instagram caption, or newsletter section. You provide a short prompt, pick from AI-suggested titles, choose a content type, and the AI writes a complete draft grounded entirely in your Vault documents — with source citations shown alongside. It exists so less-technical team members can produce quality, on-brand content without learning the full Content Pipeline.',
        when: 'Use it when you need content quickly for a campaign push, a social post, or a topical blog article — especially reactive content tied to a news hook. For planned, calendar-driven content, prefer the Content Pipeline instead.',
        steps: [
          { icon: 'edit', text: 'Step 1 — Prompt: describe what you want in 1–3 sentences, including angle and target audience.' },
          { icon: 'list', text: 'Step 2 — Choose a content type (Blog Article, Short Article, LinkedIn Post, Instagram Caption, Newsletter Section), then pick from 4 AI-suggested titles or type your own.' },
          { icon: 'auto_awesome', text: 'Step 3 — Generate: the AI writes the full piece grounded in the Vault, with references showing which documents were used.' },
          { icon: 'feedback', text: 'Not happy? Use the Feedback form (e.g. "make it more stats-heavy", "shorter sentences") and regenerate.' },
          { icon: 'rocket_launch', text: 'Optionally run the result through the LLM Optimiser before publishing for a higher AISEO score.' },
          { icon: 'check_circle', text: 'Approve to save as an unpublished Blog draft, then go to Blog to review and publish.' },
        ],
        tips: [
          { kind: 'tip', text: 'Specificity wins: "Write about the link between social media use and anxiety in Australian teenagers, for a school counsellor audience" beats "Write about youth anxiety".' },
          { kind: 'info', text: 'Every generation is saved in History (the clock icon) — you can restore any previous run.' },
          { kind: 'warning', text: 'Quick Content needs a populated Vault. A "Vault is empty" error means you must upload documents first.' },
          { kind: 'tip', text: 'Always read the draft and verify cited statistics against the Vault before publishing — AI can occasionally misattribute.' },
          { kind: 'info', text: 'Approved content lands as an unpublished Blog draft, so nothing goes live until you publish it deliberately.' },
        ],
        faqs: [
          { q: 'I got a "Vault is empty" error — what now?', a: 'Quick Content writes only from Vault documents, so it needs at least some "Ready" content to work. Go to Vault Upload, add relevant documents, wait for them to reach "Ready" in the Library, then return and generate.' },
          { q: 'How do I get better output?', a: 'Be specific in the prompt — name the angle, the audience, and any must-include points. Use the Feedback form to nudge tone or length and regenerate. The richer and more on-topic your Vault, the better the result.' },
          { q: 'Where does the content go after I approve it?', a: 'It saves as an unpublished draft in the Blog section. Nothing is public until you open it in Blog, add the author and SEO details, and toggle it live.' },
          { q: 'When should I use Quick Content versus the Content Pipeline?', a: 'Use Quick Content for fast, reactive, one-off pieces. Use the Content Pipeline for planned, calendar-driven content produced at scale with topics, ideas, drafts, and a verification stage.' },
        ],
        combos: 'Vault Library, Blog, LLM Optimiser, Content Pipeline',
        outcome: 'A polished, vault-grounded draft exists in Blog within minutes, with visible source citations, ready for a quick human review before publishing.',
      },
      {
        id: 'content-creator', icon: 'dashboard', label: 'Content Pipeline', href: '/admin/content-creator',
        tagline: 'Structured AI workflow: Topics → Ideas → Drafts → Verified',
        what: 'The Content Pipeline is a structured editorial workflow for producing high-quality, vault-grounded long-form content at scale. Content advances through four stages — Topics (what to write about), Ideas (specific article briefs), Drafts (AI-generated content for human review), and Verified (approved and publish-ready). The dashboard shows stage counts so you can see where the bottleneck is. It exists to let a team plan, generate, and quality-control a content calendar collaboratively.',
        when: 'Use it when planning a content calendar, producing a batch of SEO articles, or when multiple people work on content at different stages. For one-off reactive pieces, use Quick Content instead.',
        steps: [
          { icon: 'lightbulb', text: 'Topics: identify broad subject areas — generate suggestions from the Vault or add them manually.' },
          { icon: 'emoji_objects', text: 'Ideas: turn a topic into a specific brief (working title, audience, key points). Ideas can be bulk-generated.' },
          { icon: 'edit_note', text: 'Drafts: the AI generates a full draft from each Idea. Review, edit, or regenerate sections in the draft editor.' },
          { icon: 'fact_check', text: 'Verify statistics in each draft against the source Vault documents before approving.' },
          { icon: 'verified', text: 'Verified: mark a reviewed draft as Verified — it is now ready to publish to Blog.' },
          { icon: 'publish', text: 'Publish Verified content to Blog, then finish the SEO and author details there.' },
        ],
        tips: [
          { kind: 'info', text: 'Use the Pipeline for planned content (a monthly SEO calendar); use Quick Content for reactive content (news hooks, social).' },
          { kind: 'tip', text: 'Watch the stage counts on the dashboard — keep Drafts moving to Verified rather than letting them pile up and go stale.' },
          { kind: 'warning', text: 'Drafts go stale as the Vault and the world move on. Review them promptly rather than hoarding.' },
          { kind: 'info', text: 'Styles let you lock tone across the whole pipeline — define them once and apply them when generating Drafts.' },
          { kind: 'tip', text: 'Generate Ideas in bulk, then curate hard — Ideas are cheap, but only draft the ones genuinely worth publishing.' },
        ],
        faqs: [
          { q: 'What is the point of four separate stages?', a: 'Each stage is a quality gate. Topics ensure you write about the right things, Ideas turn them into focused briefs, Drafts produce reviewable content, and Verified confirms a human has checked it. The separation lets a team collaborate and prevents unreviewed AI text reaching the public.' },
          { q: 'Can multiple people work in the pipeline at once?', a: 'Yes — that is a core reason it exists. One person can curate Topics and Ideas while another reviews Drafts and marks them Verified. The dashboard stage counts show everyone where the work is sitting.' },
          { q: 'My Drafts queue is growing — what should I do?', a: 'Prioritise moving Drafts to Verified or archiving the ones you will not use. Drafts go stale as the Vault updates, so a clean, flowing queue produces better content than a large backlog.' },
        ],
        combos: 'Topics, Ideas, Drafts, Verified, Styles, Vault Library',
        outcome: 'A healthy, flowing content factory: a backlog of curated Ideas, Drafts moving steadily to Verified, and a ready queue of approved articles to publish on demand.',
      },
      {
        id: 'topics', icon: 'lightbulb', label: 'Topics', href: '/admin/content-creator/topics',
        tagline: 'Broad subject areas drawn from your Vault',
        what: 'Topics are the starting point of the Content Pipeline — broad subject areas (e.g. "Youth Mental Health & Social Media", "School-Based Wellbeing Programs") that each spawn multiple Ideas and Drafts. The AI can generate topics by analysing what is in your Vault, or you can add them manually. They exist to give your content calendar coherent themes rather than a scatter of unrelated articles.',
        when: 'Generate or curate topics at the start of each content planning cycle — monthly or quarterly — and whenever you have added significant new Vault material that opens up fresh subject areas.',
        steps: [
          { icon: 'auto_awesome', text: 'Click "Generate Topics" to have the AI analyse the Vault and suggest relevant subject areas.' },
          { icon: 'add', text: 'Or click "Add Topic" to create one manually with a custom title and description.' },
          { icon: 'fact_check', text: 'Curate the suggestions — keep topics broad enough to support several articles each.' },
          { icon: 'emoji_objects', text: 'From any topic card, click "Generate Ideas" to spawn article briefs from that topic.' },
          { icon: 'archive', text: 'Archive topics that are no longer relevant; archived topics will not generate new ideas.' },
        ],
        tips: [
          { kind: 'tip', text: 'A good topic supports 5+ articles. If it only yields 1–2, it is probably better created directly as an Idea.' },
          { kind: 'info', text: 'Generated topics reflect what is actually in your Vault, so richer source material yields stronger topic suggestions.' },
          { kind: 'warning', text: 'Avoid overlapping topics — near-duplicate themes produce repetitive Ideas and Drafts.' },
          { kind: 'tip', text: 'Name topics the way your audience thinks, not in internal jargon — it makes the resulting content more relatable.' },
          { kind: 'info', text: 'Archiving keeps your topic list focused without losing the record.' },
        ],
        faqs: [
          { q: 'Should I generate topics or write them myself?', a: 'Generate first — the AI surfaces themes grounded in your actual Vault content, which you might not have thought of. Then add any strategic topics manually and prune overlaps. A blend of both gives the best calendar.' },
          { q: 'How broad should a topic be?', a: 'Broad enough to support at least five distinct articles. If a subject only yields one or two angles, skip the topic layer and create it directly as an Idea instead.' },
          { q: 'What happens when I archive a topic?', a: 'It stops appearing as an active topic and will not generate new Ideas, but the record is preserved. Use it to keep the active list focused without permanently deleting your planning history.' },
        ],
        combos: 'Content Pipeline, Ideas, Vault Library, Styles',
        outcome: 'A curated set of broad, non-overlapping topics — each grounded in real Vault content and capable of feeding multiple articles into the pipeline.',
      },
      {
        id: 'styles', icon: 'brush', label: 'Styles', href: '/admin/content-creator/styles',
        tagline: 'Reusable tone and format templates',
        what: 'Content Styles are reusable templates that define tone, reading level, and structure for AI-generated content — for example "Formal — for policy stakeholders", "Accessible — plain language for parents", or "Engaging — for social media". When generating Ideas or Drafts you select a style, and the AI follows it. They exist to keep a consistent voice across everything the pipeline produces, regardless of who triggered the generation.',
        when: 'Create your styles once when you define your content strategy, then apply them on every generation. Revisit and refine the descriptions over time as you learn which instructions produce the best output.',
        steps: [
          { icon: 'add', text: 'Click "Add Style" — give it a clear name and a detailed description of tone and format instructions.' },
          { icon: 'tune', text: 'Specify target reader, vocabulary level, sentence-length guidance, and what to avoid.' },
          { icon: 'auto_awesome', text: 'When generating a Draft, select the appropriate style so the AI writes to it.' },
          { icon: 'edit', text: 'Refine a style\'s description over time based on what works well in practice.' },
        ],
        tips: [
          { kind: 'tip', text: 'The more specific the description, the more consistent the output — include reader, vocabulary level, sentence length, and what to avoid.' },
          { kind: 'info', text: 'Styles apply at generation time, so updating a style affects only future generations, not existing drafts.' },
          { kind: 'tip', text: 'Maintain one style per audience (parents, schools, policy) so you can switch voice deliberately.' },
          { kind: 'warning', text: 'Vague styles ("friendly") do little. Concrete constraints ("short sentences, no jargon, address the reader as \'you\'") produce real consistency.' },
          { kind: 'info', text: 'Styles stack with the vault-grounding — the AI still sources facts from the Vault, then writes in the chosen voice.' },
        ],
        faqs: [
          { q: 'How detailed should a style description be?', a: 'Very. Spell out the target reader, vocabulary level, typical sentence length, structure preferences, and explicit things to avoid. A vague word like "friendly" gives little to work with; concrete constraints produce genuinely consistent output.' },
          { q: 'If I edit a style, does it change content already written?', a: 'No. Styles are applied at generation time. Editing one affects only future Drafts and Ideas generated with it. To apply an updated style to existing content, regenerate it.' },
          { q: 'How many styles should I maintain?', a: 'Typically one per distinct audience or channel — e.g. parents, schools, policy stakeholders, social media. That lets you switch voice deliberately without re-explaining tone every time.' },
        ],
        combos: 'Content Pipeline, Drafts, Ideas, Prompts',
        outcome: 'A small set of well-defined styles produces consistent, audience-appropriate voice across every piece the pipeline generates, no matter who runs it.',
      },
      {
        id: 'ideas', icon: 'emoji_objects', label: 'Ideas', href: '/admin/content-creator/ideas',
        tagline: 'Article briefs waiting to become drafts',
        what: 'Ideas are specific article briefs — a working title, target audience, and the key points to cover — sitting between Topics and Drafts in the pipeline. An Idea can be AI-generated from a Topic or written manually, and from any Idea you trigger a full Draft. They exist as the curatable buffer that turns broad themes into concrete, draftable articles.',
        when: 'Browse Ideas when you are ready to generate Drafts. Keep a healthy buffer — 10–20 queued Ideas at any time means you always have something ready to write.',
        steps: [
          { icon: 'auto_awesome', text: 'From Topics, click "Generate Ideas" on a topic card; the AI creates 3–5 briefs.' },
          { icon: 'add', text: 'Or click "New Idea" to write a brief manually.' },
          { icon: 'fact_check', text: 'Curate the list — delete weak or duplicate briefs so only worthwhile ones remain.' },
          { icon: 'edit_note', text: 'Click "Generate Draft" on any Idea to move it to Drafts; the AI writes the full article from the brief.' },
          { icon: 'delete', text: 'Delete Ideas that are no longer relevant to keep the pipeline clean.' },
        ],
        tips: [
          { kind: 'info', text: 'Ideas are cheap to generate and easy to delete — generate in bulk, then curate down to the ones worth drafting.' },
          { kind: 'tip', text: 'Sharpen the working title and key points before generating a Draft; a precise brief yields a far better draft.' },
          { kind: 'warning', text: 'Do not draft every Idea — an over-full Drafts queue goes stale faster than you can review it.' },
          { kind: 'tip', text: 'Tie each Idea to a clear audience so the eventual Draft has a defined reader from the start.' },
          { kind: 'info', text: 'A buffer of 10–20 Ideas keeps the calendar flowing without scrambling for topics each week.' },
        ],
        faqs: [
          { q: 'Should I draft every Idea I generate?', a: 'No. Ideas are deliberately cheap to produce so you can generate in bulk and curate. Draft only the strongest, most relevant briefs; delete the rest. An over-full Drafts queue goes stale before you can review it.' },
          { q: 'How do I get a better Draft from an Idea?', a: 'Sharpen the brief first — tighten the working title, name the specific audience, and list the concrete points to cover. A precise Idea produces a noticeably better Draft than a vague one.' },
          { q: 'How many Ideas should I keep queued?', a: 'Around 10–20 active Ideas is a healthy buffer. That keeps your content calendar flowing without forcing you to brainstorm from scratch each cycle.' },
        ],
        combos: 'Topics, Drafts, Content Pipeline, Styles',
        outcome: 'A curated buffer of sharp, audience-specific briefs is always ready, so generating a strong Draft is a one-click step whenever you need fresh content.',
      },
      {
        id: 'drafts', icon: 'edit_note', label: 'Drafts', href: '/admin/content-creator/drafts',
        tagline: 'AI-generated content awaiting human review',
        what: 'Drafts are AI-written articles generated from Ideas but not yet human-reviewed. Each draft includes the full body, vault citations, and metadata, and the editor lets you edit, regenerate specific sections with targeted instructions, or send it onward. A human editor reviews, fact-checks, and either marks it Verified or archives it. This is the critical quality gate where AI output becomes trustworthy, publishable content.',
        when: 'Review the Drafts queue regularly — at least weekly during campaign season. Drafts that sit too long go stale as the world and your Vault move on, so process them while they are fresh.',
        steps: [
          { icon: 'list', text: 'Open Drafts and scan the queue — each card shows title, source idea, generation date, and word count.' },
          { icon: 'edit', text: 'Open a draft and read it carefully — AI can occasionally hallucinate or miss nuance.' },
          { icon: 'fact_check', text: 'Fact-check every statistic against the source Vault documents before trusting it.' },
          { icon: 'refresh', text: 'For a weak section, select it and use "Regenerate Section" with a specific instruction.' },
          { icon: 'verified', text: 'When satisfied, click "Mark as Verified" to advance it to the Verified stage.' },
          { icon: 'archive', text: 'Archive drafts you will not use to keep the queue clean.' },
        ],
        tips: [
          { kind: 'warning', text: 'Always fact-check statistics in AI drafts against the source Vault documents — hallucination is rare but possible.' },
          { kind: 'tip', text: 'Edit the title, suggest a featured image, and write the meta description before verifying — it saves time when publishing in Blog.' },
          { kind: 'info', text: 'Regenerate works at the section level, so you can fix one weak paragraph without rewriting the whole piece.' },
          { kind: 'tip', text: 'Give regeneration a specific instruction ("add an Australian statistic with a source") rather than a vague "improve this".' },
          { kind: 'warning', text: 'A stale draft is a liability — review promptly rather than letting the queue accumulate.' },
        ],
        faqs: [
          { q: 'How worried should I be about AI hallucination?', a: 'Cautious but not paranoid. Hallucination is uncommon because drafts are vault-grounded, but it is possible. Always cross-check every statistic and named fact against the source Vault documents before marking a draft Verified.' },
          { q: 'Can I fix just one bad paragraph?', a: 'Yes. Select the weak section and use "Regenerate Section" with a specific instruction — for example, "rewrite this with a cited Australian statistic". This avoids rewriting the whole article to fix one part.' },
          { q: 'What should I finish before marking a draft Verified?', a: 'Tighten the title, write the meta description, and note a featured image suggestion. Doing this now means the eventual publish step in Blog is fast and the post is SEO-ready from the start.' },
        ],
        combos: 'Ideas, Verified, Content Pipeline, Blog',
        outcome: 'Every draft that advances has been read, fact-checked against the Vault, and prepared with title and metadata — so Verified content is genuinely publish-ready.',
      },
      {
        id: 'verified', icon: 'verified', label: 'Verified', href: '/admin/content-creator/verified',
        tagline: 'Reviewed and approved content, ready to publish',
        what: 'The Verified stage is the final holding area for content that has been reviewed, edited, and approved — your content calendar queue. Verified items are considered publication-ready and only need to be pushed to the Blog and given final publishing details. It exists so you always have a vetted reserve of articles to publish on demand around campaign moments.',
        when: 'Come here when you are ready to schedule or publish content. Build the queue ahead of campaign moments so you never have to write under time pressure.',
        steps: [
          { icon: 'list', text: 'Browse Verified content — each card represents a ready-to-go article.' },
          { icon: 'publish', text: 'Click "Publish to Blog" to push an article into Blog as an unpublished draft.' },
          { icon: 'open_in_new', text: 'Go to Blog to set the featured image, author, and publish date.' },
          { icon: 'rocket_launch', text: 'Run it through the LLM Optimiser before going live to lift its AISEO score.' },
          { icon: 'toggle_on', text: 'Toggle the post live in Blog when you are ready.' },
        ],
        tips: [
          { kind: 'tip', text: 'Batch-verify content in advance so you always have a queue of ready-to-go articles for campaign moments.' },
          { kind: 'info', text: 'Publishing to Blog creates an unpublished draft — nothing goes live until you toggle it on in Blog.' },
          { kind: 'tip', text: 'Treat Verified as your editorial reserve; aim to keep several articles waiting rather than running empty.' },
          { kind: 'warning', text: 'Even verified content benefits from a final read in Blog before going live — context can shift between approval and publish.' },
          { kind: 'info', text: 'Verified content carries over its title and metadata, so the Blog publish step is quick.' },
        ],
        faqs: [
          { q: 'Does "Publish to Blog" make the article live immediately?', a: 'No. It creates an unpublished draft in the Blog section. The article only goes public when you open it in Blog, finish the author/SEO/image details, and toggle Published on.' },
          { q: 'How many articles should I keep in Verified?', a: 'Enough to cover your upcoming campaign moments — several at minimum. A healthy reserve means you publish on schedule instead of writing under pressure.' },
          { q: 'Should I still review a Verified article before publishing?', a: 'A quick final read in Blog is wise. Time can pass between verification and publishing, and a date, statistic, or campaign detail may need a small update before it goes live.' },
        ],
        combos: 'Drafts, Blog, LLM Optimiser, Content Pipeline',
        outcome: 'You hold a vetted reserve of publish-ready articles and can ship polished content on schedule for any campaign moment with just a final Blog review.',
      },
      {
        id: 'prompts', icon: 'smart_toy', label: 'Prompts', href: '/admin/prompts',
        tagline: 'AI prompt templates for batch generation',
        what: 'Prompt templates control exactly how the AI writes for specific content types — state pages, area pages, issue descriptions. Each template uses variables like {{title}}, {{state}}, and {{issue}}, and editing one changes the instructions sent to Claude for every future generation of that type. They sit on top of the same vault-grounding system: the AI retrieves relevant Vault content first, then applies your prompt instructions. This is the lever for tuning AI output quality and tone at scale.',
        when: 'Edit prompts when AI output quality is not meeting your standard, when tone needs to shift, or when new standing context must be baked in (e.g. "always mention the 2025 campaign date"). Test changes on a single record before applying them to a whole batch.',
        steps: [
          { icon: 'list', text: 'Open Prompts — each template is listed by type (State Page, Area Page, Issue Description, etc.).' },
          { icon: 'edit', text: 'Click a template to edit. Keep the variables ({{title}}, {{state}}, {{issue}}) intact — do not remove them.' },
          { icon: 'save', text: 'Save the prompt.' },
          { icon: 'science', text: 'Test on a single record first — generate one state or area and review the output.' },
          { icon: 'refresh', text: 'Once satisfied, re-run generation for the content type (e.g. regenerate all state pages) to apply the new prompt.' },
        ],
        tips: [
          { kind: 'warning', text: 'Prompt changes only affect future generations — already-generated content stays as-is until regenerated.' },
          { kind: 'tip', text: 'Test prompt edits on one record before batch-applying — a bad prompt at scale means a lot of rework.' },
          { kind: 'info', text: 'Prompts use the same vault-grounding: the AI retrieves relevant Vault content first, then applies your instructions on top.' },
          { kind: 'warning', text: 'Removing a variable like {{title}} breaks generation for that type — keep all variables in place.' },
          { kind: 'tip', text: 'Bake standing requirements into the prompt (campaign dates, mandatory disclaimers) so every generation includes them automatically.' },
        ],
        faqs: [
          { q: 'I edited a prompt but existing pages did not change — why?', a: 'Prompts only affect future generations. Existing content keeps whatever it was generated with until you regenerate it. To apply a new prompt across a type, re-run generation for those records (e.g. all state pages).' },
          { q: 'What are the {{variables}} in a prompt?', a: 'They are placeholders the system fills in at generation time — {{title}}, {{state}}, {{issue}} and similar. They inject the specific record\'s data into the instruction. Never delete them, or generation for that type will break.' },
          { q: 'How do I safely change a prompt that affects hundreds of records?', a: 'Edit and save the prompt, then generate a single record and review the result. Only once that one output looks right should you trigger the batch regeneration for the whole type.' },
        ],
        combos: 'SEO Generator, States & Data, Areas, Vault Library',
        outcome: 'Prompt templates are tuned so batch generation produces consistent, on-brand, requirement-compliant output — verified on a single record before being applied at scale.',
      },
      {
        id: 'seo', icon: 'travel_explore', label: 'SEO Generator', href: '/admin/seo',
        tagline: 'Batch-generate SEO titles and descriptions at scale',
        what: 'The SEO Generator lets you select any number of events, areas, issues, or states and generate optimised meta titles (max 60 chars) and meta descriptions (max 160 chars) for all of them in one run. Progress is shown per item with colour-coded character counts, and inline editing lets you tweak before saving. It exists to make optimising hundreds of pages a single batch operation rather than days of manual work.',
        when: 'Run it after adding a batch of new Areas or States, after a content refresh, or before a campaign launch to ensure every key page is fully optimised. Pair it with the SEO Report afterward to confirm scores.',
        steps: [
          { icon: 'filter_list', text: 'Choose the content-type tab (Events / Areas / Issues / States).' },
          { icon: 'check_box', text: 'Select the records to optimise, or use "Select All" for a full batch run.' },
          { icon: 'auto_awesome', text: 'Click "Generate SEO" — the system processes each record sequentially, showing live progress.' },
          { icon: 'edit', text: 'Review the generated titles and descriptions; edit any inline that need adjusting.' },
          { icon: 'palette', text: 'Watch the character-count colours — amber at 80% of the limit, red when over.' },
          { icon: 'save', text: 'Click "Save All" to commit the changes; they go live on the public pages.' },
        ],
        tips: [
          { kind: 'info', text: 'Character counts turn amber at 80% of the limit and red when over — red means the text will be truncated in Google results.' },
          { kind: 'tip', text: 'Run the SEO Report after a batch to check scores and find pages that still need work.' },
          { kind: 'warning', text: 'Batch generation calls the AI per record — 200 areas can take 5–10 minutes. Do not close the tab mid-run.' },
          { kind: 'tip', text: 'Edit the underlying prompt (Prompts section) first if the generated tone is consistently off — it is faster than fixing each result.' },
          { kind: 'info', text: 'Generation is grounded in the Vault, so better source material yields more specific, credible meta text.' },
        ],
        faqs: [
          { q: 'How long does a big batch take?', a: 'The system processes records one at a time, calling the AI per record. A run of ~200 areas typically takes 5–10 minutes. Keep the tab open until it finishes — closing it mid-run interrupts the batch.' },
          { q: 'What do the amber and red character counts mean?', a: 'Amber means you are at 80% of the field\'s limit (60 chars for titles, 160 for descriptions). Red means you are over the limit and the text will be truncated in search results. Edit reds down before saving.' },
          { q: 'The generated tone is consistently wrong — how do I fix it?', a: 'Do not edit every result by hand. Adjust the relevant template in the Prompts section, test on one record, then re-run the batch. Fixing the prompt fixes all future generations at once.' },
        ],
        combos: 'Prompts, SEO Report, Areas, States & Data',
        outcome: 'Every selected page has an optimised, on-length meta title and description in minutes, with character counts in the safe zone and scores confirmed in the SEO Report.',
      },
      {
        id: 'seo-report', icon: 'analytics', label: 'SEO Report', href: '/admin/seo/report',
        tagline: 'Scored audit of every published page',
        what: 'The SEO Report analyses every published blog post, event, and CMS page and scores each on two dimensions. SEO (0–100) covers traditional signals — meta title length, meta description, OG image, content depth, slug quality, keyword coherence. AISEO (0–100) covers LLM/AI-search readiness — factual density, named entities, source citations, FAQ patterns, and author attribution. Each row expands into a per-check breakdown with pass/warn/fail, points, and an explanation, and an "AI Optimise" action jumps straight into the LLM Optimiser. It is your single source of truth for content quality.',
        when: 'Run it weekly to monitor site health, and after any content campaign to assess quality. Sort by Combined to find your weakest pages, and use the Critical filter (scores < 40) to triage urgent fixes first.',
        steps: [
          { icon: 'refresh', text: 'Click "Refresh" to run a fresh analysis — the report scans all published content live.' },
          { icon: 'filter_list', text: 'Use the type tabs (All / Blog / Events / Pages) or the Critical filter (scores < 40) to narrow focus.' },
          { icon: 'search', text: 'Search by title or slug to jump to a specific page.' },
          { icon: 'expand_more', text: 'Click any row to expand the full check breakdown — each check shows pass/warn/fail with points and an explanation.' },
          { icon: 'rocket_launch', text: 'For a low AISEO page, click "AI Optimise" to open the LLM Optimiser pre-loaded with that page.' },
          { icon: 'edit', text: 'Or click "Edit" directly from the expanded row to fix issues in place.' },
          { icon: 'download', text: 'Export CSV to share the audit or track scores over time in a spreadsheet.' },
        ],
        tips: [
          { kind: 'tip', text: 'Check the Critical filter first — any score below 40 is the highest risk and should be fixed immediately.' },
          { kind: 'info', text: 'AISEO checks matter more every year as AI assistants become primary discovery channels for young people.' },
          { kind: 'tip', text: 'Common quick wins: add a meta description, add an OG image, add a named author. These three alone can lift most pages from F to C.' },
          { kind: 'info', text: 'When AISEO is below 70, the fastest fix is the "AI Optimise" button — it hands the page to the LLM Optimiser.' },
          { kind: 'warning', text: 'The report scores only published content. Draft pages are not analysed, so publish (or preview-score) before relying on a score.' },
        ],
        faqs: [
          { q: 'What is the difference between SEO and AISEO scores?', a: 'SEO measures traditional search signals (title/description length, OG image, depth, slug, keyword coherence). AISEO measures AI-search readiness (factual density, named entities, source citations, FAQ patterns, author attribution). A page can score well on one and poorly on the other — aim for both above 70.' },
          { q: 'A page scores low on AISEO — what is the quickest fix?', a: 'Click "AI Optimise" on that row. It opens the LLM Optimiser pre-loaded with the page, generates targeted patches grounded in your Vault, and lets you accept the ones that lift the weakest signals.' },
          { q: 'Why is a published page missing from the report?', a: 'The report scores published blog posts, events, and CMS pages. If a page is missing, confirm it is actually published (not a draft), then click Refresh to re-run the live analysis.' },
        ],
        combos: 'LLM Optimiser, SEO Generator, Blog, GEO/LLM Indexing',
        outcome: 'You have a live, exportable scorecard for every published page, your weakest pages are fixed first, and both SEO and AISEO scores trend above 70 across the site.',
      },
      {
        id: 'llm-optimizer', icon: 'rocket_launch', label: 'LLM Optimiser', href: '/admin/seo/optimize',
        tagline: 'AI-powered AISEO patch generator',
        what: 'The LLM Optimiser is an AI-powered patch generator that analyses a specific page for AI-search readiness (AISEO) and then generates targeted text improvements grounded in your Vault. It scores the page across 8 AISEO signals — factual density, named entities, source citations, FAQ patterns, specificity, depth, structured data, and author attribution — then generates precise patches for the weakest signals. Each patch shows a side-by-side before/after diff and a relevance score. You accept or reject each patch individually, then apply them to the database in one click.',
        when: 'Use when the SEO Report shows AISEO < 70 on a high-priority page (use the AI Optimise button directly from the report row). Also use before launching a new content campaign — run every blog post through the optimiser to ensure AI assistants like ChatGPT and Perplexity will cite your content when users ask relevant questions.',
        steps: [
          { icon: 'open_in_new', text: 'Navigate here via SEO Report → click "AI Optimise" on a row (pre-fills the page), or open directly and use the Page Picker dropdown.' },
          { icon: 'list', text: 'The Page Picker shows all pages sorted by AISEO score worst-first. Select the page you want to optimise.' },
          { icon: 'auto_awesome', text: 'Click "Optimise with AI". The system runs the full AISEO analysis (5–15 seconds), retrieves the 8 most relevant Vault chunks for the page\'s topic, and generates patches.' },
          { icon: 'donut_large', text: 'Review the Score Ring — it shows current AISEO (grey) and projected AISEO after all patches (coloured). A green projected score means the patches are high-quality.' },
          { icon: 'rule', text: 'For each patch card: read the check keys (what AISEO signals this patch improves), expand the before/after diff with the arrow button, and tick the checkbox if you want to apply it.' },
          { icon: 'playlist_add_check', text: 'The "Apply N patches →" button shows how many you have selected. If none are selected, the button shows "Select patches above".' },
          { icon: 'save', text: 'Click Apply. The system writes each accepted patch directly to the database column (title, meta_desc, body, excerpt, seo_title, seo_desc depending on content type).' },
          { icon: 'analytics', text: 'After applying, run the SEO Report again to confirm the AISEO score improvement.' },
        ],
        tips: [
          { kind: 'tip', text: 'Patches for "body" (the main content) are the most impactful but also the most risky — always read the full before/after before accepting. Body patches can change meaning.' },
          { kind: 'warning', text: 'The optimiser writes directly to the database. There is no undo button — copy the current content somewhere safe if you are unsure.' },
          { kind: 'info', text: 'The projected score assumes all patches are accepted. Accepting only some patches will give a proportionally lower improvement.' },
          { kind: 'tip', text: 'If the projected score improvement is less than 5 points, the page\'s weakness is probably structural (missing author, no OG image) rather than content-based — fix those in the Blog editor instead.' },
          { kind: 'warning', text: 'For events, the optimiser patches the "body" column only (not description). This is intentional — description is used as a teaser/excerpt and should stay concise.' },
        ],
        faqs: [
          { q: 'Why are some patches greyed out / not selectable?', a: 'Patches that would overwrite the same database column as another selected patch are locked to prevent conflicts. For example, two patches both targeting meta_desc can\'t both be applied — accept whichever is better.' },
          { q: 'What are "check keys" on each patch?', a: 'These are the AISEO signal names the patch is designed to improve: facts (factual density), entities (named entities like organisations/people/places), sources (explicit citations), faq (question-answer patterns), proper_nouns (specificity), depth (content length/detail), structure (headings/lists), author (authorship attribution).' },
          { q: 'The projected score didn\'t increase after applying patches — why?', a: 'The score is recalculated live from the database after applying. If it didn\'t change, the patch may have been applied to a field that the scorer doesn\'t read for that content type, or the check was already passing at a marginal level. Re-run the SEO Report for the definitive score.' },
        ],
        combos: 'SEO Report, Vault Library, Blog, Events',
        outcome: 'Selected pages have AISEO scores above 70, rich with cited statistics, named entities, and structured content that AI assistants can confidently cite.',
      },
      {
        id: 'llm-indexing', icon: 'smart_toy', label: 'GEO/LLM Indexing', href: '/admin/seo/llm',
        tagline: 'The control centre for how AI crawlers see your site',
        what: 'The GEO (Generative Engine Optimization) Indexing dashboard is the control centre for how AI assistants discover and represent your site. It implements the LLM equivalent of a sitemap + robots.txt: a /llms.txt manifest that lists all site content in a format AI crawlers understand, a /api/llms-md endpoint that serves any page as clean Markdown (no HTML overhead), and automatic bot interception in the middleware that redirects known AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) to the Markdown endpoint instead of the HTML page. This means when Perplexity or ChatGPT crawls your site, they see clean, structured content rather than parsing through navigation, ads, and scripts.',
        when: 'Check monthly to verify the /llms.txt manifest is up to date (it auto-regenerates hourly from your live database). Use the Markdown Preview tab to test how any specific page looks to an AI crawler before publishing — especially useful for high-priority blog posts or issue pages. Check the Bot List tab if you suspect a new AI crawler isn\'t being intercepted.',
        steps: [
          { icon: 'description', text: 'Open the dashboard. The first tab shows a live preview of /llms.txt — scroll through to verify your recent content is listed.' },
          { icon: 'format_list_numbered', text: 'Count the entries: blog posts (up to 30 most recent), events (30), issues (60), areas (50), CMS pages (20). If a page you expect is missing, check it is published in its respective admin section.' },
          { icon: 'preview', text: 'Switch to the Markdown Preview tab. Paste any site path (e.g. /blog/my-post) and click Preview.' },
          { icon: 'fact_check', text: 'Read the Markdown output carefully — this is exactly what ChatGPT/Perplexity/Claude sees when they crawl that URL. Check: Is the title clear? Are statistics present? Is the source footer correct?' },
          { icon: 'edit', text: 'If the Markdown output looks thin or lacks key information, return to the page\'s editor (Blog/Events/Issues) and enrich the content, then re-preview.' },
          { icon: 'smart_toy', text: 'Switch to the Bot Intercept tab to see the 19 known AI crawlers. If a new crawler isn\'t on the list, it will receive HTML — note this and request an update if the bot becomes significant.' },
        ],
        tips: [
          { kind: 'info', text: 'The /llms.txt manifest regenerates automatically every hour from the live database — you never edit it by hand.' },
          { kind: 'tip', text: 'Use the Markdown Preview as a final check before publishing important pages — it shows precisely what an AI bot will read.' },
          { kind: 'warning', text: 'A page missing from the manifest is almost always still a draft. Publish it in its section, then re-check the preview.' },
          { kind: 'info', text: 'Bot interception only fires for known AI user-agents, so it has no effect on normal human visitors or on Googlebot.' },
          { kind: 'tip', text: 'If a Markdown preview looks thin, the page itself is thin — enrich the source content (and run the LLM Optimiser) rather than expecting the endpoint to fix it.' },
        ],
        faqs: [
          { q: 'What is llms.txt?', a: 'llms.txt is an emerging standard (llmstxt.org) — a plain-text file at the root of a site that AI crawlers read to understand what content exists, similar to how robots.txt tells search crawlers what to index. Your /llms.txt is dynamically generated from the database every hour and includes all published blog posts, events, issues, areas, and pages with one-line descriptions.' },
          { q: 'Will this affect my Google rankings?', a: 'No — the Markdown rewrite only fires for known AI bot user-agents (GPTBot, ClaudeBot, etc.), not for Googlebot. Google\'s crawler (including Google-Extended for AI Overviews) receives the normal HTML page. The X-Robots-Tag: noindex header on Markdown responses also prevents the MD version from being indexed separately.' },
          { q: 'How do I know the interception is working?', a: 'Check Vercel logs or your hosting provider\'s request logs. Intercepted requests will have the X-LLM-Intercepted: 1 response header. You can also test locally by sending a request with User-Agent: GPTBot.' },
          { q: 'Can visitors access /api/llms-md directly?', a: 'Yes — it\'s a public API. Anyone can call /api/llms-md?path=/blog/my-post to get clean Markdown of any published page. This is intentional — Perplexity and other AI tools sometimes deep-link here directly when they detect it exists.' },
        ],
        combos: 'LLM Optimiser, SEO Report, Blog, Vault Library',
        outcome: 'AI assistants accurately cite and summarise your content with correct statistics, source attribution, and site URL. Your site appears in AI-generated answers for Australian youth mental health and school wellbeing queries.',
      },
    ],
  },

  {
    id: 'system', label: 'System', icon: 'settings', color: '#64748b',
    features: [
      {
        id: 'typography', icon: 'font_download', label: 'Typography', href: '/admin/typography',
        tagline: 'Site-wide font families, sizes, and weights',
        what: 'Typography controls the typefaces used across the entire site — heading font family, body font family, base size, and weight scale — and changes apply globally to every page at once. The page is wrapped in an error boundary so a bad value cannot take the whole admin down, and it offers live preview text so you can see the effect before committing. It exists as the single place to manage the type system without touching CSS.',
        when: 'Change during a brand refresh or when a new font licence is acquired. This is rare, deliberate work outside of major design updates — for everyday content you never need it.',
        steps: [
          { icon: 'edit', text: 'Open Typography — current settings are shown with live preview text.' },
          { icon: 'text_fields', text: 'Change the Heading font (a Google Fonts name or system font stack) and the Body font.' },
          { icon: 'format_size', text: 'Adjust the base size and scale if needed — this affects the whole type system proportionally.' },
          { icon: 'preview', text: 'Read the live preview to confirm headings and body text both look right together.' },
          { icon: 'save', text: 'Save, then refresh the homepage to verify the change across real content.' },
        ],
        tips: [
          { kind: 'warning', text: 'Typography changes affect every page instantly. Test thoroughly on both desktop and mobile before saving in production.' },
          { kind: 'info', text: 'The page is wrapped in an error boundary — if something goes wrong, the previous settings are preserved.' },
          { kind: 'tip', text: 'Pair a distinctive heading font with a highly legible body font; do not use two display fonts together.' },
          { kind: 'warning', text: 'A misspelled Google Fonts name silently falls back to a system font — copy the exact name from Google Fonts.' },
          { kind: 'info', text: 'Adjusting the base size scales the entire system proportionally, so small changes have a large cumulative effect.' },
        ],
        faqs: [
          { q: 'My chosen font is not showing on the site — why?', a: 'Almost always a misspelled font name. The system silently falls back to a system font if the Google Fonts name does not match exactly. Copy the precise family name from Google Fonts and re-save, then hard-refresh.' },
          { q: 'I made a typography change and something looks broken — am I stuck?', a: 'No. The page is wrapped in an error boundary that preserves your previous settings if something fails. Reload, revert the change, and re-apply more carefully using the live preview.' },
          { q: 'Should I change the base size to make text bigger?', a: 'Use it cautiously — base size scales the whole type system proportionally, so a small change ripples everywhere. Make incremental adjustments and preview on both desktop and mobile before saving.' },
        ],
        combos: 'Homepage Builder, Logo & Branding, Hero Settings',
        outcome: 'The site uses on-brand, legible typefaces with a balanced scale that renders cleanly on every device, applied globally without touching code.',
      },
      {
        id: 'users', icon: 'group', label: 'Users', href: '/admin/users',
        tagline: 'Admin account management',
        what: 'This is where you create, edit, and deactivate admin accounts. Each account can log into this admin panel, and in the current build every account has full admin access — there is no role-based restriction between accounts. Because access is all-or-nothing, account hygiene is the main security control you have here.',
        when: 'Add a user when onboarding a team member, and deactivate accounts immediately when someone leaves the organisation. Review the user list periodically to confirm only current people retain access.',
        steps: [
          { icon: 'add', text: 'Click "Add User" — enter their email and a temporary password.' },
          { icon: 'mail', text: 'Send the new user their credentials and ask them to change the password on first login.' },
          { icon: 'manage_accounts', text: 'Review the list periodically and confirm every active account belongs to a current team member.' },
          { icon: 'person_off', text: 'To deactivate: open the user and disable the account; they are immediately locked out.' },
          { icon: 'delete', text: 'Delete permanently removes the account and its session history.' },
        ],
        tips: [
          { kind: 'warning', text: 'There is no granular role system — every admin can do everything. Only grant access to people who genuinely need it.' },
          { kind: 'tip', text: 'Prefer individual accounts over shared aliases (team@org.com) — they make audit trails far clearer.' },
          { kind: 'warning', text: 'Deactivate departing staff the same day they leave; an active account is an open door.' },
          { kind: 'info', text: 'A temporary password should be changed by the user on first login — never reuse one across accounts.' },
          { kind: 'tip', text: 'Keep the list short. Fewer accounts means a smaller attack surface and less to audit.' },
        ],
        faqs: [
          { q: 'Can I give someone read-only or limited access?', a: 'Not in the current build — there is no granular role system, so every account has full admin access. Because of this, only create accounts for people who genuinely need full control, and remove access the moment it is no longer needed.' },
          { q: 'Should I deactivate or delete a departing staff member?', a: 'Deactivate immediately on their last day to lock them out without losing audit history. Delete only later if you are sure you will never need their account or session records again.' },
          { q: 'Is it okay to share one login across the team?', a: 'Avoid it. Shared logins destroy your audit trail and make it impossible to know who changed what. Create an individual account per person, even if everyone has the same permissions.' },
        ],
        combos: 'API Management, Settings',
        outcome: 'Only current, authorised team members hold individual admin accounts, departing staff are locked out promptly, and the account list is short and auditable.',
      },
      {
        id: 'api', icon: 'code', label: 'API Management', href: '/admin/api',
        tagline: 'External API key storage',
        what: 'API Management is the secure store for the keys that power the platform\'s integrations — OpenAI, HubSpot, and others. Keys are stored encrypted and displayed masked (only the last 4 characters visible), and deactivating a key disables its integration without deleting it. The AI features (content generation and embedding) depend on the OpenAI key here, so this page is often the first place to look when AI tooling stops working.',
        when: 'Update when rotating keys for security, when a key expires, or when adding a new integration. Check it first whenever content generation or embedding suddenly fails.',
        steps: [
          { icon: 'add', text: 'Click "Add Key" — enter the provider name, a human-readable label, and the key value.' },
          { icon: 'toggle_on', text: 'Activate the new key; the platform uses the active key for that provider.' },
          { icon: 'toggle_off', text: 'Deactivate any key no longer in use rather than deleting it immediately.' },
          { icon: 'science', text: 'Verify the integration works (e.g. run a small Quick Content generation) after rotating.' },
          { icon: 'delete', text: 'Delete old or rotated keys only once the new one is confirmed working.' },
        ],
        tips: [
          { kind: 'warning', text: 'Never share API key values in chat, email, or documents. Anyone with a key can use the service and run up its costs.' },
          { kind: 'info', text: 'AI features use the OpenAI key. If content generation stops, check here first — the key may have expired or hit its quota.' },
          { kind: 'tip', text: 'Rotate keys on a schedule and deactivate (not delete) the old one until the new one is verified.' },
          { kind: 'warning', text: 'A deactivated key disables its integration immediately — confirm the replacement works before deactivating the old one.' },
          { kind: 'info', text: 'Keys are stored encrypted and shown masked, so the panel is safe to view but never exposes full secrets.' },
        ],
        faqs: [
          { q: 'AI content generation suddenly stopped working — where do I look?', a: 'Start here. The AI features use the OpenAI key stored on this page. Check the key is active and has not expired or hit its usage quota. If in doubt, add a fresh key, activate it, and verify with a small Quick Content run.' },
          { q: 'How do I rotate a key safely?', a: 'Add the new key and activate it, verify the integration works (run a small generation or test), then deactivate the old key. Only delete the old key once you are confident the new one is fully working.' },
          { q: 'Why can I only see the last four characters of a key?', a: 'Keys are stored encrypted and displayed masked for security, so a stolen screenshot cannot leak a working secret. To replace a key you paste the new full value; you never need to read the existing one back.' },
        ],
        combos: 'Settings, Vault Upload, Quick Content, Events',
        outcome: 'All integration keys are current, active, and securely stored, AI tooling runs without interruption, and key rotation never causes downtime.',
      },
      {
        id: 'settings', icon: 'settings', label: 'Settings', href: '/admin/settings',
        tagline: 'Platform configuration and environment overview',
        what: 'The Settings hub is the platform\'s control panel, organised into six cards. Site Configuration holds editable basics — site name, contact email, footer tagline, and the maintenance-mode toggle. Environment Variables shows a read-only health check of infrastructure keys (green = set, red = missing) read live from the server at runtime. Integrations & Data, Site Links, Build Information, and Quick Access round it out with shortcuts and reference. It exists as the single place to configure the platform and diagnose whether the underlying infrastructure is healthy.',
        when: 'Enable maintenance mode before major, planned updates and disable it the moment you are done. Update the contact email when team responsibilities change, adjust the footer tagline during a rebrand, and check Environment Variables first whenever the site appears broken or an integration misbehaves.',
        steps: [
          { icon: 'edit', text: 'Site Configuration card: update the site name, contact email, or footer tagline. A Save button appears once you have made edits.' },
          { icon: 'construction', text: 'Maintenance Mode toggle (in Site Configuration): switch ON to show a maintenance page to all public visitors while you work.' },
          { icon: 'key', text: 'Environment Variables card: confirm all required keys are present — green means set, red means missing. These are read live from the server, not editable here.' },
          { icon: 'hub', text: 'Integrations & Data card: jump to API Keys, Prompts, or Users via the quick links.' },
          { icon: 'link', text: 'Site Links card: open public pages quickly to verify how changes look live.' },
          { icon: 'info', text: 'Build Information card: read the tech-stack details — useful when reporting an issue to the development team.' },
          { icon: 'save', text: 'Save your Site Configuration edits, then disable maintenance mode as soon as your work is finished.' },
        ],
        tips: [
          { kind: 'warning', text: 'Maintenance mode takes the entire public site offline. Only enable it for planned, time-limited work and disable it as soon as you are done.' },
          { kind: 'info', text: 'Environment Variables are read from the server at runtime — they come from your Vercel environment config, not this form. A red item must be fixed in Vercel, not here.' },
          { kind: 'tip', text: 'If the site looks broken, open Settings and scan Environment Variables first — a red (missing) key is the most common root cause.' },
          { kind: 'tip', text: 'Use the Site Links card to open the live public site in a new tab and confirm a change before considering it done.' },
          { kind: 'warning', text: 'Double-check the contact email after editing — it is the address visitors and partners use to reach you, so a typo means lost messages.' },
        ],
        faqs: [
          { q: 'An environment variable shows red — how do I fix it?', a: 'You cannot fix it from this page. Environment Variables are read live from the server (your Vercel environment config). A red item means a required key is missing or empty in Vercel. Add or correct it in the Vercel project settings and redeploy; the indicator turns green once the server sees the value.' },
          { q: 'What exactly does maintenance mode do?', a: 'Toggling it ON shows a maintenance page to every public visitor while the admin remains usable. Use it for planned, time-limited work, and switch it OFF the moment you finish — it takes the entire public site offline for everyone else.' },
          { q: 'Where do I change the site logo, fonts, or homepage layout?', a: 'Not here. Settings covers configuration and infrastructure. Logo and favicon live under Logo & Branding, fonts under Typography, and homepage layout under the Homepage Builder. The Quick Access and Integrations cards here link out to related areas like API Keys, Prompts, and Users.' },
          { q: 'I edited a field but there is no Save button — why?', a: 'The Save button only appears once you have made an actual change to an editable field in the Site Configuration card. If you do not see it, your edit may not have registered, or you may be looking at a read-only card like Environment Variables.' },
        ],
        combos: 'API Management, Users, Prompts, Logo & Branding',
        outcome: 'Core site configuration is correct, infrastructure keys all show green, maintenance mode is used only for planned work and switched off afterwards, and you can diagnose a broken site in seconds.',
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

/* ─── FAQ accordion item ─────────────────────────────────────────────────── */

function FaqItem({ faq, accent }: { faq: Faq; accent: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: accent, flexShrink: 0 }}>help</span>
        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: '#1f2937', lineHeight: 1.4 }}>{faq.q}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9ca3af', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s', flexShrink: 0 }}>
          expand_more
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 12px 12px 36px' }}>
          <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Feature card ───────────────────────────────────────────────────────── */

function FeatureCard({ f, accent }: { f: Feature; accent: string }) {
  const [open, setOpen] = useState(false);

  const comboChips = f.combos
    ? f.combos.split(',').map(s => s.trim()).filter(Boolean)
    : [];

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

          {/* Outcome — what success looks like */}
          {f.outcome && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#15803d' }}>check_circle</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#15803d' }}>What success looks like</span>
              </div>
              <p style={{ fontSize: 12.5, color: '#166534', margin: 0, lineHeight: 1.6 }}>{f.outcome}</p>
            </div>
          )}

          {/* Combos — pairs well with */}
          {comboChips.length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Pairs well with:</span>
              {comboChips.map((c, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' }}>
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* FAQs accordion */}
          {f.faqs && f.faqs.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8 }}>Frequently asked questions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {f.faqs.map((faq, i) => (
                  <FaqItem key={i} faq={faq} accent={accent} />
                ))}
              </div>
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
          f.when.toLowerCase().includes(searchLower) ||
          (f.combos ?? '').toLowerCase().includes(searchLower) ||
          (f.outcome ?? '').toLowerCase().includes(searchLower) ||
          (f.faqs ?? []).some(q => q.q.toLowerCase().includes(searchLower) || q.a.toLowerCase().includes(searchLower)),
        )
      : sec.features,
  })).filter(sec => sec.features.length > 0);

  const totalFeatures = SECTIONS.reduce((n, s) => n + s.features.length, 0);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div className="swa-page-header" style={{ marginBottom: 20, alignItems: 'flex-start' }}>
        <div>
          <h1 className="swa-page-title">Admin Tutorial</h1>
          <p className="swa-page-subtitle" style={{ maxWidth: 560 }}>
            A complete guide to every feature in this admin panel — what each tool does, when to use it, exactly how to use it, what success looks like, and answers to common questions.
            {' '}<span style={{ color: 'var(--color-text-faint)' }}>{totalFeatures} features documented across {SECTIONS.length} sections.</span>
          </p>
        </div>
      </div>

      {/* ── Loom video walkthrough ── */}
      <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src="https://www.loom.com/embed/34090b10da414491ad1a4a5a405af7c1"
            frameBorder="0"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* ── Quick Reference banner ── */}
      <div style={{ marginBottom: 22, padding: '14px 16px', background: 'linear-gradient(135deg,#f8fafc,#eef2ff)', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff' }}>menu_book</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Quick Reference</div>
              <div style={{ fontSize: 11.5, color: '#6b7280' }}>{totalFeatures} features across {SECTIONS.length} sections — jump to a section or clear filters below.</div>
            </div>
          </div>
          <button
            onClick={() => { setSearch(''); setActiveSection(SECTIONS[0].id); }}
            style={{ fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, border: '1px solid #c7d2fe', background: '#fff', color: '#4338ca', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            View All
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { setSearch(''); setActiveSection(s.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                padding: '5px 11px', borderRadius: 999, border: `1px solid ${s.color}33`, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, background: `${s.color}12`, color: s.color, whiteSpace: 'nowrap',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{s.icon}</span>
              {s.label}
              <span style={{ opacity: 0.75, fontSize: 11 }}>{s.features.length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#9ca3af', pointerEvents: 'none' }}>
          search
        </span>
        <input
          type="search"
          placeholder={`Search ${totalFeatures} features — try "vault", "redirect", "bot"…`}
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
          No features match &quot;{search}&quot;.
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
        Each card expands to show what the feature is, when to use it, step-by-step instructions, tips, what success looks like, related features, and FAQs. Click &quot;Open →&quot; on any card to jump straight to that feature.
      </div>
    </div>
  );
}
