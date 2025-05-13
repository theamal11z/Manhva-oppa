import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Heart,
  AlertCircle,
  Star,
  Filter,
  Bookmark,
  X,
  Check,
  Trash2,
  Pause,
  Play,
  List
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { 
  getUserReadingList, 
  getUserFavorites, 
  removeFromReadingList, 
  removeFromFavorites,
  updateReadingStatus,
  logReadingHistory,
  logAllChaptersRead,
  supabase 
} from '../lib/supabaseClient';

type ReadingStatus = 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';

type MangaItem = {
  id: string;
  title: string;
  coverImage: string;
  status: ReadingStatus;
  progress: number;
  current_chapter?: number;
  total_chapters?: number;
  rating?: number;
  lastUpdated: string;
  genres: string[];
  manga_id?: string;
};



const MyList: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reading' | 'favorites'>('reading');
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus | 'all'>('all');
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);
  
  // Move fetchUserList outside useEffect for reusability
  const fetchUserList = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      let response;
      // Fetch user's reading list or favorites based on active tab
      if (activeTab === 'reading') {
        response = await getUserReadingList(user.id);
      } else {
        response = await getUserFavorites(user.id);
      }
      if (response.error) throw new Error(response.error.message);
      // Process the data
      const items = response.data || [];
      console.log(`Fetched ${items.length} items for ${activeTab} list`);
      // Get reading history for progress calculation
      const { data: readingHistory } = await supabase
        .from('reading_history')
        .select('manga_id, chapter_id')
        .eq('user_id', user.id);
      // Create a map of manga_id to latest chapter read
      const readingProgress: {[key: string]: {count: number, chapters: Set<string>}} = {};
      if (readingHistory) {
        readingHistory.forEach(record => {
          if (!readingProgress[record.manga_id]) {
            readingProgress[record.manga_id] = {count: 0, chapters: new Set()};
          }
          readingProgress[record.manga_id].chapters.add(record.chapter_id);
          readingProgress[record.manga_id].count = readingProgress[record.manga_id].chapters.size;
        });
      }
      // Format the data
      const formattedList = await Promise.all(items.map(async (item: any) => {
        const mangaId = activeTab === 'reading' ? item.manga_id : item.manga?.id;
        const manga = item.manga || {};
        // Get total chapters for progress calculation
        const { data: chapters } = await supabase
          .from('chapters')
          .select('id, chapter_number')
          .eq('manga_id', mangaId)
          .order('chapter_number', { ascending: true });
        const maxChapterNumber = chapters && chapters.length > 0 ? 
          Math.max(...chapters.map((ch: any) => ch.chapter_number)) : 0;
        // Get the current chapter from the reading list entry (if in reading list)
        let currentChapter = item.current_chapter || 1;
        // If we're in favorites tab, we need to get the current chapter from the reading list
        if (activeTab === 'favorites') {
          const { data: readingListEntry } = await supabase
            .from('user_reading_lists')
            .select('current_chapter, status')
            .eq('user_id', user.id)
            .eq('manga_id', mangaId)
            .single();
          if (readingListEntry) {
            currentChapter = readingListEntry.current_chapter || 1;
          }
        }
        // Determine current reading progress percentage
        const progress = maxChapterNumber > 0 
          ? Math.round((currentChapter / maxChapterNumber) * 100) 
          : 0;
        // Determine last updated date
        const lastUpdated = item.updated_at || manga.updated_at || new Date().toISOString();
        // Get manga genres
        const { data: genreData } = await supabase
          .from('manga_genres')
          .select('genres(name)')
          .eq('manga_id', mangaId);
        const genres = genreData?.map((g: any) => g.genres.name) || [];
        return {
          id: item.id,
          title: manga.title || 'Unknown Title',
          coverImage: manga.cover_image || '',
          status: item.status || 'reading',
          progress,
          current_chapter: currentChapter,
          total_chapters: maxChapterNumber,
          rating: manga.rating,
          lastUpdated,
          genres,
          manga_id: mangaId
        };
      }));
      setMangaList(formattedList);
    } catch (err: any) {
      console.error(`Error fetching ${activeTab} list:`, err);
      setError(err.message || `Failed to load your ${activeTab} list`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserList();
  }, [user, activeTab]);
  
  // Defensive: if all chapters are read, show 'completed' in the UI even if status is still 'reading'
  const mappedMangaList = mangaList.map(manga => {
    if (
      manga.status === 'reading' &&
      manga.progress === 100 &&
      manga.total_chapters && manga.current_chapter &&
      manga.current_chapter === manga.total_chapters
    ) {
      return { ...manga, status: 'completed' };
    }
    return manga;
  });

  const filteredList = mappedMangaList.filter(manga => {
    if (selectedStatus === 'all') return true;
    return manga.status === selectedStatus;
  });
  
  const getStatusColor = (status: ReadingStatus) => {
    switch (status) {
      case 'reading': return 'text-green-500';
      case 'completed': return 'text-blue-500';
      case 'on_hold': return 'text-yellow-500';
      case 'dropped': return 'text-red-500';
      case 'plan_to_read': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };
  
  // Handle removing manga from list
  const handleRemove = async (mangaId: string) => {
    if (!user) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [mangaId]: true }));
      
      let response;
      if (activeTab === 'reading') {
        response = await removeFromReadingList(user.id, mangaId);
      } else {
        response = await removeFromFavorites(user.id, mangaId);
      }
      
      if (response.error) throw new Error(response.error.message);
      
      // Remove from UI
      setMangaList(mangaList.filter(item => 
        activeTab === 'reading' ? item.manga_id !== mangaId : item.id !== mangaId
      ));
      
    } catch (err: any) {
      console.error(`Error removing from ${activeTab}:`, err);
      alert(`Failed to remove: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [mangaId]: false }));
    }
  };
  
  // Handle updating reading status
  const handleStatusUpdate = async (mangaId: string, newStatus: ReadingStatus) => {
    if (!user) return;
    try {
      setActionLoading(prev => ({ ...prev, [mangaId]: true }));
      let currentChapter = 1;
      // For 'completed', fetch the last chapter number for this manga
      if (newStatus === 'completed') {
        const { data: chapters, error: chapterError } = await supabase
          .from('chapters')
          .select('chapter_number')
          .eq('manga_id', mangaId);
        if (chapterError) throw new Error(chapterError.message);
        if (chapters && chapters.length > 0) {
          currentChapter = Math.max(...chapters.map((ch: any) => ch.chapter_number));
        }
      } else {
        // For other statuses, use the current chapter from the list
        const currentManga = mangaList.find(manga => manga.manga_id === mangaId);
        currentChapter = currentManga?.current_chapter || 1;
      }
      // Update in database
      const { error } = await updateReadingStatus(
        user.id,
        mangaId,
        newStatus,
        currentChapter
      );
      // Also update reading_history accordingly
      if (newStatus === 'completed') {
        await logAllChaptersRead(user.id, mangaId, currentChapter);
      } else if (newStatus === 'reading') {
        // Log the current chapter as read
        const { data: chapters } = await supabase
          .from('chapters')
          .select('id, chapter_number')
          .eq('manga_id', mangaId);
        if (chapters) {
          const chapterObj = chapters.find((ch: any) => ch.chapter_number === currentChapter);
          if (chapterObj) {
            await logReadingHistory(user.id, mangaId, chapterObj.id);
          }
        }
      }
      if (error) throw new Error(error.message);
      // Re-fetch user list to ensure UI is in sync
      await fetchUserList();
    } catch (err: any) {
      console.error('Error updating status:', err);
      // Could show error toast here
    } finally {
      setActionLoading(prev => ({ ...prev, [mangaId]: false }));
    }
  };
  
  const getStatusIcon = (status: ReadingStatus) => {
    switch (status) {
      case 'reading': return <Play className="w-4 h-4" />;
      case 'completed': return <Check className="w-4 h-4" />;
      case 'on_hold': return <Pause className="w-4 h-4" />;
      case 'dropped': return <X className="w-4 h-4" />;
      case 'plan_to_read': return <Bookmark className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };
  
  if (authLoading) {
    return (
      <div className="pt-20 flex justify-center items-center min-h-screen">
        <div className="manga-panel p-8 bg-black/50 transform rotate-2">
          <p className="manga-title text-2xl">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="pt-20 flex justify-center items-center min-h-screen">
        <div className="manga-panel p-8 bg-black/50 transform -rotate-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="manga-title text-2xl">Please login to view your reading list</p>
          </div>
          <Link to="/" className="mt-4 inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="manga-title text-4xl transform -rotate-2">My Library</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-2 flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('reading')}
            className={`flex items-center gap-2 pb-3 transition-colors manga-title ${activeTab === 'reading' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
          >
            <BookOpen className="w-5 h-5" />
            Reading List
            <span className="ml-1 text-xs bg-red-500/30 px-2 py-0.5 rounded-full">
              {activeTab === 'reading' ? mangaList.length : null}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 pb-3 transition-colors manga-title ${activeTab === 'favorites' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
          >
            <Heart className="w-5 h-5" />
            Favorites
            <span className="ml-1 text-xs bg-red-500/30 px-2 py-0.5 rounded-full">
              {activeTab === 'favorites' ? mangaList.length : null}
            </span>
          </button>
        </div>
        
        {/* Status Filter */}
        {showFilters && (
          <div className="mb-8 manga-panel p-6 bg-black/30 transform rotate-1">
            <h3 className="manga-title text-xl mb-4">Filter by Status</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`manga-border px-3 py-1 text-sm ${selectedStatus === 'all' ? 'bg-red-500/30' : 'bg-black/30'} transition-colors`}
              >
                All
                <span className="ml-1 text-xs">{mangaList.length}</span>
              </button>
              {['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read'].map((status) => {
                const count = mangaList.filter(m => m.status === status).length;
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status as ReadingStatus)}
                    className={`manga-border px-3 py-1 text-sm ${selectedStatus === status ? 'bg-red-500/30' : 'bg-black/30'} ${count === 0 ? 'opacity-50' : ''} transition-colors`}
                    disabled={count === 0}
                  >
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span className="ml-1 text-xs">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="manga-panel p-6 bg-black/50 transform rotate-2">
              <p className="manga-title text-xl">Loading your manga collection...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="manga-panel p-6 bg-black/50 transform -rotate-2">
              <p className="manga-title text-xl text-red-500">Error: {error}</p>
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="manga-panel p-8 bg-black/30 transform rotate-1 text-center">
            <p className="manga-title text-xl mb-4">
              {activeTab === 'reading' 
                ? 'Your reading list is empty!' 
                : 'You haven\'t added any favorites yet!'}
            </p>
            <p className="mb-6">Start exploring the manga collection to add some titles.</p>
            <Link to="/discover" className="inline-block manga-gradient manga-border px-6 py-3 font-semibold transition-all transform hover:scale-105 hover:-rotate-2 manga-title">
              <BookOpen className="inline-block mr-2" />
              Discover Manga
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredList.map((manga) => (
              <div 
                key={manga.id}
                className="manga-panel p-4 bg-black/20 hover:bg-black/30 transition-colors flex items-center gap-4 transform hover:scale-[1.01] hover:rotate-[0.3deg]"
              >
                <Link to={`/manga/${manga.manga_id || manga.id}`} className="shrink-0 w-16 h-24 overflow-hidden manga-border">
                  <img 
                    src={manga.coverImage} 
                    alt={manga.title}
                    className="w-full h-full object-cover"
                  />
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link to={`/manga/${manga.manga_id || manga.id}`} className="block">
                    <h3 className="manga-title text-lg truncate">{manga.title}</h3>
                  </Link>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 text-sm ${getStatusColor(manga.status)}`}>
  {getStatusIcon(manga.status)}
  <span className="capitalize">{manga.status.replace('_', ' ')}</span>
</span>
                    
                    {manga.rating && (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {manga.rating}
                      </span>
                    )}
                    
                    <span className="text-sm text-gray-400">
                      {new Date(manga.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="mt-2">
  <div className="flex justify-between text-xs text-gray-400 mb-1">
    <span>
      {manga.current_chapter || 0} / {manga.total_chapters || '?'} chapters
    </span>
    <span>{manga.progress}%</span>
  </div>
  <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
    <div 
      className="bg-red-500 h-full transition-all duration-500" 
      style={{ width: `${manga.progress}%` }}
    ></div>
  </div>
  <div className="flex justify-end mt-1">
    {manga.status === 'reading' && manga.current_chapter && manga.current_chapter > 0 && (
      <Link 
        to={`/reader/${manga.manga_id || manga.id}/chapter/${manga.current_chapter}`} 
        className="text-xs text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
      >
        <Play className="w-3 h-3" />
        Continue Chapter {manga.current_chapter}
      </Link>
    )}
  </div>
</div>
                </div>
                
                <div className="shrink-0 ml-4 flex flex-col gap-2">
                  {activeTab === 'reading' && (
                    <div className="relative group">
                      <button 
                        className="manga-border p-2 hover:text-yellow-500 transition-colors"
                        onClick={() => setShowFilters(prev => !prev)}
                      >
                        <List className="w-5 h-5" />
                      </button>
                      
                      <div className="absolute right-full top-0 mr-2 bg-black/80 manga-border p-2 hidden group-hover:block z-10 w-36">
                        {['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read']
                          .filter(status => status !== manga.status)
                          .map(status => (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(manga.manga_id || manga.id, status as ReadingStatus)}
                              className={`w-full text-left px-2 py-1 text-sm hover:bg-white/10 flex items-center gap-2 ${getStatusColor(status as ReadingStatus)}`}
                            >
                              {getStatusIcon(status as ReadingStatus)}
                              <span className="capitalize">{status.replace('_', ' ')}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    className="manga-border p-2 hover:text-red-500 transition-colors"
                    onClick={() => handleRemove(manga.manga_id || manga.id)}
                    disabled={actionLoading[manga.manga_id || manga.id]}
                  >
                    {actionLoading[manga.manga_id || manga.id] ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            
            {filteredList.length > 0 && (
              <div className="pt-8 text-center">
                <p className="text-gray-400 mb-2">That's all for now!</p>
                <Link to="/discover" className="inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-1">
                  <BookOpen className="inline-block mr-2" />
                  Discover More Manga
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyList;