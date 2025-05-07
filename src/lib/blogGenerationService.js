import { supabase } from './supabaseClient';
import { getBlogPostByMangaId, autoGenerateBlogPost } from '../../astro-blog/src/lib/blogService';

/**
 * Initialize the blog generation service
 * Sets up listeners for new manga entries to automatically generate blog posts if enabled
 */
export function initBlogGenerationService() {
  // Check if auto-generation is enabled
  checkAutoGenerationEnabled().then(enabled => {
    if (enabled) {
      // Set up real-time listener for new manga entries
      setupMangaListener();
    }
  });
  
  // Listen for changes to the auto-generation setting
  setupSettingsListener();
}

/**
 * Check if auto-generation is enabled in site settings
 */
async function checkAutoGenerationEnabled() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 'singleton')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking auto-generation setting:', error);
      return false;
    }
    
    return data?.settings?.autoGenerateBlogPosts || false;
  } catch (error) {
    console.error('Error checking auto-generation setting:', error);
    return false;
  }
}

let mangaSubscription = null;

/**
 * Set up a real-time listener for new manga entries
 */
function setupMangaListener() {
  // Clean up existing subscription if any
  if (mangaSubscription) {
    mangaSubscription.unsubscribe();
  }
  
  // Set up a new subscription
  mangaSubscription = supabase
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
          const mangaId = payload.new.id;
          console.log(`New manga entry detected: ${mangaId}`);
          
          // Check if a blog post already exists for this manga
          const existingPost = await getBlogPostByMangaId(mangaId);
          
          if (existingPost) {
            console.log(`Blog post already exists for manga ${mangaId}`);
            return;
          }
          
          // Auto-generate a blog post for the new manga
          console.log(`Generating blog post for manga ${mangaId}...`);
          await autoGenerateBlogPost(mangaId);
          console.log(`Blog post generated for manga ${mangaId}`);
        } catch (error) {
          console.error(`Failed to generate blog post for new manga:`, error);
        }
      }
    )
    .subscribe();
}

/**
 * Listen for changes to the auto-generation setting
 */
function setupSettingsListener() {
  supabase
    .channel('site_settings_updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'site_settings',
        filter: 'id=eq.singleton'
      },
      async (payload) => {
        if (payload.new) {
          const enabled = payload.new.settings?.autoGenerateBlogPosts || false;
          
          if (enabled && !mangaSubscription) {
            console.log('Auto-generation enabled, setting up listener');
            setupMangaListener();
          } else if (!enabled && mangaSubscription) {
            console.log('Auto-generation disabled, removing listener');
            mangaSubscription.unsubscribe();
            mangaSubscription = null;
          }
        }
      }
    )
    .subscribe();
}

/**
 * Generate blog posts for existing manga entries that don't have blog posts yet
 * @returns {Promise<{generated: number, failed: number, total: number}>} - Count of generated and failed blog posts
 */
export async function generateMissingBlogPosts() {
  let generated = 0;
  let failed = 0;
  
  try {
    // Get all manga entries that don't have a blog post
    const { data: mangaEntries, error: mangaError } = await supabase
      .from('manga_entries')
      .select('id, title')
      .not('id', 'in', supabase.from('blog_posts').select('manga_id'));
    
    if (mangaError) throw mangaError;
    
    const total = mangaEntries.length;
    
    if (total === 0) {
      return { generated, failed, total };
    }
    
    // Generate blog posts one by one
    for (const manga of mangaEntries) {
      try {
        await autoGenerateBlogPost(manga.id);
        generated++;
      } catch (error) {
        console.error(`Failed to generate blog post for manga ${manga.id}:`, error);
        failed++;
      }
    }
    
    return { generated, failed, total };
  } catch (error) {
    console.error('Error generating missing blog posts:', error);
    throw error;
  }
}
