import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Filter,
  Search,
  Star,
  X,
  Check,
  TrendingUp,
  Info,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { getMangaList, getGenres } from '../lib/supabaseClient';

// Define proper interfaces for better type safety
interface MangaItem {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  rating: number;
  genres: string[];
  type: string;
  status: string;
  isNew: boolean;
  isTrending: boolean;
  created_at?: string;
  popularity?: number;
}

interface FilterOptions {
  genres: string[];
  types: string[];
  status: string[];
  minRating: number;
}

const Discover: React.FC = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'trending' | 'new'>('all');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    genres: [],
    types: [],
    status: [],
    minRating: 0,
  });
  
  // Simplified state without pagination for better performance
  
  // Available filter options
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const availableTypes = ['manga', 'manhwa', 'manhua', 'webtoon'];
  const availableStatus = ['ongoing', 'completed', 'hiatus', 'cancelled'];
  
  // Debounce search term to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch genres from the database
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const { data, error } = await getGenres();
        if (error) throw error;
        setAvailableGenres(data.map((g: {name: string}) => g.name));
      } catch (err) {
        setAvailableGenres([
          'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery',
          'Romance', 'Sci-Fi', 'Slice of Life', 'Supernatural', 'Thriller'
        ]);
      }
    };
    fetchGenres();
  }, []);

  // Simplified fetch manga function to avoid performance issues
  const fetchManga = useCallback(async () => {
    try {
      setLoading(true);
      let orderBy: 'created_at' | 'popularity' = 'created_at';
      let orderDirection: 'asc' | 'desc' = 'desc';
      
      if (activeCategory === 'trending') {
        orderBy = 'popularity';
        orderDirection = 'desc';
      } else if (activeCategory === 'new') {
        orderBy = 'created_at';
        orderDirection = 'desc';
      }
      
      // Use a fixed value for now to prevent performance issues
      // We'll load 30 items at once without pagination
      const response = await getMangaList(30, 0, orderBy, orderDirection);
      
      if (response.error) throw new Error(response.error.message);
      
      // Format the data
      const formattedData = response.data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        coverImage: item.cover_image || `https://picsum.photos/seed/${item.id}/300/400`,
        rating: item.rating || 0,
        genres: (item.genres || []).map((g: any) => g.genres?.name).filter(Boolean),
        type: item.type,
        status: item.status,
        isNew: new Date(item.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
        isTrending: item.popularity && item.popularity > 100, // Example: trending if popularity high
      }));
      
      if (formattedData && formattedData.length > 0) {
        setMangaList(formattedData);
      } else {
        setMangaList([]);
      }
      // No pagination needed for better performance
    } catch (err: any) {
      console.error('Error fetching manga:', err);
      setError(err.message || 'Failed to fetch manga');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);
  
  // Apply filters and search with memoization for performance
  const filteredManga = useMemo(() => {
    return mangaList.filter(manga => {
      // Apply search filter
      if (debouncedSearchTerm && !manga.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
        return false;
      }
      
      // Apply category filter - these are now handled at the DB level
      // but we keep the client filtering as a fallback
      if (activeCategory === 'trending' && !manga.isTrending) {
        return false;
      }
      
      if (activeCategory === 'new' && !manga.isNew) {
        return false;
      }
      
      // Apply genre filters
      if (filterOptions.genres.length > 0 && 
          !filterOptions.genres.some(genre => manga.genres.includes(genre))) {
        return false;
      }
      
      // Apply type filters
      if (filterOptions.types.length > 0 && 
          !filterOptions.types.includes(manga.type)) {
        return false;
      }
      
      // Apply status filters
      if (filterOptions.status.length > 0 && 
          !filterOptions.status.includes(manga.status)) {
        return false;
      }
      
      // Apply rating filter
      if (manga.rating < filterOptions.minRating) {
        return false;
      }
      
      return true;
    });
  }, [mangaList, debouncedSearchTerm, activeCategory, filterOptions]);
  
  const toggleGenreFilter = (genre: string) => {
    setFilterOptions(prev => {
      if (prev.genres.includes(genre)) {
        return { ...prev, genres: prev.genres.filter(g => g !== genre) };
      } else {
        return { ...prev, genres: [...prev.genres, genre] };
      }
    });
  };
  
  const toggleTypeFilter = (type: string) => {
    setFilterOptions(prev => {
      if (prev.types.includes(type)) {
        return { ...prev, types: prev.types.filter(t => t !== type) };
      } else {
        return { ...prev, types: [...prev.types, type] };
      }
    });
  };
  
  const toggleStatusFilter = (status: string) => {
    setFilterOptions(prev => {
      if (prev.status.includes(status)) {
        return { ...prev, status: prev.status.filter(s => s !== status) };
      } else {
        return { ...prev, status: [...prev.status, status] };
      }
    });
  };
  
  const clearFilters = () => {
    setFilterOptions({
      genres: [],
      types: [],
      status: [],
      minRating: 0,
    });
    setSearchTerm('');
    fetchManga(); // Reload with cleared filters
  };
  
  // Add effect to load data on category changes
  useEffect(() => {
    fetchManga();
  }, [activeCategory, fetchManga]);
  
  // Simple placeholder function for the Load More button
  const loadMore = () => {
    // Implement pagination later when performance is optimized
    console.log('Load more functionality temporarily disabled for performance');
  };
  
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="manga-title text-4xl transform -rotate-2">Discover Manga</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-2 flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
        
        {/* Search bar */}
        <div className="mb-8">
          <div className="relative transform hover:scale-[1.01] transition-transform">
            <input
              type="text"
              placeholder="Search for manga titles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full manga-panel bg-white/10 py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="flex gap-8 mb-8 border-b border-white/10">
          {[
            { id: 'all', label: 'All Manga', icon: BookOpen },
            { id: 'trending', label: 'Trending', icon: TrendingUp },
            { id: 'new', label: 'New Releases', icon: Clock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id as 'all' | 'trending' | 'new')}
              className={`flex items-center gap-2 pb-4 transition-colors manga-title transform hover:rotate-2 ${
                activeCategory === id 
                  ? 'text-red-500 border-b-2 border-red-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
        
        {/* Filters panel */}
        {showFilters && (
          <div className="mb-8 manga-panel p-6 bg-black/30 transform rotate-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="manga-title text-xl">Filter Options</h3>
              <button 
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear All Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Genres */}
              <div>
                <h4 className="text-lg mb-2 manga-title transform -rotate-1">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {availableGenres.map((genre, idx) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenreFilter(genre)}
                      className={`manga-border px-3 py-1 text-sm transition-colors transform ${
                        filterOptions.genres.includes(genre)
                          ? 'bg-red-500/30 text-white'
                          : 'hover:bg-white/10'
                      }`}
                      style={{ transform: `rotate(${idx % 2 ? 1 : -1}deg)` }}
                    >
                      {filterOptions.genres.includes(genre) && (
                        <Check className="inline-block w-3 h-3 mr-1" />
                      )}
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Type & Status */}
              <div>
                <h4 className="text-lg mb-2 manga-title transform -rotate-1">Type</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {availableTypes.map((type, idx) => (
                    <button
                      key={type}
                      onClick={() => toggleTypeFilter(type)}
                      className={`manga-border px-3 py-1 text-sm transition-colors capitalize transform ${
                        filterOptions.types.includes(type)
                          ? 'bg-red-500/30 text-white'
                          : 'hover:bg-white/10'
                      }`}
                      style={{ transform: `rotate(${idx % 2 ? 1 : -1}deg)` }}
                    >
                      {filterOptions.types.includes(type) && (
                        <Check className="inline-block w-3 h-3 mr-1" />
                      )}
                      {type}
                    </button>
                  ))}
                </div>
                
                <h4 className="text-lg mb-2 manga-title transform -rotate-1">Status</h4>
                <div className="flex flex-wrap gap-2">
                  {availableStatus.map((status, idx) => (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`manga-border px-3 py-1 text-sm transition-colors capitalize transform ${
                        filterOptions.status.includes(status)
                          ? 'bg-red-500/30 text-white'
                          : 'hover:bg-white/10'
                      }`}
                      style={{ transform: `rotate(${idx % 2 ? 1 : -1}deg)` }}
                    >
                      {filterOptions.status.includes(status) && (
                        <Check className="inline-block w-3 h-3 mr-1" />
                      )}
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Rating */}
              <div>
                <h4 className="text-lg mb-2 manga-title transform -rotate-1">Minimum Rating</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={filterOptions.minRating}
                    onChange={(e) => setFilterOptions(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                    className="w-full accent-red-500"
                  />
                  <div className="flex items-center whitespace-nowrap">
                    <Star className="inline-block w-4 h-4 text-yellow-500 mr-1" />
                    <span>{filterOptions.minRating.toFixed(1)}+</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowFilters(false)}
                className="manga-gradient manga-border px-6 py-2 font-semibold transition-all transform hover:scale-105 hover:rotate-1 manga-title"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="manga-panel p-6 bg-black/50 transform rotate-2">
              <p className="manga-title text-xl">Loading manga collection...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="manga-panel p-6 bg-black/50 transform -rotate-2">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <p className="manga-title text-xl text-red-500">Error: {error}</p>
              </div>
            </div>
          </div>
        ) : filteredManga.length === 0 ? (
          <div className="manga-panel p-8 bg-black/30 transform rotate-1 text-center">
            <p className="manga-title text-xl mb-4">No manga found matching your filters</p>
            <button
              onClick={clearFilters}
              className="inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredManga.map((manga, index) => (
              <Link 
                key={manga.id}
                to={`/manga/${manga.id}`}
                className="group relative aspect-[3/4] manga-panel overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300"
                style={{ transform: `rotate(${index % 2 ? 1 : -1}deg)` }}
              >
                <img
                  src={manga.coverImage}
                  alt={manga.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 p-4 w-full">
                    <h3 className="text-lg manga-title transform -rotate-2">{manga.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">{manga.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {manga.genres.slice(0, 2).map((genre: string, idx: number) => (
                        <span
                          key={`${manga.id}-${genre}`}
                          className="text-xs manga-border px-2 py-1 transform"
                          style={{ transform: `rotate(${idx % 2 ? 2 : -2}deg)` }}
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Info className="w-4 h-4 text-gray-400" />
                      <span className="capitalize text-xs">{manga.type} • {manga.status}</span>
                    </div>
                  </div>
                </div>
                
                {/* Status badges */}
                <div className="absolute top-2 left-0 right-0 flex justify-center gap-2">
                  {manga.isNew && (
                    <span className="action-bubble bg-red-500 text-xs font-semibold">
                      NEW
                    </span>
                  )}
                  {manga.isTrending && (
                    <span className="action-bubble bg-blue-500 text-xs font-semibold">
                      TRENDING
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {/* Load more button - disabled for now to improve performance */}
        {!loading && !error && filteredManga.length > 0 && false && (
          <div className="flex justify-center mt-10">
            <button 
              onClick={loadMore}
              disabled={loading}
              className="manga-gradient manga-border px-8 py-3 font-semibold transition-all transform hover:scale-105 hover:rotate-2 manga-title">
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;