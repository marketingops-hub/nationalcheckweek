-- Debug script to check CTA block content and colors
-- Run this in Supabase SQL Editor to see what's actually saved

SELECT 
  id,
  title,
  block_type,
  content->'colors' as colors_object,
  content->'colors'->'useGlobalColors' as use_global,
  content->'colors'->'ctaBackground' as cta_background,
  content->'colors'->'ctaText' as cta_text,
  content->'colors'->'ctaPrimaryButton' as primary_button,
  content->'colors'->'primaryButtonText' as button_text,
  content
FROM homepage_blocks 
WHERE block_type = 'cta';
