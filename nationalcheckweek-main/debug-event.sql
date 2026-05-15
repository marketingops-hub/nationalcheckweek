-- Check if the event exists and its data
SELECT 
  id,
  slug,
  title,
  published,
  status,
  format,
  event_date,
  event_time,
  event_end,
  description,
  body,
  tagline,
  feature_image,
  is_free,
  price,
  register_url,
  recording_url,
  location,
  seo_title,
  seo_desc
FROM events
WHERE slug = 'building-resilience-anxiety-may-2025';

-- Check event_speakers for this event
SELECT 
  es.*
FROM event_speakers es
JOIN events e ON e.id = es.event_id
WHERE e.slug = 'building-resilience-anxiety-may-2025';
