import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  AlertCircle,
  BookOpen,
  Users,
  Settings,
  BarChart2,
  Menu,
  X,
  LogOut,
  FileText
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import Dashboard from '../components/admin/Dashboard';
import MangaManager from '../components/admin/MangaManager';
import UserManager from '../components/admin/UserManager';
import ChapterManager from '../components/admin/ChapterManager';
import AdminSettings from '../components/admin/AdminSettings';

const Admin: React.FC = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  
  // Parse view from URL hash or default to dashboard
  const getViewFromHash = () => {
    const hash = location.hash.replace('#', '');
    if (['dashboard', 'manga', 'chapters', 'users', 'settings'].includes(hash)) {
      return hash as 'dashboard' | 'manga' | 'chapters' | 'users' | 'settings';
    }
    return 'dashboard';
  };
  
  const [activeView, setActiveView] = useState<'dashboard' | 'manga' | 'chapters' | 'users' | 'settings'>(getViewFromHash());
  const [mainContentHeight, setMainContentHeight] = useState<string>('auto');
  
  // Update activeView when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setActiveView(getViewFromHash());
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Handle sidebar responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      setSidebarOpen(isDesktop);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate and set the proper height for the main content area
  useEffect(() => {
    const calculateHeight = () => {
      // Get the viewport height
      const vh = window.innerHeight;
      // Subtract header height (if any)
      const headerHeight = 0; // No header in new layout
      const contentHeight = vh - headerHeight;
      setMainContentHeight(`${contentHeight}px`);
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    
    return () => {
      window.removeEventListener('resize', calculateHeight);
    };
  }, []);
  
  // Handle tab navigation
  const handleTabChange = (view: 'dashboard' | 'manga' | 'chapters' | 'users' | 'settings') => {
    if (activeView !== view) {
      // Reset scroll position
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
      }
      
      // Update URL hash for direct link support
      window.location.hash = view;
      setActiveView(view);
      
      // On mobile, close sidebar after navigation
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a0a]">
        <div className="manga-panel p-8 bg-black/50 transform rotate-2">
          <p className="manga-title text-2xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a0a]">
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
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Sidebar Overlay - Mobile Only */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#100f0f] border-r border-white/10 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h1 className="manga-title text-xl text-red-500 transform -rotate-2">Admin Panel</h1>
            <button 
              className="lg:hidden p-2 hover:text-red-500"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Admin Profile */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                {user.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="truncate text-sm font-medium">{user.email}</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 p-2 overflow-y-auto">
            <div className="space-y-1">
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${
                  activeView === 'dashboard'
                    ? 'bg-red-500/20 text-red-500'
                    : 'hover:bg-black/40 text-gray-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-5 h-5 mr-3" />
                <span className="manga-title">Dashboard</span>
              </button>
              
              <button
                onClick={() => handleTabChange('manga')}
                className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${
                  activeView === 'manga'
                    ? 'bg-red-500/20 text-red-500'
                    : 'hover:bg-black/40 text-gray-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-5 h-5 mr-3" />
                <span className="manga-title">Manga Library</span>
              </button>
              
              <button
                onClick={() => handleTabChange('chapters')}
                className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${
                  activeView === 'chapters'
                    ? 'bg-red-500/20 text-red-500'
                    : 'hover:bg-black/40 text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5 mr-3" />
                <span className="manga-title">Chapters</span>
              </button>
              
              <button
                onClick={() => handleTabChange('users')}
                className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${
                  activeView === 'users'
                    ? 'bg-red-500/20 text-red-500'
                    : 'hover:bg-black/40 text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-5 h-5 mr-3" />
                <span className="manga-title">Users</span>
              </button>
              
              <button
                onClick={() => handleTabChange('settings')}
                className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${
                  activeView === 'settings'
                    ? 'bg-red-500/20 text-red-500'
                    : 'hover:bg-black/40 text-gray-400 hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5 mr-3" />
                <span className="manga-title">Settings</span>
              </button>
            </div>
          </nav>
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="space-y-2">
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center px-4 py-2 rounded-md transition-colors hover:bg-black/40 text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5 mr-3" />
                <span>Back to Site</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 rounded-md transition-colors hover:bg-red-900/20 text-gray-400 hover:text-red-500"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
        {/* Top Bar */}
        <div className="bg-[#0f0f0f] border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="lg:hidden p-2 mr-2 hover:text-red-500 rounded-md"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-medium">
              {activeView === 'dashboard' && 'Dashboard Overview'}
              {activeView === 'manga' && 'Manga Library'}
              {activeView === 'chapters' && 'Chapter Manager'}
              {activeView === 'users' && 'User Management'}
              {activeView === 'settings' && 'Admin Settings'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="manga-border px-3 py-1 hover:text-red-500 transition-all text-sm hidden sm:flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              View Site
            </button>
          </div>
        </div>
        
        {/* Content Area with proper stacking context */}
        <div 
          ref={mainContentRef}
          className="flex-1 overflow-auto"
          style={{ height: mainContentHeight }}
        >
          <div className="h-full">
            {activeView === 'dashboard' && <Dashboard />}
            {activeView === 'manga' && <MangaManager />}
            {activeView === 'chapters' && <ChapterManager />}
            {activeView === 'users' && <UserManager />}
            
            {activeView === 'settings' && (
  <div className="p-4">
    <div className="manga-panel p-6 bg-black/30 relative z-0">
      <h2 className="text-2xl font-bold manga-title mb-6">Admin Settings</h2>
      <div className="relative z-10">
        <AdminSettings />
      </div>
    </div>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;