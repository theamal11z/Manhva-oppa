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
 * Fetch all blog posts from Supabase, ignoring the search query.
 * Filtering will be done on the frontend.
 * @param {string} query - Search query (ignored)
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum number of posts to fetch
 * @returns {Promise<Object>} - Object containing all blog posts
 */
export async function searchBlogPosts(query, options = {}) {
  const { limit = 1000 } = options; // Increase limit to fetch more posts if needed

  try {
    let queryBuilder = supabase
      .from('blog_posts')
      .select(`
        *,
        manga:manga_entries(id, title, cover_image)
      `)
      .order('published_date', { ascending: false })
      .limit(limit);

    const { data, error } = await queryBuilder;
    if (error) {
      console.error('Error fetching blog posts:', error);
      return { posts: [], relatedTerms: [] };
    }
    return { posts: data || [], relatedTerms: [] };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return { posts: [], relatedTerms: [] };
  }
}

/**
 * Generate related search terms based on search results
 * @param {Array} results - Search results
 * @param {string} originalQuery - Original search query
 * @returns {Array} - Related search terms
 */
function generateRelatedTerms(results, originalQuery) {
  if (!results || results.length === 0 || !originalQuery) return [];
  
  // Extract keywords from search results
  const allKeywords = results
    .flatMap(post => {
      // Get keywords from post
      const postKeywords = post.seo_keywords ? post.seo_keywords.split(',').map(k => k.trim()) : [];
      
      // Get genre names if available
      const genreNames = post.manga?.genres
        ? post.manga.genres.map(g => g.genres?.name).filter(Boolean)
        : [];
      
      return [...postKeywords, ...genreNames];
    })
    .filter(Boolean);
  
  // Count keyword occurrences
  const keywordCounts = allKeywords.reduce((acc, keyword) => {
    // Skip keywords that are too similar to the original query
    if (keyword.toLowerCase() === originalQuery.toLowerCase()) return acc;
    
    acc[keyword] = (acc[keyword] || 0) + 1;
    return acc;
  }, {});
  
  // Sort by frequency and return top 5
  return Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([term]) => term);
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
