import { supabase } from './supabaseClient.js';

/**
 * Fetches all blog posts with optional filtering
 * @param {Object} options - Options for fetching posts
 * @param {number} options.limit - Maximum number of posts to fetch
 * @param {number} options.offset - Number of posts to skip
 * @param {string} options.orderBy - Field to order by
 * @param {boolean} options.ascending - Whether to order in ascending order
 * @param {Array} options.tags - Array of tags to filter by
 * @returns {Promise<Array>} - Blog posts
 */
export async function getAllBlogPosts({ 
  limit = 20, 
  offset = 0, 
  orderBy = 'published_date', 
  ascending = false,
  tags = [] 
} = {}) {
  try {
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        manga:manga_entries(id, title, cover_image)
      `)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);
    
    // Apply tag filter if specified (simplified for now)
    if (tags.length > 0 && tags[0]) {
      // This is a simplified approach. In a real implementation, you might use a tags join table
      query = query.ilike('seo_keywords', `%${tags[0]}%`); 
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

/**
 * Search for blog posts with filters
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum number of posts to fetch
 * @param {Array} options.tags - Array of tags to filter by
 * @returns {Promise<Object>} - Object containing matching posts and search metadata
 */
export async function searchBlogPosts(query, { limit = 20, tags = [] } = {}) {
  try {
    let queryBuilder = supabase
      .from('blog_posts')
      .select(`
        *,
        manga:manga_entries(id, title, cover_image)
      `);
    
    // Apply search filter if query exists
    if (query && query.trim() !== '') {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,content.ilike.%${query}%,seo_description.ilike.%${query}%,seo_keywords.ilike.%${query}%`
      );
    }
    
    // Apply tag filters
    if (tags.length > 0 && tags[0]) {
      // This is a simplified approach
      queryBuilder = queryBuilder.ilike('seo_keywords', `%${tags[0]}%`);
    }
    
    // Apply sorting
    queryBuilder = queryBuilder.order('published_date', { ascending: false });
    queryBuilder = queryBuilder.limit(limit);
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      console.error('Error searching blog posts:', error);
      return { posts: [], relatedTags: [] };
    }
    
    // Extract related tags from search results
    const relatedTags = extractRelatedTags(data || []);
    
    return { 
      posts: data || [],
      relatedTags
    };
  } catch (error) {
    console.error('Error searching blog posts:', error);
    return { posts: [], relatedTags: [] };
  }
}

/**
 * Get popular tags from blog posts
 * @param {number} limit - Maximum number of tags to fetch
 * @returns {Promise<Array>} - Popular tags with post counts
 */
export async function getPopularTags(limit = 10) {
  try {
    // Fetch blog posts to extract keywords/tags
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('seo_keywords')
      .not('seo_keywords', 'is', null);
    
    if (error) {
      console.error('Error fetching blog keywords:', error);
      return [];
    }
    
    // Extract and count tags from keywords
    const tagCounts = {};
    posts.forEach(post => {
      if (!post.seo_keywords) return;
      
      const tags = post.seo_keywords.split(',').map(tag => tag.trim()).filter(Boolean);
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    // Convert to array and sort by popularity
    const popularTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return popularTags;
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    return [];
  }
}

/**
 * Extract related tags from blog post results
 * @param {Array} postResults - Blog post search results
 * @returns {Array} - Related tags sorted by frequency
 */
function extractRelatedTags(postResults) {
  if (!postResults || postResults.length === 0) return [];
  
  // Extract all tags from blog post results
  const tagOccurrences = {};
  postResults.forEach(post => {
    if (!post.seo_keywords) return;
    
    const tags = post.seo_keywords.split(',').map(tag => tag.trim()).filter(Boolean);
    tags.forEach(tag => {
      if (!tagOccurrences[tag]) {
        tagOccurrences[tag] = {
          name: tag,
          count: 0
        };
      }
      
      tagOccurrences[tag].count++;
    });
  });
  
  // Convert to array and sort by frequency
  return Object.values(tagOccurrences)
    .sort((a, b) => b.count - a.count);
}
