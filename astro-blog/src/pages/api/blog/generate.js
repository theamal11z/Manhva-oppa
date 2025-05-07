import { autoGenerateBlogPost, getBlogPostByMangaId } from '../../../lib/blogService.js';
import { supabase } from '../../../lib/supabaseClient.js';

// This endpoint handles generating blog posts for manga
export async function post({ request }) {
  try {
    // Verify authentication and admin status
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    if (adminError || !adminData) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the request body
    const data = await request.json();
    const { mangaId, force = false } = data;
    
    if (!mangaId) {
      return new Response(JSON.stringify({ error: 'Manga ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if a blog post already exists for this manga
    const existingPost = await getBlogPostByMangaId(mangaId);
    
    if (existingPost && !force) {
      return new Response(JSON.stringify({ 
        error: 'Blog post already exists for this manga',
        blogPostId: existingPost.id
      }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete existing blog post if force is true
    if (existingPost && force) {
      await supabase
        .from('blog_posts')
        .delete()
        .eq('id', existingPost.id);
    }
    
    // Generate the blog post
    const blogPost = await autoGenerateBlogPost(mangaId);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Blog post generated successfully',
      blogPostId: blogPost.id,
      blogPostSlug: blogPost.slug
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error generating blog post:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to generate blog post',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// This endpoint handles checking the status of a manga's blog post
export async function get({ request, url }) {
  try {
    // Get the manga ID from query parameters
    const mangaId = url.searchParams.get('mangaId');
    
    if (!mangaId) {
      return new Response(JSON.stringify({ error: 'Manga ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if a blog post exists for this manga
    const blogPost = await getBlogPostByMangaId(mangaId);
    
    if (!blogPost) {
      return new Response(JSON.stringify({ 
        exists: false,
        message: 'No blog post found for this manga'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      exists: true,
      blogPostId: blogPost.id,
      blogPostSlug: blogPost.slug,
      title: blogPost.title,
      publishedDate: blogPost.published_date
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error checking blog post status:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to check blog post status',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
