# Homepage Blocks Fix

## Problem
1. **"Your Voice" block not showing** - The block code is deployed but needs to be added to the database
2. **Registration form missing** - The "How To Participate" block (contains HubSpot form) may be hidden or missing

## Solution

### Option 1: Run SQL in Supabase (Fastest)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor → New Query
4. Copy and paste the contents of `fix-homepage-blocks.sql`
5. Click "Run"

### Option 2: Use Admin Panel
Go to `/admin/home-page` and:

1. **Add "Your Voice" block:**
   - Click "Add Block"
   - Select "Your Voice" from dropdown
   - Set position to 1 (after Hero)
   - Fill in:
     - Eyebrow: "We Need Your Help"
     - Heading: "Let Your Voice Be Heard"
     - Description: "At National Check Week, we need your opinion to help us find the best solution. Join the conversation and make a difference in student wellbeing across Australia."
     - CTA Text: "Join the Conversation"
     - CTA Link: `/your-voice`

2. **Check "How To Participate" block:**
   - Find it in the list
   - Ensure it's **visible** (eye icon enabled)
   - Check these fields are set:
     - Form Heading: "Register Your School"
     - HubSpot Portal ID: `48027557`
     - HubSpot Form ID: `c90ff5bf-0d6c-4afe-81f8-46f0c32244ee`
     - HubSpot Region: `ap1`

## What Was Created

| File | Purpose |
|------|---------|
| `YourVoiceBlock.tsx` | Frontend component |
| `YourVoiceBlockEditor.tsx` | Admin editor |
| `homepage-blocks.ts` | TypeScript types |
| `BlockRenderer.tsx` | Block registration |
| `HomepageBlocksEditor.tsx` | Admin block list |

## After Fix

Refresh the homepage at `http://localhost:3000` (or production URL) to see:
1. "Your Voice" CTA block in position 1/2
2. Registration form in "How To Participate" section
