-- Genres seed data
INSERT INTO public.genres (id, name, description)
VALUES
  (uuid_generate_v4(), 'Action', 'Comics featuring physical conflict or combat'),
  (uuid_generate_v4(), 'Romance', 'Comics focusing on romantic relationships'),
  (uuid_generate_v4(), 'Fantasy', 'Comics set in fantastical worlds with magical elements'),
  (uuid_generate_v4(), 'Sci-Fi', 'Comics with scientific themes, futuristic technology, or space settings'),
  (uuid_generate_v4(), 'Horror', 'Comics designed to scare or disturb readers'),
  (uuid_generate_v4(), 'Comedy', 'Comics intended to be humorous'),
  (uuid_generate_v4(), 'Drama', 'Comics with serious plots and realistic characters'),
  (uuid_generate_v4(), 'Mystery', 'Comics featuring puzzles, secrets, or crimes to solve'),
  (uuid_generate_v4(), 'Slice of Life', 'Comics depicting everyday experiences'),
  (uuid_generate_v4(), 'Adventure', 'Comics featuring journeys, quests, or explorations'),
  (uuid_generate_v4(), 'Historical', 'Comics set in the past or based on historical events'),
  (uuid_generate_v4(), 'Sports', 'Comics featuring athletic competition'),
  (uuid_generate_v4(), 'Supernatural', 'Comics featuring paranormal or supernatural elements'),
  (uuid_generate_v4(), 'Psychological', 'Comics focused on the mental and emotional states of characters'),
  (uuid_generate_v4(), 'Mecha', 'Comics featuring robots or mechanical suits');

-- Tags seed data
INSERT INTO public.tags (id, name, description)
VALUES
  (uuid_generate_v4(), 'Time Travel', 'Stories involving movement through time'),
  (uuid_generate_v4(), 'Reincarnation', 'Characters who are reborn after death'),
  (uuid_generate_v4(), 'School Life', 'Settings that prominently feature school environments'),
  (uuid_generate_v4(), 'Magic', 'Stories featuring supernatural abilities and spells'),
  (uuid_generate_v4(), 'Demons', 'Featuring demon characters or demon-related themes'),
  (uuid_generate_v4(), 'Martial Arts', 'Stories involving hand-to-hand combat disciplines'),
  (uuid_generate_v4(), 'Vampires', 'Stories featuring vampire characters'),
  (uuid_generate_v4(), 'Isekai', 'Characters transported to another world'),
  (uuid_generate_v4(), 'Post-Apocalyptic', 'Settings after a global catastrophe'),
  (uuid_generate_v4(), 'Revenge', 'Stories centered on retribution'),
  (uuid_generate_v4(), 'Cyberpunk', 'Futuristic settings with advanced tech and social problems'),
  (uuid_generate_v4(), 'Harem', 'Multiple romantic interests for the protagonist'),
  (uuid_generate_v4(), 'Super Powers', 'Characters with abilities beyond normal humans'),
  (uuid_generate_v4(), 'Virtual Reality', 'Stories involving simulated experiences'),
  (uuid_generate_v4(), 'Zombies', 'Stories featuring the undead');

-- Sample admin user
-- Note: In production, add an admin via direct DB insertion or through a secure admin panel
-- This is just for development setup
-- Replace 'admin_user_id_from_auth_users' with a real user ID after registration
-- INSERT INTO public.admins (user_id)
-- VALUES ('admin_user_id_from_auth_users');

-- Sample manga entries
DO $$
DECLARE
  actionId UUID;
  fantasyId UUID;
  romanceId UUID;
  scifiId UUID;
  supernaturalId UUID;
  adventureId UUID;
  
  magicTagId UUID;
  timeTraveTagId UUID;
  isekaiTagId UUID;
  demonsTagId UUID;
  virtualRealityTagId UUID;
  
  manga1Id UUID;
  manga2Id UUID;
  manga3Id UUID;
BEGIN
  -- Get genre IDs
  SELECT id INTO actionId FROM public.genres WHERE name = 'Action' LIMIT 1;
  SELECT id INTO fantasyId FROM public.genres WHERE name = 'Fantasy' LIMIT 1;
  SELECT id INTO romanceId FROM public.genres WHERE name = 'Romance' LIMIT 1;
  SELECT id INTO scifiId FROM public.genres WHERE name = 'Sci-Fi' LIMIT 1;
  SELECT id INTO supernaturalId FROM public.genres WHERE name = 'Supernatural' LIMIT 1;
  SELECT id INTO adventureId FROM public.genres WHERE name = 'Adventure' LIMIT 1;
  
  -- Get tag IDs
  SELECT id INTO magicTagId FROM public.tags WHERE name = 'Magic' LIMIT 1;
  SELECT id INTO timeTraveTagId FROM public.tags WHERE name = 'Time Travel' LIMIT 1;
  SELECT id INTO isekaiTagId FROM public.tags WHERE name = 'Isekai' LIMIT 1;
  SELECT id INTO demonsTagId FROM public.tags WHERE name = 'Demons' LIMIT 1;
  SELECT id INTO virtualRealityTagId FROM public.tags WHERE name = 'Virtual Reality' LIMIT 1;
  
  -- Insert sample manga 1
  manga1Id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  )
  VALUES (
    manga1Id,
    'Spirit Hunter',
    'A young exorcist battles demons in modern Tokyo while uncovering secrets about his mysterious powers.',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=300&h=400',
    'Kenji Takahashi',
    'Yui Tanaka',
    'ongoing',
    'manga',
    2020,
    100,
    4.8,
    '13+'
  );
  
  -- Insert sample manga 2
  manga2Id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  )
  VALUES (
    manga2Id,
    'Cyber Dreams',
    'In a dystopian future, a hacker discovers a virtual world that might hold the key to humanity''s salvation.',
    'https://images.unsplash.com/photo-1614583225154-5fcdda07019e?auto=format&fit=crop&q=80&w=300&h=400',
    'Emma Chen',
    'Li Wei',
    'ongoing',
    'manga',
    2022,
    85,
    4.6,
    '16+'
  );
  
  -- Insert sample manga 3
  manga3Id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  )
  VALUES (
    manga3Id,
    'Dragon''s Path',
    'A young warrior embarks on a quest to find seven mythical dragons and save his kingdom from eternal darkness.',
    'https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?auto=format&fit=crop&q=80&w=300&h=400',
    'Michael Wong',
    'Sarah Johnson',
    'ongoing',
    'manhwa',
    2021,
    120,
    4.9,
    'all'
  );
  
  -- Link genres to manga
  INSERT INTO public.manga_genres (manga_id, genre_id)
  VALUES
    (manga1Id, actionId),
    (manga1Id, supernaturalId),
    (manga2Id, scifiId),
    (manga2Id, romanceId),
    (manga3Id, fantasyId),
    (manga3Id, actionId),
    (manga3Id, adventureId);
  
  -- Link tags to manga
  INSERT INTO public.manga_tags (manga_id, tag_id)
  VALUES
    (manga1Id, magicTagId),
    (manga1Id, demonsTagId),
    (manga2Id, timeTraveTagId),
    (manga2Id, virtualRealityTagId),
    (manga3Id, magicTagId),
    (manga3Id, isekaiTagId);
    
  -- Create chapters for manga 1
  FOR i IN 1..5 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (
      manga1Id,
      i,
      'Chapter ' || i,
      20
    );
  END LOOP;
  
  -- Create chapters for manga 2
  FOR i IN 1..3 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (
      manga2Id,
      i,
      'Chapter ' || i,
      18
    );
  END LOOP;
  
  -- Create chapters for manga 3
  FOR i IN 1..7 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (
      manga3Id,
      i,
      'Chapter ' || i,
      25
    );
  END LOOP;
END $$;
