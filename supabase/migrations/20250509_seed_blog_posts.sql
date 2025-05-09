-- Seed data for blog_posts table: SEO-friendly, evergreen topics
-- NOTE: Replace <manga_id> with actual UUIDs if you want to link to manga_entries, or leave NULL if not linking.

INSERT INTO blog_posts (
  id, title, slug, content, published_date, manga_id, featured_image, seo_description, seo_keywords, views, created_at, updated_at
) VALUES
-- 1. Top 10 Manhwa of All Time
(uuid_generate_v4(),
 'Top 10 Manhwa of All Time',
 'top-10-manhwa-of-all-time',
 'Discover the best manhwa series that have captivated readers worldwide. From action-packed adventures to heartwarming romances, here are the top 10 manhwa you must read.',
 now(),
 NULL,
 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
 'Explore our definitive list of the top 10 manhwa of all time. Find your next favorite Korean comic with our expertly curated recommendations.',
 'top manhwa, best manhwa, manhwa recommendations, Korean comics',
 0, now(), now()
),
-- 2. Top 10 Manga of All Time
(uuid_generate_v4(),
 'Top 10 Manga of All Time',
 'top-10-manga-of-all-time',
 'From timeless classics to modern masterpieces, these are the top 10 manga series every fan should experience at least once.',
 now(),
 NULL,
 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
 'A ranked list of the greatest manga ever created. Perfect for newcomers and seasoned readers alike.',
 'top manga, best manga, manga recommendations, Japanese comics',
 0, now(), now()
),
-- 3. Best Manga & Manhwa to Read Before You Die
(uuid_generate_v4(),
 'Best Manga & Manhwa to Read Before You Die',
 'best-manga-manhwa-to-read-before-you-die',
 'Don''t miss out on these essential manga and manhwa titles. These stories have left a lasting impact and are must-reads for every enthusiast.',
 now(),
 NULL,
 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80',
 'A handpicked guide to the most unforgettable manga and manhwa you need to read before you die.',
 'must read manga, must read manhwa, best manga, best manhwa, essential manga, essential manhwa',
 0, now(), now()
);
