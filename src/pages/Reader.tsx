import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Home,
  List,
  Maximize,
  Minimize,
  Settings,
  X,
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { supabase } from '../lib/supabaseClient';

type PageImage = {
  id: string;
  url: string;
  number: number;
};

const Reader: React.FC = () => {
  const { mangaId, chapterNumber } = useParams<{ mangaId: string; chapterNumber: string }>();
  const navigate = useNavigate();
  const [mangaTitle, setMangaTitle] = useState('Loading...');
  const [chapterTitle, setChapterTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<PageImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [readingDirection, setReadingDirection] = useState<'rtl' | 'ltr'>('rtl'); // Manga is typically right-to-left
  
  // Convert chapter number from string to number
  const chapter = parseInt(chapterNumber || '1', 10);
  
  useEffect(() => {
    const fetchMangaData = async () => {
      if (!mangaId) return;
      
      try {
        setLoading(true);
        
        // Fetch manga title
        const { data: mangaData, error: mangaError } = await supabase
          .from('manga_entries')
          .select('title')
          .eq('id', mangaId)
          .single();
        
        if (mangaError) throw new Error(mangaError.message);
        if (mangaData) setMangaTitle(mangaData.title);
        
        // For demo, generate dummy chapter title
        setChapterTitle(`Chapter ${chapter}: ${['The Beginning', 'Dark Shadows', 'New Power', 'Unexpected Alliance', 'Final Battle'][chapter % 5 || 0]}`);
        
        // For demo, generate dummy pages
        // In a real app, you would fetch actual pages from Supabase storage
        const dummyPages = Array.from({ length: 15 }, (_, i) => ({
          id: `page-${i + 1}`,
          url: `https://picsum.photos/seed/${mangaId}-${chapter}-${i + 1}/800/1200`,
          number: i + 1,
        }));
        
        setPages(dummyPages);
      } catch (err: any) {
        console.error('Error fetching manga data:', err);
        setError(err.message || 'Failed to load manga');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMangaData();
  }, [mangaId, chapter]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigatePage(readingDirection === 'rtl' ? 1 : -1);
      } else if (e.key === 'ArrowRight') {
        navigatePage(readingDirection === 'rtl' ? -1 : 1);
      } else if (e.key === 'Escape') {
        navigate(`/manga/${mangaId}`);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages.length, readingDirection, mangaId, navigate]);
  
  const navigatePage = (direction: number) => {
    const newPage = currentPage + direction;
    
    if (newPage < 1) {
      // Go to previous chapter
      if (chapter > 1) {
        navigate(`/reader/${mangaId}/chapter/${chapter - 1}`);
      }
      return;
    }
    
    if (newPage > pages.length) {
      // Go to next chapter
      navigate(`/reader/${mangaId}/chapter/${chapter + 1}`);
      return;
    }
    
    setCurrentPage(newPage);
  };
  
  const toggleReadingDirection = () => {
    setReadingDirection(prev => prev === 'rtl' ? 'ltr' : 'rtl');
  };
  
  if (loading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black">
        <div className="manga-panel p-8 bg-black/50 transform rotate-2">
          <p className="manga-title text-2xl">Loading manga pages...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black">
        <div className="manga-panel p-8 bg-black/50 transform -rotate-2">
          <p className="manga-title text-2xl text-red-500">Error: {error}</p>
          <Link to={`/manga/${mangaId}`} className="mt-4 block manga-border px-4 py-2 text-center hover:text-red-500 transition-all transform hover:scale-105">
            <ChevronLeft className="inline-block mr-2" />
            Back to Manga
          </Link>
        </div>
      </div>
    );
  }
  
  const currentPageData = pages[currentPage - 1];
  
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top navigation bar */}
      {showControls && (
        <div className="bg-black/80 backdrop-blur-sm p-4 flex justify-between items-center z-10">
          <div className="flex items-center space-x-4">
            <Link to={`/manga/${mangaId}`} className="manga-border p-2 hover:text-red-500 transition-colors">
              <X className="w-6 h-6" />
            </Link>
            
            <div>
              <h1 className="text-lg font-semibold">{mangaTitle}</h1>
              <p className="text-sm text-gray-400">{chapterTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="manga-border p-2 hover:text-red-500 transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
            
            <Link to="/" className="manga-border p-2 hover:text-red-500 transition-colors">
              <Home className="w-6 h-6" />
            </Link>
          </div>
        </div>
      )}
      
      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-20 right-4 bg-black/90 manga-panel p-4 z-20 transform rotate-1 space-y-4 w-64">
          <h3 className="font-semibold manga-title">Reading Settings</h3>
          
          <div>
            <p className="text-sm text-gray-400 mb-2">Reading Direction</p>
            <div className="flex space-x-2">
              <button 
                onClick={toggleReadingDirection}
                className={`manga-border px-3 py-1 text-sm ${readingDirection === 'rtl' ? 'bg-red-500/30' : ''}`}
              >
                Right to Left
              </button>
              <button 
                onClick={toggleReadingDirection}
                className={`manga-border px-3 py-1 text-sm ${readingDirection === 'ltr' ? 'bg-red-500/30' : ''}`}
              >
                Left to Right
              </button>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-2">Jump to Page</p>
            <div className="flex space-x-2">
              <input 
                type="number" 
                min={1} 
                max={pages.length} 
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.min(Math.max(1, parseInt(e.target.value) || 1), pages.length))}
                className="manga-border px-3 py-1 bg-transparent w-full"
              />
              <span className="text-sm flex items-center">/ {pages.length}</span>
            </div>
          </div>
          
          <div>
            <Link 
              to={`/manga/${mangaId}`}
              className="block w-full manga-border px-3 py-2 text-center text-sm hover:bg-red-500/30 transition-colors"
            >
              <List className="inline-block mr-1 w-4 h-4" />
              Chapter List
            </Link>
          </div>
        </div>
      )}
      
      {/* Main reader area */}
      <div 
        className="flex-1 overflow-hidden"
        onClick={() => setShowControls(!showControls)}
      >
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          centerOnInit
          limitToBounds
          wheel={{ step: 0.1 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom controls */}
              {showControls && (
                <div className="absolute bottom-24 right-4 flex flex-col space-y-2 z-10">
                  <button 
                    onClick={() => zoomIn(0.2)}
                    className="manga-border p-2 bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => zoomOut(0.2)}
                    className="manga-border p-2 bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <Minimize className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => resetTransform()}
                    className="manga-border p-2 bg-black/50 hover:bg-black/70 transition-colors text-xs">
                    Reset
                  </button>
                </div>
              )}
              
              <TransformComponent
                wrapperClass="w-full h-full flex justify-center items-center"
                contentClass="reader-page max-h-full"
              >
                {currentPageData && (
                  <img 
                    src={currentPageData.url} 
                    alt={`Page ${currentPageData.number}`}
                    className="max-h-full object-contain"
                    style={{ maxWidth: '100%' }}
                  />
                )}
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
      
      {/* Bottom navigation bar */}
      {showControls && (
        <div className="bg-black/80 backdrop-blur-sm p-4 flex justify-between items-center z-10">
          <button 
            onClick={() => navigatePage(readingDirection === 'rtl' ? 1 : -1)}
            disabled={readingDirection === 'rtl' ? currentPage === pages.length : currentPage === 1}
            className="manga-border px-4 py-2 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {readingDirection === 'rtl' ? 'Next' : 'Previous'}
            {readingDirection === 'rtl' ? <ArrowRight className="inline-block ml-2 w-4 h-4" /> : <ArrowLeft className="inline-block mr-2 w-4 h-4" />}
          </button>
          
          <div className="text-center">
            <span className="manga-border px-3 py-1 text-sm bg-black/50">
              Page {currentPage} of {pages.length}
            </span>
          </div>
          
          <button 
            onClick={() => navigatePage(readingDirection === 'rtl' ? -1 : 1)}
            disabled={readingDirection === 'rtl' ? currentPage === 1 : currentPage === pages.length}
            className="manga-border px-4 py-2 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {readingDirection === 'rtl' ? 'Previous' : 'Next'}
            {readingDirection === 'rtl' ? <ArrowLeft className="inline-block ml-2 w-4 h-4" /> : <ArrowRight className="inline-block ml-2 w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default Reader;