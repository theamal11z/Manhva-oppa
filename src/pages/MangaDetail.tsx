import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Book,
  Bookmark,
  Calendar,
  Heart,
  Info,
  List,
  Share,
  Star,
  User,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getMangaById, addToReadingList, addToFavorites } from '../lib/supabaseClient';

type Chapter = {
  id: string;
  number: number;
  title: string;
  releaseDate: string;
  read?: boolean;
};

const MangaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [manga, setManga] = useState<any | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'chapters'>('info');
  
  useEffect(() => {
    const fetchManga = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await getMangaById(id);
        
        if (response.error) throw new Error(response.error.message);
        
        setManga(response.data);
        
        // For demo purposes, generate dummy chapters
        const dummyChapters = Array.from({ length: 24 }, (_, i) => ({
          id: `chapter-${i + 1}`,
          number: i + 1,
          title: `Chapter ${i + 1}: ${['The Beginning', 'Dark Shadows', 'New Power', 'Unexpected Alliance', 'Final Battle'][i % 5]}`,
          releaseDate: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString(), // Each chapter a week apart
          read: Math.random() > 0.7, // Some chapters marked as read
        }));
        
        setChapters(dummyChapters.reverse()); // Latest chapters first
      } catch (err: any) {
        console.error('Error fetching manga:', err);
        setError(err.message || 'Failed to fetch manga details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchManga();
  }, [id]);
  
  const handleAddToList = async (status: 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read') => {
    if (!user || !manga) return;
    
    try {
      await addToReadingList(user.id, manga.id, status);
      alert(`Added to your ${status.replace('_', ' ')} list!`);
    } catch (err) {
      console.error('Error adding to reading list:', err);
    }
  };
  
  const handleAddToFavorites = async () => {
    if (!user || !manga) return;
    
    try {
      await addToFavorites(user.id, manga.id);
      alert('Added to favorites!');
    } catch (err) {
      console.error('Error adding to favorites:', err);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 flex justify-center items-center min-h-screen">
        <div className="manga-panel p-8 bg-black/50 transform rotate-2">
          <p className="manga-title text-2xl">Loading manga details...</p>
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="pt-20 flex justify-center items-center min-h-screen">
        <div className="manga-panel p-8 bg-black/50 transform -rotate-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="manga-title text-2xl text-red-500">Error: {error || 'Manga not found'}</p>
          </div>
          <Link to="/" className="mt-4 inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105">
            <ArrowLeft className="inline-block mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // If we don't have actual data, use placeholder data
  const mangaData = {
    id: manga.id || id || 'unknown',
    title: manga.title || 'Manga Title',
    description: manga.description || 'No description available for this manga.',
    coverImage: manga.cover_image_url || `https://picsum.photos/seed/${id}/600/800`,
    author: manga.author || 'Unknown Author',
    artist: manga.artist || 'Unknown Artist',
    status: manga.status || 'ongoing',
    releaseYear: manga.release_year || 2022,
    rating: 4.7,
    genres: manga.genres?.map((g: any) => g.genres?.name) || ['Action', 'Adventure', 'Fantasy'],
    type: manga.type || 'manga',
  };

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link to="/" className="inline-block mb-6 manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 hover:-rotate-2">
          <ArrowLeft className="inline-block mr-2" />
          Back to Home
        </Link>
        
        {/* Manga header section */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Cover image */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="relative aspect-[3/4] manga-panel overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
              <img
                src={mangaData.coverImage}
                alt={mangaData.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 manga-panel p-2 bg-black/70">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-bold">{mangaData.rating}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 py-2 px-4 bg-gradient-to-t from-black to-transparent text-center">
                <span className="uppercase text-xs font-bold tracking-wider">
                  {mangaData.type} • {mangaData.status}
                </span>
              </div>
              <div className="absolute -bottom-12 -right-12 impact-text text-9xl opacity-20 transform rotate-12 pointer-events-none">
                {mangaData.status === 'ongoing' ? 'NEW!' : 'COMPLETE'}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-3 mt-4">
              <Link 
                to={`/reader/${mangaData.id}/chapter/1`}
                className="block manga-gradient manga-border py-3 text-center font-semibold transition-all transform hover:scale-105 hover:-rotate-1 manga-title"
              >
                <Book className="inline-block mr-2" />
                Start Reading
              </Link>
              
              <button
                onClick={() => handleAddToList('reading')}
                className="block w-full bg-white/10 manga-border py-3 text-center font-semibold transition-all transform hover:scale-105 hover:rotate-1 manga-title"
              >
                <Bookmark className="inline-block mr-2" />
                Add to Reading List
              </button>
              
              <button
                onClick={handleAddToFavorites}
                className="block w-full bg-white/10 manga-border py-3 text-center font-semibold transition-all transform hover:scale-105 hover:-rotate-1 manga-title"
              >
                <Heart className="inline-block mr-2" />
                Add to Favorites
              </button>
              
              <button className="block w-full bg-white/10 manga-border py-3 text-center font-semibold transition-all transform hover:scale-105 hover:rotate-1 manga-title">
                <Share className="inline-block mr-2" />
                Share
              </button>
            </div>
          </div>
          
          {/* Manga details */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <div className="manga-panel p-6 bg-black/30 mb-6">
              <h1 className="manga-title text-4xl md:text-5xl leading-tight mb-4 transform -rotate-1">
                {mangaData.title}
              </h1>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {mangaData.genres.map((genre: string, idx: number) => (
                  <span
                    key={genre}
                    className="text-sm manga-border px-3 py-1 transform"
                    style={{ transform: `rotate(${idx % 2 ? 1 : -1}deg)` }}
                  >
                    {genre}
                  </span>
                ))}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className="capitalize font-semibold flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {mangaData.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Type</span>
                  <span className="capitalize font-semibold flex items-center gap-1">
                    <Book className="w-4 h-4" />
                    {mangaData.type}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Author</span>
                  <span className="font-semibold flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {mangaData.author}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Released</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {mangaData.releaseYear}
                  </span>
                </div>
              </div>
            </div>
          
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-white/10">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-2 pb-3 transition-colors manga-title ${
                  activeTab === 'info' 
                    ? 'text-red-500 border-b-2 border-red-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Info className="w-5 h-5" />
                Information
              </button>
              
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex items-center gap-2 pb-3 transition-colors manga-title ${
                  activeTab === 'chapters' 
                    ? 'text-red-500 border-b-2 border-red-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-5 h-5" />
                Chapters <span className="ml-1 text-sm">({chapters.length})</span>
              </button>
            </div>
            
            {/* Tab content */}
            {activeTab === 'info' ? (
              <div className="speech-bubble transform -rotate-1 p-6">
                <p className="text-lg leading-relaxed">{mangaData.description}</p>
                
                {/* Could add more information here like awards, related manga, etc. */}
                <div className="mt-6 text-gray-300">
                  <p>This manga has been viewed over 100,000 times and has received numerous positive reviews.</p>
                </div>
              </div>
            ) : (
              <div className="manga-panel bg-black/20 p-4">
                <div className="space-y-2">
                  {chapters.map((chapter, index) => (
                    <Link 
                      key={chapter.id}
                      to={`/reader/${mangaData.id}/chapter/${chapter.number}`}
                      className={`flex items-center justify-between p-3 manga-border ${chapter.read ? 'opacity-70' : ''} hover:bg-white/5 transition-colors transform hover:scale-[1.01] ${index % 2 ? 'hover:rotate-[0.5deg]' : 'hover:-rotate-[0.5deg]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="aspect-square w-10 h-10 flex items-center justify-center manga-panel bg-gray-800">
                          <span className="font-bold">{chapter.number}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{chapter.title}</h3>
                          <p className="text-sm text-gray-400">
                            {new Date(chapter.releaseDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {chapter.read && (
                        <span className="text-sm text-gray-400 manga-border px-2 py-1">Read</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Related manga section */}
        <div className="mt-16">
          <h2 className="manga-title text-2xl mb-6 transform -rotate-1">Similar Titles</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Link 
                key={`related-${index}`}
                to={`/manga/related-${index}`}
                className="group relative aspect-[3/4] manga-panel overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300"
                style={{ transform: `rotate(${index % 2 ? 1 : -1}deg)` }}
              >
                <img
                  src={`https://picsum.photos/seed/related${index}/300/400`}
                  alt={`Related manga ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 p-4 w-full">
                    <h3 className="text-lg manga-title transform -rotate-2">Related Title {index + 1}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MangaDetail;