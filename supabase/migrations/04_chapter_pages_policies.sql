-- Add security policies for chapter_pages table
-- First, make sure RLS is enabled
ALTER TABLE public.chapter_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplicates
DROP POLICY IF EXISTS "Chapter pages are viewable by everyone" ON public.chapter_pages;
DROP POLICY IF EXISTS "Only admins can manage chapter pages" ON public.chapter_pages;

-- Create policy to allow anyone to view chapter pages
CREATE POLICY "Chapter pages are viewable by everyone" 
ON public.chapter_pages FOR SELECT USING (true);

-- Create policy to allow only admins to insert/update/delete chapter pages
-- This uses the is_admin() function that should already exist
CREATE POLICY "Only admins can manage chapter pages" 
ON public.chapter_pages FOR ALL USING (
  public.is_admin()
);

-- Ensure storage bucket has the correct permissions
-- Note: We manage this through the API rather than SQL, but adding it here for completeness
