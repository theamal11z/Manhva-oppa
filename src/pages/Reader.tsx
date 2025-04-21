import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { supabase, updateReadingStatus } from '../lib/supabaseClient';

type PageImage = {
  id: string;
  url: string;
  number: number;
};

// Component to display images with loading/error states
const PageImageViewer: React.FC<{ page: PageImage; darkMode: boolean }> = ({ page, darkMode }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="relative mb-4 w-full">
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="border-4 border-gray-800 border-t-red-500 rounded-full w-6 h-6 animate-spin"></div>
        </div>
      )}
      {error && (
        <div onClick={() => { setError(false); setLoaded(false); }} className="absolute inset-0 flex flex-col items-center justify-center text-red-500 cursor-pointer">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-sm">Failed to load page (tap to retry)</span>
        </div>
      )}
      <img
        loading="lazy"
        src={page.url}
        alt={`Page ${page.number}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full object-contain transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ filter: darkMode ? 'invert(1)' : 'none' }}
      />
    </div>
  );
};

import { useAuth } from '../lib/AuthContext';

const Reader: React.FC = () => {
  const { user } = useAuth();
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [mangaTitle, setMangaTitle] = useState('Loading...');
  const [chapterTitle, setChapterTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<PageImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [readingDirection, setReadingDirection] = useState<'rtl' | 'ltr'>('rtl'); // Manga is typically right-to-left
  const [readingMode, setReadingMode] = useState<'single' | 'continuous' | 'webtoon'>('webtoon'); // Webtoon as default
  const [darkMode, setDarkMode] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [markingCompleted, setMarkingCompleted] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState<string|null>(null);
  const touchStartX = useRef<number | null>(null);
  const [zoomStep, setZoomStep] = useState(0.2);
  const [pinchEnabled, setPinchEnabled] = useState(true);
  const [pageSpacing, setPageSpacing] = useState(16);
  const [controlAutoHide, setControlAutoHide] = useState(true);
  const [showNextChapterPrompt, setShowNextChapterPrompt] = useState(false);
  const [nextChapterNumber, setNextChapterNumber] = useState<number | null>(null);
  const [hasNextChapter, setHasNextChapter] = useState(false);
  const controlsTimerRef = useRef<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Helper to check if this is the last chapter
  const isLastChapter = () => {
    // Return the opposite of hasNextChapter
    return !hasNextChapter;
  };

  // Update reading status when chapter loads - mark as reading
  useEffect(() => {
    const updateStatus = async () => {
      if (user && mangaId && chapterId) {
        try {
          // When a chapter first loads, mark it as 'reading'
          await updateReadingStatus(user.id, mangaId, 'reading', Number(chapterId));
          console.log(`Started reading chapter ${chapterId}`);
        } catch (err) {
          console.error('Error updating reading status:', err);
        }
      }
    };
    updateStatus();
  }, [user, mangaId, chapterId]);
  
  // Track reading progress based on current page in single page mode
  useEffect(() => {
    // Only track progress in single page mode, for continuous/webtoon modes we'll use scroll position
    if (readingMode === 'single' && user && mangaId && chapterId && pages.length > 0) {
      // If user is at the last page, consider the chapter completed
      if (currentPage === pages.length) {
        const markAsCompleted = async () => {
          try {
            await updateReadingStatus(user.id, mangaId, 'reading', Number(chapterId));
            console.log(`Completed chapter ${chapterId} (reached last page)`);
          } catch (err) {
            console.error('Error marking chapter as completed:', err);
          }
        };
        markAsCompleted();
      } else if (currentPage > 1) {
        // Update progress periodically as user reads through pages
        // We don't want to flood the database with updates on every page change
        // so we update every 3rd page or so
        if (currentPage % 3 === 0) {
          const updateProgress = async () => {
            try {
              await updateReadingStatus(user.id, mangaId, 'reading', Number(chapterId));
              console.log(`Updated reading progress: ${currentPage}/${pages.length}`);
            } catch (err) {
              console.error('Error updating reading progress:', err);
            }
          };
          updateProgress();
        }
      }
    }
  }, [user, mangaId, chapterId, currentPage, pages.length, readingMode]);

  // Load persisted reader settings but default to webtoon mode if not set
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('readerSettings') || '{}');
      if (saved.readingDirection) setReadingDirection(saved.readingDirection);
      // Default to webtoon if not explicitly set by user
      if (saved.readingMode) setReadingMode(saved.readingMode);
      else setReadingMode('webtoon'); // Ensure webtoon is the default
      if (saved.darkMode !== undefined) setDarkMode(saved.darkMode);
      if (saved.zoomStep !== undefined) setZoomStep(saved.zoomStep);
      if (saved.pinchEnabled !== undefined) setPinchEnabled(saved.pinchEnabled);
      if (saved.pageSpacing !== undefined) setPageSpacing(saved.pageSpacing);
      if (saved.controlAutoHide !== undefined) setControlAutoHide(saved.controlAutoHide);
    } catch (e) {
      // Ignore errors from localStorage
      setReadingMode('webtoon'); // Fallback to webtoon mode in case of errors
    }
  }, []);

  // Save reader settings on change
  useEffect(() => {
    const config = { readingMode, readingDirection, darkMode, controlAutoHide, pageSpacing, zoomStep, pinchEnabled };
    localStorage.setItem('readerSettings', JSON.stringify(config));
  }, [readingMode, readingDirection, darkMode, controlAutoHide, pageSpacing, zoomStep, pinchEnabled]);

  // Convert chapter number from string to number
  const chapter = parseInt(chapterId || '1', 10);

  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Exit early if no IDs
        if (!mangaId || !chapterId) {
          navigate('/');
          return;
        }

        const chapter = parseInt(chapterId);
        
        // Fetch manga title
        const { data: mangaData, error: mangaError } = await supabase
          .from('manga_entries')
          .select('title')
          .eq('id', mangaId)
          .single();

        if (mangaError) throw new Error(mangaError.message);
        if (mangaData) setMangaTitle(mangaData.title);

        // Get chapter data
        const { data: chapterData, error: chapterError } = await supabase
          .from('chapters')
          .select('*')
          .eq('manga_id', mangaId)
          .eq('chapter_number', chapter)
          .single();

        if (chapterError) {
          console.error('Error fetching chapter:', chapterError);
          // If no exact chapter match, try to find closest chapter
          const { data: allChapters } = await supabase
            .from('chapters')
            .select('*')
            .eq('manga_id', mangaId)
            .order('chapter_number', { ascending: true });

          if (allChapters && allChapters.length > 0) {
            // Find closest chapter
            const closestChapter = allChapters.reduce((prev, curr) => {
              return Math.abs(curr.chapter_number - chapter) < Math.abs(prev.chapter_number - chapter)
                ? curr : prev;
            });

            // Redirect to the closest chapter
            navigate(`/reader/${mangaId}/chapter/${closestChapter.chapter_number}`, { replace: true });
            return;
          }

          throw new Error('Chapter not found');
        }

        // Set chapter title
        if (chapterData) {
          setChapterTitle(`Chapter ${chapterData.chapter_number}${chapterData.title ? `: ${chapterData.title}` : ''}`);
        }
        
        // Check if next chapter exists
        const { data: nextChapterData, error: nextChapterError } = await supabase
          .from('chapters')
          .select('chapter_number')
          .eq('manga_id', mangaId)
          .gt('chapter_number', chapter)
          .order('chapter_number', { ascending: true })
          .limit(1);
        
        if (!nextChapterError && nextChapterData && nextChapterData.length > 0) {
          setHasNextChapter(true);
          setNextChapterNumber(nextChapterData[0].chapter_number);
        } else {
          setHasNextChapter(false);
          setNextChapterNumber(null);
        }

        // Get chapter pages
        const { data: pagesData, error: pagesError } = await supabase
          .from('chapter_pages')
          .select('*')
          .eq('chapter_id', chapterData.id)
          .order('page_number', { ascending: true });

        if (pagesError) throw new Error(pagesError.message);

        if (pagesData && pagesData.length > 0) {
          const formattedPages = pagesData.map(page => ({
            id: page.id,
            url: page.image_url,
            number: page.page_number
          }));
          setPages(formattedPages);
        } else {
          // If no pages found, show a placeholder
          const demoPages = Array.from({ length: 10 }, (_, i) => ({
            id: `demo-${i+1}`,
            url: `https://picsum.photos/seed/${mangaId}-${chapter}-${i+1}/800/1200`,
            number: i + 1
          }));
          setPages(demoPages);
        }
        
      } catch (err) {
        console.error('Error fetching manga data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load the chapter');
      } finally {
        setLoading(false);
      }
    };
    fetchMangaData();
  }, [mangaId, chapter, navigate, chapterId]);

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

  useEffect(() => {
    if (!showControls || !controlAutoHide || showSettings) return;
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    if (controlAutoHide) {
      controlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
        controlsTimerRef.current = null;
      }, 3000);
    }
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [showControls, currentPage, controlAutoHide, showSettings]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (diff > 50) navigatePage(readingDirection === 'rtl' ? 1 : -1);
      else if (diff < -50) navigatePage(readingDirection === 'rtl' ? -1 : 1);
    }
    touchStartX.current = null;
  };

  // Show controls on user activity (mouse move or click)
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    if (controlAutoHide) {
      controlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
        controlsTimerRef.current = null;
      }, 3000);
    }
  };

  // Touchable zones: left third = prev, right third = next, center = show controls
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showControls) return;
    const x = e.clientX;
    const w = window.innerWidth;
    if (x < w / 3) navigatePage(readingDirection === 'rtl' ? 1 : -1);
    else if (x > (2 * w) / 3) navigatePage(readingDirection === 'rtl' ? -1 : 1);
    else setShowControls(true);
  };

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
      // Show next chapter prompt if available instead of automatically navigating
      if (hasNextChapter && nextChapterNumber !== null) {
        setShowNextChapterPrompt(true);
      } else {
        // If no next chapter, just stay on the last page
        setCurrentPage(pages.length);
      }
      return;
    }
    
    // If we're moving away from the last page, hide the next chapter prompt
    if (showNextChapterPrompt) {
      setShowNextChapterPrompt(false);
    }

    setCurrentPage(newPage);
  };

  const toggleReadingDirection = () => {
    setReadingDirection(prev => prev === 'rtl' ? 'ltr' : 'rtl');
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullScreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setFullScreen(false);
    }
  };
  
  // Navigate to the next chapter when prompted
  const goToNextChapter = () => {
    if (hasNextChapter && nextChapterNumber !== null) {
      // Mark current chapter as completed before navigating
      if (user && mangaId && chapterId) {
        updateReadingStatus(user.id, mangaId, 'completed', Number(chapterId))
          .then(() => console.log(`Marked chapter ${chapterId} as completed`));
      }
      navigate(`/reader/${mangaId}/chapter/${nextChapterNumber}`);
    }
  };

  // Enhanced settings handler to ensure settings panel always shows
  const handleSettingsClick = (e: React.MouseEvent) => {
    // Stop event propagation to prevent other click handlers
    e.stopPropagation();
    
    // Show controls and settings
    setShowControls(true);
    setShowSettings(true);
    
    // Clear any auto-hide timer
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
  };
  
  // Handle click outside settings panel to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettings && settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    
    // Add event listener when settings are open
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // Prefetch adjacent pages to smooth navigation
  useEffect(() => {
    if (readingMode === 'single' && pages.length) {
      const prefetch = (url: string) => { const img = new Image(); img.src = url; };
      if (pages[currentPage]) prefetch(pages[currentPage].url);
      if (pages[currentPage - 2]) prefetch(pages[currentPage - 2].url);
    }
  }, [currentPage, pages, readingMode]);

  const handleTouchMove = () => {
    if (controlAutoHide) setShowControls(false);
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
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onMouseMove={handleUserActivity} onClick={e => { handleUserActivity(); handleTap(e); }} className={`fixed inset-0 ${darkMode ? 'bg-white' : 'bg-black'} flex flex-col`}>
      {/* Top navigation bar - Simplified for chapter details */}
      {showControls && (
        <div className="manga-panel p-4 bg-black/50 sm:transform sm:rotate-2 flex justify-between items-center z-10">
          <div className="flex items-center space-x-4">
            <Link to={`/manga/${mangaId}`} className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105">
              <X className="w-6 h-6" />
            </Link>

            <div className="flex-1">
              <h1 className="text-lg font-semibold">{mangaTitle}</h1>
              <p className="text-sm text-gray-400">{chapterTitle}</p>
            </div>
          </div>

          <Link to="/" className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105">
            <Home className="w-6 h-6" />
          </Link>
        </div>
      )}

      {/* Settings panel - Moved to bottom with mobile optimizations */}
      {showSettings && (
        <div 
          ref={settingsRef}
          className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-20 sm:right-4 manga-panel bg-black/90 p-4 pt-3 pb-6 sm:p-4 sm:transform sm:-rotate-2 space-y-3 w-auto sm:w-72 max-h-[70vh] sm:max-h-[80vh] overflow-auto z-[2000] rounded-t-lg sm:rounded-lg border-t-2 sm:border-2 border-red-500">
          {/* Drag handle for mobile */}
          <div className="block sm:hidden w-16 h-1 bg-gray-500 rounded-full mx-auto mb-2"></div>
          
          {/* Close settings */}
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold manga-title text-lg">Reading Settings</h3>
            <button 
              onClick={() => setShowSettings(false)} 
              className="p-2 bg-red-500 rounded-full cursor-pointer hover:bg-red-600 transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="bg-black/30 p-3 rounded-lg">
            <p className="text-sm text-gray-300 mb-2 font-medium">Reading Direction</p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={toggleReadingDirection}
                className={`manga-border px-4 py-3 sm:py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${readingDirection === 'rtl' ? 'bg-red-500/30' : ''}`}
              >
                Right to Left
              </button>
              <button
                onClick={toggleReadingDirection}
                className={`manga-border px-4 py-3 sm:py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${readingDirection === 'ltr' ? 'bg-red-500/30' : ''}`}
              >
                Left to Right
              </button>
            </div>
          </div>

          <div className="bg-black/30 p-3 rounded-lg">
            <p className="text-sm text-gray-300 mb-2 font-medium">Reading Mode</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setReadingMode('single')}
                className={`manga-border px-2 py-3 sm:py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${readingMode === 'single' ? 'bg-red-500/30' : ''}`}
              >
                Single
              </button>
              <button
                onClick={() => setReadingMode('continuous')}
                className={`manga-border px-2 py-3 sm:py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${readingMode === 'continuous' ? 'bg-red-500/30' : ''}`}
              >
                Scroll
              </button>
              <button
                onClick={() => setReadingMode('webtoon')}
                className={`manga-border px-2 py-3 sm:py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${readingMode === 'webtoon' ? 'bg-red-500/30' : ''}`}
              >
                Webtoon
              </button>
            </div>
          </div>

          <div className="bg-black/30 p-3 rounded-lg">
            <p className="text-sm text-gray-300 mb-2 font-medium">Theme</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDarkMode(false)}
                className={`manga-border px-4 py-3 sm:py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${!darkMode ? 'bg-red-500/30' : ''}`}
              >
                Light
              </button>
              <button
                onClick={() => setDarkMode(true)}
                className={`manga-border px-4 py-3 sm:py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${darkMode ? 'bg-red-500/30' : ''}`}
              >
                Dark
              </button>
            </div>
          </div>

          <div className="bg-black/30 p-3 rounded-lg">
            <p className="text-sm text-gray-300 mb-2 font-medium">Jump to Page</p>
            <div className="flex space-x-2 items-center">
              <input
                type="number"
                min={1}
                max={pages.length}
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.min(Math.max(1, parseInt(e.target.value) || 1), pages.length))}
                className="manga-border px-4 py-3 sm:py-2 bg-transparent w-full text-lg sm:text-base transform hover:scale-105 transition-all"
              />
              <span className="text-base sm:text-sm flex items-center whitespace-nowrap">/ {pages.length}</span>
            </div>
          </div>

          <div className="bg-black/30 p-3 rounded-lg">
            <p className="text-sm text-gray-300 mb-2 font-medium">Zoom Sensitivity</p>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              value={zoomStep}
              onChange={e => setZoomStep(parseFloat(e.target.value))}
              className="w-full h-8 sm:h-6"
            />
            <span className="text-sm">Step: {zoomStep}</span>
          </div>

          <div className="bg-black/30 p-3 rounded-lg">
            <p className="text-sm text-gray-300 mb-2 font-medium">Pinch to Zoom</p>
            <div className="flex items-center space-x-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinchEnabled}
                  onChange={e => setPinchEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                <span className="ml-3 text-sm">Enable</span>
              </label>
            </div>
          </div>

          <div className="bg-black/30 p-3 rounded-lg">
            <p className="text-sm text-gray-300 mb-2 font-medium">Page Spacing</p>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={pageSpacing}
              onChange={e => setPageSpacing(parseInt(e.target.value))}
              className="w-full h-8 sm:h-6"
            />
            <span className="text-sm">{pageSpacing}px</span>
          </div>

          <div className="bg-black/30 p-3 rounded-lg">
            <p className="text-sm text-gray-300 mb-2 font-medium">Auto-hide Controls</p>
            <div className="flex items-center space-x-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={controlAutoHide}
                  onChange={e => setControlAutoHide(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                <span className="ml-3 text-sm">Enable</span>
              </label>
            </div>
          </div>

          <div className="bg-black/30 p-3 rounded-lg">
            <p className="text-sm text-gray-300 mb-2 font-medium">Fullscreen</p>
            <button
              onClick={toggleFullScreen}
              className="manga-border px-4 py-3 sm:py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all w-full"
            >
              {fullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            </button>
          </div>

          <div className="bg-black/30 p-3 rounded-lg">
            <Link
              to={`/manga/${mangaId}`}
              className="block w-full manga-border px-4 py-3 sm:py-2 text-center text-sm hover:bg-red-500/30 transition-colors"
            >
              <List className="inline-block mr-1 w-4 h-4" />
              Chapter List
            </Link>
          </div>
        </div>
      )}

      {/* Main reader area */}
      {readingMode === 'single' ? (
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
            wheel={{ step: zoomStep }}
            pinch={{ disabled: !pinchEnabled }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Zoom controls */}
                {showControls && (
                  <div className="absolute bottom-24 right-4 flex flex-col space-y-2 z-10">
                    <button
                      onClick={() => zoomIn(0.2)}
                      className="manga-border px-4 py-2 bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <Maximize className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => zoomOut(0.2)}
                      className="manga-border px-4 py-2 bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <Minimize className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => resetTransform()}
                      className="manga-border px-4 py-2 bg-black/50 hover:bg-black/70 transition-colors text-xs"
                    >
                      Reset
                    </button>
                    {/* Mark as Completed button if on last page of last chapter */}
                    {user && currentPage === pages.length && isLastChapter() && (
                      <button
                        className="manga-border px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors ml-4"
                        disabled={markingCompleted}
                        onClick={async () => {
                          setMarkingCompleted(true);
                          setCompletedSuccess(null);
                          try {
                            await updateReadingStatus(user.id, mangaId!, 'completed', Number(chapterId));
                            setCompletedSuccess('Marked as completed!');
                          } catch (err: any) {
                            setCompletedSuccess('Failed to mark as completed');
                          } finally {
                            setMarkingCompleted(false);
                            setTimeout(() => setCompletedSuccess(null), 2000);
                          }
                        }}
                      >
                        {markingCompleted ? 'Marking...' : 'Mark as Completed'}
                      </button>
                    )}
                    {completedSuccess && (
                      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-green-400 px-4 py-2 rounded-lg manga-shadow z-50">
                        {completedSuccess}
                      </div>
                    )}
                  </div>
                )}

                <TransformComponent
                  wrapperClass="w-full h-full flex justify-center items-center"
                  contentClass="reader-page max-h-full"
                >
                  {currentPageData && (
                    <>
                      <PageImageViewer page={currentPageData} darkMode={darkMode} />
                      
                      {/* Next Chapter Prompt - show when on last page */}
                      {showNextChapterPrompt && hasNextChapter && (
                        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-4 rounded-lg manga-shadow z-50 flex flex-col items-center animate-pulse">
                          <p className="mb-2">You've reached the end of this chapter!</p>
                          <button 
                            onClick={() => {
                              // Mark current chapter as completed before moving to next chapter
                              if (user && mangaId && chapterId) {
                                updateReadingStatus(user.id, mangaId, 'completed', Number(chapterId))
                                  .then(() => console.log(`Marked chapter ${chapterId} as completed`));
                              }
                              goToNextChapter();
                            }}
                            disabled={loading}
                            className="manga-border bg-red-500/70 hover:bg-red-500 px-4 py-2 text-white transition-all transform hover:scale-105"
                          >
                            Continue to Chapter {nextChapterNumber}
                            <ArrowRight className="inline-block ml-2 w-4 h-4" />
                          </button>
                      </div>
                      )}
                    </>
                  )}
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 flex flex-col relative" style={{ gap: `${readingMode === 'webtoon' ? 0 : pageSpacing}px` }}>
          {pages.map(
            page => (
              <PageImageViewer key={page.id} page={page} darkMode={darkMode} />
            ))}
            
          {/* No separate next chapter prompt - we'll integrate it into the controls */}
        </div>
      )}

      {/* Bottom navigation bar with settings button */}
      {showControls && (
        <div className="manga-panel p-4 bg-black/50 sm:transform sm:-rotate-2 flex justify-between items-center z-10">
          {/* In single page mode, show page navigation. In scroll/webtoon mode, show chapter navigation for left button */}
          {readingMode === 'single' ? (
            <button
              onClick={() => navigatePage(readingDirection === 'rtl' ? 1 : -1)}
              disabled={readingDirection === 'rtl' ? currentPage === pages.length : currentPage === 1}
              className="manga-border px-4 py-2 text-sm hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {readingDirection === 'rtl' ? 'Next Page' : 'Previous Page'}
              {readingDirection === 'rtl' ? <ArrowRight className="inline-block ml-2 w-4 h-4" /> : <ArrowLeft className="inline-block mr-2 w-4 h-4" />}
            </button>
          ) : (
            <button
              onClick={() => chapter > 1 ? navigate(`/reader/${mangaId}/chapter/${chapter - 1}`) : undefined}
              disabled={chapter <= 1}
              className="manga-border px-4 py-2 text-sm hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous Chapter
              <ArrowLeft className="inline-block ml-2 w-4 h-4" />
            </button>
          )}
          
          <div className="flex items-center space-x-2">
            {readingMode === 'single' && (
              <>
                <div className="text-center hidden sm:block">
                  <span className="manga-border px-3 py-1 text-sm bg-black/50 manga-shadow">
                    Page {currentPage} of {pages.length}
                  </span>
                </div>
                
                <input
                  type="range"
                  min={1}
                  max={pages.length}
                  value={currentPage}
                  onChange={e => setCurrentPage(Math.min(Math.max(1, +e.target.value), pages.length))}
                  className="w-24 sm:w-32 mx-2 manga-border p-1"
                />
              </>
            )}
            
            {readingMode !== 'single' && (
              <div className="text-center">
                <span className="manga-border px-3 py-1 text-sm bg-black/50 manga-shadow">
                  Chapter {chapter}
                </span>
              </div>
            )}
            
            <button
              onClick={handleSettingsClick}
              className="manga-border px-3 py-2 bg-red-500/70 hover:bg-red-500 text-white transition-all transform hover:scale-105 z-[3000]"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          {/* In single page mode, show page navigation. In scroll/webtoon mode, show chapter navigation for right button */}
          {readingMode === 'single' ? (
            <button
              onClick={() => navigatePage(readingDirection === 'rtl' ? -1 : 1)}
              disabled={readingDirection === 'rtl' ? currentPage === 1 : currentPage === pages.length}
              className="manga-border px-4 py-2 text-sm hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {readingDirection === 'rtl' ? 'Previous Page' : 'Next Page'}
              {readingDirection === 'rtl' ? <ArrowLeft className="inline-block ml-2 w-4 h-4" /> : <ArrowRight className="inline-block ml-2 w-4 h-4" />}
            </button>
          ) : (
            <button
              onClick={hasNextChapter ? () => {
                // Mark current chapter as completed before moving to next
                if (user && mangaId && chapterId) {
                  updateReadingStatus(user.id, mangaId, 'completed', Number(chapterId))
                    .then(() => console.log(`Marked chapter ${chapterId} as completed`));
                }
                goToNextChapter();
              } : () => {}}
              disabled={!hasNextChapter}
              className="manga-border px-4 py-2 text-sm hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Chapter
              <ArrowRight className="inline-block ml-2 w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Reader;