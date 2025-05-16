import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Heart,
  Star,
  TrendingUp,
  Clock,
  Flame,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { addToReadingList } from '../lib/supabaseClient';
import { getSettings } from '../lib/settingsApi';
import SiteAnnouncement from '../components/SiteAnnouncement';
// New imports for data persistence
import useMangaList from '../hooks/useMangaList';
import useFeaturedManga from '../hooks/useFeaturedManga';
import AppStorage from '../lib/AppStorage';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'trending'|'new'|'recommended'|'search'>('trending');
  const [page, setPage] = useState(0);
  const limit = 6;
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteAnnouncement, setSiteAnnouncement] = useState<string | null>(null);

  // Use the custom hook for featured manga
  const { 
    data: featuredData,
    isLoading: featuredLoading
  } = useFeaturedManga();

  // Use the custom hook for manga lists with persistent caching
  const {
    data: mangaList = [],
    isLoading: mangaLoading,
    isError: mangaError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMangaList({
    category: activeTab, 
    limit,
    offset: page * limit,
    searchTerm,
  });

  // Set loading state based on the queries
  useEffect(() => {
    setLoading(featuredLoading || mangaLoading);
  }, [featuredLoading, mangaLoading]);
  
  // Set error state based on the queries
  useEffect(() => {
    setError(mangaError ? "Failed to load manga data" : null);
  }, [mangaError]);
  
  // Update has more based on the query response
  useEffect(() => {
    setHasMore(!!hasNextPage);
  }, [hasNextPage]);

  // Resolve Supabase storage path to public URL
  const resolvePublicUrl = (path: string) => {
    const { data } = supabase.storage.from('manga_covers').getPublicUrl(path);
    return data.publicUrl;
  };

  // Load site announcement from settings
  useEffect(() => {
    getSettings().then(settings => {
      if (settings.announcement) {
        setSiteAnnouncement(settings.announcement);
      }
    });
  }, []);

  // Derived hero values with better fallbacks and processing
  const heroImage = featuredData ? featuredData.imageUrl : 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&q=80';
  
  // Process title for display - split for styling if it has multiple words
  const heroTitle = featuredData?.title || 'Spirit Hunter';
  const heroTitleParts = heroTitle.split(' ');
  const heroTitleFirst = heroTitleParts[0];
  const heroTitleRest = heroTitleParts.slice(1).join(' ');
  
  const heroDescription = featuredData?.description || 'Follow the journey of a young exorcist as she battles supernatural forces in modern-day Tokyo. A thrilling tale of action, mystery, and redemption.';
  const heroRating = featuredData?.popularity ? Number(featuredData.popularity).toFixed(1) : '4.8';
  const heroChapterCount = featuredData?.firstChapter || 1;
  const heroTrendingRank = 1;

  // Reset pagination and list on tab or search change
  useEffect(() => {
    setPage(0);
  }, [activeTab, searchTerm]);

  // Load more function
  const loadMore = () => {
    if (!isFetchingNextPage && hasNextPage) {
      setPage(prev => prev + 1);
      fetchNextPage();
    }
  };

  const handleAddFavorite = async (mangaId: string) => {
    if (!user) {
      window.alert('Please log in to add to favorites');
      return;
    }
    
    // Check if already in favorites
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)
        .single();
        
      if (error || !data) {
        // Not in favorites, add it
        await addToReadingList(user.id, mangaId, 'reading');
        window.alert('Added to your reading list!');
      } else {
        window.alert('Already in your favorites!');
      }
    } catch (err) {
      console.error('Error adding to favorites:', err);
    }
  };

  const handleAddReadingList = async (mangaId: string) => {
    if (!user) {
      window.alert('Please log in to add to your reading list');
      return;
    }
    try {
      const { error } = await addToReadingList(user.id, mangaId, 'plan_to_read');
      if (error) throw error;
      window.alert('Added to your reading list!');
    } catch (err: any) {
      console.error('Error adding to reading list:', err);
      window.alert('Failed to add to reading list: ' + (err.message || 'Unknown error'));
    }
  };

  // Site title and description from settings
  useEffect(() => {
    getSettings().then(settings => {
      if (settings.siteTitle) {
        document.title = settings.siteTitle;
      } else {
        document.title = 'MangaVerse';
      }
      if (settings.siteDescription) {
        const descTag = document.querySelector('meta[name="description"]');
        if (descTag) {
          descTag.setAttribute('content', settings.siteDescription);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'description';
          meta.content = settings.siteDescription;
          document.head.appendChild(meta);
        }
      }
    });
  }, []);

  return (
    <main className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden manga-panel">
        <div
          className="absolute inset-0 bg-cover bg-center transform hover:scale-105 transition-transform duration-700"
          style={{ backgroundImage: `url("${heroImage}")` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <span className="inline-block action-bubble bg-red-500 text-sm font-semibold">
                Featured Release
              </span>
              <div className="relative">
                <h1 className="manga-title text-6xl md:text-8xl leading-tight transform -rotate-2">
                  {heroTitleFirst}
                  {heroTitleRest && <span className="text-red-500"> {heroTitleRest}</span>}
                </h1>
                <span className="impact-text absolute -top-8 right-0 transform rotate-12">
                  BOOM!
                </span>
              </div>
              <div className="speech-bubble transform -rotate-1">
                <p className="text-lg md:text-xl leading-relaxed">
                  {heroDescription}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Link 
                to={featuredData?.id ? `/reader/${featuredData.id}/chapter/${heroChapterCount}` : '#'}
                className={`manga-gradient manga-border px-8 py-4 font-semibold transition-all transform hover:scale-105 hover:-rotate-3 manga-title flex items-center gap-2 ${!featuredData?.id || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => {
                  if (!featuredData?.id) {
                    e.preventDefault();
                    window.alert('Featured manga is not available right now');
                  } else {
                    console.log(`Navigating to chapter ${heroChapterCount} of ${featuredData.title}`);
                  }
                }}
              >
                <Flame className="w-6 h-6" />
                Start Reading
              </Link>
              <button 
                onClick={() => {
                  if (featuredData?.id) {
                    handleAddReadingList(featuredData.id);
                    console.log(`Adding ${featuredData.title} to reading list`);
                  } else {
                    window.alert('Featured manga is not available to add to your list');
                  }
                }} 
                disabled={!featuredData?.id || loading}
                className={`bg-white/10 manga-border px-8 py-4 font-semibold transition-all transform hover:scale-105 hover:rotate-3 manga-title flex items-center gap-2 ${!featuredData?.id || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Sparkles className="w-6 h-6" />
                Add to List
              </button>
            </div>

            <div className="flex items-center gap-6 manga-panel p-4 bg-black/50 transform rotate-1">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">{heroRating}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span>{heroChapterCount} {heroChapterCount === 1 ? 'Chapter' : 'Chapters'}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span>Trending #{heroTrendingRank}</span>
              </div>
              {loading && (
                <div className="flex items-center gap-2 ml-auto">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Loading...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* Announcement Banner - Place it below hero and above search bar */}
      <SiteAnnouncement />
      {/* Search Section */}
      <section className="py-12 bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative transform hover:scale-[1.01] transition-transform">
            <input
              type="text"
              placeholder="Search for manga titles..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setActiveTab('search'); }}
              className="w-full manga-panel bg-white/10 py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 mb-8 border-b border-white/10">
            {[
              { id: 'trending', label: 'Trending', icon: TrendingUp },
              { id: 'new', label: 'New Releases', icon: Clock },
              { id: 'recommended', label: 'For You', icon: Heart },
              { id: 'search', label: 'Search', icon: BookOpen },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'trending'|'new'|'recommended'|'search')}
                className={`flex items-center gap-2 pb-4 transition-colors manga-title transform hover:rotate-2 ${
                  activeTab === id 
                    ? 'text-red-500 border-b-2 border-red-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="manga-panel p-6 bg-black/50 transform rotate-2">
                <p className="manga-title text-xl">Loading awesome manga...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <div className="manga-panel p-6 bg-black/50 transform -rotate-2">
                <p className="manga-title text-xl text-red-500">Error: {error}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {mangaList.map((manga, index) => (
                <div
                  key={manga.id}
                  className="group relative aspect-[3/4] manga-panel overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 manga-card"
                  style={{ transform: `rotate(${index % 2 ? 1 : -1}deg)` }}
                >
                  <Link to={`/manga/${manga.id}`}>
                    <img
                      src={manga.image}
                      alt={manga.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Badge */}
                    {activeTab !== 'recommended' && (
                      <div className="absolute top-2 left-2 action-bubble bg-red-500 text-xs font-semibold">
                        {activeTab === 'trending' ? 'Trending' : activeTab === 'new' ? 'New' : ''}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 p-4 w-full">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg manga-title transform -rotate-2">{manga.title}</h3>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddFavorite(manga.id);
                            }}
                          >
                            <Heart className="w-5 h-5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity transform rotate-12" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">{manga.rating}</span>
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
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && mangaList.length > 0 && hasMore && activeTab !== 'recommended' && activeTab !== 'search' && (
            <div className="flex justify-center mt-10">
              <button onClick={loadMore} className="manga-gradient manga-border px-8 py-3 font-semibold transition-all transform hover:scale-105 hover:rotate-2 manga-title">
                Load More
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;