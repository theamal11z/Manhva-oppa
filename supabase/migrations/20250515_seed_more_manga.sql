-- Additional manga and manhwa seed data for Manhva-oppa
-- Created: 2025-05-15

-- Function to safely insert manga with genres and tags
CREATE OR REPLACE FUNCTION seed_additional_manga()
RETURNS VOID AS $$
DECLARE
  -- Manga ID for current insertion
  manga_id UUID;
  
  -- Variables to check existence
  genre_count INT;
  tag_count INT;
BEGIN
  -- Create temporary tables for direct lookup
  -- TEMPORARY tables are automatically dropped at the end of the session
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_genres AS
  SELECT id, name FROM public.genres;
  
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_tags AS
  SELECT id, name FROM public.tags;
  
  -- Count genres and tags for validation
  SELECT COUNT(*) INTO genre_count FROM temp_genres;
  SELECT COUNT(*) INTO tag_count FROM temp_tags;
  
  -- Display counts for debugging
  RAISE NOTICE 'Found % genres and % tags', genre_count, tag_count;
  
  -- Check if we have the basic required genres and tags
  IF genre_count < 5 THEN
    RAISE EXCEPTION 'Not enough genres found in the database (found %): Please ensure genres are seeded first.', genre_count;
  END IF;
  
  IF tag_count < 5 THEN
    RAISE EXCEPTION 'Not enough tags found in the database (found %): Please ensure tags are seeded first.', tag_count;
  END IF;

  -- Helper function to safely link manga with genre
  CREATE OR REPLACE FUNCTION safe_link_manga_genre(p_manga_id UUID, p_genre_name TEXT)
  RETURNS VOID AS $inner$
  DECLARE
    v_genre_id UUID;
  BEGIN
    -- Get the genre ID directly from the temp table
    SELECT id INTO v_genre_id FROM temp_genres WHERE name = p_genre_name;
    
    IF v_genre_id IS NOT NULL THEN
      -- Insert with the UUID from the temp table
      INSERT INTO public.manga_genres (manga_id, genre_id)
      VALUES (p_manga_id, v_genre_id);
      
      RAISE NOTICE 'Added genre % with ID %', p_genre_name, v_genre_id;
    ELSE
      RAISE NOTICE 'Genre "%" not found, skipping link', p_genre_name;
    END IF;
  END;
  $inner$ LANGUAGE plpgsql;

  -- Helper function to safely link manga with tag
  CREATE OR REPLACE FUNCTION safe_link_manga_tag(p_manga_id UUID, p_tag_name TEXT)
  RETURNS VOID AS $inner$
  DECLARE
    v_tag_id UUID;
  BEGIN
    -- Get the tag ID directly from the temp table
    SELECT id INTO v_tag_id FROM temp_tags WHERE name = p_tag_name;
    
    IF v_tag_id IS NOT NULL THEN
      -- Insert with the UUID from the temp table
      INSERT INTO public.manga_tags (manga_id, tag_id)
      VALUES (p_manga_id, v_tag_id);
      
      RAISE NOTICE 'Added tag % with ID %', p_tag_name, v_tag_id;
    ELSE
      RAISE NOTICE 'Tag "%" not found, skipping link', p_tag_name;
    END IF;
  END;
  $inner$ LANGUAGE plpgsql;

  -- 1. Solo Leveling (Manhwa)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'Solo Leveling',
    'In a world where hunters must battle deadly monsters to protect humanity, Sung Jin-Woo, the weakest hunter of all mankind, finds himself in a mysterious dungeon where he gains an incredible power.',
    'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&q=80&w=300&h=400',
    'Chugong',
    'DUBU',
    'completed',
    'manhwa',
    2018,
    950,
    4.9,
    '16+'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Fantasy');
  PERFORM safe_link_manga_genre(manga_id, 'Adventure');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Super Powers');
  PERFORM safe_link_manga_tag(manga_id, 'Martial Arts');
  PERFORM safe_link_manga_tag(manga_id, 'Magic');
  
  -- Create 10 chapters
  FOR i IN 1..10 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 30);
  END LOOP;

  -- 2. Tower of God (Manhwa)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'Tower of God',
    'The story follows Twenty-Fifth Bam, a boy who spent most of his life trapped beneath a vast tower, with only his close friend Rachel as company. When Rachel enters the tower, Bam manages to open the door too, and faces challenges at each floor of this tower in his quest to find his companion.',
    'https://images.unsplash.com/photo-1579935110464-fcd041be62d0?auto=format&fit=crop&q=80&w=300&h=400',
    'SIU',
    'SIU',
    'ongoing',
    'manhwa',
    2010,
    850,
    4.7,
    '13+'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Fantasy');
  PERFORM safe_link_manga_genre(manga_id, 'Mystery');
  PERFORM safe_link_manga_genre(manga_id, 'Adventure');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Super Powers');
  PERFORM safe_link_manga_tag(manga_id, 'Magic');
  
  -- Create 8 chapters
  FOR i IN 1..8 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 35);
  END LOOP;

  -- 3. Omniscient Reader's Viewpoint (Manhwa)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'Omniscient Reader''s Viewpoint',
    'Kim Dokja was an average office worker whose sole interest was reading his favorite web novel "Three Ways to Survive the Apocalypse." But when the novel suddenly becomes reality, he is the only person who knows how the world will end.',
    'https://images.unsplash.com/photo-1614964227492-f7aa35be6cef?auto=format&fit=crop&q=80&w=300&h=400',
    'Sing-Shong',
    'Sleepy-C',
    'ongoing',
    'manhwa',
    2020,
    780,
    4.8,
    '16+'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Fantasy');
  PERFORM safe_link_manga_genre(manga_id, 'Adventure');
  PERFORM safe_link_manga_genre(manga_id, 'Drama');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Super Powers');
  PERFORM safe_link_manga_tag(manga_id, 'Post-Apocalyptic');
  
  -- Create 7 chapters
  FOR i IN 1..7 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 32);
  END LOOP;

  -- 4. Attack on Titan (Manga)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'Attack on Titan',
    'In a world where humanity lives within territories surrounded by three enormous walls that protect them from gigantic man-eating humanoids referred to as Titans, Eren Yeager joins the military with his childhood friends to fight the Titans after a Titan brings about the destruction of his hometown and the death of his mother.',
    'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?auto=format&fit=crop&q=80&w=300&h=400',
    'Hajime Isayama',
    'Hajime Isayama',
    'completed',
    'manga',
    2009,
    980,
    4.9,
    '18+'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Drama');
  PERFORM safe_link_manga_genre(manga_id, 'Fantasy');
  PERFORM safe_link_manga_genre(manga_id, 'Horror');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Super Powers');
  PERFORM safe_link_manga_tag(manga_id, 'Post-Apocalyptic');
  
  -- Create 9 chapters
  FOR i IN 1..9 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 40);
  END LOOP;

  -- 5. Demon Slayer (Manga)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'Demon Slayer',
    'Tanjiro Kamado''s peaceful life is shattered after his family is slaughtered by a demon. Tanjiro and his sister Nezuko, the sole survivor who has been transformed into a demon, set out to avenge their family and cure Nezuko.',
    'https://images.unsplash.com/photo-1578981670101-d0e45e0b7241?auto=format&fit=crop&q=80&w=300&h=400',
    'Koyoharu Gotouge',
    'Koyoharu Gotouge',
    'completed',
    'manga',
    2016,
    920,
    4.8,
    '16+'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Supernatural');
  PERFORM safe_link_manga_genre(manga_id, 'Fantasy');
  PERFORM safe_link_manga_genre(manga_id, 'Drama');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Demons');
  PERFORM safe_link_manga_tag(manga_id, 'Martial Arts');
  PERFORM safe_link_manga_tag(manga_id, 'Super Powers');
  
  -- Create 8 chapters
  FOR i IN 1..8 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 38);
  END LOOP;

  -- 6. My Hero Academia (Manga)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'My Hero Academia',
    'In a world where people with superpowers known as "Quirks" are the norm, Izuku Midoriya, a regular middle school student, dreams of one day becoming a Pro Hero despite being bullied by his classmates for not having a Quirk.',
    'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&q=80&w=300&h=400',
    'Kohei Horikoshi',
    'Kohei Horikoshi',
    'ongoing',
    'manga',
    2014,
    890,
    4.7,
    '13+'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Comedy');
  PERFORM safe_link_manga_genre(manga_id, 'Supernatural');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Super Powers');
  PERFORM safe_link_manga_tag(manga_id, 'School Life');
  
  -- Create 7 chapters
  FOR i IN 1..7 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 28);
  END LOOP;

  -- 7. The Beginning After The End (Manhwa)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'The Beginning After The End',
    'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power. Reincarnated into a new world filled with magic and monsters, the king has a second chance to relive his life.',
    'https://images.unsplash.com/photo-1579546929662-711aa81148cf?auto=format&fit=crop&q=80&w=300&h=400',
    'TurtleMe',
    'Fuyuki23',
    'ongoing',
    'manhwa',
    2018,
    820,
    4.8,
    '13+'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Fantasy');
  PERFORM safe_link_manga_genre(manga_id, 'Adventure');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Reincarnation');
  PERFORM safe_link_manga_tag(manga_id, 'Magic');
  PERFORM safe_link_manga_tag(manga_id, 'Martial Arts');
  
  -- Create 10 chapters
  FOR i IN 1..10 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 31);
  END LOOP;

  -- 8. Jujutsu Kaisen (Manga)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'Jujutsu Kaisen',
    'Yuji Itadori, a kind-hearted teenager, joins his school''s Occult Club for fun, but discovers that its members are actual sorcerers who can manipulate the energy between beings for their own use. He hears about a cursed talisman - the finger of Sukuna, a demon - and its being targeted by other cursed beings.',
    'https://images.unsplash.com/photo-1620336655055-088d06e36bf0?auto=format&fit=crop&q=80&w=300&h=400',
    'Gege Akutami',
    'Gege Akutami',
    'ongoing',
    'manga',
    2018,
    860,
    4.7,
    '16+'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Supernatural');
  PERFORM safe_link_manga_genre(manga_id, 'Horror');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Demons');
  PERFORM safe_link_manga_tag(manga_id, 'Super Powers');
  PERFORM safe_link_manga_tag(manga_id, 'School Life');
  
  -- Create 8 chapters
  FOR i IN 1..8 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 33);
  END LOOP;

  -- 9. Villain to Kill (Manhwa)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'Villain to Kill',
    'Cassian Lee is a normal office worker until the day a villainous Portal opens above him. Now with his newfound, seemingly evil powers, will he become the hero of his own story or is he fated to become the villain?',
    'https://images.unsplash.com/photo-1568283661163-c90191ba3824?auto=format&fit=crop&q=80&w=300&h=400',
    'Seongmin',
    'Seokwoo',
    'ongoing',
    'manhwa',
    2020,
    680,
    4.6,
    '16+'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Supernatural');
  PERFORM safe_link_manga_genre(manga_id, 'Fantasy');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Super Powers');
  PERFORM safe_link_manga_tag(manga_id, 'Revenge');
  
  -- Create 6 chapters
  FOR i IN 1..6 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 29);
  END LOOP;

  -- 10. Spy x Family (Manga)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'Spy x Family',
    'A spy on an undercover mission gets married and adopts a child as part of his cover. His wife and daughter have secrets of their own, and the family must learn to live together while keeping their true identities hidden.',
    'https://images.unsplash.com/photo-1616627561839-074385245ff6?auto=format&fit=crop&q=80&w=300&h=400',
    'Tatsuya Endo',
    'Tatsuya Endo',
    'ongoing',
    'manga',
    2019,
    800,
    4.8,
    'all'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Comedy');
  PERFORM safe_link_manga_genre(manga_id, 'Slice of Life');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Super Powers');
  
  -- Create 5 chapters
  FOR i IN 1..5 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 25);
  END LOOP;
  
  -- 11. Tomb Raider King (Manhwa)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'Tomb Raider King',
    'Joo Heon is a tomb raider who seeks out ancient tombs and relics that grant special powers. After being betrayed by his team, he is given a chance to go back in time and take revenge.',
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=300&h=400',
    'San Gyung',
    'USONAN',
    'ongoing',
    'manhwa',
    2019,
    720,
    4.5,
    '16+'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Fantasy');
  PERFORM safe_link_manga_genre(manga_id, 'Adventure');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Revenge');
  PERFORM safe_link_manga_tag(manga_id, 'Time Travel');
  PERFORM safe_link_manga_tag(manga_id, 'Super Powers');
  
  -- Create 7 chapters
  FOR i IN 1..7 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 34);
  END LOOP;

  -- 12. Tokyo Revengers (Manga)
  manga_id := uuid_generate_v4();
  INSERT INTO public.manga_entries (
    id, title, description, cover_image, author, artist, status, type, year, popularity, rating, age_rating
  ) VALUES (
    manga_id,
    'Tokyo Revengers',
    'Takemichi Hanagaki learns that his ex-girlfriend has been killed. When he is pushed in front of a train, he travels back in time to his middle school days and tries to change the future to save her.',
    'https://images.unsplash.com/photo-1595959901920-90d79a8e2128?auto=format&fit=crop&q=80&w=300&h=400',
    'Ken Wakui',
    'Ken Wakui',
    'completed',
    'manga',
    2017,
    760,
    4.6,
    '16+'
  );
  
  -- Link genres safely
  PERFORM safe_link_manga_genre(manga_id, 'Action');
  PERFORM safe_link_manga_genre(manga_id, 'Drama');
  PERFORM safe_link_manga_genre(manga_id, 'Supernatural');
  
  -- Link tags safely
  PERFORM safe_link_manga_tag(manga_id, 'Time Travel');
  PERFORM safe_link_manga_tag(manga_id, 'Revenge');
  
  -- Create 6 chapters
  FOR i IN 1..6 LOOP
    INSERT INTO public.chapters (manga_id, chapter_number, title, pages)
    VALUES (manga_id, i, 'Chapter ' || i, 28);
  END LOOP;
  
  -- Drop helper functions - temp tables will be dropped automatically at session end
  DROP FUNCTION safe_link_manga_genre(UUID, TEXT);
  DROP FUNCTION safe_link_manga_tag(UUID, TEXT);
  
  RAISE NOTICE 'Successfully added 12 new manga/manhwa entries to the database.';
END;
$$ LANGUAGE plpgsql;

-- Run the function to insert data
SELECT seed_additional_manga();

-- Clean up after we're done (remove the temporary function)
DROP FUNCTION seed_additional_manga();

COMMENT ON MIGRATION '20250515_seed_more_manga' IS 'Adds 12 popular manga and manhwa titles with proper genre and tag associations';
