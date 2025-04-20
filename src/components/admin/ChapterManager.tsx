import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash, 
  Eye, 
  ChevronDown, 
  RefreshCw,
  Loader,
  FileImage,
  Filter
} from 'lucide-react';
import { getChaptersByMangaId, getMangaList, deleteChapter } from '../../lib/supabaseClient';
import ChapterForm from './ChapterForm';
import ChapterView from './ChapterView';
import PageManager from './PageManager';

const ChapterManager: React.FC = () => {
  const [chapters, setChapters] = useState<any[]>([]);
  const [manga, setManga] = useState<any[]>([]);
  const [selectedManga, setSelectedManga] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [isViewingChapter, setIsViewingChapter] = useState(false);
  const [isManagingPages, setIsManagingPages] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingManga, setLoadingManga] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionsOpen, setActionsOpen] = useState<Record<string, boolean>>({});
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

  const loadManga = useCallback(async () => {
    setLoadingManga(true);
    try {
      const { data, error } = await getMangaList(100, 0);
      if (error) throw error;
      setManga(data || []);
    } catch (err) {
      console.error('Error loading manga list:', err);
    } finally {
      setLoadingManga(false);
    }
  }, []);

  const loadChapters = useCallback(async () => {
    if (!selectedManga) {
      setChapters([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setRefreshing(true);
    try {
      const { data, error } = await getChaptersByMangaId(selectedManga);
      if (error) {
        console.error('Error loading chapters:', error);
        // Set chapters to empty array even if there's an error to exit loading state
        setChapters([]);
      } else {
        setChapters(data || []);
      }
      setLastFetchTime(Date.now());
    } catch (err) {
      console.error('Error loading chapters:', err);
      // Set chapters to empty array on error to exit loading state
      setChapters([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedManga]);

  // Load manga list on component mount
  useEffect(() => {
    loadManga();
  }, [loadManga]);

  // Load chapters when manga selection changes
  useEffect(() => {
    if (selectedManga) {
      loadChapters();
    }
  }, [selectedManga, loadChapters]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedManga) {
        const currentTime = Date.now();
        if (currentTime - lastFetchTime > REFRESH_INTERVAL) {
          loadChapters();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadChapters, lastFetchTime, selectedManga]);

  const handleMangaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mangaId = event.target.value || null;
    setSelectedManga(mangaId);
  };

  const handleActionToggle = (chapterId: string) => {
    setActionsOpen(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const closeAllActions = () => {
    setActionsOpen({});
  };

  const handleAddChapter = () => {
    setIsAddingChapter(true);
    closeAllActions();
  };

  const handleEditChapter = (chapter: any) => {
    setSelectedChapter(chapter);
    setIsEditingChapter(true);
    closeAllActions();
  };

  const handleViewChapter = (chapter: any) => {
    setSelectedChapter(chapter);
    setIsViewingChapter(true);
    closeAllActions();
  };

  const handleManagePages = (chapter: any) => {
    setSelectedChapter(chapter);
    setIsManagingPages(true);
    closeAllActions();
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!window.confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await deleteChapter(chapterId);
      if (error) throw error;
      // Refresh the chapters list
      loadChapters();
    } catch (err) {
      console.error('Error deleting chapter:', err);
      alert('Failed to delete chapter. Please try again.');
    }
    
    closeAllActions();
  };

  const handleChapterFormComplete = () => {
    setIsAddingChapter(false);
    setIsEditingChapter(false);
    setSelectedChapter(null);
    loadChapters();
  };

  const handleChapterFormCancel = () => {
    setIsAddingChapter(false);
    setIsEditingChapter(false);
    setSelectedChapter(null);
  };

  const handleChapterViewClose = () => {
    setIsViewingChapter(false);
    setSelectedChapter(null);
  };

  const handlePageManagerClose = () => {
    setIsManagingPages(false);
    setSelectedChapter(null);
    loadChapters(); // Refresh to see any changes to chapters
  };

  const handleRefresh = () => {
    loadChapters();
  };

  // Filter chapters by search term
  const filteredChapters = chapters.filter(chapter => {
    const chapterNumber = String(chapter.chapter_number || '');
    const chapterTitle = (chapter.title || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return chapterNumber.includes(searchTerm) || 
           chapterTitle.includes(searchLower);
  });

  // If we're in a form mode, show that form instead of the list
  if (isAddingChapter || isEditingChapter) {
    return (
      <ChapterForm 
        manga={manga}
        selectedMangaId={selectedManga}
        chapter={isEditingChapter ? selectedChapter : null}
        onComplete={handleChapterFormComplete}
        onCancel={handleChapterFormCancel}
      />
    );
  }

  if (isViewingChapter && selectedChapter) {
    return (
      <ChapterView 
        chapter={selectedChapter} 
        onClose={handleChapterViewClose}
      />
    );
  }

  if (isManagingPages && selectedChapter) {
    return (
      <PageManager 
        chapter={selectedChapter} 
        onClose={handlePageManagerClose}
      />
    );
  }

  // Otherwise, show the chapters list
  return (
    <div className="chapter-manager p-4 h-full">
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Chapter Management</h2>
          
          {/* Manga Selection and Actions */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="md:w-1/2">
              <label htmlFor="manga-select" className="block text-sm font-medium mb-2">
                Select Manga
              </label>
              <select
                id="manga-select"
                value={selectedManga || ''}
                onChange={handleMangaChange}
                disabled={loadingManga}
                className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
              >
                <option value="">Select a manga</option>
                {manga.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              {loadingManga && (
                <div className="mt-2 text-sm text-gray-400 flex items-center">
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Loading manga list...
                </div>
              )}
            </div>
            
            <div className="md:w-1/2 flex items-end">
              <button
                type="button"
                onClick={handleAddChapter}
                disabled={!selectedManga}
                className={`manga-border px-4 py-2 flex items-center gap-2 ${
                  !selectedManga ? 'opacity-50 cursor-not-allowed' : 'hover:text-green-500'
                } transition-colors`}
              >
                <Plus className="w-5 h-5" />
                Add New Chapter
              </button>
              
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing || !selectedManga}
                className={`manga-border ml-4 px-4 py-2 flex items-center gap-2 ${
                  refreshing || !selectedManga ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-500'
                } transition-colors`}
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Search and Filter */}
          {selectedManga && (
            <div className="relative flex mb-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
                  placeholder="Search by chapter number or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Chapters List */}
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader className="w-10 h-10 text-red-500 animate-spin mb-4" />
              <p className="text-gray-400">Loading chapters...</p>
            </div>
          ) : !selectedManga ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <BookOpen className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Manga Selected</h3>
              <p className="text-gray-400 max-w-md">
                Please select a manga from the dropdown above to view and manage its chapters.
              </p>
            </div>
          ) : chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <BookOpen className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Chapters Found</h3>
              <p className="text-gray-400 max-w-md">
                This manga doesn't have any chapters yet. Click "Add New Chapter" to create one.
              </p>
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Search className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Matching Chapters</h3>
              <p className="text-gray-400 max-w-md">
                No chapters match your search criteria. Try adjusting your search terms.
              </p>
            </div>
          ) : (
            <div className="bg-black/30 border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-black/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Chapter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Pages
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Release Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredChapters.map((chapter) => (
                      <tr key={chapter.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-800">
                              <BookOpen className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium">
                                {chapter.chapter_number ? `Chapter ${chapter.chapter_number}` : 'No Number'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{chapter.title || 'Untitled'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <FileImage className="w-4 h-4 mr-2 text-gray-400" />
                            {chapter.page_count || 0} pages
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            chapter.status === 'published' ? 'bg-green-900/50 text-green-300' : 
                            chapter.status === 'draft' ? 'bg-yellow-900/50 text-yellow-300' : 
                            'bg-gray-900/50 text-gray-300'
                          }`}>
                            {chapter.status || 'draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {chapter.release_date ? new Date(chapter.release_date).toLocaleDateString() : 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              className="manga-border p-2 hover:text-blue-500 transition-colors"
                              onClick={() => handleActionToggle(chapter.id)}
                              aria-label="Chapter actions"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            
                            {actionsOpen[chapter.id] && (
                              <div 
                                className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                  <button
                                    type="button"
                                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left"
                                    onClick={() => handleViewChapter(chapter)}
                                  >
                                    <Eye className="w-4 h-4 mr-3" />
                                    View Chapter
                                  </button>
                                  <button
                                    type="button"
                                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left"
                                    onClick={() => handleEditChapter(chapter)}
                                  >
                                    <Edit className="w-4 h-4 mr-3" />
                                    Edit Chapter
                                  </button>
                                  <button
                                    type="button"
                                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left"
                                    onClick={() => handleManagePages(chapter)}
                                  >
                                    <FileImage className="w-4 h-4 mr-3" />
                                    Manage Pages
                                  </button>
                                  <button
                                    type="button"
                                    className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 w-full text-left"
                                    onClick={() => handleDeleteChapter(chapter.id)}
                                  >
                                    <Trash className="w-4 h-4 mr-3" />
                                    Delete Chapter
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterManager;
