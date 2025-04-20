-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update timestamps
CREATE TRIGGER update_user_profiles_modtime
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_manga_entries_modtime
BEFORE UPDATE ON public.manga_entries
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_chapters_modtime
BEFORE UPDATE ON public.chapters
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_reading_lists_modtime
BEFORE UPDATE ON public.user_reading_lists
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_preferences_modtime
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_reviews_modtime
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_comments_modtime
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create empty user profile with username
    INSERT INTO public.user_profiles (id, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
    );
    
    -- Create empty user preferences
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update manga rating based on reviews
CREATE OR REPLACE FUNCTION update_manga_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC;
BEGIN
    -- Calculate the average rating for the manga
    SELECT AVG(rating) INTO avg_rating
    FROM public.reviews
    WHERE manga_id = NEW.manga_id;
    
    -- Update the manga's rating
    UPDATE public.manga_entries
    SET rating = avg_rating
    WHERE id = NEW.manga_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update manga rating when reviews are added, updated, or deleted
CREATE TRIGGER update_manga_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_manga_rating();

-- Function to update manga popularity based on reading activity
CREATE OR REPLACE FUNCTION update_manga_popularity()
RETURNS TRIGGER AS $$
DECLARE
    reading_count INTEGER;
    favorite_count INTEGER;
    review_count INTEGER;
    total_score INTEGER;
BEGIN
    -- Count users reading this manga
    SELECT COUNT(*) INTO reading_count
    FROM public.user_reading_lists
    WHERE manga_id = NEW.manga_id;
    
    -- Count users who favorited this manga
    SELECT COUNT(*) INTO favorite_count
    FROM public.user_favorites
    WHERE manga_id = NEW.manga_id;
    
    -- Count reviews for this manga
    SELECT COUNT(*) INTO review_count
    FROM public.reviews
    WHERE manga_id = NEW.manga_id;
    
    -- Calculate popularity score (you can adjust this formula)
    total_score := reading_count * 2 + favorite_count * 3 + review_count * 1;
    
    -- Update manga popularity
    UPDATE public.manga_entries
    SET popularity = total_score
    WHERE id = NEW.manga_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update manga popularity
CREATE TRIGGER update_manga_popularity_on_reading
AFTER INSERT OR UPDATE OR DELETE ON public.user_reading_lists
FOR EACH ROW EXECUTE FUNCTION update_manga_popularity();

CREATE TRIGGER update_manga_popularity_on_favorite
AFTER INSERT OR UPDATE OR DELETE ON public.user_favorites
FOR EACH ROW EXECUTE FUNCTION update_manga_popularity();

CREATE TRIGGER update_manga_popularity_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_manga_popularity();

-- Function to log reading history
CREATE OR REPLACE FUNCTION log_reading_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update reading history
    INSERT INTO public.reading_history (user_id, chapter_id, manga_id)
    VALUES (NEW.user_id, NEW.chapter_id, NEW.manga_id)
    ON CONFLICT (user_id, chapter_id)
    DO UPDATE SET read_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
