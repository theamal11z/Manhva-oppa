import { supabase } from './supabaseClient.js';
import { generateMangaBlogPost } from './openai.js';

/**
 * Creates a new blog post in the database
 * @param {Object} blogData - The blog post data
 * @returns {Promise<Object>} - The created blog post
 */
export async function createBlogPost(blogData) {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert(blogData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
  
  return data;
}

/**
 * Gets all blog posts
 * @param {number} limit - Maximum number of posts to retrieve
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - The blog posts
 */
export async function getBlogPosts(limit = 10, offset = 0) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      manga:manga_entries(*)
    `)
    .order('published_date', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }
  
  return data;
}

/**
 * Gets a blog post by slug
 * @param {string} slug - The blog post slug
 * @returns {Promise<Object>} - The blog post
 */
export async function getBlogPostBySlug(slug) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      manga:manga_entries(*)
    `)
    .eq('slug', slug)
    .single();
  
  if (error) {
    console.error(`Error fetching blog post with slug ${slug}:`, error);
    throw error;
  }
  
  return data;
}

/**
 * Gets a blog post by manga ID
 * @param {string} mangaId - The manga ID
 * @returns {Promise<Object>} - The blog post
 */
export async function getBlogPostByMangaId(mangaId) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      manga:manga_entries(*)
    `)
    .eq('manga_id', mangaId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
    console.error(`Error fetching blog post for manga ${mangaId}:`, error);
    throw error;
  }
  
  return data;
}

/**
 * Automatically generates and creates a blog post for a manga
 * @param {string} mangaId - The ID of the manga to generate a blog post for
 * @returns {Promise<Object>} - The generated and created blog post
 */
export async function autoGenerateBlogPost(mangaId) {
  try {
    // Check if a blog post already exists for this manga
    const existingPost = await getBlogPostByMangaId(mangaId);
    
    if (existingPost) {
      console.log(`Blog post already exists for manga ${mangaId}`);
      return existingPost;
    }
    
    // Fetch the manga details
    const { data: mangaData, error: mangaError } = await supabase
      .from('manga_entries')
      .select(`
        *,
        genres:manga_genres(genres(*)),
        tags:manga_tags(tags(*))
      `)
      .eq('id', mangaId)
      .single();
    
    if (mangaError) {
      console.error(`Error fetching manga ${mangaId}:`, mangaError);
      throw mangaError;
    }
    
    // Generate a blog post using OpenAI
    const blogPostData = await generateMangaBlogPost(mangaData);
    
    // Save the generated blog post to the database
    const savedBlogPost = await createBlogPost(blogPostData);
    
    return savedBlogPost;
  } catch (error) {
    console.error('Error auto-generating blog post:', error);
    throw error;
  }
}

/**
 * Sets up a trigger to listen for new manga entries and automatically generate blog posts
 */
export function setupAutoGenerateTrigger() {
  // Subscribe to manga_entries table inserts
  const mangaSubscription = supabase
    .channel('manga_entries_inserts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'manga_entries'
      },
      async (payload) => {
        try {
          console.log('New manga entry detected:', payload.new.id);
          // Auto-generate a blog post for the new manga
          await autoGenerateBlogPost(payload.new.id);
          console.log(`Blog post generated for manga ${payload.new.id}`);
        } catch (error) {
          console.error(`Failed to generate blog post for manga ${payload.new.id}:`, error);
        }
      }
    )
    .subscribe();
  
  return mangaSubscription;
}
