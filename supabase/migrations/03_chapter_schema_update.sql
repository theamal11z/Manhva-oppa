-- Add missing columns to the chapters table
ALTER TABLE public.chapters 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 0;

-- Create trigger to update page_count automatically when pages are added or removed
CREATE OR REPLACE FUNCTION update_chapter_page_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.chapters
    SET page_count = page_count + 1
    WHERE id = NEW.chapter_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.chapters
    SET page_count = GREATEST(0, page_count - 1)
    WHERE id = OLD.chapter_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists already
DROP TRIGGER IF EXISTS update_page_count_trigger ON public.chapter_pages;

-- Create the trigger on chapter_pages table
CREATE TRIGGER update_page_count_trigger
AFTER INSERT OR DELETE ON public.chapter_pages
FOR EACH ROW
EXECUTE FUNCTION update_chapter_page_count();

-- Note: Storage bucket creation will be handled via the JavaScript client
-- as the storage.policies table doesn't exist in this Supabase setup
