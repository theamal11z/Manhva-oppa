import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Edit, Trash2, Plus, Search, RefreshCw, 
  CheckCircle, XCircle, Eye, BookOpen
} from 'lucide-react';
import BlogPostEditor from './BlogPostEditor';

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
  featured_image?: string;
  views?: number;
  manga?: {
    title: string;
  };
  status: 'published' | 'draft';
  created_at: string;
}

const ITEMS_PER_PAGE = 20;

const BlogManager: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [viewingPost, setViewingPost] = useState<BlogPost | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const lastPostElementRef = useCallback((node: HTMLElement | null) => {
    if (loadingRef.current || loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        // Set loading flag to prevent multiple calls
        loadingRef.current = true;
        
        // Clear any existing timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        
        // Debounce the loadMore call
        timerRef.current = setTimeout(() => {
          loadMorePosts();
          // Reset loading flag after a delay to prevent rapid consecutive calls
          setTimeout(() => {
            loadingRef.current = false;
          }, 1000);
        }, 300);
      }
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px 500px 0px' // Load earlier before reaching the end 
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // Function to fetch blog posts with proper throttling
  const fetchBlogPosts = async (refresh = false) => {
    // Prevent excessive fetching by requiring at least 10 seconds between fetches
    // unless refresh=true is specified
    const now = Date.now();
    if (!refresh && lastFetchTime && now - lastFetchTime < 10000) {
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      loadingRef.current = true;
      
      if (refresh) {
        setPage(0);
      } else {
        setLoadingMore(true);
      }
      
      const newPage = refresh ? 0 : page;
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          manga:manga_id (
            title
          )
        `)
        .order('published_date', { ascending: false })
        .range(newPage * ITEMS_PER_PAGE, (newPage + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      
      const newPosts = data || [];
      
      // If we received fewer items than requested, there are no more items
      setHasMore(newPosts.length === ITEMS_PER_PAGE);
      
      if (refresh) {
        setBlogPosts(newPosts);
      } else {
        setBlogPosts(prev => [...prev, ...newPosts]);
      }
      
      if (!refresh) {
        setPage(prev => prev + 1);
      }
      setLastFetchTime(now);
    } catch (err: any) {
      console.error('Error fetching blog posts:', err);
      setError(err.message || 'Failed to load blog posts');
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setLoadingMore(false);
    }
  };
  
  const loadMorePosts = () => {
    if (!loadingMore && hasMore && !loadingRef.current) {
      fetchBlogPosts(false);
    }
  };

  useEffect(() => {
    fetchBlogPosts(true);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('BlogManager: Tab became visible, refreshing data');
        fetchBlogPosts(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleAddNew = () => {
    setEditingPost(null);
    setShowForm(true);
  };
  
  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleViewDetails = (post: BlogPost) => {
    setViewingPost(post);
  };

  const handleDeleteConfirm = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove from local state
      setBlogPosts(prev => prev.filter(post => post.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting blog post:', err);
      setError(err.message || 'Failed to delete blog post');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredPosts = blogPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const onFormComplete = () => {
    setShowForm(false);
    fetchBlogPosts(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not published';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="manga-panel-outer relative h-full overflow-hidden">
      {showForm ? (
        <BlogPostEditor 
          blogPost={editingPost} 
          onClose={() => setShowForm(false)} 
          onSaved={onFormComplete} 
        />
      ) : viewingPost ? (
        <div className="manga-panel p-6 bg-black/60 h-full overflow-y-auto border border-white/20 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold manga-title">{viewingPost.title}</h2>
            <button 
              onClick={() => setViewingPost(null)} 
              className="p-2 hover:text-red-500 transition-colors"
              aria-label="Close"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Blog Details</h3>
              <div className="space-y-2">
                <p><span className="text-gray-400">Slug:</span> {viewingPost.slug}</p>
                <p><span className="text-gray-400">Status:</span> {viewingPost.status}</p>
                <p><span className="text-gray-400">Published:</span> {formatDate(viewingPost.published_date)}</p>
                <p><span className="text-gray-400">Views:</span> {viewingPost.views || 0}</p>
                {viewingPost.manga && (
                  <p><span className="text-gray-400">Associated Manga:</span> {viewingPost.manga.title}</p>
                )}
              </div>
            </div>
            
            {viewingPost.featured_image && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Featured Image</h3>
                <img 
                  src={viewingPost.featured_image} 
                  alt={viewingPost.title} 
                  className="max-h-48 object-contain"
                />
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">SEO</h3>
            <div className="space-y-2">
              <p><span className="text-gray-400">Description:</span> {viewingPost.seo_description}</p>
              <p><span className="text-gray-400">Keywords:</span> {viewingPost.seo_keywords}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Content</h3>
            <div className="bg-black/30 p-4 border border-white/10 rounded">
              <div dangerouslySetInnerHTML={{ __html: viewingPost.content }} />
            </div>
          </div>
          
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-white/10">
            <button
              onClick={() => setViewingPost(null)}
              className="manga-border px-4 py-2 hover:text-red-500 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Close
            </button>
            <button
              onClick={() => {
                setEditingPost(viewingPost);
                setViewingPost(null);
                setShowForm(true);
              }}
              className="bg-red-500/20 hover:bg-red-500/30 manga-border px-4 py-2 flex items-center gap-2 transition-all"
            >
              <Edit className="w-5 h-5" />
              Edit Post
            </button>
          </div>
        </div>
      ) : (
        <div className="h-full overflow-y-auto p-4">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold manga-title">Blog Posts</h2>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => fetchBlogPosts(true)}
                  className="manga-border px-4 py-2 hover:text-blue-500 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </button>
                
                <button 
                  onClick={handleAddNew}
                  className="manga-border px-4 py-2 bg-red-500/20 hover:bg-red-500/30 hover:text-white transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add New
                </button>
              </div>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-md pl-10 py-2 focus:manga-border focus:outline-none"
              />
            </div>
          </div>
          
          {loading && blogPosts.length === 0 ? (
            <div className="manga-panel p-6 bg-black/30 text-center">
              <p className="manga-title text-xl mb-4">Loading Blog Posts...</p>
              <RefreshCw className="w-8 h-8 mx-auto animate-spin" />
            </div>
          ) : error ? (
            <div className="manga-panel p-6 bg-black/30 text-center">
              <p className="manga-title text-xl text-red-500 mb-4">Error Loading Blog Posts</p>
              <p className="mb-6">{error}</p>
              <button 
                onClick={() => fetchBlogPosts(true)}
                className="manga-border px-4 py-2 hover:text-blue-500"
              >
                Try Again
              </button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="manga-panel p-8 bg-black/30 text-center">
              {searchTerm ? (
                <>
                  <p className="manga-title text-xl mb-4">No blog posts match your search</p>
                  <p className="mb-6">Try a different search term or clear the search.</p>
                </>
              ) : (
                <>
                  <p className="manga-title text-xl mb-4">No blog posts found</p>
                  <p className="mb-6">Start by adding some blog posts to your library.</p>
                  <button 
                    onClick={handleAddNew} 
                    className="manga-border px-4 py-2 hover:text-red-500"
                  >
                    <Plus className="w-5 h-5 inline-block mr-2" />
                    Add Blog Post
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="manga-panel bg-black/20 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/40">
                    <th className="p-4">Title</th>
                    <th className="p-4 hidden sm:table-cell">Manga</th>
                    <th className="p-4 hidden md:table-cell">Status</th>
                    <th className="p-4 hidden md:table-cell">Published</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post, index) => (
                    <tr 
                      key={post.id} 
                      className="border-t border-white/10 hover:bg-black/30 transition-colors relative"
                      ref={index === filteredPosts.length - 1 ? lastPostElementRef : null}
                    >
                      <td className="p-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-gray-800 shrink-0 overflow-hidden">
                            {post.featured_image ? (
                              <img 
                                src={post.featured_image} 
                                alt={post.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-700">
                                <BookOpen className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white">{post.title}</div>
                            <div className="text-gray-400 text-sm truncate">{post.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">{post.manga?.title || 'None'}</td>
                      <td className="p-4 hidden md:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === 'published' 
                            ? 'bg-green-900/30 text-green-400 border border-green-600'
                            : 'bg-yellow-900/30 text-yellow-400 border border-yellow-600'
                        }`}>
                          {post.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell">{formatDate(post.published_date)}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(post)}
                            className="p-2 hover:text-blue-500 transition-colors"
                            title="Edit post"
                            type="button"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteConfirm(post.id)}
                            className="p-2 hover:text-red-500 transition-colors"
                            title="Delete post"
                            type="button"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleViewDetails(post)}
                            className="p-2 hover:text-green-500 transition-colors hidden sm:inline-block"
                            title="View post"
                            type="button"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {deleteConfirm === post.id && (
                          <div className="absolute right-4 top-full mt-2 p-4 bg-gray-900 manga-border z-50">
                            <p className="mb-2 text-left">Delete <strong>{post.title}</strong>?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(post.id)}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded flex items-center gap-1 text-sm"
                                disabled={deleteLoading}
                                type="button"
                              >
                                {deleteLoading ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded flex items-center gap-1 text-sm"
                                type="button"
                              >
                                <XCircle className="w-4 h-4" />
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loadingMore && (
                <div className="p-4 text-center">
                  <div className="inline-block manga-border px-4 py-2">
                    <RefreshCw className="w-5 h-5 inline-block mr-2 animate-spin" />
                    Loading more...
                  </div>
                </div>
              )}
              
              {!hasMore && filteredPosts.length > 10 && (
                <div className="p-4 text-center text-gray-400">
                  You've reached the end of the list
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogManager;
