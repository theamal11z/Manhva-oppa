import React, { useState, useEffect } from 'react';
import { BookOpen, Users, TrendingUp, BarChart2, RefreshCw, Calendar, Star, Plus } from 'lucide-react';
import { getDashboardStats } from '../../lib/supabaseClient';

type DashboardStats = {
  mangaCount: number;
  userCount: number;
  recentManga: any[];
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    mangaCount: 0,
    userCount: 0,
    recentManga: []
  });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchStats = async (force = false) => {
    // Prevent excessive fetching by requiring at least 10 seconds between fetches
    // unless force=true is specified
    const now = Date.now();
    if (!force && lastFetchTime && now - lastFetchTime < 10000) {
      return;
    }
    
    try {
      setError(null);
      setRefreshing(true);
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
      setLastFetchTime(now);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchStats();
    
    // Set up visibility change detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Dashboard: Tab became visible, refreshing data');
        fetchStats();
      }
    };
    
    // Handle page focus/visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Reload data regularly when tab is visible
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    }, 60000); // Every minute if tab is visible
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  const handleRefresh = () => {
    if (!refreshing) {
      fetchStats(true); // Force refresh
    }
  };

  if (loading) {
    return (
      <div className="manga-panel p-6 bg-black/30 text-center">
        <p className="manga-title text-xl">Loading dashboard data...</p>
        <RefreshCw className="w-8 h-8 mx-auto mt-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold manga-title">Dashboard Overview</h2>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="manga-border px-4 py-2 hover:text-blue-500 transition-all flex items-center gap-2 self-start"
          type="button"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="manga-panel p-4 bg-red-900/30 border border-red-500 mb-6">
          <p className="font-bold text-red-500">Error loading dashboard data</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 px-4 py-1 bg-red-900/50 hover:bg-red-900/70 transition-colors rounded text-sm"
            type="button"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="manga-panel p-4 sm:p-6 bg-black/30">
          <div className="flex items-center">
            <div className="manga-border p-3 bg-red-500/20 text-red-500 mr-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Manga</p>
              <p className="text-2xl font-bold manga-title">{stats.mangaCount}</p>
            </div>
          </div>
        </div>
        
        <div className="manga-panel p-4 sm:p-6 bg-black/30">
          <div className="flex items-center">
            <div className="manga-border p-3 bg-blue-500/20 text-blue-500 mr-4">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Registered Users</p>
              <p className="text-2xl font-bold manga-title">{stats.userCount}</p>
            </div>
          </div>
        </div>
        
        <div className="manga-panel p-4 sm:p-6 bg-black/30">
          <div className="flex items-center">
            <div className="manga-border p-3 bg-green-500/20 text-green-500 mr-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Engagement Rate</p>
              <p className="text-2xl font-bold manga-title">82%</p>
            </div>
          </div>
        </div>
        
        <div className="manga-panel p-4 sm:p-6 bg-black/30">
          <div className="flex items-center">
            <div className="manga-border p-3 bg-purple-500/20 text-purple-500 mr-4">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Average Rating</p>
              <p className="text-2xl font-bold manga-title">4.7</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Manga */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold manga-title">Recent Manga</h3>
          <a href="#manga" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View All</a>
        </div>
        
        <div className="manga-panel bg-black/30 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/40">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 hidden sm:table-cell">Author</th>
                <th className="py-3 px-4 hidden md:table-cell">Type</th>
                <th className="py-3 px-4">Date Added</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentManga.length === 0 ? (
                <tr className="border-b border-white/10">
                  <td colSpan={4} className="py-6 text-center text-gray-400">
                    No manga entries yet
                    <div className="mt-2">
                      <button 
                        onClick={() => window.location.hash = 'manga'}
                        className="manga-border px-4 py-2 hover:text-red-500 transition-all inline-flex items-center"
                        type="button"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Manga
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                stats.recentManga.map((manga, idx) => (
                  <tr key={idx} className="border-b border-white/10 hover:bg-black/20">
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center">
                        <div className="w-8 h-10 bg-gray-800 shrink-0 overflow-hidden mr-2">
                          {manga.cover_image ? (
                            <img 
                              src={manga.cover_image} 
                              alt={manga.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-700">
                              <BookOpen className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <span className="truncate max-w-[150px]">{manga.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-gray-300">{manga.author || 'Unknown'}</td>
                    <td className="py-3 px-4 capitalize hidden md:table-cell text-gray-300">{manga.type || 'manga'}</td>
                    <td className="py-3 px-4 text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 shrink-0" />
                        <span>{new Date(manga.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Analytics Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Future Section for Analytics */}
        <div className="manga-panel p-4 sm:p-6 bg-black/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold manga-title flex items-center">
              <BarChart2 className="w-5 h-5 mr-2" />
              Analytics Snapshot
            </h3>
          </div>
          
          <div className="text-center py-6 sm:py-10 text-gray-400">
            <p>Detailed analytics coming soon.</p>
            <p className="mt-2 text-sm">Statistics and visualization for user engagement and content performance.</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="manga-panel p-4 sm:p-6 bg-black/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold manga-title">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <a 
              href="#manga" 
              className="manga-border p-3 text-center hover:bg-black/40 transition-colors flex flex-col items-center"
            >
              <BookOpen className="w-6 h-6 mb-2" />
              <span className="text-sm">Add Manga</span>
            </a>
            
            <a 
              href="#users" 
              className="manga-border p-3 text-center hover:bg-black/40 transition-colors flex flex-col items-center"
            >
              <Users className="w-6 h-6 mb-2" />
              <span className="text-sm">Manage Users</span>
            </a>
            
            <a 
              href="#settings" 
              className="manga-border p-3 text-center hover:bg-black/40 transition-colors flex flex-col items-center"
            >
              <RefreshCw className="w-6 h-6 mb-2" />
              <span className="text-sm">Update Site</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
