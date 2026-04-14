-- Add AI provider tracking to generation_log table
-- This allows us to monitor which AI provider (OpenAI or Anthropic) was used
-- and track fallback usage for cost analysis and reliability metrics

-- Add provider column (default to 'openai' for backward compatibility)
ALTER TABLE generation_log 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'openai';

-- Add fallback_used column to track when Anthropic was used as fallback
ALTER TABLE generation_log 
ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN DEFAULT false;

-- Add model column to track specific model used
ALTER TABLE generation_log 
ADD COLUMN IF NOT EXISTS model TEXT;

-- Create index for efficient provider-based queries
CREATE INDEX IF NOT EXISTS idx_generation_log_provider 
ON generation_log(provider);

-- Create index for fallback analysis
CREATE INDEX IF NOT EXISTS idx_generation_log_fallback 
ON generation_log(fallback_used) 
WHERE fallback_used = true;

-- Create composite index for time-based provider analysis
CREATE INDEX IF NOT EXISTS idx_generation_log_provider_created 
ON generation_log(provider, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN generation_log.provider IS 
'AI provider used: openai or anthropic';

COMMENT ON COLUMN generation_log.fallback_used IS 
'True if Anthropic was used as fallback after OpenAI failure';

COMMENT ON COLUMN generation_log.model IS 
'Specific model used (e.g., gpt-4o, claude-3-5-sonnet-20241022)';

-- Create view for provider analytics
CREATE OR REPLACE VIEW generation_analytics AS
SELECT 
  DATE(created_at) as date,
  provider,
  model,
  COUNT(*) as request_count,
  COUNT(CASE WHEN fallback_used THEN 1 END) as fallback_count,
  SUM(tokens_used) as total_tokens,
  AVG(tokens_used) as avg_tokens,
  COUNT(CASE WHEN metadata->>'status' = 'error' THEN 1 END) as error_count
FROM generation_log
GROUP BY DATE(created_at), provider, model
ORDER BY date DESC, provider;

COMMENT ON VIEW generation_analytics IS 
'Daily analytics for AI provider usage, costs, and reliability';
