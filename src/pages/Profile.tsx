import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  LogOut,
  BookOpen,
  Heart,
  History,
  Edit,
  AlertCircle,
  Save,
  Camera,
  Clock,
  FileText,
  Tag,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';

type UserPreferences = {
  favoriteGenres: string[];
  excludeGenres: string[];
  darkMode: boolean;
  readingDirection: 'rtl' | 'ltr';
};

const Profile: React.FC = () => {
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'history'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    favoriteGenres: [],
    excludeGenres: [],
    darkMode: true,
    readingDirection: 'rtl',
  });
  
  // Reading history (for demo purposes)
  const [readingHistory] = useState<any[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: `manga-${i + 1}`,
      title: `Manga Title ${i + 1}`,
      coverImage: `https://picsum.photos/seed/manga${i + 1}/300/400`,
      chapter: Math.floor(Math.random() * 50) + 1,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }))
  );
  
  // Available genres for preferences
  const allGenres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery',
    'Romance', 'Sci-Fi', 'Slice of Life', 'Supernatural', 'Thriller'
  ];
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);
  
  useEffect(() => {
    if (!user) return;
    
    // Fetch user profile data (in a real app)
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Fetch profile from user_profiles
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (profile) {
          setDisplayName(profile.full_name || profile.username || user.email?.split('@')[0] || 'User');
          setBio(profile.bio || '');
          setAvatar(profile.avatar_url || `https://ui-avatars.com/api/?name=${user.email?.split('@')[0]}&background=random`);
        }

        // Fetch preferences from user_preferences
        const { data: pref, error: prefError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (prefError && prefError.code !== 'PGRST116') throw prefError; // ignore 'row not found' error
        if (pref) {
          setPreferences({
            favoriteGenres: pref.favorite_genres || [],
            excludeGenres: pref.exclude_genres || [],
            darkMode: typeof pref.dark_mode === 'boolean' ? pref.dark_mode : true,
            readingDirection: pref.reading_direction || 'rtl',
          });
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'Failed to sign out');
    }
  };
  
  const saveProfile = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          username: user?.email?.split('@')[0] || '',
          full_name: displayName,
          bio,
          avatar_url: avatar,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const savePreferences = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          favorite_genres: preferences.favoriteGenres,
          exclude_genres: preferences.excludeGenres,
          dark_mode: preferences.darkMode,
          reading_direction: preferences.readingDirection,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      setSuccess('Preferences saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleFavoriteGenre = (genre: string) => {
    setPreferences(prev => {
      if (prev.favoriteGenres.includes(genre)) {
        return { ...prev, favoriteGenres: prev.favoriteGenres.filter(g => g !== genre) };
      } else {
        // Remove from excluded genres if it's being added to favorites
        const newExcludeGenres = prev.excludeGenres.filter(g => g !== genre);
        return { 
          ...prev, 
          favoriteGenres: [...prev.favoriteGenres, genre],
          excludeGenres: newExcludeGenres,
        };
      }
    });
  };
  
  const toggleExcludeGenre = (genre: string) => {
    setPreferences(prev => {
      if (prev.excludeGenres.includes(genre)) {
        return { ...prev, excludeGenres: prev.excludeGenres.filter(g => g !== genre) };
      } else {
        // Remove from favorite genres if it's being excluded
        const newFavoriteGenres = prev.favoriteGenres.filter(g => g !== genre);
        return { 
          ...prev, 
          excludeGenres: [...prev.excludeGenres, genre],
          favoriteGenres: newFavoriteGenres,
        };
      }
    });
  };
  
  if (authLoading) {
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
            <p className="manga-title text-2xl">Please login to view your profile</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105"
          >
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
          <h1 className="manga-title text-4xl transform -rotate-2">Your Profile</h1>
          {isAdmin && (
            <div className="manga-panel px-4 py-2 bg-red-500/30 transform rotate-2">
              <span className="font-semibold">Admin User</span>
            </div>
          )}
        </div>
        
        {/* Display success/error messages */}
        {success && (
          <div className="mb-6 manga-panel p-4 bg-green-500/20 transform rotate-1">
            <p className="font-medium text-green-400">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 manga-panel p-4 bg-red-500/20 transform -rotate-1">
            <p className="font-medium text-red-400">{error}</p>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-4" style={{ position: 'relative', zIndex: 50 }}>
            {/* User card */}
            <div className="manga-panel p-6 bg-black/30 text-center">
              <div className="relative w-32 h-32 mx-auto overflow-hidden rounded-full mb-4">
                {avatar && (
                  <img 
                    src={avatar} 
                    alt={displayName}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
              <h2 className="manga-title text-2xl mb-1">{displayName}</h2>
              <p className="text-gray-400 text-sm mb-4">{user.email}</p>
              <button
                onClick={handleSignOut}
                className="w-full manga-border py-2 text-center font-semibold hover:text-red-500 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              
              {isAdmin && (
                <a
                  href="/admin"
                  className="block w-full mt-2 manga-border py-2 text-center font-semibold hover:text-red-500 transition-colors"
                >
                  Admin Dashboard
                </a>
              )}
            </div>
            
            {/* Nav tabs */}
            <div className="manga-panel bg-black/20 overflow-hidden" style={{ position: 'relative', zIndex: 100 }}>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 w-full p-4 text-left ${activeTab === 'profile' ? 'bg-black/40' : 'hover:bg-black/30'} transition-colors`}
                style={{ pointerEvents: 'auto' }}
              >
                <User className="w-5 h-5" />
                Profile
              </button>
              
              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex items-center gap-3 w-full p-4 text-left ${activeTab === 'preferences' ? 'bg-black/40' : 'hover:bg-black/30'} transition-colors`}
                style={{ pointerEvents: 'auto' }}
              >
                <Settings className="w-5 h-5" />
                Preferences
              </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-3 w-full p-4 text-left ${activeTab === 'history' ? 'bg-black/40' : 'hover:bg-black/30'} transition-colors`}
                style={{ pointerEvents: 'auto' }}
              >
                <History className="w-5 h-5" />
                Reading History
              </button>
            </div>
            
            {/* Quick links */}
            <div className="manga-panel p-4 bg-black/20">
              <h3 className="font-medium mb-3">Quick Links</h3>
              <div className="space-y-2">
                <a href="/my-list" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                  <span>My Reading List</span>
                </a>
                <a href="/discover" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>Discover New Manga</span>
                </a>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="flex-1 manga-panel p-6 bg-black/20" style={{ position: 'relative' }}>
            {/* Profile tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="manga-title text-2xl transform -rotate-1">Profile Information</h2>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="manga-border p-2 hover:text-red-500 transition-colors"
                    disabled={loading}
                  >
                    {isEditing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full manga-panel bg-black/30 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Your display name"
                        disabled={loading}
                      />
                    ) : (
                      <p className="p-3 manga-panel bg-black/10">{displayName}</p>
                    )}
                  </div>
                  
                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <p className="p-3 manga-panel bg-black/10">{user.email}</p>
                  </div>
                  
                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                    {isEditing ? (
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full manga-panel bg-black/30 p-3 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                        placeholder="Tell us about yourself and your manga preferences"
                        disabled={loading}
                      />
                    ) : (
                      <p className="p-3 manga-panel bg-black/10">{bio}</p>
                    )}
                  </div>
                  
                  {/* Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Profile Image</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 overflow-hidden rounded-full">
                        {avatar && (
                          <img 
                            src={avatar} 
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      {isEditing && (
                        <button className="manga-border p-2 hover:text-red-500 transition-colors" disabled={loading}>
                          <Camera className="w-5 h-5" />
                          <span className="sr-only">Change Avatar</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Action button */}
                  {isEditing && (
                    <div className="pt-4">
                      <button
                        onClick={saveProfile}
                        className="manga-gradient manga-border py-3 px-6 font-semibold transition-all transform hover:scale-105 manga-title"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Preferences tab */}
            {activeTab === 'preferences' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="manga-title text-2xl transform -rotate-1">Reading Preferences</h2>
                </div>

                {/* Preferences summary card */}
                <div className="manga-panel p-4 bg-black/30 mb-8">
                  <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Your Current Preferences
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <span className="text-sm font-semibold">Favorite Genres: </span>
                      {preferences.favoriteGenres.length > 0 ? (
                        <span className="text-green-400">{preferences.favoriteGenres.join(', ')}</span>
                      ) : (
                        <span className="text-gray-400">None selected</span>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold">Genres to Avoid: </span>
                      {preferences.excludeGenres.length > 0 ? (
                        <span className="text-red-400">{preferences.excludeGenres.join(', ')}</span>
                      ) : (
                        <span className="text-gray-400">None selected</span>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold">Reading Direction: </span>
                      <span className="text-blue-400">{preferences.readingDirection === 'rtl' ? 'Right to Left (Manga)' : 'Left to Right (Comic)'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold">Dark Mode: </span>
                      <span className="text-purple-400">{preferences.darkMode ? 'On' : 'Off'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-8">
                  {/* Genre Preferences */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Genre Preferences
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Favorite Genres */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Favorite Genres</h4>
                        <p className="text-xs text-gray-500 mb-3">You'll see more of these genres in recommendations</p>
                        <div className="flex flex-wrap gap-2">
                          {allGenres.map((genre, idx) => (
                            <button
                              key={genre}
                              onClick={() => toggleFavoriteGenre(genre)}
                              className={`manga-border px-3 py-1 text-sm transition-colors transform ${idx % 2 ? 'rotate-1' : '-rotate-1'} ${
                                preferences.favoriteGenres.includes(genre)
                                  ? 'bg-green-500/30 text-white'
                                  : 'hover:bg-white/10'
                              }`}
                            >
                              {genre}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Excluded Genres */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Genres to Avoid</h4>
                        <p className="text-xs text-gray-500 mb-3">You'll see less of these genres in recommendations</p>
                        <div className="flex flex-wrap gap-2">
                          {allGenres.map((genre, idx) => (
                            <button
                              key={genre}
                              onClick={() => toggleExcludeGenre(genre)}
                              className={`manga-border px-3 py-1 text-sm transition-colors transform ${idx % 2 ? 'rotate-1' : '-rotate-1'} ${
                                preferences.excludeGenres.includes(genre)
                                  ? 'bg-red-500/30 text-white'
                                  : 'hover:bg-white/10'
                              }`}
                            >
                              {genre}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reading Direction */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Reading Settings
                    </h3>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Default Reading Direction</h4>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setPreferences(prev => ({ ...prev, readingDirection: 'rtl' }))}
                          className={`manga-border px-4 py-2 transition-colors ${
                            preferences.readingDirection === 'rtl'
                              ? 'bg-red-500/30 text-white'
                              : 'hover:bg-white/10'
                          }`}
                        >
                          Right to Left (Manga Style)
                        </button>
                        <button
                          onClick={() => setPreferences(prev => ({ ...prev, readingDirection: 'ltr' }))}
                          className={`manga-border px-4 py-2 transition-colors ${
                            preferences.readingDirection === 'ltr'
                              ? 'bg-red-500/30 text-white'
                              : 'hover:bg-white/10'
                          }`}
                        >
                          Left to Right (Comic Style)
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Theme */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Theme Settings
                    </h3>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Dark Mode</h4>
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={preferences.darkMode}
                            onChange={() => setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                          />
                          <div className="w-10 h-6 bg-gray-700 rounded-full shadow-inner"></div>
                          <div className={`absolute left-1 top-1 w-4 h-4 transition bg-white rounded-full transform ${preferences.darkMode ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="ml-3">{preferences.darkMode ? 'On' : 'Off'}</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Save button */}
                  <div className="pt-4">
                    <button
                      onClick={savePreferences}
                      className="manga-gradient manga-border py-3 px-6 font-semibold transition-all transform hover:scale-105 manga-title"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Reading History tab */}
            {activeTab === 'history' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="manga-title text-2xl transform -rotate-1">Reading History</h2>
                </div>
                
                {readingHistory.length === 0 ? (
                  <div className="manga-panel p-6 bg-black/10 text-center">
                    <p className="text-lg mb-4">You haven't read any manga yet!</p>
                    <a 
                      href="/discover"
                      className="inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105"
                    >
                      <BookOpen className="inline-block mr-2" />
                      Discover Manga to Read
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* History entries */}
                    {readingHistory.map((item) => (
                      <a 
                        key={`${item.id}-${item.chapter}`}
                        href={`/reader/${item.id}/chapter/${item.chapter}`}
                        className="flex items-center gap-4 manga-panel p-3 bg-black/10 hover:bg-black/20 transition-colors"
                      >
                        <div className="w-12 h-16 overflow-hidden flex-shrink-0">
                          <img 
                            src={item.coverImage} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <FileText className="w-3 h-3" />
                            <span>Chapter {item.chapter}</span>
                            <Clock className="w-3 h-3 ml-2" />
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                    
                    <div className="pt-4 text-center">
                      <p className="text-gray-400 text-sm mb-2">Showing recent reading history</p>
                      <button className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-1">
                        View Full History
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;