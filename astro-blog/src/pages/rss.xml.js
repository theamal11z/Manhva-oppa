import rss from '@astrojs/rss';
import { getTitle, getDescription } from '../consts';
import { getAllBlogPosts } from '../lib/blogDataService.js';

export async function GET(context) {
	// Get dynamic site info
	const title = await getTitle();
	const description = await getDescription();
	
	// Fetch all blog posts from Supabase
	const { posts } = await getAllBlogPosts({ limit: 100 });
	
	// Create RSS feed items from the real data
	return rss({
		title: title,
		description: description,
		site: context.site,
		items: posts.map((post) => ({
			title: post.title,
			description: post.seo_description,
			pubDate: new Date(post.published_date),
			link: `/blog/${post.slug}/`,
			categories: post.seo_keywords?.split(',').map(keyword => keyword.trim()) || [],
			customData: post.manga ? `
				<manga:info xmlns:manga="https://blog.manhva-oppa.com/ns">
					<manga:title>${post.manga.title}</manga:title>
					${post.manga.author ? `<manga:author>${post.manga.author}</manga:author>` : ''}
					${post.manga.published_year ? `<manga:year>${post.manga.published_year}</manga:year>` : ''}
				</manga:info>
			` : '',
		})),
		customData: `
			<language>en-us</language>
			<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
			<generator>Astro</generator>
			<copyright>© ${new Date().getFullYear()} ${title}</copyright>
		`,
		xmlNs: {
			atom: 'http://www.w3.org/2005/Atom',
			dc: 'http://purl.org/dc/elements/1.1/',
			content: 'http://purl.org/rss/1.0/modules/content/',
			manga: 'https://blog.manhva-oppa.com/ns'
		}
	});
}
