import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Heart,
  Library,
  Menu,
  Filter,
  X,
  LogOut,
  AlertCircle,
  User,
} from 'lucide-react';
import { useAuth } from './lib/AuthContext';
import { getSettings } from './lib/settingsApi';
import queryClient from './lib/QueryClient';

// Import pages
import Home from './pages/Home';
import MangaDetail from './pages/MangaDetail';
import Reader from './pages/Reader';
import Discover from './pages/Discover';
import MyList from './pages/MyList';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';

function App() {
  const { user, loading, signOut, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Fix for Profile page tabs not being clickable
  useEffect(() => {
    if (location.pathname === '/profile') {
      // Give time for the component to render
      const timer = setTimeout(() => {
        // Find all overlays that might be blocking clicks
        const overlays = document.querySelectorAll('.fixed, .absolute');
        
        overlays.forEach(overlay => {
          // Skip elements that are part of the Profile sidebar
          if (overlay.closest('.manga-panel') || 
              overlay.closest('button') || 
              overlay.closest('a')) {
            return;
          }
          
          // Check if this overlay is blocking clicks
          const style = window.getComputedStyle(overlay as Element);
          if (style.pointerEvents !== 'none' && 
              style.display !== 'none' && 
              style.visibility !== 'hidden') {
            // Make it not block clicks
            (overlay as HTMLElement).style.pointerEvents = 'none';
            console.log('Fixed overlay:', overlay);
          }
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Site title for navbar branding
  const [siteTitle, setSiteTitle] = useState('MangaVerse');
  useEffect(() => {
    getSettings().then(settings => {
      if (settings.siteTitle && typeof settings.siteTitle === 'string') {
        setSiteTitle(settings.siteTitle);
      }
    });
  }, []);

  // Handle scroll for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setShowFilters(false);
  }, [location.pathname]);

  // Handle clicking outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.mobile-menu') && !target.closest('.menu-button')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  // Simplified genres for filter representation
  const genres = ['Action', 'Romance', 'Fantasy', 'Horror', 'Comedy', 'Drama', 'Sci-fi', 'Mystery', 'Slice of Life'];

  // For auth protected routes
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) {
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
              <p className="manga-title text-2xl text-red-500">Login Required</p>
            </div>
            <p className="mt-2 mb-4">You need to be logged in to access this page.</p>
            <Link 
              to="/"
              className="mt-4 inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105"
            >
              Go to Home
            </Link>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  };

  // Admin only route protection
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) {
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
              <p className="manga-title text-2xl text-red-500">Login Required</p>
            </div>
            <p className="mt-2 mb-4">You need to be logged in to access this page.</p>
            <Link 
              to="/"
              className="mt-4 inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105"
            >
              Go to Home
            </Link>
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="pt-20 flex justify-center items-center min-h-screen">
          <div className="manga-panel p-8 bg-black/50 transform -rotate-2">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <p className="manga-title text-2xl text-red-500">Access Denied</p>
            </div>
            <p className="mt-2 mb-4">You don't have permission to access the admin panel.</p>
            <Link 
              to="/"
              className="mt-4 inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105"
            >
              Go to Home
            </Link>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <div className="fixed inset-0 screen-tone pointer-events-none" />
      
      {/* Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/90 backdrop-blur-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center manga-border bg-red-500 px-4 py-2 transform -rotate-2">
              <BookOpen className="w-8 h-8 text-white" />
              <span className="ml-2 text-xl manga-title">{siteTitle}</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/discover" 
                className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:-rotate-2 flex items-center gap-2"
              >
                <Library className="w-5 h-5" />
                Discover
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to="/my-list" 
                    className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-2 flex items-center gap-2"
                  >
                    <Heart className="w-5 h-5" />
                    My List
                  </Link>
                  
                  <Link 
                    to="/profile" 
                    className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:-rotate-2 flex items-center gap-2"
                  >
                    <User className="w-5 h-5" />
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:-rotate-2 flex items-center gap-2"
                    >
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-2 flex items-center gap-2"
                  >
                    Login
                  </Link>
                  
                  <Link 
                    to="/signup" 
                    className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:-rotate-2 flex items-center gap-2"
                  >
                    Signup
                  </Link>
                </>
              )}
              
              <button 
                onClick={() => setShowFilters(true)}
                className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-2 flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>

            <button
              className="md:hidden manga-border p-2 transform hover:rotate-3 transition-transform menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/95 z-40 pt-16 mobile-menu">
          <div className="p-4 space-y-4">
            <Link 
              to="/discover" 
              className="block manga-panel py-2 px-4 hover:text-red-500 transition-colors transform hover:-rotate-2"
            >
              Discover
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/my-list" 
                  className="block manga-panel py-2 px-4 hover:text-red-500 transition-colors transform hover:rotate-2"
                >
                  My List
                </Link>
                
                <Link 
                  to="/profile" 
                  className="block manga-panel py-2 px-4 hover:text-red-500 transition-colors transform hover:-rotate-2"
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="block manga-panel py-2 px-4 hover:text-red-500 transition-colors transform hover:-rotate-2"
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block manga-panel py-2 px-4 hover:text-red-500 transition-colors transform hover:rotate-2"
                >
                  Login
                </Link>
                
                <Link 
                  to="/signup" 
                  className="block manga-panel py-2 px-4 hover:text-red-500 transition-colors transform hover:-rotate-2"
                >
                  Signup
                </Link>
              </>
            )}
            
            <button 
              onClick={() => {
                setShowFilters(true);
                setIsMenuOpen(false);
              }}
              className="block w-full text-left manga-panel py-2 px-4 hover:text-red-500 transition-colors transform hover:rotate-2"
            >
              Filters
            </button>

            {user && (
              <button 
                onClick={handleLogout}
                className="block w-full text-left manga-panel py-2 px-4 hover:text-red-500 transition-colors transform hover:-rotate-2 flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 manga-panel p-6 w-full max-w-md relative transform -rotate-1">
            <div className="absolute inset-0 screen-tone pointer-events-none" />
            <div className="relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl manga-title transform rotate-2">Filters</h3>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="hover:text-red-500 transition-colors transform hover:rotate-12"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 manga-title transform -rotate-2">Genres</label>
                  <div className="grid grid-cols-2 gap-2">
                    {genres.map((genre) => (
                      <button
                        key={genre}
                        className="manga-border px-4 py-2 hover:bg-red-500 transition-colors transform hover:rotate-1"
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 manga-title transform rotate-2">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Ongoing', 'Completed', 'Hiatus', 'Cancelled'].map((status) => (
                      <button
                        key={status}
                        className="manga-border px-4 py-2 hover:bg-red-500 transition-colors transform hover:-rotate-1"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 mt-6">
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="manga-border px-4 py-2 hover:text-red-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="manga-gradient manga-border px-4 py-2"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Routes */}
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/manga/:id" element={<MangaDetail />} />
          <Route path="/reader/:mangaId/chapter/:chapterId" element={<Reader />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route 
            path="/my-list" 
            element={
              <ProtectedRoute>
                <MyList />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } 
          />
          
          {/* 404 Route */}
          <Route path="*" element={
            <div className="pt-20 flex justify-center items-center min-h-screen">
              <div className="manga-panel p-8 bg-black/50 transform -rotate-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <p className="manga-title text-2xl text-red-500">Page Not Found</p>
                </div>
                <p className="mt-2 mb-4">The page you're looking for doesn't exist.</p>
                <Link 
                  to="/"
                  className="mt-4 inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105"
                >
                  Go to Home
                </Link>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;
