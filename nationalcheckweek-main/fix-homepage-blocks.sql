-- Fix Homepage Blocks: Add Your Voice block and ensure How To Participate is visible
-- Run this in Supabase SQL Editor

-- First, let's see what blocks currently exist
-- SELECT id, block_type, title, display_order, is_visible FROM homepage_blocks ORDER BY display_order;

-- Add the "Your Voice" block at position 1/2 (display_order = 1 or 2 depending on existing blocks)
-- This will insert it after the hero block (typically order 0) and before other blocks

-- Check if Your Voice block already exists
DO $$
DECLARE
    hero_order INTEGER;
    next_order INTEGER;
BEGIN
    -- Find the hero block order (should be 0 or 1)
    SELECT display_order INTO hero_order FROM homepage_blocks WHERE block_type = 'hero' LIMIT 1;
    
    -- If no hero found, default to 0
    IF hero_order IS NULL THEN
        hero_order := 0;
    END IF;
    
    -- Calculate next order (hero + 1)
    next_order := hero_order + 1;
    
    -- Check if Your Voice already exists
    IF NOT EXISTS (SELECT 1 FROM homepage_blocks WHERE block_type = 'your_voice') THEN
        -- Shift existing blocks up by 1 to make room
        UPDATE homepage_blocks 
        SET display_order = display_order + 1 
        WHERE display_order >= next_order;
        
        -- Insert Your Voice block
        INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible)
        VALUES (
            'your_voice',
            'Your Voice CTA',
            jsonb_build_object(
                'eyebrow', 'We Need Your Help',
                'heading', 'Let Your Voice Be Heard',
                'description', 'At National Check Week, we need your opinion to help us find the best solution. Join the conversation and make a difference in student wellbeing across Australia.',
                'ctaText', 'Join the Conversation',
                'ctaLink', '/your-voice',
                'colors', jsonb_build_object(
                    'useGlobalColors', true,
                    'accentColor', '#29B8E8',
                    'backgroundColor', '#0B1D35',
                    'textColor', '#FFFFFF',
                    'primaryButton', '#29B8E8',
                    'primaryButtonText', '#FFFFFF'
                )
            ),
            next_order,
            true
        );
        
        RAISE NOTICE 'Added Your Voice block at order %', next_order;
    ELSE
        RAISE NOTICE 'Your Voice block already exists';
    END IF;
END $$;

-- Ensure How To Participate block is visible with HubSpot form settings
-- Check if it exists and update if needed
UPDATE homepage_blocks 
SET is_visible = true,
    content = content || jsonb_build_object(
        'formHeading', 'Register Your School',
        'hubspotPortalId', COALESCE(content->>'hubspotPortalId', '48027557'),
        'hubspotFormId', COALESCE(content->>'hubspotFormId', 'c90ff5bf-0d6c-4afe-81f8-46f0c32244ee'),
        'hubspotRegion', COALESCE(content->>'hubspotRegion', 'ap1')
    )
WHERE block_type = 'how_to_participate';

-- If How To Participate doesn't exist, insert it
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible)
SELECT 
    'how_to_participate',
    'Register Your School',
    jsonb_build_object(
        'heading', 'How To Participate',
        'description', 'Join thousands of schools across Australia in National Check-in Week. Register now to access exclusive resources, webinars, and wellbeing tools.',
        'features', ARRAY[
            'Free access to wellbeing resources',
            'Exclusive webinars with experts',
            'Data insights for your school',
            'Join a national movement'
        ],
        'formHeading', 'Register Your School',
        'hubspotPortalId', '48027557',
        'hubspotFormId', 'c90ff5bf-0d6c-4afe-81f8-46f0c32244ee',
        'hubspotRegion', 'ap1',
        'colors', jsonb_build_object('useGlobalColors', true)
    ),
    (SELECT MAX(display_order) + 1 FROM homepage_blocks),
    true
WHERE NOT EXISTS (SELECT 1 FROM homepage_blocks WHERE block_type = 'how_to_participate');

-- Show final state
SELECT id, block_type, title, display_order, is_visible 
FROM homepage_blocks 
ORDER BY display_order;
