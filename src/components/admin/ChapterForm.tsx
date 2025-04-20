import React, { useState, useEffect } from 'react';
import { X, Save, ArrowLeft, AlertTriangle, Calendar } from 'lucide-react';
import { addChapter, updateChapter } from '../../lib/supabaseClient';

type ChapterFormProps = {
  manga: any[];
  selectedMangaId: string | null;
  chapter?: any | null;
  onComplete: () => void;
  onCancel: () => void;
};

const ChapterForm: React.FC<ChapterFormProps> = ({ 
  manga, 
  selectedMangaId, 
  chapter, 
  onComplete, 
  onCancel 
}) => {
  const isEditing = !!chapter;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    manga_id: selectedMangaId || '',
    chapter_number: '',
    title: '',
    description: '',
    status: 'draft',
    release_date: new Date().toISOString().split('T')[0] // Today in YYYY-MM-DD format
  });

  // Initialize form data if editing
  useEffect(() => {
    if (isEditing && chapter) {
      setFormData({
        manga_id: chapter.manga_id || selectedMangaId || '',
        chapter_number: chapter.chapter_number?.toString() || '',
        title: chapter.title || '',
        description: chapter.description || '',
        status: chapter.status || 'draft',
        release_date: chapter.release_date 
          ? new Date(chapter.release_date).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0]
      });
    }
  }, [isEditing, chapter, selectedMangaId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const chapterData = {
        ...formData,
        chapter_number: formData.chapter_number ? parseFloat(formData.chapter_number) : null
      };

      let result;
      if (isEditing) {
        result = await updateChapter(chapter.id, chapterData);
      } else {
        result = await addChapter(chapterData);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      onComplete();
    } catch (err: any) {
      console.error('Error saving chapter:', err);
      setError(err.message || 'Failed to save chapter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get the manga title for display
  const selectedMangaTitle = manga.find(m => m.id === formData.manga_id)?.title || 'Unknown Manga';

  return (
    <div className="chapter-form p-6 bg-black/30 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold manga-title">
          {isEditing ? 'Edit Chapter' : 'Add New Chapter'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Manga Information (Read-only) */}
        <div>
          <label className="block text-sm font-medium mb-2">Manga</label>
          <div className="p-3 bg-black/30 border border-white/20 rounded">
            <p className="font-medium">{selectedMangaTitle}</p>
          </div>
        </div>

        {/* Basic Chapter Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chapter Number */}
          <div>
            <label htmlFor="chapter_number" className="block text-sm font-medium mb-2">
              Chapter Number <span className="text-red-500">*</span>
            </label>
            <input
              id="chapter_number"
              name="chapter_number"
              type="number"
              step="0.1"
              min="0"
              value={formData.chapter_number}
              onChange={handleChange}
              required
              placeholder="e.g., 1, 1.5, 2"
              className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-gray-400">
              You can use decimal numbers for special chapters (e.g., 7.5 for extras)
            </p>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Chapter Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Chapter title (optional)"
              className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description or notes about this chapter (optional)"
            className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Release Date & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Release Date */}
          <div>
            <label htmlFor="release_date" className="block text-sm font-medium mb-2">
              Release Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="release_date"
                name="release_date"
                type="date"
                value={formData.release_date}
                onChange={handleChange}
                className="w-full pl-10 p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
            >
              <option value="draft">Draft (Not Visible)</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              {formData.status === 'scheduled' && 'Chapter will be automatically published on the release date'}
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="manga-border px-4 py-2 hover:text-red-500 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <ArrowLeft className="w-5 h-5" />
            Cancel
          </button>
          <button
            type="submit"
            className="bg-red-500/20 hover:bg-red-500/30 manga-border px-4 py-2 flex items-center gap-2 transition-all"
            disabled={loading || !formData.chapter_number}
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : isEditing ? 'Update Chapter' : 'Add Chapter'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChapterForm;
