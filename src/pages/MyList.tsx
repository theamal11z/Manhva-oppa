import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Heart,
  Clock,
  AlertCircle,
  Star,
  Filter,
  Bookmark,
  X,
  Check,
  Trash2
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getUserReadingList } from '../lib/supabaseClient';

type ReadingStatus = 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';

type MangaItem = {
  id: string;
  title: string;
  coverImage: string;
  status: ReadingStatus;
  progress: number;
  rating?: number;
  lastUpdated: string;
  genres: string[];
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
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);
  
  useEffect(() => {
    const fetchUserList = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch user's reading list from Supabase
        const response = await getUserReadingList(user.id);
        
        if (response.error) throw new Error(response.error.message);
        
        // For now, generate some dummy data if the API doesn't return anything
        let items = response.data || [];
        
        if (items.length === 0) {
          // Generate dummy data for demo
          items = Array.from({ length: 12 }, (_, i) => ({
            id: `manga-${i + 1}`,
            manga: {
              id: `manga-${i + 1}`,
              title: `Manga Title ${i + 1}`,
              cover_image_url: `https://picsum.photos/seed/manga${i + 1}/300/400`,
              genres: [{ genres: { name: 'Action' } }, { genres: { name: 'Adventure' } }]
            },
            status: ['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read'][i % 5] as ReadingStatus,
            rating: Math.floor(Math.random() * 5) + 1,
            updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          }));
        }
        
        // Format the data
        const formattedList = items.map((item: any) => ({
          id: item.manga?.id || item.manga_id,
          title: item.manga?.title || `Manga ${item.manga_id}`,
          coverImage: item.manga?.cover_image_url || `https://picsum.photos/seed/${item.manga_id}/300/400`,
          status: item.status || 'reading',
          progress: Math.floor(Math.random() * 100),  // Demo - would come from API
          rating: item.rating,
          lastUpdated: item.updated_at,
          genres: item.manga?.genres?.map((g: any) => g.genres?.name) || ['Action', 'Adventure']
        }));
        
        setMangaList(formattedList);
      } catch (err: any) {
        console.error('Error fetching reading list:', err);
        setError(err.message || 'Failed to load your reading list');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserList();
  }, [user, activeTab]);
  
  const filteredList = mangaList.filter(manga => {
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
  
  const getStatusIcon = (status: ReadingStatus) => {
    switch (status) {
      case 'reading': return <Clock className="w-4 h-4" />;
      case 'completed': return <Check className="w-4 h-4" />;
      case 'on_hold': return <Bookmark className="w-4 h-4" />;
      case 'dropped': return <X className="w-4 h-4" />;
      case 'plan_to_read': return <BookOpen className="w-4 h-4" />;
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
            className={`flex items-center gap-2 pb-4 transition-colors manga-title transform hover:rotate-2 ${
              activeTab === 'reading' 
                ? 'text-red-500 border-b-2 border-red-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Reading List
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 pb-4 transition-colors manga-title transform hover:rotate-2 ${
              activeTab === 'favorites' 
                ? 'text-red-500 border-b-2 border-red-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Heart className="w-5 h-5" />
            Favorites
          </button>
        </div>
        
        {/* Status Filter */}
        {showFilters && (
          <div className="mb-8 manga-panel p-6 bg-black/30 transform rotate-1">
            <h3 className="manga-title text-xl mb-4">Filter by Status</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'reading', label: 'Currently Reading' },
                { id: 'completed', label: 'Completed' },
                { id: 'on_hold', label: 'On Hold' },
                { id: 'dropped', label: 'Dropped' },
                { id: 'plan_to_read', label: 'Plan to Read' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSelectedStatus(id as ReadingStatus | 'all')}
                  className={`manga-border px-4 py-2 transition-colors transform hover:scale-105 ${
                    selectedStatus === id 
                      ? 'bg-red-500/30 text-white' 
                      : 'hover:bg-white/10'
                  }`}
                  style={{ transform: `rotate(${Math.random() > 0.5 ? 1 : -1}deg)` }}
                >
                  {label}
                </button>
              ))}
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
                <Link to={`/manga/${manga.id}`} className="shrink-0 w-16 h-24 overflow-hidden">
                  <img 
                    src={manga.coverImage} 
                    alt={manga.title}
                    className="w-full h-full object-cover"
                  />
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link to={`/manga/${manga.id}`} className="block">
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
                      Updated {new Date(manga.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-red-500 h-full" 
                        style={{ width: `${manga.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                      <span>{manga.progress}% complete</span>
                      {manga.status === 'reading' && (
                        <Link to={`/reader/${manga.id}/chapter/1`} className="text-red-500 hover:text-red-400 transition-colors">
                          Continue Reading
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="shrink-0 ml-4 flex gap-2">
                  <button className="manga-border p-2 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button className="manga-border p-2 hover:text-yellow-500 transition-colors">
                    <Star className="w-5 h-5" />
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