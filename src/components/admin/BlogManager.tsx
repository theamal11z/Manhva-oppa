import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Edit3, Trash2, Plus, Search, RefreshCw, Eye, XCircle } from 'lucide-react';

// Type definitions
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  manga_id: string | null;
  seo_description: string;
  seo_keywords: string;
  published_date: string;
  manga?: {
    title: string;
  };
  status: 'published' | 'draft';
  created_at: string;
}

interface MangaTitle {
  id: string;
  title: string;
}

const BlogManager: React.FC = () => {
  // State management
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [mangaTitles, setMangaTitles] = useState<MangaTitle[]>([]);
  const [selectedMangaFilter, setSelectedMangaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showEditorModal, setShowEditorModal] = useState<boolean>(false);
  const [currentBlogPost, setCurrentBlogPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch blog posts
  const fetchBlogPosts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          manga:manga_id (
            title
          )
        `)
        .order('published_date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setBlogPosts(data || []);
      setFilteredPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching blog posts:', error);
      setError('Failed to load blog posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch manga titles for filter
  const fetchMangaTitles = async () => {
    try {
      const { data, error } = await supabase
        .from('manga_entries')
        .select('id, title')
        .order('title');
      
      if (error) {
        throw error;
      }
      
      setMangaTitles(data || []);
    } catch (error: any) {
      console.error('Error fetching manga titles:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchBlogPosts();
    fetchMangaTitles();
  }, []);

  // Filter posts when filters change
  useEffect(() => {
    let result = blogPosts;
    
    // Apply search term filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(lowerSearchTerm) || 
        post.content.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply manga filter
    if (selectedMangaFilter !== 'all') {
      result = result.filter(post => post.manga_id === selectedMangaFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(post => post.status === statusFilter);
    }
    
    setFilteredPosts(result);
  }, [searchTerm, selectedMangaFilter, statusFilter, blogPosts]);

  // Create new blog post
  const handleCreatePost = () => {
    setCurrentBlogPost(null); // Clear any selected post
    setShowEditorModal(true);
  };

  // Edit existing blog post
  const handleEditPost = (post: BlogPost) => {
    setCurrentBlogPost(post);
    setShowEditorModal(true);
  };

  // Delete blog post
  const handleDeletePost = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Refresh blog posts
        fetchBlogPosts();
      } catch (error: any) {
        console.error('Error deleting blog post:', error);
        setError('Failed to delete blog post. Please try again.');
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="p-4">
      <div className="manga-panel p-6 bg-black/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold manga-title">Blog Posts</h1>
          
          <button
            onClick={handleCreatePost}
            className="manga-border px-4 py-2 bg-red-900/30 hover:bg-red-800/50 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Create New Post
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded mb-4 flex items-center">
            <XCircle className="mr-2" size={18} />
            {error}
          </div>
        )}
        
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search blog posts..."
              className="pl-10 pr-4 py-2 w-full bg-gray-900/50 border border-gray-700 rounded focus:ring-red-500 focus:border-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded focus:ring-red-500 focus:border-red-500"
            value={selectedMangaFilter}
            onChange={(e) => setSelectedMangaFilter(e.target.value)}
          >
            <option value="all">All Manga</option>
            {mangaTitles.map((manga) => (
              <option key={manga.id} value={manga.id}>
                {manga.title}
              </option>
            ))}
          </select>
          
          <select
            className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded focus:ring-red-500 focus:border-red-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        
        {/* Blog posts table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Manga
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Published Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Loading blog posts...
                    </div>
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                    No blog posts found. Create your first post!
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {truncateText(post.seo_description || '', 80)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.manga?.title || 'No manga'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.status === 'published' 
                          ? 'bg-green-900/30 text-green-400 border border-green-600'
                          : 'bg-yellow-900/30 text-yellow-400 border border-yellow-600'
                      }`}>
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {post.published_date ? formatDate(post.published_date) : 'Not published'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditPost(post)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <a 
                          href={`/blog/${post.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white transition-colors"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* "Load more" button could go here if pagination is needed */}
        
        {/* Editor Modal will be integrated here once we build it */}
        {showEditorModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4 manga-title">
                {currentBlogPost ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h2>
              
              {/* Blog editor form will be implemented in a later step */}
              <div className="mt-6 text-center text-gray-400">
                <p>Blog editor will be implemented in the next step</p>
                <p className="mt-4">For now, you can:</p>
                <div className="flex justify-center space-x-4 mt-4">
                  <button
                    onClick={() => setShowEditorModal(false)}
                    className="manga-border px-4 py-2 hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManager;
