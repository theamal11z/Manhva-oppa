import OpenAI from 'openai';

// Initialize the OpenAI client
// Note: You should store this in an environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let openai;
try {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

/**
 * Generate an SEO-optimized blog post about a manga
 * @param {Object} mangaData - Data about the manga
 * @returns {Promise<Object>} - Generated blog content
 */
export async function generateMangaBlogPost(mangaData) {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }
  
  try {
    // Construct a prompt that will generate an SEO-friendly blog post
    const prompt = `
    Generate an SEO-optimized blog post about the manga/manhwa titled "${mangaData.title}". 
    
    Use the following information:
    - Title: ${mangaData.title}
    - Description: ${mangaData.description || 'N/A'}
    - Genres: ${mangaData.genres?.map(g => g.name).join(', ') || 'N/A'}
    - Author: ${mangaData.author || 'N/A'}
    - Status: ${mangaData.status || 'N/A'}
    - Published Year: ${mangaData.published_year || 'N/A'}
    
    The blog post should:
    1. Have an engaging title that includes the manga name and main genre
    2. Include an SEO-friendly introduction with keywords related to manga, manhwa, and the specific genres
    3. Provide a detailed but concise overview of the manga's plot without major spoilers
    4. Discuss the art style, character development, and storytelling
    5. Compare it briefly to similar works in the genre
    6. Include a section about why readers might enjoy this manga
    7. End with a call-to-action to read the manga
    8. Format the post with proper headings (H2, H3), paragraphs, and bullet points where appropriate
    
    The total length should be around 800-1200 words.
    
    Return the content in markdown format with proper headings, formatting, and structure.
    `;

    // Generate content using GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Use GPT-4 for high-quality content
      messages: [
        {
          role: "system", 
          content: "You are an expert content writer specializing in manga and anime reviews. You create engaging, SEO-optimized blog posts that rank well in search engines."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7, // Balance between creativity and consistency
      max_tokens: 2000, // Allow for a substantial blog post
    });

    // Extract the generated content
    const generatedContent = completion.choices[0].message.content;
    
    // Generate a slug for the blog post
    const slug = mangaData.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-');
    
    // Create a blog post object
    const blogPost = {
      title: `${mangaData.title} - An In-Depth Look at This ${mangaData.genres?.[0]?.name || 'Amazing'} Manga`,
      slug: slug,
      content: generatedContent,
      manga_id: mangaData.id,
      published_date: new Date().toISOString(),
      seo_description: `Discover everything about ${mangaData.title}, a ${mangaData.genres?.[0]?.name || ''} manga that's captivating readers worldwide. Read our comprehensive review and analysis.`,
      seo_keywords: `${mangaData.title}, manga, manhwa, ${mangaData.genres?.map(g => g.name).join(', ')}`,
      featured_image: mangaData.cover_image || null
    };
    
    return blogPost;
  } catch (error) {
    console.error('Error generating blog post:', error);
    throw error;
  }
}
