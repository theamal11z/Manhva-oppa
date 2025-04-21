import { createClient } from '@supabase/supabase-js';
// Import the Database type when we have proper Supabase schema defined
// For now using any type to avoid compilation errors
type Database = any;

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// User authentication helpers
export const signUp = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const resetPassword = async (email: string) => {
  return supabase.auth.resetPasswordForEmail(email);
};

// Manga-related helpers
export const getGenres = async () => {
  return supabase.from('genres').select('*').order('name', { ascending: true });
};

export const getMangaList = async (
  limit = 10,
  offset = 0,
  orderBy: 'created_at' | 'popularity' = 'created_at',
  orderDirection: 'asc' | 'desc' = 'desc'
) => {
  return supabase
    .from('manga_entries')
    .select(`
      *,
      genres:manga_genres(genres(*)),
      tags:manga_tags(tags(*))
    `)
    .range(offset, offset + limit - 1)
    .order(orderBy, { ascending: orderDirection === 'asc' });
};

export const getMangaById = async (id: string) => {
  return supabase
    .from('manga_entries')
    .select(`
      *,
      genres:manga_genres(genres(*)),
      tags:manga_tags(tags(*))
    `)
    .eq('id', id)
    .single();
};

export const getMangaByGenre = async (genreId: string, limit = 10) => {
  return supabase
    .from('manga_genres')
    .select(`
      manga_entries(*)
    `)
    .eq('genre_id', genreId)
    .limit(limit);
};

// User reading list helpers
export const getUserReadingList = async (userId: string) => {
  return supabase
    .from('user_reading_lists')
    .select(`
      *,
      manga:manga_entries(*)
    `)
    .eq('user_id', userId);
};

export const addToReadingList = async (
  userId: string,
  mangaId: string,
  status: 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read'
) => {
  return supabase.from('user_reading_lists').upsert({
    user_id: userId,
    manga_id: mangaId,
    status,
    updated_at: new Date().toISOString(),
  });
};

export const addToFavorites = async (userId: string, mangaId: string) => {
  return supabase.from('user_favorites').upsert({
    user_id: userId,
    manga_id: mangaId,
  });
};

export const removeFromFavorites = async (userId: string, mangaId: string) => {
  return supabase
    .from('user_favorites')
    .delete()
    .match({ user_id: userId, manga_id: mangaId });
};

// Function to get user favorites
export const getUserFavorites = async (userId: string) => {
  return supabase
    .from('user_favorites')
    .select(`
      *,
      manga:manga_entries(*)
    `)
    .eq('user_id', userId);
};

// Function to remove a manga from reading list
export const removeFromReadingList = async (userId: string, mangaId: string) => {
  return supabase
    .from('user_reading_lists')
    .delete()
    .match({ user_id: userId, manga_id: mangaId });
};

// Function to update reading status
export const updateReadingStatus = async (userId: string, mangaId: string, status: 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read', currentChapter?: number) => {
  const updateData: any = {
    user_id: userId,
    manga_id: mangaId,
    status,
    updated_at: new Date().toISOString()
  };
  
  if (currentChapter !== undefined) {
    updateData.current_chapter = currentChapter;
  }
  
  return supabase.from('user_reading_lists').upsert(updateData);
};

// Admin helpers
export const addMangaEntry = async (mangaData: any) => {
  // Separate genres and tags from the manga data
  const { genres, tags, ...mangaDetails } = mangaData;
  
  // Insert the manga entry first
  const { data: newManga, error } = await supabase
    .from('manga_entries')
    .insert(mangaDetails)
    .select()
    .single();
  
  if (error || !newManga) {
    console.error('Error adding manga entry:', error);
    return { error };
  }
  
  // Now handle genres if they exist
  if (genres && genres.length > 0) {
    // First, get or create genre records
    const genrePromises = genres.map(async (genreName: string) => {
      // Check if genre exists
      const { data: existingGenres } = await supabase
        .from('genres')
        .select('id')
        .eq('name', genreName)
        .limit(1);
      
      // If genre exists, return it; otherwise create it
      if (existingGenres && existingGenres.length > 0) {
        return existingGenres[0].id;
      } else {
        const { data: newGenre } = await supabase
          .from('genres')
          .insert({ name: genreName })
          .select('id')
          .single();
        
        return newGenre?.id;
      }
    });
    
    // Resolve all genre promises to get IDs
    const genreIds = await Promise.all(genrePromises);
    
    // Create manga_genres entries for each genre
    const mangaGenresData = genreIds.filter(id => id).map(genreId => ({
      manga_id: newManga.id,
      genre_id: genreId
    }));
    
    if (mangaGenresData.length > 0) {
      await supabase.from('manga_genres').insert(mangaGenresData);
    }
  }
  
  // Now handle tags if they exist
  if (tags && tags.length > 0) {
    // First, get or create tag records
    const tagPromises = tags.map(async (tagName: string) => {
      // Check if tag exists
      const { data: existingTags } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .limit(1);
      
      // If tag exists, return it; otherwise create it
      if (existingTags && existingTags.length > 0) {
        return existingTags[0].id;
      } else {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ name: tagName })
          .select('id')
          .single();
        
        return newTag?.id;
      }
    });
    
    // Resolve all tag promises to get IDs
    const tagIds = await Promise.all(tagPromises);
    
    // Create manga_tags entries for each tag
    const mangaTagsData = tagIds.filter(id => id).map(tagId => ({
      manga_id: newManga.id,
      tag_id: tagId
    }));
    
    if (mangaTagsData.length > 0) {
      await supabase.from('manga_tags').insert(mangaTagsData);
    }
  }
  
  // Return the new manga data
  return { data: newManga, error: null };
};

export const updateMangaEntry = async (id: string, mangaData: any) => {
  // Separate genres and tags from the manga data
  const { genres, tags, ...mangaDetails } = mangaData;
  
  // Update the manga entry first
  const { data: updatedManga, error } = await supabase
    .from('manga_entries')
    .update(mangaDetails)
    .eq('id', id)
    .select()
    .single();
  
  if (error || !updatedManga) {
    console.error('Error updating manga entry:', error);
    return { error };
  }
  
  // Handle genres if they were provided in the update
  if (genres) {
    // First, delete existing manga_genres entries
    await supabase
      .from('manga_genres')
      .delete()
      .eq('manga_id', id);
    
    if (genres.length > 0) {
      // Get or create genre records
      const genrePromises = genres.map(async (genreName: string) => {
        // Check if genre exists
        const { data: existingGenres } = await supabase
          .from('genres')
          .select('id')
          .eq('name', genreName)
          .limit(1);
        
        // If genre exists, return it; otherwise create it
        if (existingGenres && existingGenres.length > 0) {
          return existingGenres[0].id;
        } else {
          const { data: newGenre } = await supabase
            .from('genres')
            .insert({ name: genreName })
            .select('id')
            .single();
          
          return newGenre?.id;
        }
      });
      
      // Resolve all genre promises to get IDs
      const genreIds = await Promise.all(genrePromises);
      
      // Create manga_genres entries for each genre
      const mangaGenresData = genreIds.filter(id => id).map(genreId => ({
        manga_id: id,
        genre_id: genreId
      }));
      
      if (mangaGenresData.length > 0) {
        await supabase.from('manga_genres').insert(mangaGenresData);
      }
    }
  }
  
  // Handle tags if they were provided in the update
  if (tags) {
    // First, delete existing manga_tags entries
    await supabase
      .from('manga_tags')
      .delete()
      .eq('manga_id', id);
    
    if (tags.length > 0) {
      // Get or create tag records
      const tagPromises = tags.map(async (tagName: string) => {
        // Check if tag exists
        const { data: existingTags } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .limit(1);
        
        // If tag exists, return it; otherwise create it
        if (existingTags && existingTags.length > 0) {
          return existingTags[0].id;
        } else {
          const { data: newTag } = await supabase
            .from('tags')
            .insert({ name: tagName })
            .select('id')
            .single();
          
          return newTag?.id;
        }
      });
      
      // Resolve all tag promises to get IDs
      const tagIds = await Promise.all(tagPromises);
      
      // Create manga_tags entries for each tag
      const mangaTagsData = tagIds.filter(id => id).map(tagId => ({
        manga_id: id,
        tag_id: tagId
      }));
      
      if (mangaTagsData.length > 0) {
        await supabase.from('manga_tags').insert(mangaTagsData);
      }
    }
  }
  
  // Return the updated manga data
  return { data: updatedManga, error: null };
};

export const deleteMangaEntry = async (id: string) => {
  return supabase
    .from('manga_entries')
    .delete()
    .eq('id', id);
};

// User management for admins
export const getUsers = async (limit = 20, offset = 0) => {
  return supabase
    .from('user_profiles')
    .select('*')
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });
};

export const getUserById = async (userId: string) => {
  return supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
};

export const addAdmin = async (userId: string) => {
  return supabase
    .from('admins')
    .insert({ user_id: userId })
    .select();
};

export const removeAdmin = async (userId: string) => {
  return supabase
    .from('admins')
    .delete()
    .eq('user_id', userId);
};

export const getAdminList = async () => {
  // Use a direct query with RPC to avoid the RLS policies causing infinite recursion
  const { data, error } = await supabase.rpc('get_admin_list');
  
  if (error) {
    console.error("Error fetching admin list:", error);
    return { data: [], error };
  }
  
  return { data, error };
};

// Stats for admin dashboard
export const getDashboardStats = async () => {
  // Get total manga count
  const mangaCount = await supabase
    .from('manga_entries')
    .select('id', { count: 'exact', head: true });
    
  // Get total user count
  const userCount = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true });
    
  // Get recently added manga
  const recentManga = await supabase
    .from('manga_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  return {
    mangaCount: mangaCount.count || 0,
    userCount: userCount.count || 0,
    recentManga: recentManga.data || []
  };
};

// Upload a manga cover image to Supabase storage
export const uploadCoverImage = async (file: File, path: string) => {
  return supabase.storage.from('manga_covers').upload(path, file);
};

// Get recommendations based on user's reading history
export const getRecommendations = async (limit = 10) => {
  // This is a placeholder for future AI recommendation logic
  // For now, we'll just return popular manga
  return supabase
    .from('manga_entries')
    .select('*')
    .order('popularity', { ascending: false })
    .limit(limit);
};

export const getChaptersByMangaId = async (mangaId: string, limit = 50, offset = 0) => {
  // First, get the chapters
  const { data, error } = await supabase
    .from('chapters')
    .select(`
      id,
      manga_id,
      chapter_number,
      title,
      pages,
      views,
      created_at,
      updated_at
    `)
    .eq('manga_id', mangaId)
    .order('chapter_number', { ascending: true })
    .range(offset, offset + limit - 1);
    
  if (error) {
    console.error('Error fetching chapters:', error);
    return { data: [], error };
  }
  
  // For each chapter, count the pages
  if (data) {
    // Enhance the data with derived fields for compatibility
    const enhancedData = data.map(chapter => ({
      ...chapter,
      // Map existing fields to expected ones
      status: 'published', // Default status
      description: '', // Default empty description
      release_date: chapter.created_at, // Use created_at as release date
      page_count: chapter.pages || 0, // Use pages field as page_count
    }));
    
    return { data: enhancedData, error: null };
  }
  
  return { data, error };
};

export const getChapterById = async (chapterId: string) => {
  const { data, error } = await supabase
    .from('chapters')
    .select(`
      id,
      manga_id,
      chapter_number,
      title,
      pages,
      views,
      created_at,
      updated_at,
      manga_entries(id, title)
    `)
    .eq('id', chapterId)
    .single();
    
  if (error) {
    console.error('Error fetching chapter:', error);
    return { data: null, error };
  }
  
  if (data) {
    // Enhance the data with derived fields for compatibility
    const enhancedData = {
      ...data,
      status: 'published', // Default status
      description: '', // Default empty description
      release_date: data.created_at, // Use created_at as release date
      page_count: data.pages || 0, // Use pages field as page_count
    };
    
    return { data: enhancedData, error: null };
  }
  
  return { data, error };
};

export const addChapter = async (chapterData: any) => {
  // Convert from our UI model to the database model
  const dbChapterData = {
    manga_id: chapterData.manga_id,
    chapter_number: chapterData.chapter_number,
    title: chapterData.title,
    // Use default values for fields not in schema
    pages: 0, // Will be updated when pages are added
    // We don't need to add status, description, release_date because they don't exist in your schema
  };
  
  const { data, error } = await supabase
    .from('chapters')
    .insert(dbChapterData)
    .select()
    .single();
  
  if (error) {
    console.error('Error adding chapter:', error);
    return { data: null, error };
  }
  
  if (data) {
    // Enhance the data with derived fields for compatibility with UI
    const enhancedData = {
      ...data,
      status: 'published', // Default status
      description: '', // Default empty description
      release_date: data.created_at, // Use created_at as release date
      page_count: data.pages || 0, // Use pages field as page_count
    };
    
    return { data: enhancedData, error: null };
  }
  
  return { data, error };
};

export const updateChapter = async (id: string, chapterData: any) => {
  // Convert from our UI model to the database model
  const dbChapterData = {
    manga_id: chapterData.manga_id,
    chapter_number: chapterData.chapter_number,
    title: chapterData.title,
    // Only include fields that exist in the database schema
  };
  
  const { data, error } = await supabase
    .from('chapters')
    .update(dbChapterData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating chapter:', error);
    return { data: null, error };
  }
  
  if (data) {
    // Enhance the data with derived fields for compatibility with UI
    const enhancedData = {
      ...data,
      status: 'published', // Default status
      description: '', // Default empty description
      release_date: data.created_at, // Use created_at as release date
      page_count: data.pages || 0, // Use pages field as page_count
    };
    
    return { data: enhancedData, error: null };
  }
  
  return { data, error };
};

export const deleteChapter = async (id: string) => {
  // This will automatically delete associated chapter_pages due to CASCADE constraints
  const { data, error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', id);
  
  return { error };
};

export const getChapterPages = async (chapterId: string) => {
  return supabase
    .from('chapter_pages')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('page_number', { ascending: true });
};

export const uploadChapterPage = async (file: File, chapterId: string, pageNumber: number) => {
  // Create a unique path for the page
  const fileExt = file.name.split('.').pop();
  const filePath = `chapter_${chapterId}/page_${pageNumber}.${fileExt}`;
  
  // Check if storage bucket exists, create it if it doesn't
  const { data: buckets } = await supabase.storage.listBuckets();
  const chapterPagesBucket = buckets?.find(bucket => bucket.name === 'chapter_pages');
  
  if (!chapterPagesBucket) {
    // Create the bucket if it doesn't exist
    const { error: bucketError } = await supabase.storage.createBucket('chapter_pages', { public: true });
    if (bucketError) {
      console.error('Error creating bucket:', bucketError);
      return { error: bucketError };
    }
  }
  
  // Upload the file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('chapter_pages')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (uploadError) {
    console.error('Error uploading page:', uploadError);
    return { error: uploadError };
  }
  
  // Get the public URL for the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from('chapter_pages')
    .getPublicUrl(filePath);
  
  const publicURL = publicUrlData.publicUrl;
  
  // Create a record in the chapter_pages table
  const { data: pageData, error: pageError } = await supabase
    .from('chapter_pages')
    .insert({
      chapter_id: chapterId,
      page_number: pageNumber,
      image_url: publicURL
    })
    .select()
    .single();
  
  if (pageError) {
    console.error('Error creating page record:', pageError);
    return { error: pageError };
  }
  
  // Update the chapter's page count
  await supabase
    .from('chapters')
    .update({ pages: pageNumber }) // Use the highest page number as the count
    .eq('id', chapterId)
    .gt('pages', pageNumber - 1); // Only update if current page count is less
  
  return { data: pageData, error: null };
};

export const bulkUploadChapterPages = async (files: File[], chapterId: string) => {
  // Sort files by name to ensure correct ordering
  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));
  
  const uploadPromises = sortedFiles.map((file, index) => 
    uploadChapterPage(file, chapterId, index + 1)
  );
  
  const results = await Promise.all(uploadPromises);
  const errors = results.filter(result => result.error).map(result => result.error);
  
  if (errors.length > 0) {
    return { 
      error: { message: `${errors.length} files failed to upload` },
      data: results.filter(result => !result.error).map(result => result.data)
    };
  }
  
  // Update the chapter's total page count
  await supabase
    .from('chapters')
    .update({ pages: sortedFiles.length })
    .eq('id', chapterId);
  
  return { 
    data: results.map(result => result.data),
    error: null 
  };
};

export const deleteChapterPage = async (pageId: string) => {
  // First get the page to find its image URL and chapter ID
  const { data: page } = await supabase
    .from('chapter_pages')
    .select('image_url, chapter_id')
    .eq('id', pageId)
    .single();
  
  if (page) {
    // Extract the path from the URL
    const urlParts = page.image_url.split('/');
    const filePath = urlParts.slice(urlParts.indexOf('chapter_pages') + 1).join('/');
    
    // Delete the file from storage
    await supabase.storage
      .from('chapter_pages')
      .remove([filePath]);
      
    // Delete the page record
    const { error } = await supabase
      .from('chapter_pages')
      .delete()
      .eq('id', pageId);
      
    if (error) return { error };
    
    // Update the chapter's page count
    const { data: remainingPages } = await supabase
      .from('chapter_pages')
      .select('id')
      .eq('chapter_id', page.chapter_id);
      
    await supabase
      .from('chapters')
      .update({ pages: remainingPages?.length || 0 })
      .eq('id', page.chapter_id);
      
    return { error: null };
  }
  
  // If no page was found, return an error
  return { error: { message: 'Page not found' } };
};

export const reorderChapterPages = async (chapterId: string, pageOrder: {id: string, page_number: number}[]) => {
  // Create an array of update operations
  const updates = pageOrder.map(({ id, page_number }) => 
    supabase
      .from('chapter_pages')
      .update({ page_number })
      .eq('id', id)
  );
  
  // Execute all updates in parallel
  await Promise.all(updates);
  
  // Return the updated pages
  return getChapterPages(chapterId);
};

export const addPageFromUrl = async (imageUrl: string, chapterId: string, pageNumber: number) => {
  try {
    // Create a record in the chapter_pages table with the external URL
    const { data: pageData, error: pageError } = await supabase
      .from('chapter_pages')
      .insert({
        chapter_id: chapterId,
        page_number: pageNumber,
        image_url: imageUrl
      })
      .select()
      .single();
    
    if (pageError) {
      console.error('Error creating page record from URL:', pageError);
      return { error: pageError };
    }
    
    // Update the chapter's page count
    await supabase
      .from('chapters')
      .update({ pages: pageNumber }) // Use the highest page number as the count
      .eq('id', chapterId)
      .gt('pages', pageNumber - 1); // Only update if current page count is less
    
    return { data: pageData, error: null };
  } catch (err) {
    console.error('Error adding page from URL:', err);
    return { error: err };
  }
};

export const bulkAddPagesFromUrls = async (imageUrls: string[], chapterId: string) => {
  try {
    const addPromises = imageUrls.map((url, index) => 
      addPageFromUrl(url, chapterId, index + 1)
    );
    
    const results = await Promise.all(addPromises);
    const errors = results.filter(result => result.error).map(result => result.error);
    
    if (errors.length > 0) {
      return { 
        error: { message: `${errors.length} URLs failed to add` },
        data: results.filter(result => !result.error).map(result => result.data)
      };
    }
    
    // Update the chapter's total page count
    await supabase
      .from('chapters')
      .update({ pages: imageUrls.length })
      .eq('id', chapterId);
    
    return { 
      data: results.map(result => result.data),
      error: null 
    };
  } catch (err) {
    console.error('Error bulk adding pages from URLs:', err);
    return { error: err };
  }
};