-- Add event_link field to Ambassador table
-- This links an ambassador to their specific events

ALTER TABLE "Ambassador"
ADD COLUMN event_link TEXT;

COMMENT ON COLUMN "Ambassador".event_link IS 'URL to events the ambassador is involved in';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Ambassador' AND column_name = 'event_link'
  ) THEN
    RAISE NOTICE 'event_link column added successfully to Ambassador table';
  ELSE
    RAISE EXCEPTION 'Failed to add event_link column';
  END IF;
END $$;
