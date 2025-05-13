import { getAllBlogPosts } from '../lib/blogDataService.js';

export async function get() {
  // Base URL of your site
  const site = import.meta.env.SITE || 'https://blogsmanhwa-oppa.vercel.app';
  
  // Get all blog posts and extract manga data
  const { posts } = await getAllBlogPosts({ limit: 1000 });
  
  // Extract unique manga entries for dedicated pages
  const mangaEntries = [];
  const genreSet = new Set();
  
  // Process posts to extract manga and genres
  posts.forEach(post => {
    if (post.manga && !mangaEntries.some(m => m.id === post.manga.id)) {
      mangaEntries.push(post.manga);
      
      // Extract genres if available
      if (post.manga.genres) {
        post.manga.genres.forEach(genre => {
          if (genre.name) {
            genreSet.add(genre.name.toLowerCase());
          }
        });
      }
    }
  });
  
  // Convert genre set to array
  const genres = Array.from(genreSet);
  
  // Current timestamp for lastmod
  const currentDate = new Date().toISOString();
  
  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <!-- Main pages -->
  <url>
    <loc>${site}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${site}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${site}/discover</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${site}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Genre Pages -->
  ${genres.map(genre => `
  <url>
    <loc>${site}/genres/${encodeURIComponent(genre.toLowerCase().replace(/ /g, '-'))}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  
  <!-- Blog Posts -->
  ${posts.map(post => {
    const lastmod = post.updated_at ? new Date(post.updated_at).toISOString() : new Date(post.published_date).toISOString();
    
    return `
  <url>
    <loc>${site}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    ${post.featured_image || post.manga?.cover_image ? `
    <image:image>
      <image:loc>${post.featured_image || post.manga?.cover_image}</image:loc>
      <image:title>${escapeXml(post.title)}</image:title>
      <image:caption>${escapeXml(post.seo_description || '')}</image:caption>
    </image:image>` : ''}
  </url>`;
  }).join('')}
  
  <!-- Manga Pages -->
  ${mangaEntries.map(manga => {
    const mangaSlug = manga.slug || manga.id.toString();
    return `
  <url>
    <loc>${site}/manga/${mangaSlug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    ${manga.cover_image ? `
    <image:image>
      <image:loc>${manga.cover_image}</image:loc>
      <image:title>${escapeXml(manga.title)}</image:title>
      <image:caption>${escapeXml(manga.description || manga.title)}</image:caption>
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
