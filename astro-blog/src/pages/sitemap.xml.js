import { getAllBlogPosts } from '../lib/blogDataService.js';

export async function get() {
  // Base URL of your site
  const site = 'https://blog.manhva-oppa.com';
  
  // Get all blog posts
  const { posts } = await getAllBlogPosts({ limit: 1000 });
  
  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>${site}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${site}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${site}/blog/archive</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${site}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  ${posts.map(post => {
    const lastmod = post.updated_at ? new Date(post.updated_at).toISOString() : new Date(post.published_date).toISOString();
    
    return `
  <url>
    <loc>${site}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    ${post.featured_image || post.manga?.cover_image ? `
    <image:image>
      <image:loc>${post.featured_image || post.manga?.cover_image}</image:loc>
      <image:title>${escapeXml(post.title)}</image:title>
      <image:caption>${escapeXml(post.seo_description || '')}</image:caption>
    </image:image>` : ''}
  </url>`;
  }).join('')}
</urlset>`;

  return {
    body: xml,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600'
    }
  };
}

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
