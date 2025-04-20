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
import { getMangaList, getRecommendations, addToFavorites } from '../lib/supabaseClient';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('trending');
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        setLoading(true);
        let response;

        if (activeTab === 'trending') {
          response = await getMangaList(12, 0);
        } else if (activeTab === 'new') {
          response = await getMangaList(12, 0);
          // For demonstration, we're using the same API but would filter by date in a real implementation
        } else if (activeTab === 'recommended') {
          response = await getRecommendations(12);
        } else {
          response = await getMangaList(12, 0);
        }

        if (response.error) throw new Error(response.error.message);
        
        // Transform the data to match our UI components
        const formattedData = response.data?.map((item: any) => ({
          id: item.id,
          title: item.title,
          rating: item.popularity || 4.5, // Using popularity as rating for now
          genres: item.genres?.map((g: any) => g.genres?.name || 'Genre') || ['Action', 'Adventure'],
          image: item.cover_image_url || `https://picsum.photos/seed/${item.id}/300/400`, // Placeholder image if none available
          isNew: new Date(item.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // Created within the last week
          trending: Math.random() > 0.5, // Randomly assign trending status
          impact: Math.random() > 0.7 ? 'HOT!' : (Math.random() > 0.5 ? 'NEW!!' : 'WOW!'), // Random impact text
        }));

        setMangaList(formattedData || []);
      } catch (err: any) {
        console.error('Error fetching manga:', err);
        setError(err.message || 'Failed to fetch manga');
      } finally {
        setLoading(false);
      }
    };

    fetchManga();
  }, [activeTab]);

  const handleAddFavorite = async (mangaId: string) => {
    if (!user) return;
    
    try {
      const { error } = await addToFavorites(user.id, mangaId);
      if (error) throw error;
      // Show success notification
    } catch (err: any) {
      console.error('Error adding to favorites:', err);
      // Show error notification
    }
  };

  // Featured manga - could be from the list or hardcoded for now
  const featuredManga = {
    id: 'featured-001',
    title: 'Spirit Hunter',
    description: 'Follow the journey of a young exorcist as she battles supernatural forces in modern-day Tokyo. A thrilling tale of action, mystery, and redemption.',
    rating: 4.8,
    chapterCount: 24,
    trendingRank: 1,
    image: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&q=80',
  };

  return (
    <main className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden manga-panel">
        <div
          className="absolute inset-0 bg-cover bg-center transform hover:scale-105 transition-transform duration-700"
          style={{
            backgroundImage: `url("${featuredManga.image}")`,
          }}
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
                  {featuredManga.title.split(' ')[0]}
                  <span className="text-red-500"> {featuredManga.title.split(' ')[1]}</span>
                </h1>
                <span className="impact-text absolute -top-8 right-0 transform rotate-12">
                  BOOM!
                </span>
              </div>
              <div className="speech-bubble transform -rotate-1">
                <p className="text-lg md:text-xl leading-relaxed">
                  {featuredManga.description}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Link 
                to={`/manga/${featuredManga.id}`}
                className="manga-gradient manga-border px-8 py-4 font-semibold transition-all transform hover:scale-105 hover:-rotate-3 manga-title flex items-center gap-2"
              >
                <Flame className="w-6 h-6" />
                Start Reading
              </Link>
              <button 
                onClick={() => handleAddFavorite(featuredManga.id)} 
                className="bg-white/10 manga-border px-8 py-4 font-semibold transition-all transform hover:scale-105 hover:rotate-3 manga-title flex items-center gap-2"
              >
                <Sparkles className="w-6 h-6" />
                Add to List
              </button>
            </div>

            <div className="flex items-center gap-6 manga-panel p-4 bg-black/50 transform rotate-1">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">{featuredManga.rating}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span>{featuredManga.chapterCount} Chapters</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span>Trending #{featuredManga.trendingRank}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative transform hover:scale-[1.01] transition-transform">
            <input
              type="text"
              placeholder="Search for manga titles, authors, or genres..."
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
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
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
                  {(manga.isNew || manga.trending) && (
                    <div className="absolute top-2 left-2 action-bubble bg-red-500 text-xs font-semibold">
                      {manga.impact}
                    </div>
                  )}
                  <span className="impact-text absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {manga.impact}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && mangaList.length > 0 && (
            <div className="flex justify-center mt-10">
              <button className="manga-gradient manga-border px-8 py-3 font-semibold transition-all transform hover:scale-105 hover:rotate-2 manga-title">
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