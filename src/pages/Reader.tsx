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
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { supabase } from '../lib/supabaseClient';

type PageImage = {
  id: string;
  url: string;
  number: number;
};

const Reader: React.FC = () => {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>();
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
  const [readingMode, setReadingMode] = useState<'single' | 'continuous'>('single');
  const [darkMode, setDarkMode] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const [zoomStep, setZoomStep] = useState(0.2);
  const [pinchEnabled, setPinchEnabled] = useState(true);
  const [pageSpacing, setPageSpacing] = useState(16);
  const [controlAutoHide, setControlAutoHide] = useState(true);

  // Convert chapter number from string to number
  const chapter = parseInt(chapterId || '1', 10);

  useEffect(() => {
    const fetchMangaData = async () => {
      if (!mangaId || !chapterId) return;

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
          setPages([{
            id: 'placeholder',
            url: `https://via.placeholder.com/800x1200/222222/FF5555?text=No+Pages+Found`,
            number: 1
          }]);
        }
      } catch (err: any) {
        console.error('Error fetching manga data:', err);
        setError(err.message || 'Failed to load manga');

        // Show a placeholder if error
        setPages([{
          id: 'error',
          url: `https://via.placeholder.com/800x1200/222222/FF5555?text=Error+Loading+Chapter`,
          number: 1
        }]);
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
    if (!showControls || !controlAutoHide) return;
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls, currentPage, controlAutoHide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setShowControls(true);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (diff > 50) navigatePage(readingDirection === 'rtl' ? 1 : -1);
      else if (diff < -50) navigatePage(readingDirection === 'rtl' ? -1 : 1);
    }
    touchStartX.current = null;
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
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className={`fixed inset-0 ${darkMode ? 'bg-white' : 'bg-black'} flex flex-col`}>
      {/* Top navigation bar */}
      {showControls && (
        <div className="manga-panel p-4 bg-black/50 transform rotate-2 flex justify-between items-center z-10">
          <div className="flex items-center space-x-4">
            <Link to={`/manga/${mangaId}`} className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105">
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
              className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105"
            >
              <Settings className="w-6 h-6" />
            </button>

            <Link to="/" className="manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105">
              <Home className="w-6 h-6" />
            </Link>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-20 right-4 manga-panel bg-black/90 p-4 transform -rotate-2 space-y-4 w-64 z-20">
          <h3 className="font-semibold manga-title">Reading Settings</h3>

          <div>
            <p className="text-sm text-gray-400 mb-2">Reading Direction</p>
            <div className="flex space-x-2">
              <button
                onClick={toggleReadingDirection}
                className={`manga-border px-4 py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${readingDirection === 'rtl' ? 'bg-red-500/30' : ''}`}
              >
                Right to Left
              </button>
              <button
                onClick={toggleReadingDirection}
                className={`manga-border px-4 py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${readingDirection === 'ltr' ? 'bg-red-500/30' : ''}`}
              >
                Left to Right
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Reading Mode</p>
            <div className="flex space-x-2">
              <button
                onClick={() => setReadingMode('single')}
                className={`manga-border px-4 py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${readingMode === 'single' ? 'bg-red-500/30' : ''}`}
              >
                Single
              </button>
              <button
                onClick={() => setReadingMode('continuous')}
                className={`manga-border px-4 py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${readingMode === 'continuous' ? 'bg-red-500/30' : ''}`}
              >
                Scroll
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Theme</p>
            <div className="flex space-x-2">
              <button
                onClick={() => setDarkMode(false)}
                className={`manga-border px-4 py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${!darkMode ? 'bg-red-500/30' : ''}`}
              >
                Light
              </button>
              <button
                onClick={() => setDarkMode(true)}
                className={`manga-border px-4 py-2 text-sm transform hover:scale-105 hover:rotate-1 transition-all ${darkMode ? 'bg-red-500/30' : ''}`}
              >
                Dark
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
                className="manga-border px-4 py-2 bg-transparent w-full transform hover:scale-105 transition-all"
              />
              <span className="text-sm flex items-center">/ {pages.length}</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Zoom Sensitivity</p>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              value={zoomStep}
              onChange={e => setZoomStep(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm">Step: {zoomStep}</span>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Pinch to Zoom</p>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={pinchEnabled}
                onChange={e => setPinchEnabled(e.target.checked)}
              />
              <span className="text-sm">Enable</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Page Spacing</p>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={pageSpacing}
              onChange={e => setPageSpacing(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm">{pageSpacing}px</span>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Auto-hide Controls</p>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={controlAutoHide}
                onChange={e => setControlAutoHide(e.target.checked)}
              />
              <span className="text-sm">Enable</span>
            </div>
          </div>

          <div>
            <Link
              to={`/manga/${mangaId}`}
              className="block w-full manga-border px-4 py-2 text-center text-sm hover:bg-red-500/30 transition-colors"
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
                      onDoubleClick={() => zoomIn(1)}
                    />
                  )}
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 flex flex-col" style={{ gap: `${pageSpacing}px` }}>
          {pages.map(page => (
            <img
              key={page.id}
              src={page.url}
              alt={`Page ${page.number}`}
              className="w-full object-contain mb-4"
              style={{ filter: darkMode ? 'invert(1)' : 'none' }}
            />
          ))}
        </div>
      )}

      {/* Bottom navigation bar */}
      {showControls && (
        <div className="manga-panel p-4 bg-black/50 transform -rotate-2 flex justify-between items-center z-10">
          <button
            onClick={() => navigatePage(readingDirection === 'rtl' ? 1 : -1)}
            disabled={readingDirection === 'rtl' ? currentPage === pages.length : currentPage === 1}
            className="manga-border px-4 py-2 text-sm hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {readingDirection === 'rtl' ? 'Next' : 'Previous'}
            {readingDirection === 'rtl' ? <ArrowRight className="inline-block ml-2 w-4 h-4" /> : <ArrowLeft className="inline-block mr-2 w-4 h-4" />}
          </button>
          <input
            type="range"
            min={1}
            max={pages.length}
            value={currentPage}
            onChange={e => setCurrentPage(Math.min(Math.max(1, +e.target.value), pages.length))}
            className="w-1/3 mx-4 manga-border p-1"
          />
          <div className="text-center">
            <span className="manga-border px-3 py-1 text-sm bg-black/50 manga-shadow">
              Page {currentPage} of {pages.length}
            </span>
          </div>
          <button
            onClick={() => navigatePage(readingDirection === 'rtl' ? -1 : 1)}
            disabled={readingDirection === 'rtl' ? currentPage === 1 : currentPage === pages.length}
            className="manga-border px-4 py-2 text-sm hover:text-red-500 transition-all transform hover:scale-105 hover:rotate-1 disabled:opacity-50 disabled:cursor-not-allowed"
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