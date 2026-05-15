# Home Page Admin Management System - Implementation Plan

## Requirements Summary

### 1. Hero Section Management
- Logo size control
- Event date (📅 25 May 2026 · Australia)
- Main heading text
- Subheading text
- Primary CTA button (text + link)
- Secondary CTA button (text + link)
- Hero image upload
- Countdown timer target date
- Background colors
- Button colors
- Font customization
- Floating stats card (15M+ Students)
- Badge text (✓ 1,200+ Schools)

### 2. Trusted Organizations Logos
- Upload/manage organization logos
- Display order
- Show/hide individual logos
- Logo size control

### 3. CTA Banner Section (Join the Movement)
- Eyebrow text ("Join the Movement")
- Heading text
- Description text
- Primary button (text + link)
- Secondary button (text + link)
- Background color
- Text colors
- Button colors

### 4. Footer Customization
- Logo upload
- Brand description text
- Contact details (phone, fax, email)
- Quick links (customizable)
- Social media links (Facebook, LinkedIn, Instagram, etc.)
- Social media button colors
- Copyright text
- Font customization
- Background colors

## Database Schema

### Tables to Create:
1. `home_hero_settings` - Single row for hero section
2. `home_trusted_logos` - Multiple rows for organization logos
3. `home_cta_settings` - Single row for CTA banner
4. `home_footer_settings` - Single row for footer
5. `home_footer_links` - Multiple rows for footer links
6. `home_social_links` - Multiple rows for social media

## Implementation Steps

1. ✅ Create database migrations
2. ✅ Create API endpoints
3. ✅ Create admin UI components
4. ✅ Update home1 page to use dynamic data
5. ✅ Add to admin sidebar

## Estimated Time: 4-6 hours
