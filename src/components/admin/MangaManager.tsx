import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Edit, Trash2, Search, RefreshCw, 
  CheckCircle, XCircle, Eye, BookOpen
} from 'lucide-react';
import { getMangaList, deleteMangaEntry } from '../../lib/supabaseClient';
import MangaView from './MangaView';
import MangaForm from './MangaForm';

type Manga = {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  author?: string;
  artist?: string;
  status?: string;
  type?: string;
  year?: number;
  created_at: string;
  genres?: any[];
  tags?: any[];
};

const ITEMS_PER_PAGE = 20;

const MangaManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingManga, setEditingManga] = useState<Manga | null>(null);
  const [viewingManga, setViewingManga] = useState<Manga | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const lastMangaElementRef = useCallback((node: HTMLElement | null) => {
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
          loadMoreManga();
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

  // Function to fetch manga list with proper throttling
  const fetchMangaList = async (refresh = false) => {
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
      const response = await getMangaList(ITEMS_PER_PAGE, newPage * ITEMS_PER_PAGE);

      if (response.error) throw new Error(response.error.message);
      
      const newManga = response.data || [];
      
      // If we received fewer items than requested, there are no more items
      setHasMore(newManga.length === ITEMS_PER_PAGE);
      
      if (refresh) {
        setMangaList(newManga);
      } else {
        setMangaList(prev => [...prev, ...newManga]);
      }
      
      if (!refresh) {
        setPage(prev => prev + 1);
      }
      setLastFetchTime(now);
    } catch (err: any) {
      console.error('Error fetching manga:', err);
      setError(err.message || 'Failed to load manga');
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setLoadingMore(false);
    }
  };
  
  const loadMoreManga = () => {
    if (!loadingMore && hasMore && !loadingRef.current) {
      fetchMangaList(false);
    }
  };

  useEffect(() => {
    fetchMangaList(true);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('MangaManager: Tab became visible, refreshing data');
        fetchMangaList(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleAddNew = () => {
    setEditingManga(null);
    setShowForm(true);
  };
  
  const handleEdit = (manga: Manga) => {
    setEditingManga(manga);
    setShowForm(true);
  };

  const handleViewDetails = (manga: Manga) => {
    setViewingManga(manga);
  };

  const handleDeleteConfirm = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(true);
      const response = await deleteMangaEntry(id);
      
      if (response.error) throw new Error(response.error.message);
      
      // Remove from local state
      setMangaList(prev => prev.filter(manga => manga.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting manga:', err);
      setError(err.message || 'Failed to delete manga');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredManga = mangaList.filter(manga => 
    manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (manga.author && manga.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const onFormComplete = () => {
    setShowForm(false);
    fetchMangaList(true);
  };

  return (
    <div className="manga-panel-outer relative h-full overflow-hidden">
      {showForm ? (
        <MangaForm manga={editingManga} onComplete={onFormComplete} onCancel={() => setShowForm(false)} />
      ) : viewingManga ? (
        <MangaView manga={viewingManga} onClose={() => setViewingManga(null)} />
      ) : (
        <div className="h-full overflow-y-auto p-4">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold manga-title">Manga Library</h2>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => fetchMangaList(true)}
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
                placeholder="Search manga..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-md pl-10 py-2 focus:manga-border focus:outline-none"
              />
            </div>
          </div>
          
          {loading && mangaList.length === 0 ? (
            <div className="manga-panel p-6 bg-black/30 text-center">
              <p className="manga-title text-xl mb-4">Loading Manga...</p>
              <RefreshCw className="w-8 h-8 mx-auto animate-spin" />
            </div>
          ) : error ? (
            <div className="manga-panel p-6 bg-black/30 text-center">
              <p className="manga-title text-xl text-red-500 mb-4">Error Loading Manga</p>
              <p className="mb-6">{error}</p>
              <button 
                onClick={() => fetchMangaList(true)}
                className="manga-border px-4 py-2 hover:text-blue-500"
              >
                Try Again
              </button>
            </div>
          ) : filteredManga.length === 0 ? (
            <div className="manga-panel p-8 bg-black/30 text-center">
              {searchTerm ? (
                <>
                  <p className="manga-title text-xl mb-4">No manga match your search</p>
                  <p className="mb-6">Try a different search term or clear the search.</p>
                </>
              ) : (
                <>
                  <p className="manga-title text-xl mb-4">No manga found</p>
                  <p className="mb-6">Start by adding some manga entries to your library.</p>
                  <button 
                    onClick={handleAddNew} 
                    className="manga-border px-4 py-2 hover:text-red-500"
                  >
                    <Plus className="w-5 h-5 inline-block mr-2" />
                    Add Manga
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
                    <th className="p-4 hidden sm:table-cell">Type</th>
                    <th className="p-4 hidden md:table-cell">Status</th>
                    <th className="p-4 hidden md:table-cell">Added</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManga.map((manga, index) => (
                    <tr 
                      key={manga.id} 
                      className="border-t border-white/10 hover:bg-black/30 transition-colors relative"
                      ref={index === filteredManga.length - 1 ? lastMangaElementRef : null}
                    >
                      <td className="p-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-gray-800 shrink-0 overflow-hidden">
                            {manga.cover_image ? (
                              <img 
                                src={manga.cover_image} 
                                alt={manga.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-700">
                                <BookOpen className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white">{manga.title}</div>
                            <div className="text-gray-400 text-sm truncate">{manga.author || 'Unknown author'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">{manga.type || 'N/A'}</td>
                      <td className="p-4 hidden md:table-cell">{manga.status || 'N/A'}</td>
                      <td className="p-4 hidden md:table-cell">{new Date(manga.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(manga)}
                            className="p-2 hover:text-blue-500 transition-colors"
                            title="Edit manga"
                            type="button"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteConfirm(manga.id)}
                            className="p-2 hover:text-red-500 transition-colors"
                            title="Delete manga"
                            type="button"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleViewDetails(manga)}
                            className="p-2 hover:text-green-500 transition-colors hidden sm:inline-block"
                            title="View manga"
                            type="button"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {deleteConfirm === manga.id && (
                          <div className="absolute right-4 top-full mt-2 p-4 bg-gray-900 manga-border z-50">
                            <p className="mb-2 text-left">Delete <strong>{manga.title}</strong>?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(manga.id)}
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
              
              {!hasMore && filteredManga.length > 10 && (
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

export default MangaManager;
