-- Migration to add the missing trigger for reading history logging
-- Date: 2025-05-13

-- This trigger will automatically update the reading_history table when a user_reading_lists record is created or updated
-- This ensures consistent tracking for the recommendation engine

-- First, let's check if the log_reading_history function exists; if not, recreate it
CREATE OR REPLACE FUNCTION log_reading_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update reading history for completed chapters
    -- We'll consider chapters up to and including the current_chapter as read
    -- This is triggered when a user_reading_lists record is inserted/updated
    
    -- For status changes, we want to ensure reading_history is properly updated
    -- When status is 'reading' or 'completed', we ensure the chapter is in reading_history
    IF (NEW.status IN ('reading', 'completed')) THEN
        -- Get all chapters up to the current chapter
        INSERT INTO public.reading_history (user_id, chapter_id, manga_id)
        SELECT 
            NEW.user_id, 
            chapters.id, 
            NEW.manga_id
        FROM 
            public.chapters
        WHERE 
            chapters.manga_id = NEW.manga_id
            AND chapters.chapter_number <= NEW.current_chapter
        ON CONFLICT (user_id, chapter_id) 
        DO UPDATE SET read_at = now();
    END IF;
    
    -- Regardless of status, log this specific chapter as read if we have a current_chapter
    -- This helps track even for dropped or on_hold manga
    IF (NEW.current_chapter IS NOT NULL) THEN
        -- First get the id of the specific chapter being updated
        DECLARE
            target_chapter_id UUID;
        BEGIN
            SELECT id INTO target_chapter_id
            FROM public.chapters
            WHERE manga_id = NEW.manga_id
              AND chapter_number = NEW.current_chapter
            LIMIT 1;
            
            -- Only insert if we found a valid chapter ID
            IF target_chapter_id IS NOT NULL THEN
                INSERT INTO public.reading_history (user_id, chapter_id, manga_id)
                VALUES (NEW.user_id, target_chapter_id, NEW.manga_id)
                ON CONFLICT (user_id, chapter_id) 
                DO UPDATE SET read_at = now();
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (if it doesn't exist) to call the log_reading_history function
-- This will be called after insert or update on user_reading_lists
DROP TRIGGER IF EXISTS on_reading_status_change ON public.user_reading_lists;

CREATE TRIGGER on_reading_status_change
AFTER INSERT OR UPDATE ON public.user_reading_lists
FOR EACH ROW EXECUTE FUNCTION log_reading_history();

-- Also update the manga popularity when reading status changes
-- by ensuring the existing trigger is in place
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_manga_popularity_on_reading'
        AND tgrelid = 'public.user_reading_lists'::regclass
    ) THEN
        CREATE TRIGGER update_manga_popularity_on_reading
        AFTER INSERT OR UPDATE OR DELETE ON public.user_reading_lists
        FOR EACH ROW EXECUTE FUNCTION update_manga_popularity();
    END IF;
END $$;
