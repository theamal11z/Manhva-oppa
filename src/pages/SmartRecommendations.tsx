import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, TrendingUp, Filter, RefreshCw, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { updateUserRecommendations, checkAndUpdateRecommendations } from '../lib/recommendationScheduler';
import RecommendationOnboarding from '../components/RecommendationOnboarding';
import { useAuth } from '../hooks/useAuth';
import RecommendationCard from '../components/RecommendationCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Recommendation {
  id: string;
  title: string;
  cover_image: string;
  reason: string;
  match_percentage: number;
  genres: string[];
  updated_at: string;
}

interface UserRecommendationsData {
  recommendations: Recommendation[];
  lastUpdated: string | null;
  nextUpdate: string | null;
  needsOnboarding: boolean;
}

const SmartRecommendations: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<'all' | 'best-matches' | 'new'>('all');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);

  const { 
    data: recommendationsData,
    isLoading: queryLoading,
    isError: queryIsError,
    error: queryError
  } = useQuery<UserRecommendationsData, Error>({
    queryKey: ['userRecommendations', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not available for fetching recommendations.");

      const { data, error: dbError } = await supabase
        .from('user_recommendations')
        .select('recommendations, last_updated, next_update')
        .eq('user_id', user.id)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        return { recommendations: [], lastUpdated: null, nextUpdate: null, needsOnboarding: true };
      }

      return {
        recommendations: data.recommendations && Array.isArray(data.recommendations) ? data.recommendations : [],
        lastUpdated: data.last_updated,
        nextUpdate: data.next_update,
        needsOnboarding: false,
      };
    },
    enabled: !!user && !authLoading,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  const { mutate: refreshMutate, isPending: refreshing } = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!user) throw new Error("User not available for refreshing recommendations.");

      console.log('Starting recommendation refresh via mutation...');
      const updated = await updateUserRecommendations(user.id);
      if (!updated) {
        console.warn('updateUserRecommendations did not return a truthy value during mutation.');
      }
    },
    onSuccess: () => {
      console.log('Refresh mutation successful, invalidating recommendations query.');
      queryClient.invalidateQueries({ queryKey: ['userRecommendations', user?.id] });
      setSaveNotice(true);
      setTimeout(() => setSaveNotice(false), 3000);
    },
    onError: (err: Error) => {
      console.error('Refresh mutation error:', err);
    },
  });

  const recommendations = recommendationsData?.recommendations || [];
  const lastUpdated = recommendationsData?.lastUpdated || null;
  const nextUpdate = recommendationsData?.nextUpdate || null;
  const needsOnboarding = recommendationsData?.needsOnboarding || false;
  const loading = queryLoading || (authLoading && !recommendationsData);
  const error = queryIsError ? queryError?.message || 'Failed to load recommendations.' : null;

  const availableGenres = useMemo(() => {
    if (!recommendationsData?.recommendations) return [];
    const allGenres = recommendationsData.recommendations.reduce((acc: string[], rec) => {
      rec.genres.forEach(genre => {
        if (!acc.includes(genre)) {
          acc.push(genre);
        }
      });
      return acc;
    }, []);
    return allGenres.sort();
  }, [recommendationsData?.recommendations]);

  const toggleGenreFilter = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && lastUpdated && recommendations.length > 0 && !refreshing && !loading) {
      const lastUpdateTime = new Date(lastUpdated).getTime();
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

      if (lastUpdateTime < oneDayAgo) {
        console.log('Checking if recommendations need updating (last update was >24h ago)');
        checkAndUpdateRecommendations(user.id)
          .then((updated) => {
            if (updated) {
              console.log('Recommendations were automatically updated, invalidating query.');
              queryClient.invalidateQueries({ queryKey: ['userRecommendations', user?.id] });
            }
          })
          .catch(err => console.error("Error during stale check and update:", err));
      }
    }
  }, [user, lastUpdated, recommendations, refreshing, loading, queryClient]);

  const handleRefreshClick = useCallback(() => {
    if (!refreshing) {
      console.log('Manual refresh triggered by user click');
      refreshMutate();
    }
  }, [refreshing, refreshMutate]);

  const filteredRecommendations = useMemo(() => {
    if (!Array.isArray(recommendations)) return [];
    return recommendations.filter(rec => {
      let mainFilterPass = false;
      switch (filter) {
        case 'best-matches':
          mainFilterPass = rec.match_percentage >= 85;
          break;
        case 'new':
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          mainFilterPass = new Date(rec.updated_at) > oneWeekAgo;
          break;
        default: // 'all'
          mainFilterPass = true;
          break;
      }
      if (!mainFilterPass) return false;

      if (selectedGenres.length > 0) {
        if (!rec.genres.some(genre => selectedGenres.includes(genre))) {
          return false;
        }
      }

      return true;
    });
  }, [recommendations, filter, selectedGenres]);

  if (authLoading && !recommendationsData) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <RecommendationOnboarding userId={user!.id} onComplete={() => {
      queryClient.invalidateQueries({ queryKey: ['userRecommendations', user?.id] });
    }} />;
  }

  return (
    <>
    <div className="container mx-auto px-4 py-8">
      {/* Success notification */}
      {saveNotice && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span>Recommendations have been saved!</span>
        </div>
      )}
      
      {/* Header section */}
      <div className="p-6 bg-black/30 mb-8 rounded-lg">
        <h1 className="text-3xl md:text-4xl mb-4 font-bold text-red-400">
          Smart Recommendations
        </h1>
        <p className="text-gray-300">
          Discover manga, manhwa, and more tailored for you, powered by our AI engine.
        </p>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <span className="text-gray-400 mr-2 flex items-center">
          <Filter className="w-4 h-4 mr-1" />
          Filter:
        </span>
        <button 
          onClick={() => setFilter('all')}
          className={`filter-button px-3 py-1 text-sm ${filter === 'all' ? 'bg-red-500/20 border border-red-500/50 text-red-400' : 'border border-gray-700 text-gray-300'}`}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('best-matches')}
          className={`filter-button px-3 py-1 text-sm flex items-center ${filter === 'best-matches' ? 'bg-red-500/20 border border-red-500/50 text-red-400' : 'border border-gray-700 text-gray-300'}`}
        >
          <Star className="w-3 h-3 mr-1" />
          Best Matches
        </button>
        <button 
          onClick={() => setFilter('new')}
          className={`filter-button px-3 py-1 text-sm flex items-center ${filter === 'new' ? 'bg-red-500/20 border border-red-500/50 text-red-400' : 'border border-gray-700 text-gray-300'}`}
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          New
        </button>
        
        {/* Genre Filter Dropdown */}
        <div className="relative ml-4">
          <button 
            onClick={() => setShowGenreFilter(!showGenreFilter)}
            className="filter-button px-3 py-1 text-sm flex items-center border border-gray-700 text-gray-300 disabled:opacity-50"
          >
            <Filter className="w-3 h-3 mr-1" />
            Genres ({selectedGenres.length > 0 ? selectedGenres.length : 'All'})
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showGenreFilter ? 'rotate-180' : ''}`} />
          </button>
          {showGenreFilter && availableGenres.length > 0 && (
            <div className="absolute z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1">
              <div className="px-2 py-1">
                <button 
                  onClick={() => setSelectedGenres([])} 
                  className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:bg-gray-700 rounded-md mb-1"
                >
                  Clear All Genres
                </button>
              </div>
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenreFilter(genre)}
                  className={`w-full text-left block px-3 py-1.5 text-sm hover:bg-gray-700 ${selectedGenres.includes(genre) ? 'text-red-400 font-semibold' : 'text-gray-300'}`}
                  role="menuitem"
                >
                  {selectedGenres.includes(genre) && <Check className="inline w-4 h-4 mr-2" />} 
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={handleRefreshClick}
          disabled={refreshing}
          className="ml-auto filter-button px-3 py-1 text-sm flex items-center border border-blue-500/50 text-blue-400 disabled:opacity-50"
        >
          {refreshing ? (
            <div className="w-3 h-3 mr-1 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          Refresh Recommendations
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-4 rounded-lg mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : filteredRecommendations.length === 0 && !error ? (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-70" />
          <p className="text-2xl mb-4 font-bold text-red-400">No matching recommendations found.</p>
          <p className="mb-6 text-gray-300">None of Gemini's recommendations matched your current manga library.<br />Try adding more manga or refreshing for new suggestions.</p>
          <button 
            onClick={handleRefreshClick}
            disabled={refreshing}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {refreshing ? 'Refreshing...' : 'Try Again'}
          </button>
        </div>
      ) : (
        <>
          {/* Recommendation grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
          {/* Last updated info */}
          {lastUpdated && (
            <div className="mt-8 text-gray-500 text-xs text-center">
              <p>Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : ''}</p>
              {nextUpdate && (
                <p>Next scheduled update: {nextUpdate ? new Date(nextUpdate).toLocaleString() : ''}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
};

export default SmartRecommendations;
