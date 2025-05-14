-- Migration to add index for faster reading status lookups
-- Date: 2025-05-14

-- Add composite index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_reading_lists_user_status ON public.user_reading_lists(user_id, status);

-- Add composite index for faster reading history lookups
CREATE INDEX IF NOT EXISTS idx_reading_history_user_manga ON public.reading_history(user_id, manga_id);

-- Add index for faster chapter lookups by number
CREATE INDEX IF NOT EXISTS idx_chapters_manga_number ON public.chapters(manga_id, chapter_number);

-- Add index for faster progress calculations
CREATE INDEX IF NOT EXISTS idx_reading_history_chapter ON public.reading_history(chapter_id);

-- Update the reading history trigger to be more efficient
CREATE OR REPLACE FUNCTION log_reading_history()
RETURNS TRIGGER AS $$
BEGIN
    -- For status changes, we want to ensure reading_history is properly updated
    -- When status is 'reading' or 'completed', we ensure the chapter is in reading_history
    IF (NEW.status IN ('reading', 'completed')) THEN
        -- Get all chapters up to the current chapter
        INSERT INTO public.reading_history (user_id, chapter_id, manga_id, read_at)
        SELECT 
            NEW.user_id, 
            chapters.id, 
            NEW.manga_id,
            CASE 
                WHEN NEW.status = 'completed' THEN now()
                ELSE COALESCE(
                    (SELECT read_at FROM public.reading_history 
                     WHERE user_id = NEW.user_id AND chapter_id = chapters.id),
                    now()
                )
            END as read_at
        FROM 
            public.chapters
        WHERE 
            chapters.manga_id = NEW.manga_id
            AND chapters.chapter_number <= NEW.current_chapter
        ON CONFLICT (user_id, chapter_id) 
        DO UPDATE SET read_at = 
            CASE 
                WHEN NEW.status = 'completed' THEN now()
                ELSE EXCLUDED.read_at
            END
        WHERE reading_history.read_at < EXCLUDED.read_at;
    END IF;
    
    -- For on_hold or dropped status, we still want to track the last read chapter
    IF (NEW.status IN ('on_hold', 'dropped') AND NEW.current_chapter IS NOT NULL) THEN
        INSERT INTO public.reading_history (user_id, chapter_id, manga_id, read_at)
        SELECT 
            NEW.user_id,
            chapters.id,
            NEW.manga_id,
            now()
        FROM 
            public.chapters
        WHERE 
            chapters.manga_id = NEW.manga_id
            AND chapters.chapter_number = NEW.current_chapter
        ON CONFLICT (user_id, chapter_id) 
        DO UPDATE SET read_at = now()
        WHERE reading_history.read_at < now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger is properly attached
DROP TRIGGER IF EXISTS on_reading_status_change ON public.user_reading_lists;
CREATE TRIGGER on_reading_status_change
    AFTER INSERT OR UPDATE ON public.user_reading_lists
    FOR EACH ROW
    EXECUTE FUNCTION log_reading_history(); 