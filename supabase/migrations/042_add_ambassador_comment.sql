-- Add comment field to ambassadors table
-- This field stores what ambassadors think about National Check-in Week

ALTER TABLE "Ambassador"
ADD COLUMN comment TEXT;

-- Add comment on the column
COMMENT ON COLUMN "Ambassador".comment IS 'Ambassador testimonial or thoughts about National Check-in Week';

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Ambassador' 
    AND column_name = 'comment'
  ) THEN
    RAISE NOTICE 'Comment column added successfully to Ambassador table';
  ELSE
    RAISE EXCEPTION 'Failed to add comment column to Ambassador table';
  END IF;
END $$;
