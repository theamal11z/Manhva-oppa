import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, TrendingUp, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { updateUserRecommendations, checkAndUpdateRecommendations } from '../lib/recommendationScheduler';
import RecommendationOnboarding from '../components/RecommendationOnboarding';
import { useAuth } from '../hooks/useAuth';

// Type definition for recommendation item
interface Recommendation {
  id: string;
  title: string;
  cover_image: string;
  reason: string;
  match_percentage: number;
  genres: string[];
  updated_at: string;
}

// Type for user profile data
interface UserProfile {
  genres: string[];
  themes: string[];
  tropes: string[];
  characters: string[];
  pace?: string;
  tone?: string;
  avoid_genres: string[];
}

const SmartRecommendations: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  // We store the user profile but don't use it directly in the UI
  // It's needed to track what the user's preferences are
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'best-matches' | 'new'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [nextUpdate, setNextUpdate] = useState<string | null>(null);
  
  // Track if recommendations have been fetched to prevent repeated fetches
  const [hasFetched, setHasFetched] = useState(false);
  
  // Fetch recommendations ONLY when the component mounts or user changes
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (!hasFetched) {
        // Only fetch if we haven't already fetched recommendations
        fetchRecommendations();
        setHasFetched(true);
      }
    }
  }, [user, authLoading, navigate, hasFetched]);

  // Fetch recommendations from the database
  const fetchRecommendations = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      // Get recommendation data
      const { data, error } = await supabase
        .from('user_recommendations')
        .select('recommendations, profile, last_updated, next_update')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error) throw error;
      
      if (!data) {
        console.log('No recommendations found, user may need onboarding');
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }
      
      // Update state with fetched data, even if empty (to prevent refresh loops)
      setRecommendations(data.recommendations && Array.isArray(data.recommendations) ? data.recommendations : []);
      setUserProfile(data.profile || null);
      setLastUpdated(data.last_updated);
      setNextUpdate(data.next_update);
      
      // Only refresh if there are truly no recommendations
      if (!data.recommendations || !Array.isArray(data.recommendations) || data.recommendations.length === 0) {
        console.log('Empty recommendations, running one-time update');
        await refreshRecommendations();
        return;
      }
      
      // Only check for auto-updates if we're not already in a refresh cycle
      const lastUpdateTime = data.last_updated ? new Date(data.last_updated).getTime() : 0;
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      // Only check for updates if last update was more than a day ago
      if (lastUpdateTime < oneDayAgo) {
        console.log('Checking if recommendations need updating (last update was >24h ago)');
        checkAndUpdateRecommendations(user.id)
          .then((updated) => {
            if (updated) {
              console.log('Recommendations were automatically updated');
              // Get the updated recommendations without triggering another refresh
              supabase
                .from('user_recommendations')
                .select('recommendations')
                .eq('user_id', user.id)
                .maybeSingle()
                .then(({ data: updatedData }) => {
                  if (updatedData?.recommendations) {
                    setRecommendations(updatedData.recommendations);
                  }
                });
            }
          })
          .catch(console.error);
      }
      
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Refresh recommendations from the API - with protection against multiple refreshes
  const refreshRecommendations = async () => {
    // Guard clauses to prevent multiple refreshes
    if (!user || refreshing) {
      console.log('Skipping refresh - user not ready or already refreshing');
      return;
    }
    
    // Set a flag to indicate refresh is in progress
    setRefreshing(true);
    setError(null);
    
    // Set a timeout to provide feedback if taking too long
    const feedbackTimeoutId = setTimeout(() => {
      setError('Recommendation generation is taking longer than expected. Please wait...');
    }, 10000); // Show message after 10 seconds
    
    try {
      console.log('Starting recommendation refresh...');
      
      // Run the update
      const updated = await updateUserRecommendations(user.id);
      
      if (!updated) {
        throw new Error('Failed to update recommendations');
      }
      
      // Verify recommendations were actually saved to the database
      console.log('Verifying recommendations were saved...');
      const { data, error: verifyError } = await supabase
        .from('user_recommendations')
        .select('recommendations')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (verifyError) throw verifyError;
      
      if (!data || !data.recommendations || !Array.isArray(data.recommendations)) {
        throw new Error('Recommendations were not saved to the database');
      }
      
      console.log('Successfully verified recommendations, updating UI...');
      
      // Update the recommendations directly instead of triggering another fetch
      setRecommendations(data.recommendations);
      
      // Update last updated time
      const { data: timeData } = await supabase
        .from('user_recommendations')
        .select('last_updated, next_update')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (timeData) {
        setLastUpdated(timeData.last_updated);
        setNextUpdate(timeData.next_update);
      }
      
      // Show success notification
      setSaveNotice(true);
      setTimeout(() => setSaveNotice(false), 3000);
    } catch (err: any) {
      console.error('Refresh error:', err);
      if (err.message.includes('timed out') || err.message.includes('took too long')) {
        setError('The recommendation service is currently busy. Please try again later.');
      } else {
        setError(err.message || 'Failed to refresh recommendations');
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Filter recommendations based on current filter setting
  const filteredRecommendations = recommendations.filter(rec => {
    switch (filter) {
      case 'best-matches':
        return rec.match_percentage >= 85;
      case 'new':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(rec.updated_at) > oneWeekAgo;
      default:
        return true;
    }
  });

  // Handle completion of the onboarding process
  // Memoize the onboarding complete handler to prevent recreation on every render
  const handleOnboardingComplete = React.useCallback(() => {
    setNeedsOnboarding(false);
    fetchRecommendations();
  }, []);
  
  // Memoize the refresh handler to prevent it from triggering on re-renders
  const handleRefreshClick = React.useCallback(() => {
    if (!refreshing) {
      refreshRecommendations();
    }
  }, [refreshing]);

  // Loading state
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }
  
  // Show onboarding for new users
  if (needsOnboarding && user) {
    return <RecommendationOnboarding userId={user.id} onComplete={handleOnboardingComplete} />;
  }

  // Main component render
  return (
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
      ) : filteredRecommendations.length === 0 ? (
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
        /* Recommendation grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecommendations.map((rec) => (
            <div key={rec.id} className="manga-card bg-gray-800/50 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-700/50 hover:-translate-y-1">
              <Link to={`/manga/${rec.id}`} className="block">
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={rec.cover_image} 
                    alt={rec.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-cover.jpg';
                    }}
                  />
                  <div className="absolute bottom-0 right-0 bg-red-500 text-white px-2 py-1 text-sm font-semibold">
                    {rec.match_percentage}% Match
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2 line-clamp-1">{rec.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {rec.genres.slice(0, 3).map((genre, idx) => (
                      <span key={idx} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                        {genre}
                      </span>
                    ))}
                    {rec.genres.length > 3 && (
                      <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                        +{rec.genres.length - 3}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2">{rec.reason}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Last updated info */}
      {lastUpdated && (
        <div className="mt-8 text-gray-500 text-xs text-center">
          <p>Last updated: {new Date(lastUpdated).toLocaleString()}</p>
          {nextUpdate && (
            <p>Next scheduled update: {new Date(nextUpdate).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartRecommendations;
