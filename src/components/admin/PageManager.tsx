import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeft, 
  Upload, 
  Trash, 
  AlertTriangle, 
  Save, 
  Loader, 
  FileImage,
  ArrowUp,
  ArrowDown,
  Link,
  Plus
} from 'lucide-react';
import { 
  getChapterById, 
  getChapterPages, 
  uploadChapterPage, 
  bulkUploadChapterPages,
  deleteChapterPage,
  reorderChapterPages,
  addPageFromUrl,
  bulkAddPagesFromUrls
} from '../../lib/supabaseClient';

type PageManagerProps = {
  chapter: any;
  onClose: () => void;
};

const PageManager: React.FC<PageManagerProps> = ({ chapter, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [chapterData, setChapterData] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draggedPage, setDraggedPage] = useState<any | null>(null);
  const [dragOverPage, setDragOverPage] = useState<any | null>(null);
  const [urlMode, setUrlMode] = useState(false);
  const [singleUrl, setSingleUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chapter details and pages
  useEffect(() => {
    const loadChapterDetails = async () => {
      setLoading(true);
      try {
        // Get full chapter details
        const { data, error } = await getChapterById(chapter.id);
        if (error) throw error;
        setChapterData(data);
        
        // Get chapter pages
        const pagesResult = await getChapterPages(chapter.id);
        if (pagesResult.error) throw pagesResult.error;
        
        // Sort pages by page number
        const sortedPages = (pagesResult.data || []).sort((a, b) => a.page_number - b.page_number);
        setPages(sortedPages);
      } catch (err: any) {
        console.error('Error loading chapter pages:', err);
        setError('Failed to load chapter pages. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadChapterDetails();
  }, [chapter.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      // For bulk uploads, use the bulk upload function
      if (files.length > 1) {
        const startingPageNumber = pages.length > 0 
          ? Math.max(...pages.map(p => p.page_number)) + 1 
          : 1;
          
        // Convert FileList to array and adjust page numbers
        const filesArray = Array.from(files);
        
        // Use bulkUploadChapterPages function
        const result = await bulkUploadChapterPages(filesArray, chapter.id);
        
        if (result.error) {
          throw new Error(result.error.message || 'Failed to upload pages');
        }
        
        // Refresh pages after upload
        const pagesResult = await getChapterPages(chapter.id);
        if (pagesResult.error) throw pagesResult.error;
        
        // Sort pages by page number
        const sortedPages = (pagesResult.data || []).sort((a, b) => a.page_number - b.page_number);
        setPages(sortedPages);
      } 
      // For single file upload
      else {
        const file = files[0];
        const nextPageNumber = pages.length > 0 
          ? Math.max(...pages.map(p => p.page_number)) + 1 
          : 1;
          
        const result = await uploadChapterPage(file, chapter.id, nextPageNumber);
        
        if (result.error) {
          throw new Error(result.error.message || 'Failed to upload page');
        }
        
        // Add the new page to the pages array
        setPages([...pages, result.data]);
      }
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error uploading pages:', err);
      setError(err.message || 'Failed to upload pages. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await deleteChapterPage(pageId);
      
      if (error) {
        throw new Error(error.message || 'Failed to delete page');
      }
      
      // Remove the deleted page from the pages array
      setPages(pages.filter(page => page.id !== pageId));
    } catch (err: any) {
      console.error('Error deleting page:', err);
      setError(err.message || 'Failed to delete page. Please try again.');
    }
  };

  const handleDragStart = (page: any) => {
    setDraggedPage(page);
  };

  const handleDragOver = (e: React.DragEvent, page: any) => {
    e.preventDefault();
    if (page.id !== draggedPage?.id) {
      setDragOverPage(page);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedPage || !dragOverPage || draggedPage.id === dragOverPage.id) {
      setDraggedPage(null);
      setDragOverPage(null);
      return;
    }
    
    try {
      // Create a copy of the pages array
      const updatedPages = [...pages];
      
      // Find indexes of dragged and target pages
      const draggedIndex = updatedPages.findIndex(p => p.id === draggedPage.id);
      const targetIndex = updatedPages.findIndex(p => p.id === dragOverPage.id);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // Remove dragged page from array
      const [removed] = updatedPages.splice(draggedIndex, 1);
      
      // Insert at new position
      updatedPages.splice(targetIndex, 0, removed);
      
      // Update page numbers for all pages
      const pageUpdates = updatedPages.map((page, index) => ({
        id: page.id,
        page_number: index + 1
      }));
      
      // Update UI immediately for a responsive feel
      setPages(updatedPages.map((page, index) => ({ ...page, page_number: index + 1 })));
      
      // Send update to server
      const { error } = await reorderChapterPages(chapter.id, pageUpdates);
      
      if (error) {
        throw new Error(error.message || 'Failed to reorder pages');
      }
    } catch (err: any) {
      console.error('Error reordering pages:', err);
      setError(err.message || 'Failed to reorder pages. Please try again.');
      
      // Refresh pages to revert to server state
      const pagesResult = await getChapterPages(chapter.id);
      if (!pagesResult.error) {
        const sortedPages = (pagesResult.data || []).sort((a, b) => a.page_number - b.page_number);
        setPages(sortedPages);
      }
    } finally {
      setDraggedPage(null);
      setDragOverPage(null);
    }
  };
  
  const handleMoveUp = async (page: any) => {
    if (page.page_number <= 1) return;
    
    try {
      // Find the page above this one
      const pageAbove = pages.find(p => p.page_number === page.page_number - 1);
      if (!pageAbove) return;
      
      // Swap page numbers
      const updates = [
        { id: page.id, page_number: page.page_number - 1 },
        { id: pageAbove.id, page_number: pageAbove.page_number + 1 }
      ];
      
      // Update UI immediately
      const updatedPages = pages.map(p => {
        if (p.id === page.id) return { ...p, page_number: p.page_number - 1 };
        if (p.id === pageAbove.id) return { ...p, page_number: p.page_number + 1 };
        return p;
      }).sort((a, b) => a.page_number - b.page_number);
      
      setPages(updatedPages);
      
      // Send update to server
      const { error } = await reorderChapterPages(chapter.id, updates);
      
      if (error) {
        throw new Error(error.message || 'Failed to reorder pages');
      }
    } catch (err: any) {
      console.error('Error moving page up:', err);
      setError(err.message || 'Failed to move page. Please try again.');
      
      // Refresh pages to revert to server state
      const pagesResult = await getChapterPages(chapter.id);
      if (!pagesResult.error) {
        const sortedPages = (pagesResult.data || []).sort((a, b) => a.page_number - b.page_number);
        setPages(sortedPages);
      }
    }
  };
  
  const handleMoveDown = async (page: any) => {
    if (page.page_number >= pages.length) return;
    
    try {
      // Find the page below this one
      const pageBelow = pages.find(p => p.page_number === page.page_number + 1);
      if (!pageBelow) return;
      
      // Swap page numbers
      const updates = [
        { id: page.id, page_number: page.page_number + 1 },
        { id: pageBelow.id, page_number: pageBelow.page_number - 1 }
      ];
      
      // Update UI immediately
      const updatedPages = pages.map(p => {
        if (p.id === page.id) return { ...p, page_number: p.page_number + 1 };
        if (p.id === pageBelow.id) return { ...p, page_number: p.page_number - 1 };
        return p;
      }).sort((a, b) => a.page_number - b.page_number);
      
      setPages(updatedPages);
      
      // Send update to server
      const { error } = await reorderChapterPages(chapter.id, updates);
      
      if (error) {
        throw new Error(error.message || 'Failed to reorder pages');
      }
    } catch (err: any) {
      console.error('Error moving page down:', err);
      setError(err.message || 'Failed to move page. Please try again.');
      
      // Refresh pages to revert to server state
      const pagesResult = await getChapterPages(chapter.id);
      if (!pagesResult.error) {
        const sortedPages = (pagesResult.data || []).sort((a, b) => a.page_number - b.page_number);
        setPages(sortedPages);
      }
    }
  };

  const handleAddPageFromUrl = async () => {
    if (!singleUrl.trim()) {
      setError('Please enter a valid image URL');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      const nextPageNumber = pages.length > 0 
        ? Math.max(...pages.map(p => p.page_number)) + 1 
        : 1;
        
      const result = await addPageFromUrl(singleUrl.trim(), chapter.id, nextPageNumber);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to add page from URL');
      }
      
      // Add the new page to the pages array
      setPages([...pages, result.data]);
      
      // Clear the URL input
      setSingleUrl('');
    } catch (err: any) {
      console.error('Error adding page from URL:', err);
      setError(err.message || 'Failed to add page from URL. Please check the URL and try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const handleAddBulkPagesFromUrls = async () => {
    if (!bulkUrls.trim()) {
      setError('Please enter at least one valid image URL');
      return;
    }
    
    // Split by newlines and filter out empty lines
    const urls = bulkUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    if (urls.length === 0) {
      setError('Please enter at least one valid image URL');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // Use the bulk function to add all URLs
      const result = await bulkAddPagesFromUrls(urls, chapter.id);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to add pages from URLs');
      }
      
      // Refresh pages to get the latest
      const pagesResult = await getChapterPages(chapter.id);
      if (pagesResult.error) throw pagesResult.error;
      
      // Sort pages by page number
      const sortedPages = (pagesResult.data || []).sort((a, b) => a.page_number - b.page_number);
      setPages(sortedPages);
      
      // Clear the URL input
      setBulkUrls('');
    } catch (err: any) {
      console.error('Error adding pages from URLs:', err);
      setError(err.message || 'Failed to add pages from URLs. Please check the URLs and try again.');
    } finally {
      setUploading(false);
    }
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Loader className="w-10 h-10 text-red-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading chapter pages...</p>
      </div>
    );
  }

  return (
    <div className="page-manager p-6 bg-black/30 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold manga-title">
          Manage Pages - Chapter {chapterData?.chapter_number || ''}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:text-red-500 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 p-4 mb-6 flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-red-500">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Upload Control */}
      <div className="mb-6 p-6 bg-black/20 border border-dashed border-white/20 rounded-lg">
        <div className="flex justify-end mb-4">
          <div className="flex">
            <button
              type="button"
              onClick={() => setUrlMode(false)}
              className={`px-3 py-1 ${!urlMode ? 'bg-red-500/30 text-white' : 'bg-black/30 text-gray-400'} rounded-l-md transition-colors`}
            >
              <Upload className="w-4 h-4 inline-block mr-1" />
              File Upload
            </button>
            <button
              type="button"
              onClick={() => setUrlMode(true)}
              className={`px-3 py-1 ${urlMode ? 'bg-red-500/30 text-white' : 'bg-black/30 text-gray-400'} rounded-r-md transition-colors`}
            >
              <Link className="w-4 h-4 inline-block mr-1" />
              URL Upload
            </button>
          </div>
        </div>
        
        {urlMode ? (
          <div className="flex flex-col items-center text-center">
            <Link className="w-12 h-12 text-gray-400 mb-2" />
            <h3 className="text-lg font-semibold mb-1">Upload Pages from URL</h3>
            <p className="text-gray-400 mb-4 max-w-md">
              Enter image URLs directly to add pages without downloading and uploading files.
            </p>
            
            <div className="w-full max-w-md">
              <div className="bg-black/20 p-4 rounded-lg mb-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Single URL</label>
                  <div className="flex">
                    <input
                      type="url"
                      value={singleUrl}
                      onChange={(e) => setSingleUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-grow p-2 bg-black/30 border border-white/20 focus:border-red-500 outline-none transition-colors"
                      disabled={uploading}
                    />
                    <button
                      type="button"
                      onClick={handleAddPageFromUrl}
                      disabled={uploading || !singleUrl.trim()}
                      className={`manga-border px-3 py-2 ml-2 ${
                        uploading || !singleUrl.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:text-green-500'
                      } transition-colors`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Bulk URLs (one per line)</label>
                  <textarea
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    placeholder="https://example.com/page1.jpg&#10;https://example.com/page2.jpg&#10;https://example.com/page3.jpg"
                    rows={5}
                    className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 outline-none transition-colors"
                    disabled={uploading}
                  />
                  <button
                    type="button"
                    onClick={handleAddBulkPagesFromUrls}
                    disabled={uploading || !bulkUrls.trim()}
                    className={`manga-border px-4 py-2 mt-2 ${
                      uploading || !bulkUrls.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:text-green-500'
                    } transition-colors flex items-center gap-2`}
                  >
                    <Plus className="w-4 h-4" />
                    Add All URLs
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <FileImage className="w-12 h-12 text-gray-400 mb-2" />
            <h3 className="text-lg font-semibold mb-1">Upload Pages</h3>
            <p className="text-gray-400 mb-4 max-w-md">
              Select multiple image files to upload as pages. Page order will be based on file names.
            </p>
            
            <label className="manga-border px-4 py-2 cursor-pointer inline-flex items-center gap-2 hover:text-blue-400 transition-colors">
              <Upload className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Select Files'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: JPEG, PNG, WebP. Max size: 5MB per image.
            </p>
          </div>
        )}
        
        {uploading && (
          <div className="mt-4 flex items-center justify-center">
            <Loader className="w-6 h-6 text-blue-500 animate-spin mr-2" />
            <span>Uploading pages... Please wait</span>
          </div>
        )}
      </div>
      
      {/* Pages List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FileImage className="w-5 h-5 mr-2" />
          Pages ({pages.length})
        </h3>
        
        {pages.length === 0 ? (
          <div className="bg-black/20 border border-white/10 rounded-lg p-8 text-center">
            <p className="text-gray-400">
              No pages have been uploaded yet. Use the upload control above to add pages.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pages.map((page) => (
              <div 
                key={page.id}
                className={`bg-black/20 border ${
                  dragOverPage?.id === page.id ? 'border-blue-500' : 'border-white/10'
                } rounded-lg overflow-hidden relative shadow-lg`}
                draggable
                onDragStart={() => handleDragStart(page)}
                onDragOver={(e) => handleDragOver(e, page)}
                onDrop={handleDrop}
                onDragEnd={() => { setDraggedPage(null); setDragOverPage(null); }}
              >
                {/* Page Image */}
                <div className="aspect-w-3 aspect-h-4 bg-black/50">
                  <img 
                    src={page.image_url} 
                    alt={`Page ${page.page_number}`}
                    className="object-contain w-full h-full"
                  />
                </div>
                
                {/* Page Info & Controls */}
                <div className="p-3 bg-black/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Page {page.page_number}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(page)}
                        disabled={page.page_number <= 1}
                        className={`p-1 rounded ${
                          page.page_number <= 1 ? 'text-gray-600 cursor-not-allowed' : 'hover:text-blue-500'
                        }`}
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(page)}
                        disabled={page.page_number >= pages.length}
                        className={`p-1 rounded ${
                          page.page_number >= pages.length ? 'text-gray-600 cursor-not-allowed' : 'hover:text-blue-500'
                        }`}
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePage(page.id)}
                        className="p-1 rounded hover:text-red-500"
                        title="Delete page"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(page.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

export default PageManager;
