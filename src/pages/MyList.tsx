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
import { getDetailedReadingStatus, type ReadingStatus } from '../lib/readingStatusManager';

// Add this type for better progress tracking
type MangaProgress = {
  chaptersRead: number;
  totalChapters: number;
  lastReadChapter: number | null;
  lastReadAt: string | null;
  readChapters: number[];
};

// Update the manga list item type
type MangaListItem = {
  id: string; // ID of the user_reading_lists or user_favorites entry
  manga_id: string; // Actual ID of the manga
  status: ReadingStatus | null; // Status can be null if not on reading list
  current_chapter: number | null; // Current chapter can be null
  updated_at: string;
  manga: {
    title: string;
    cover_image: string;
    total_chapters: number;
  };
  progress: MangaProgress;
};

// Define the status options array at the top level with explicit typing
const STATUS_OPTIONS: ReadingStatus[] = [
  'reading',
  'completed',
  'on_hold',
  'dropped',
  'plan_to_read'
];

const MyList: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reading' | 'favorites'>('reading');
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus | 'all'>('all');
  const [mangaList, setMangaList] = useState<MangaListItem[]>([]);
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
      
      // Format the data with detailed progress information
      const formattedListPromises = items.map(async (item: any) => {
        const isReadingTab = activeTab === 'reading';
        const mangaDetails = isReadingTab ? item.manga : item.manga; // item.manga for favorites comes from the join
        const mangaIdToProcess = isReadingTab ? item.manga_id : mangaDetails?.id;

        if (!mangaIdToProcess || !mangaDetails) {
          console.warn(`Skipping item in ${activeTab} list due to missing manga_id or manga details:`, item);
          return null; // Skip this item if essential details are missing
        }
        
        // Get detailed reading status including progress
        const { status: detailedStatus, currentChapter: detailedCurrentChapter, progress } = await getDetailedReadingStatus(user.id, mangaIdToProcess);
        
        let finalStatus: ReadingStatus | null = detailedStatus;
        if (!finalStatus && isReadingTab && item.status) {
          if (STATUS_OPTIONS.includes(item.status as ReadingStatus)) {
            finalStatus = item.status as ReadingStatus;
          } else {
            console.warn(`Invalid status value '${item.status}' for manga ${mangaIdToProcess}. Defaulting to null.`);
            finalStatus = null; 
          }
        }

        return {
          id: item.id, // This is the user_reading_lists.id or user_favorites.id
          manga_id: mangaIdToProcess,
          status: finalStatus,
          current_chapter: detailedCurrentChapter || (isReadingTab ? item.current_chapter : null),
          updated_at: item.updated_at || new Date().toISOString(),
          manga: {
            title: mangaDetails.title || 'Unknown Title',
            cover_image: mangaDetails.cover_image || '',
            total_chapters: progress.totalChapters || mangaDetails.total_chapters || 0
          },
          progress: progress
        };
      });
      
      const resolvedFormattedList = await Promise.all(formattedListPromises);
      const validFormattedList = resolvedFormattedList.filter(item => item !== null) as MangaListItem[];
      
      setMangaList(validFormattedList);
    } catch (err) {
      console.error('Error fetching user list:', err);
      setError(err instanceof Error ? err.message : 'Failed to load your list');
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
      manga.progress.totalChapters > 0 &&
      manga.progress.chaptersRead === manga.progress.totalChapters
    ) {
      return { ...manga, status: 'completed' };
    }
    return manga;
  });

  const filteredList = mappedMangaList.filter(manga => {
    if (selectedStatus === 'all') return true;
    return manga.status === selectedStatus;
  });
  
  const getStatusColor = (status: ReadingStatus | null) => {
    if (status === null) return 'text-gray-500'; // Default for null status
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
      let currentChapter = mangaList.find(manga => manga.manga_id === mangaId)?.current_chapter || 1;
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
  
  const getStatusIcon = (status: ReadingStatus | null) => {
    if (status === null) return <List className="w-4 h-4" />; // Default for null status
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
                className={`w-full text-left px-2 py-1 text-sm hover:bg-white/10 flex items-center gap-2 ${selectedStatus === 'all' ? 'text-red-500' : 'text-gray-300'}`}
              >
                <List className="w-4 h-4" />
                All Statuses
                <span className="ml-1 text-xs">{mangaList.length}</span>
              </button>
              {STATUS_OPTIONS.map((status) => {
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`w-full text-left px-2 py-1 text-sm hover:bg-white/10 flex items-center gap-2 ${getStatusColor(status)} ${selectedStatus === status ? 'ring-1 ring-red-500' : ''}`}
                  >
                    {getStatusIcon(status)}
                    <span className="capitalize">{status.replace('_', ' ')}</span>
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
            <Link to="/discover" className="inline-block manga-border px-6 py-3 font-semibold transition-all transform hover:scale-105 hover:-rotate-2 manga-title">
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
                    src={manga.manga.cover_image} 
                    alt={manga.manga.title}
                    className="w-full h-full object-cover"
                  />
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link to={`/manga/${manga.manga_id || manga.id}`} className="block">
                    <h3 className="manga-title text-lg truncate">{manga.manga.title}</h3>
                  </Link>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 text-sm ${getStatusColor(manga.status as ReadingStatus | null)}`}>
                      {getStatusIcon(manga.status as ReadingStatus | null)}
                      <span className="capitalize">{manga.status?.replace('_', ' ')}</span>
                    </span>
                    
                    {manga.progress && (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {Math.round((manga.progress.chaptersRead / manga.progress.totalChapters) * 100)}%
                      </span>
                    )}
                    
                    <span className="text-sm text-gray-400">
                      {new Date(manga.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {manga.progress && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>
                          {manga.progress.chaptersRead} / {manga.progress.totalChapters} chapters read
                        </span>
                        <span>{Math.round((manga.progress.chaptersRead / manga.progress.totalChapters) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-red-500 h-full transition-all duration-500" 
                          style={{ 
                            width: `${manga.progress.totalChapters > 0 
                              ? (manga.progress.chaptersRead / manga.progress.totalChapters) * 100 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs">
                        <span className="text-gray-400">
                          {manga.progress.lastReadAt 
                            ? `Last read: ${new Date(manga.progress.lastReadAt).toLocaleDateString()}`
                            : 'Not started yet'}
                        </span>
                        {manga.status === 'reading' && manga.current_chapter && manga.current_chapter > 0 && (
                          <Link 
                            to={`/reader/${manga.manga_id}/chapter/${manga.current_chapter}`} 
                            className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Continue Chapter {manga.current_chapter}
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
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
                        {STATUS_OPTIONS
                          .filter(status => status !== manga.status)
                          .map(status => (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(manga.manga_id || manga.id, status)}
                              className={`w-full text-left px-2 py-1 text-sm hover:bg-white/10 flex items-center gap-2 ${getStatusColor(status)}`}
                            >
                              {getStatusIcon(status)}
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