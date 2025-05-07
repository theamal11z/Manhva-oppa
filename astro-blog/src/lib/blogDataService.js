import { supabase } from './supabaseClient.js';

/**
 * Fetches all blog posts from the database
 * @param {Object} options - Options for fetching posts
 * @param {number} options.limit - Maximum number of posts to fetch
 * @param {number} options.offset - Number of posts to skip
 * @param {string} options.orderBy - Field to order by
 * @param {boolean} options.ascending - Whether to order in ascending order
 * @returns {Promise<Array>} - Blog posts
 */
export async function getAllBlogPosts({ 
  limit = 10, 
  offset = 0, 
  orderBy = 'published_date', 
  ascending = false 
} = {}) {
  try {
    const { data, error, count } = await supabase
      .from('blog_posts')
      .select(`
        *,
        manga:manga_entries(id, title, cover_image, description, 
        genres:manga_genres(genres(*)))
      `, { count: 'exact' })
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching blog posts:', error);
      return { posts: [], count: 0 };
    }
    
    return { posts: data || [], count };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return { posts: [], count: 0 };
  }
}

/**
 * Fetches a single blog post by slug
 * @param {string} slug - The blog post slug
 * @returns {Promise<Object>} - The blog post
 */
export async function getBlogPostBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        manga:manga_entries(
          id, 
          title, 
          cover_image, 
          description, 
          author,
          status,
          published_year,
          genres:manga_genres(genres(*)),
          tags:manga_tags(tags(*))
        )
      `)
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error(`Error fetching blog post with slug ${slug}:`, error);
      return null;
    }
    
    // Increment the view count
    incrementViewCount(data.id);
    
    return data;
  } catch (error) {
    console.error(`Error fetching blog post with slug ${slug}:`, error);
    return null;
  }
}

/**
 * Fetches the latest blog posts
 * @param {number} limit - Maximum number of posts to fetch
 * @returns {Promise<Array>} - Latest blog posts
 */
export async function getLatestBlogPosts(limit = 5) {
  try {
    const { posts } = await getAllBlogPosts({ limit });
    return posts;
  } catch (error) {
    console.error('Error fetching latest blog posts:', error);
    return [];
  }
}

/**
 * Fetches blog posts related to a specific manga
 * @param {string} mangaId - The manga ID
 * @param {number} limit - Maximum number of posts to fetch
 * @returns {Promise<Array>} - Related blog posts
 */
export async function getRelatedBlogPosts(mangaId, limit = 3) {
  try {
    // First get the current manga's genres
    const { data: manga, error: mangaError } = await supabase
      .from('manga_entries')
      .select('genres:manga_genres(genre_id)')
      .eq('id', mangaId)
      .single();
    
    if (mangaError || !manga) {
      return [];
    }
    
    // Extract genre IDs
    const genreIds = manga.genres.map(g => g.genre_id);
    
    if (genreIds.length === 0) {
      return [];
    }
    
    // Find blog posts for manga with similar genres
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        manga:manga_entries!inner(
          id, 
          title, 
          cover_image,
          genres:manga_genres(genre_id)
        )
      `)
      .not('manga_id', 'eq', mangaId) // Exclude the current manga
      .order('published_date', { ascending: false })
      .limit(limit * 3); // Fetch more than needed to filter
    
    if (error) {
      console.error('Error fetching related blog posts:', error);
      return [];
    }
    
    // Filter and sort by genre relevance
    const scoredPosts = data.map(post => {
      // Calculate genre similarity score
      const postGenreIds = post.manga.genres.map(g => g.genre_id);
      const commonGenres = postGenreIds.filter(id => genreIds.includes(id));
      const score = commonGenres.length;
      
      return { ...post, score };
    });
    
    // Sort by score (higher is better) and then by date
    scoredPosts.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.published_date) - new Date(a.published_date);
    });
    
    // Return the top matches
    return scoredPosts.slice(0, limit);
  } catch (error) {
    console.error('Error fetching related blog posts:', error);
    return [];
  }
}

/**
 * Search for blog posts
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of posts to fetch
 * @returns {Promise<Array>} - Matching blog posts
 */
export async function searchBlogPosts(query, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        manga:manga_entries(id, title, cover_image)
      `)
      .or(`title.ilike.%${query}%, content.ilike.%${query}%, seo_keywords.ilike.%${query}%`)
      .order('published_date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error searching blog posts:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error searching blog posts:', error);
    return [];
  }
}

/**
 * Increment the view count for a blog post
 * @param {string} postId - The blog post ID
 */
async function incrementViewCount(postId) {
  try {
    await supabase.rpc('increment_blog_views', { post_id: postId });
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}
