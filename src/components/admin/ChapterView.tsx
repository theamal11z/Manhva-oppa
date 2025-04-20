import React, { useState, useEffect } from 'react';
import { X, BookOpen, Calendar, FileText, ArrowLeft, FileImage, Loader } from 'lucide-react';
import { getChapterById, getChapterPages } from '../../lib/supabaseClient';

type ChapterViewProps = {
  chapter: any;
  onClose: () => void;
};

const ChapterView: React.FC<ChapterViewProps> = ({ chapter, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [chapterData, setChapterData] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);

  useEffect(() => {
    const loadChapterDetails = async () => {
      setLoading(true);
      try {
        // Get full chapter details including manga info
        const { data, error } = await getChapterById(chapter.id);
        if (error) throw error;
        
        setChapterData(data);
        
        // Get chapter pages
        const pagesResult = await getChapterPages(chapter.id);
        if (pagesResult.error) throw pagesResult.error;
        
        setPages(pagesResult.data || []);
      } catch (err) {
        console.error('Error loading chapter details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadChapterDetails();
  }, [chapter.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Loader className="w-10 h-10 text-red-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading chapter details...</p>
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="bg-red-900/30 border border-red-500 p-4 rounded max-w-md">
          <p className="font-bold text-red-500">Error</p>
          <p className="text-sm">Failed to load chapter details. Please try again.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="manga-border px-4 py-2 mt-4 hover:text-red-500 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Get status color for display
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'text-green-500';
      case 'scheduled':
        return 'text-blue-500';
      case 'draft':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="chapter-view p-6 bg-black/30 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold manga-title">Chapter Details</h2>
        <button 
          type="button" 
          onClick={onClose} 
          className="p-2 hover:text-red-500 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chapter Preview */}
        <div className="lg:col-span-1">
          <div className="bg-black/20 rounded-lg p-6 flex flex-col items-center justify-center text-center h-60">
            <BookOpen className="w-16 h-16 text-gray-600 mb-2" />
            <h3 className="text-xl font-semibold mb-1">
              Chapter {chapterData.chapter_number}
            </h3>
            <p className="text-sm text-gray-400">
              {chapterData.manga_entries?.title || 'Unknown Manga'}
            </p>
          </div>
          
          <div className="mt-4 bg-black/20 rounded-lg p-4">
            <h4 className="font-medium mb-2">Pages Preview</h4>
            {pages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {pages.slice(0, 6).map((page) => (
                  <div 
                    key={page.id}
                    className="aspect-w-2 aspect-h-3 bg-black/50 rounded overflow-hidden"
                  >
                    <img 
                      src={page.image_url} 
                      alt={`Page ${page.page_number}`}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-0 right-0 bg-black/70 text-xs px-1 rounded-tl">
                      {page.page_number}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <FileImage className="w-10 h-10 text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">No pages uploaded yet</p>
              </div>
            )}
            {pages.length > 6 && (
              <p className="text-right text-xs text-gray-400 mt-2">
                +{pages.length - 6} more pages
              </p>
            )}
          </div>
        </div>
        
        {/* Chapter Details */}
        <div className="lg:col-span-2">
          <div className="bg-black/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Chapter Information</h3>
            
            <div className="space-y-4">
              {/* Chapter Number & Title */}
              <div>
                <h4 className="text-sm text-gray-400 mb-1">Chapter Number & Title</h4>
                <p className="font-medium text-lg">
                  Chapter {chapterData.chapter_number}
                  {chapterData.title && `: ${chapterData.title}`}
                </p>
              </div>
              
              {/* Status */}
              <div>
                <h4 className="text-sm text-gray-400 mb-1">Status</h4>
                <p className={`font-medium ${getStatusColor(chapterData.status)}`}>
                  {chapterData.status || 'Draft'}
                </p>
              </div>
              
              {/* Release Date */}
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="text-sm text-gray-400">Release Date</h4>
                  <p>
                    {chapterData.release_date 
                      ? new Date(chapterData.release_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Not set'}
                  </p>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <h4 className="text-sm text-gray-400 mb-1">Description</h4>
                <div className="bg-black/20 p-4 rounded-lg">
                  {chapterData.description ? (
                    <p className="whitespace-pre-line">{chapterData.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No description provided</p>
                  )}
                </div>
              </div>
              
              {/* Page Count */}
              <div className="flex items-start gap-2">
                <FileImage className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="text-sm text-gray-400">Pages</h4>
                  <p>{pages.length} pages</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Metadata */}
          <div className="mt-4 bg-black/20 rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Metadata</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">ID</p>
                <p className="text-sm font-mono">{chapterData.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm">
                  {chapterData.created_at ? new Date(chapterData.created_at).toLocaleString() : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm">
                  {chapterData.updated_at ? new Date(chapterData.updated_at).toLocaleString() : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Manga ID</p>
                <p className="text-sm font-mono">{chapterData.manga_id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end gap-4 mt-6 border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={onClose}
          className="manga-border px-4 py-2 hover:text-red-500 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Chapters
        </button>
      </div>
    </div>
  );
};

export default ChapterView;
