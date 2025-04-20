import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  BookOpen,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getMangaList, addMangaEntry, updateMangaEntry, deleteMangaEntry } from '../lib/supabaseClient';

const Admin: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'manga' | 'users' | 'settings'>('manga');
  
  useEffect(() => {
    // Redirect if not an admin
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);
  
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchMangaList = async () => {
      try {
        setLoading(true);
        const response = await getMangaList(50, 0);
        
        if (response.error) throw new Error(response.error.message);
        
        setMangaList(response.data || []);
      } catch (err: any) {
        console.error('Error fetching manga list:', err);
        setError(err.message || 'Failed to load manga entries');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMangaList();
  }, [isAdmin]);
  
  if (authLoading) {
    return (
      <div className="pt-20 flex justify-center items-center min-h-screen">
        <div className="manga-panel p-8 bg-black/50 transform rotate-2">
          <p className="manga-title text-2xl">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !isAdmin) {
    return (
      <div className="pt-20 flex justify-center items-center min-h-screen">
        <div className="manga-panel p-8 bg-black/50 transform -rotate-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="manga-title text-2xl text-red-500">Admin access required</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105"
          >
            <ChevronLeft className="inline-block mr-2" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="manga-title text-4xl transform -rotate-2">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage content and users</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105"
          >
            <ChevronLeft className="inline-block mr-2" />
            Back to Site
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-8 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveView('manga')}
            className={`flex items-center gap-2 pb-4 transition-colors manga-title transform hover:rotate-2 ${
              activeView === 'manga' 
                ? 'text-red-500 border-b-2 border-red-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Manga Library
          </button>
          
          <button
            onClick={() => setActiveView('users')}
            className={`flex items-center gap-2 pb-4 transition-colors manga-title transform hover:rotate-2 ${
              activeView === 'users' 
                ? 'text-red-500 border-b-2 border-red-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Users
          </button>
          
          <button
            onClick={() => setActiveView('settings')}
            className={`flex items-center gap-2 pb-4 transition-colors manga-title transform hover:rotate-2 ${
              activeView === 'settings' 
                ? 'text-red-500 border-b-2 border-red-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>
        
        {/* Manga Management */}
        {activeView === 'manga' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="manga-title text-2xl transform -rotate-1">Manage Manga Entries</h2>
              <div className="flex gap-2">
                <button className="manga-border p-2 hover:text-red-500 transition-colors">
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button className="manga-gradient manga-border px-4 py-2 font-semibold transition-all transform hover:scale-105 hover:rotate-2 manga-title flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Manga
                </button>
              </div>
            </div>
            
            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search manga titles..."
                  className="w-full manga-panel bg-white/10 py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <button className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>
            
            {/* Manga Table */}
            {loading ? (
              <div className="manga-panel p-6 bg-black/30 text-center">
                <p className="manga-title text-xl">Loading manga entries...</p>
              </div>
            ) : error ? (
              <div className="manga-panel p-6 bg-black/30 text-center">
                <p className="manga-title text-xl text-red-500">Error: {error}</p>
              </div>
            ) : mangaList.length === 0 ? (
              <div className="manga-panel p-8 bg-black/30 text-center">
                <p className="manga-title text-xl mb-4">No manga entries found</p>
                <p className="mb-6">Start adding manga to build your library.</p>
                <button className="manga-gradient manga-border px-6 py-3 font-semibold transition-all transform hover:scale-105 manga-title">
                  <Plus className="inline-block mr-2" />
                  Add First Manga
                </button>
              </div>
            ) : (
              <div className="manga-panel bg-black/20 overflow-hidden relative">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/40">
                      <th className="p-4">Title</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Created</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* For demo purposes, we'll show a few placeholder rows */}
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="border-t border-white/10 hover:bg-black/30 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-10 h-14 bg-gray-800 shrink-0">
                            {/* Placeholder for image */}
                          </div>
                          <span className="font-medium">Manga Title {idx + 1}</span>
                        </td>
                        <td className="p-4 capitalize">manga</td>
                        <td className="p-4 capitalize">ongoing</td>
                        <td className="p-4">{new Date().toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button className="manga-border p-2 hover:text-blue-500 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="manga-border p-2 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Placeholder for other tabs */}
        {activeView === 'users' && (
          <div className="manga-panel p-6 bg-black/30 text-center">
            <p className="manga-title text-xl mb-4">User Management</p>
            <p>This feature is coming soon.</p>
          </div>
        )}
        
        {activeView === 'settings' && (
          <div className="manga-panel p-6 bg-black/30 text-center">
            <p className="manga-title text-xl mb-4">Admin Settings</p>
            <p>This feature is coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;