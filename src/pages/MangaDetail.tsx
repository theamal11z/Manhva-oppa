import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Book,
  Bookmark,
  Calendar,
  Heart,
  Info,
  List,
  Share,
  Star,
  User,
  Clock,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { 
  getMangaById, 
  addToFavorites, 
  getChaptersByMangaId,
  updateReadingStatus,
  logReadingHistory,
  logAllChaptersRead,
  supabase
} from '../lib/supabaseClient';

type Chapter = {
  id: string;
  chapter_number: number;
  title: string | null;
  pages: number;
  views: number;
  created_at: string;
  updated_at: string;
  release_date?: string;
  read?: boolean;
};


const MangaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  
  const [manga, setManga] = useState<any | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [similarManga, setSimilarManga] = useState<any[]>([]);
  const [inReadingList, setInReadingList] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [userStatus, setUserStatus] = useState<string|null>(null);
  const [userChapter, setUserChapter] = useState<number|null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState<string|null>(null);
  
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'chapters' | 'reviews'>('info');
  
  // Fetch manga details
  useEffect(() => {
    const fetchManga = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        console.log('Fetching manga with ID:', id);
        const response = await getMangaById(id);
        
        if (response.error) throw new Error(response.error.message);
        if (!response.data) throw new Error('Manga not found');
        
        console.log('Manga data loaded:', response.data.title);
        setManga(response.data);
        
        // Fetch similar manga based on genres
        if (response.data.genres && response.data.genres.length > 0) {
          const genreIds = response.data.genres.map((g: any) => g.genres.id);
          const { data: similarData } = await supabase
            .from('manga_genres')
            .select('manga_entries(*)')
            .in('genre_id', genreIds)
            .neq('manga_id', id)
            .limit(6);
            
          if (similarData) {
            const uniqueManga = Array.from(new Set(
              similarData.map((item: any) => item.manga_entries.id)
            )).map(uniqueId => 
              similarData.find((item: any) => item.manga_entries.id === uniqueId)?.manga_entries
            ).filter(Boolean).slice(0, 6);
            
            setSimilarManga(uniqueManga);
          }
        }
        
        // Check if manga is in user's reading list
        if (user) {
          const { data: readingListData } = await supabase
            .from('user_reading_lists')
            .select('*')
            .eq('user_id', user.id)
            .eq('manga_id', id)
            .single();
            
          setInReadingList(!!readingListData);
          setUserStatus(readingListData?.status || null);
          setUserChapter(readingListData?.current_chapter || null);
          
          // Check if manga is in user's favorites
          const { data: favoritesData } = await supabase
            .from('user_favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('manga_id', id)
            .single();
            
          setInFavorites(!!favoritesData);
        }
      } catch (err: any) {
        console.error('Error fetching manga:', err);
        setError(err.message || 'Failed to fetch manga details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchManga();
  }, [id, user]);
  
  // Fetch chapters separately and mark which ones have been read
  useEffect(() => {
    const fetchChapters = async () => {
      if (!id) return;
      
      try {
        setChaptersLoading(true);
        const response = await getChaptersByMangaId(id);
        
        if (response.error) throw new Error(response.error.message);
        
        const sortedChapters = (response.data || [])
          .sort((a: Chapter, b: Chapter) => {
            // Sort by chapter number in descending order (newest first)
            return b.chapter_number - a.chapter_number;
          });
        
        // Mark chapters that have been read if user is logged in
        if (user) {
          // Fetch reading history for this manga
          const { data: readingHistory } = await supabase
            .from('reading_history')
            .select('chapter_id')
            .eq('user_id', user.id)
            .eq('manga_id', id);
          
          // Get user reading status to find current chapter
          const { data: readingStatus } = await supabase
            .from('user_reading_lists')
            .select('status, current_chapter')
            .eq('user_id', user.id)
            .eq('manga_id', id)
            .single();
          
          // Create a set of read chapter IDs for faster lookup
          const readChapterIds = new Set();
          
          if (readingHistory) {
            readingHistory.forEach((record: any) => {
              readChapterIds.add(record.chapter_id);
            });
          }
          
          // Mark chapters as read based on reading history
          const markedChapters = sortedChapters.map((chapter: Chapter) => {
            // A chapter is considered read if it's in the reading history
            // OR if it's a lower chapter number than the current chapter (when status is 'reading' or 'completed')
            const isRead = readChapterIds.has(String(chapter.chapter_number)) || 
              (readingStatus?.current_chapter !== undefined && 
              chapter.chapter_number <= readingStatus.current_chapter && 
              ['reading', 'completed'].includes(readingStatus.status || ''));
              
            return { ...chapter, read: isRead };
          });
          
          setChapters(markedChapters);
        } else {
          // No user logged in, chapters are not marked as read
          setChapters(sortedChapters);
        }
      } catch (err: any) {
        console.error('Error fetching chapters:', err);
        // Don't set global error, just show empty state
      } finally {
        setChaptersLoading(false);
      }
    };
    
    fetchChapters();
  }, [id, user]);
  
  const handleAddToList = async (status: 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read') => {
    if (!user || !id) return;
    
    setStatusUpdating(true);
    try {
      // Find the appropriate chapter to set as current chapter based on status
      let currentChapter = 1;
      
      // If we have chapters available
      if (chapters.length > 0) {
        // For completed status, set to max chapter
        if (status === 'completed') {
          // Find the maximum chapter number
          currentChapter = Math.max(...chapters.map(ch => ch.chapter_number));
        }
        // For reading status, start with chapter 1
        // For other statuses, currentChapter remains 1
      }
      
      await updateReadingStatus(user.id, id, status, currentChapter);
      // Log reading history accordingly
      if (status === 'completed') {
        await logAllChaptersRead(user.id, id, currentChapter);
      } else if (status === 'reading') {
        // Log the current chapter as read
        const chapterObj = chapters.find(ch => ch.chapter_number === currentChapter);
        if (chapterObj) {
          await logReadingHistory(user.id, id, chapterObj.id);
        }
      }
      setInReadingList(true);
      setUserStatus(status);
      setUserChapter(currentChapter);
      setStatusSuccess(`Added to your ${status.replace('_', ' ')} list`);
    } catch (err: any) {
      setError(err.message || 'Failed to add to list');
    } finally {
      setStatusUpdating(false);
      setTimeout(() => setStatusSuccess(null), 3000);
    }
  };

  const handleAddToFavorites = async () => {
    if (!user || !manga) return;
    
    try {
      await addToFavorites(user.id, manga.id);
      alert('Added to favorites!');
    } catch (err) {
      console.error('Error adding to favorites:', err);
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="manga-panel p-6 bg-black/50 transform rotate-2">
          <div className="border-4 border-gray-800 border-t-red-500 rounded-full w-8 h-8 animate-spin mb-4 mx-auto"></div>
          <div className="text-lg">Loading manga details...</div>
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="manga-panel p-6 bg-black/50 transform -rotate-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="manga-title text-2xl text-red-500">Error: {error || 'Manga not found'}</p>
          </div>
          <Link to="/" className="mt-4 inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105">
            <ArrowLeft className="inline-block mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Process manga data for display
  const resolveImageUrl = (path: string | null) => {
    if (!path) return `https://picsum.photos/seed/${id}/600/800`;
    if (path.startsWith('http')) return path;
    
    // Get public URL from Supabase storage
    const { data } = supabase.storage.from('manga_covers').getPublicUrl(path);
    return data.publicUrl;
  };
  
  // If we don't have actual data, use placeholder data
  const mangaData = {
    id: manga.id || id || 'unknown',
    title: manga.title || 'Manga Title',
    description: manga.description || 'No description available for this manga.',
    coverImage: resolveImageUrl(manga.cover_image),
    author: manga.author || 'Unknown Author',
    artist: manga.artist || 'Unknown Artist',
    status: manga.status || 'ongoing',
    type: manga.type || 'manga',
    year: manga.year || new Date().getFullYear(),
    rating: manga.rating || 4.5,
    popularity: manga.popularity || 0,
    genres: manga.genres?.map((g: any) => g.genres.name) || ['Action', 'Fantasy'],
    tags: manga.tags?.map((t: any) => t.tags.name) || ['Magic', 'Adventure'],
    ageRating: manga.age_rating || '13+',
    totalChapters: manga.total_chapters || chapters.length || 0
  };

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link to="/" className="inline-block mb-6 manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:-rotate-2">
          <ArrowLeft className="inline-block mr-2" />
          Back to Home
        </Link>
        
        {/* Manga header section */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Cover image */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="relative aspect-[3/4] manga-panel overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
              <img
                src={mangaData.coverImage}
                alt={mangaData.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 manga-panel p-2 bg-black/70">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-bold">{mangaData.rating}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 py-2 px-4 bg-gradient-to-t from-black to-transparent text-center">
                <span className="uppercase text-xs font-bold tracking-wider">
                  {mangaData.type} • {mangaData.status}
                </span>
              </div>
              <div className="absolute -bottom-12 -right-12 impact-text text-9xl opacity-20 transform rotate-12 pointer-events-none">
                {mangaData.status === 'ongoing' ? 'NEW!' : 'COMPLETE'}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-3 mt-4">
              <Link 
                to={`/reader/${mangaData.id}/chapter/1`}
                className="block manga-gradient manga-border py-3 text-center font-semibold transition-all transform hover:scale-105 hover:-rotate-1 manga-title"
              >
                <Book className="inline-block mr-2" />
                Start Reading
              </Link>
              
              <button
                onClick={() => handleAddToList('reading')}
                className={`manga-gradient manga-border px-6 py-3 font-semibold transition-all transform hover:scale-105 hover:-rotate-3 flex items-center gap-2 ${inReadingList ? 'opacity-75' : ''}`}
              >
                <Bookmark className="w-5 h-5" />
                {inReadingList ? 'Continue Reading' : 'Start Reading'}
              </button>
              
              <button
                onClick={handleAddToFavorites}
                className={`${inFavorites ? 'bg-red-500/30' : 'bg-white/10'} manga-border px-6 py-3 font-semibold transition-all transform hover:scale-105 hover:rotate-3 flex items-center gap-2`}
              >
                <Heart className={`w-5 h-5 ${inFavorites ? 'text-red-500' : ''}`} />
                {inFavorites ? 'In Favorites' : 'Add to Favorites'}
              </button>
              
              <button className="block w-full bg-white/10 manga-border py-3 text-center font-semibold transition-all transform hover:scale-105 hover:rotate-1 manga-title">
                <Share className="inline-block mr-2" />
                Share
              </button>
            </div>
          </div>
          
          {/* Manga Info */}
          {user && (
            <div className="my-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-gray-400">Your Status:</span>
              <select
                value={userStatus || ''}
                onChange={async (e) => {
                  setStatusUpdating(true);
                  setStatusSuccess(null);
                  try {
                    await updateReadingStatus(user.id, manga.id, e.target.value as 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read', userChapter || undefined);
                    // Log reading history accordingly
                    if (e.target.value === 'completed') {
                      await logAllChaptersRead(user.id, manga.id, userChapter || chapters.length);
                    } else if (e.target.value === 'reading' && userChapter) {
                      const chapterObj = chapters.find(ch => ch.chapter_number === userChapter);
                      if (chapterObj) {
                        await logReadingHistory(user.id, manga.id, chapterObj.id);
                      }
                    }
                    setUserStatus(e.target.value);
                    setStatusSuccess('Status updated!');
                  } catch {
                    setStatusSuccess('Failed to update status');
                  } finally {
                    setStatusUpdating(false);
                    setTimeout(() => setStatusSuccess(null), 1500);
                  }
                }}
                className="manga-border px-2 py-1 bg-black/40 text-white rounded"
                disabled={statusUpdating}
              >
                <option value="">Select status</option>
                <option value="reading">Reading</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="dropped">Dropped</option>
                <option value="plan_to_read">Plan to Read</option>
              </select>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-xs text-gray-400">Progress:</span>
                <input
                  type="number"
                  min={1}
                  max={chapters.length}
                  value={userChapter || ''}
                  onChange={async (e) => {
                    const chapterNum = Number(e.target.value);
                    setStatusUpdating(true);
                    setStatusSuccess(null);
                    try {
                      await updateReadingStatus(user.id, manga.id, (userStatus || 'reading') as 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read', chapterNum);
                      // Log reading history for the selected chapter
                      const chapterObj = chapters.find(ch => ch.chapter_number === chapterNum);
                      if (chapterObj) {
                        await logReadingHistory(user.id, manga.id, chapterObj.id);
                      }
                      setUserChapter(chapterNum);
                      setStatusSuccess('Progress updated!');
                    } catch {
                      setStatusSuccess('Failed to update progress');
                    } finally {
                      setStatusUpdating(false);
                      setTimeout(() => setStatusSuccess(null), 1500);
                    }
                  }}
                  className="manga-border px-2 py-1 w-16 bg-black/40 text-white rounded"
                  disabled={statusUpdating}
                />
                <span className="text-xs text-gray-400">/ {chapters.length}</span>
              </div>
              {statusSuccess && (
                <span className="ml-2 text-green-400 text-xs">{statusSuccess}</span>
              )}
            </div>
          )}
          
          {/* Manga details */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <div className="manga-panel p-6 bg-black/30 mb-6">
              <h1 className="manga-title text-4xl md:text-5xl leading-tight mb-4 transform -rotate-1">
                {mangaData.title}
              </h1>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {mangaData.genres.map((genre: string, idx: number) => (
                  <span
                    key={genre}
                    className="text-sm manga-border px-3 py-1 transform"
                    style={{ transform: `rotate(${idx % 2 ? 1 : -1}deg)` }}
                  >
                    {genre}
                  </span>
                ))}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className="capitalize font-semibold flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {mangaData.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Type</span>
                  <span className="capitalize font-semibold flex items-center gap-1">
                    <Book className="w-4 h-4" />
                    {mangaData.type}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Author</span>
                  <span className="font-semibold flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {mangaData.author}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Released</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>{mangaData.year}</span>
                  </div>
                </div>
              </div>
            </div>
          
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-white/10">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-2 pb-3 transition-colors manga-title ${
                  activeTab === 'info' 
                    ? 'text-red-500 border-b-2 border-red-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Info className="w-5 h-5" />
                Information
              </button>
              
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex items-center gap-2 pb-3 transition-colors manga-title ${
                  activeTab === 'chapters' 
                    ? 'text-red-500 border-b-2 border-red-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-5 h-5" />
                Chapters <span className="ml-1 text-sm">({chapters.length})</span>
              </button>
            </div>
            
            {/* Tab content */}
            {/* Reading Progress Bar - show only if user has started reading */}
            {user && userChapter && (
              <div className="mb-6 manga-panel bg-black/20 p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold">Your Reading Progress</h3>
                  </div>
                  <div className="text-sm text-gray-300">
                    {userStatus === 'reading' ? 'Currently Reading' :
                     userStatus === 'completed' ? 'Completed' :
                     userStatus === 'on_hold' ? 'On Hold' :
                     userStatus === 'dropped' ? 'Dropped' :
                     userStatus === 'plan_to_read' ? 'Plan to Read' : ''}  
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Chapter {userChapter} / {chapters.length > 0 ? chapters[chapters.length - 1].chapter_number : '?'}</span>
                  <span>{chapters.length > 0 ? Math.round((userChapter / chapters[chapters.length - 1].chapter_number) * 100) : 0}%</span>
                </div>
                
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full transition-all duration-500" 
                    style={{ width: `${chapters.length > 0 ? (userChapter / chapters[chapters.length - 1].chapter_number) * 100 : 0}%` }}
                  ></div>
                </div>
                
                {userStatus === 'reading' && (
                  <div className="mt-3 flex justify-end">
                    <Link 
                      to={`/reader/${id}/chapter/${userChapter}`} 
                      className="manga-border px-3 py-1 bg-red-500/30 hover:bg-red-500/50 text-sm flex items-center gap-1 transition-colors"
                    >
                      Continue Reading Chapter {userChapter}
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'info' ? (
              <div className="speech-bubble transform -rotate-1 p-6">
                <p className="text-lg leading-relaxed">{mangaData.description}</p>
                
                {/* Could add more information here like awards, related manga, etc. */}
                <div className="mt-6 text-gray-300">
                  <p>This manga has been viewed over 100,000 times and has received numerous positive reviews.</p>
                </div>
              </div>
            ) : (
              <div className="manga-panel bg-black/20 p-4">
                {chaptersLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="border-4 border-gray-800 border-t-red-500 rounded-full w-8 h-8 animate-spin"></div>
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="flex justify-center items-center h-32">
                    <p className="text-gray-400">No chapters available yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chapters.map((chapter, index) => (
                      <Link 
                        key={chapter.id}
                        to={`/reader/${mangaData.id}/chapter/${chapter.chapter_number}`}
                        className={`flex items-center justify-between p-3 manga-border ${chapter.read ? 'opacity-70' : ''} hover:bg-white/5 transition-colors transform hover:scale-[1.01] ${index % 2 ? 'hover:rotate-[0.5deg]' : 'hover:-rotate-[0.5deg]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="aspect-square w-10 h-10 flex items-center justify-center manga-panel bg-gray-800">
                            <span className="font-bold">{chapter.chapter_number}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{chapter.title || `Chapter ${chapter.chapter_number}`}</h3>
                            <p className="text-sm text-gray-400">
                              {new Date(chapter.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {chapter.read && (
                          <span className="text-sm text-gray-400 manga-border px-2 py-1">Read</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Similar manga section */}
        <div className="mt-16">
          <h2 className="manga-title text-2xl mb-6 transform -rotate-1">Similar Titles</h2>
          {similarManga.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {similarManga.map((relatedManga, index) => (
                <Link 
                  key={relatedManga.id}
                  to={`/manga/${relatedManga.id}`}
                  className="group relative aspect-[3/4] manga-panel overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300"
                  style={{ transform: `rotate(${index % 2 ? 1 : -1}deg)` }}
                >
                  <img
                    src={resolveImageUrl(relatedManga.cover_image)}
                    alt={relatedManga.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 p-4 w-full">
                      <h3 className="text-lg manga-title transform -rotate-2">{relatedManga.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-32 manga-panel bg-black/20">
              <p className="text-gray-400">No similar titles found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MangaDetail;