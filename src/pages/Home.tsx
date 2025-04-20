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

const Home: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'trending'|'new'|'recommended'|'search'>('trending');
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const limit = 12;
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic featured manga for hero section
  type FeaturedData = { id: string; title: string; description: string; popularity: number; cover_image_url?: string; cover_image?: string; image_url?: string; };
  const [featuredData, setFeaturedData] = useState<FeaturedData | null>(null);
  const [featuredChapterNumber, setFeaturedChapterNumber] = useState<number>(1);

  // Resolve Supabase storage path to public URL
  const resolvePublicUrl = (path: string) => {
    const { data } = supabase.storage.from('manga_covers').getPublicUrl(path);
    return data.publicUrl;
  };

  // Load featured manga
  useEffect(() => {
    const loadFeatured = async () => {
      const { data, error } = await supabase
        .from('manga_entries')
        .select('id, title, description, popularity, cover_image_url, cover_image, image_url')
        .order('popularity', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) {
        setFeaturedData(data);
        const { data: chap, error: chapErr } = await supabase
          .from('chapters')
          .select('chapter_number')
          .eq('manga_id', data.id)
          .order('chapter_number', { ascending: true })
          .limit(1)
          .single();
        if (!chapErr && chap) setFeaturedChapterNumber(chap.chapter_number);
      }
    };
    loadFeatured();
  }, []);

  // Derived hero values
  const heroImage = featuredData ? (() => {
    const raw = featuredData.cover_image_url || featuredData.cover_image || featuredData.image_url || '';
    return raw.startsWith('http') ? raw : (raw ? resolvePublicUrl(raw) : '');
  })() : 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&q=80';
  const heroTitle = featuredData?.title || 'Spirit Hunter';
  const heroDescription = featuredData?.description || 'Follow the journey of a young exorcist as she battles supernatural forces in modern-day Tokyo. A thrilling tale of action, mystery, and redemption.';
  const heroRating = featuredData?.popularity || 4.8;
  const heroChapterCount = featuredChapterNumber;
  const heroTrendingRank = 1;

  // Reset pagination and list on tab or search change
  useEffect(() => {
    setPage(0);
    setMangaList([]);
    setHasMore(true);
  }, [activeTab, searchTerm]);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        setLoading(true);
        let response: any;
        const offset = page * limit;
        if (activeTab === 'trending') {
          response = await supabase
            .from('manga_entries')
            .select(`*, genres:manga_genres(genres(*)), tags:manga_tags(tags(*))`)
            .order('popularity', { ascending: false })
            .range(offset, offset + limit - 1);
        } else if (activeTab === 'new') {
          response = await supabase
            .from('manga_entries')
            .select(`*, genres:manga_genres(genres(*)), tags:manga_tags(tags(*))`)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        } else if (activeTab === 'recommended') {
          response = await supabase
            .from('manga_entries')
            .select(`*, genres:manga_genres(genres(*)), tags:manga_tags(tags(*))`)
            .order('popularity', { ascending: false })
            .range(offset, offset + limit - 1);
        } else if (activeTab === 'search') {
          response = await supabase
            .from('manga_entries')
            .select(`*, genres:manga_genres(genres(*)), tags:manga_tags(tags(*))`)
            .ilike('title', `%${searchTerm}%`)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        } else {
          response = await supabase
            .from('manga_entries')
            .select(`*, genres:manga_genres(genres(*)), tags:manga_tags(tags(*))`)
            .range(offset, offset + limit - 1);
        }
        if (response.error) throw new Error(response.error.message);

        // Map to UI format
        const items = (response.data || []).map((item: any) => {
          const raw = item.cover_image_url || item.cover_image || item.image_url || '';
          const imageUrl = raw
            ? (raw.startsWith('http') ? raw : resolvePublicUrl(raw))
            : `https://picsum.photos/seed/${item.id}/300/400`;
          return {
            id: item.id,
            title: item.title,
            rating: item.popularity,
            genres: item.genres?.map((g: any) => g.genres.name) || [],
            image: imageUrl,
            createdAt: item.created_at,
          };
        });
        setHasMore(items.length === limit);
        setMangaList(prev => page === 0 ? items : [...prev, ...items]);
      } catch (err: any) {
        console.error('Error fetching manga:', err);
        setError(err.message || 'Failed to fetch manga');
      } finally {
        setLoading(false);
      }
    };

    fetchManga();
  }, [activeTab, page, searchTerm]);

  const handleAddFavorite = async (mangaId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, manga_id: mangaId });
      if (error) throw error;
      window.alert('Added to favorites!');
    } catch (err: any) {
      console.error('Error adding to favorites:', err);
      window.alert('Failed to add to favorites.');
    }
  };

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
                  {heroTitle.split(' ')[0]}
                  <span className="text-red-500"> {heroTitle.split(' ')[1]}</span>
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
                to={`/reader/${featuredData?.id || 'featured-001'}/chapter/${heroChapterCount}`}
                className="manga-gradient manga-border px-8 py-4 font-semibold transition-all transform hover:scale-105 hover:-rotate-3 manga-title flex items-center gap-2"
              >
                <Flame className="w-6 h-6" />
                Start Reading
              </Link>
              <button 
                onClick={() => handleAddFavorite(featuredData?.id || 'featured-001')} 
                className="bg-white/10 manga-border px-8 py-4 font-semibold transition-all transform hover:scale-105 hover:rotate-3 manga-title flex items-center gap-2"
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
                <span>{heroChapterCount} Chapters</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span>Trending #{heroTrendingRank}</span>
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
              <button onClick={() => setPage(prev => prev + 1)} className="manga-gradient manga-border px-8 py-3 font-semibold transition-all transform hover:scale-105 hover:rotate-2 manga-title">
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