import React, { useState } from 'react';
import { X, Save, Upload, ArrowLeft, AlertTriangle, Plus, X as XIcon } from 'lucide-react';
import { addMangaEntry, updateMangaEntry, uploadCoverImage } from '../../lib/supabaseClient';

type MangaFormProps = {
  manga?: any;
  onComplete: () => void;
  onCancel: () => void;
};

const MangaForm: React.FC<MangaFormProps> = ({ manga, onComplete, onCancel }) => {
  const isEditing = !!manga;
  const [formData, setFormData] = useState({
    title: manga?.title || '',
    description: manga?.description || '',
    author: manga?.author || '',
    artist: manga?.artist || '',
    status: manga?.status || 'ongoing',
    type: manga?.type || 'manga',
    year: manga?.year || new Date().getFullYear(),
    age_rating: manga?.age_rating || 'all',
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(manga?.cover_image || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For genres and tags
  const [selectedGenres, setSelectedGenres] = useState<string[]>(manga?.genres?.map((g: any) => g.genres.name) || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(manga?.tags?.map((t: any) => t.tags.name) || []);
  const [newGenre, setNewGenre] = useState('');
  const [newTag, setNewTag] = useState('');
  
  // Common genres and tags for quick selection
  const commonGenres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural'];
  const commonTags = ['School Life', 'Magic', 'Martial Arts', 'Historical', 'Military', 'Psychological', 'Isekai', 'Time Travel', 'Harem', 'Mature'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const addGenre = () => {
    if (newGenre && !selectedGenres.includes(newGenre)) {
      setSelectedGenres([...selectedGenres, newGenre]);
      setNewGenre('');
    }
  };
  
  const removeGenre = (genre: string) => {
    setSelectedGenres(selectedGenres.filter(g => g !== genre));
  };
  
  const addTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
      setNewTag('');
    }
  };
  
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      let coverImageUrl = manga?.cover_image || '';
      
      // Upload cover image if provided
      if (coverImage) {
        const imagePath = `${Date.now()}-${coverImage.name}`;
        const uploadResult = await uploadCoverImage(coverImage, imagePath);
        
        if (uploadResult.error) {
          throw new Error(`Failed to upload cover image: ${uploadResult.error.message}`);
        }
        
        // Get the public URL
        coverImageUrl = `https://iwybjtgyldetjzpgpjal.supabase.co/storage/v1/object/public/manga_covers/${imagePath}`;
      }
      
      const mangaData = {
        ...formData,
        cover_image: coverImageUrl,
        genres: selectedGenres,
        tags: selectedTags
      };
      
      if (isEditing) {
        // Update existing manga
        const { error } = await updateMangaEntry(manga.id, mangaData);
        if (error) throw new Error(error.message);
      } else {
        // Add new manga
        const { error } = await addMangaEntry(mangaData);
        if (error) throw new Error(error.message);
      }
      
      onComplete();
    } catch (err: any) {
      console.error('Error saving manga:', err);
      setError(err.message || 'Failed to save manga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manga-panel p-6 bg-black/30 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold manga-title">{isEditing ? 'Edit Manga' : 'Add New Manga'}</h2>
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
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">Title <span className="text-red-500">*</span></label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Manga title"
                className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
            
            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium mb-2">Cover Image</label>
              <div className="flex items-start gap-4">
                <div className="w-24 h-32 bg-gray-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/20">
                  {coverPreview ? (
                    <img 
                      src={coverPreview} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <div className="text-gray-400 flex justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">No image</p>
                    </div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <label 
                    htmlFor="cover-upload" 
                    className="manga-border px-4 py-2 cursor-pointer inline-flex items-center gap-2 hover:text-blue-400 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    {coverPreview ? 'Change Image' : 'Upload Image'}
                  </label>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-400 mt-2">Recommended: 350×500px JPG or PNG</p>
                </div>
              </div>
            </div>
            
            {/* Author & Artist */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="author" className="block text-sm font-medium mb-2">Author</label>
                <input
                  id="author"
                  name="author"
                  type="text"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Author name"
                  className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="artist" className="block text-sm font-medium mb-2">Artist</label>
                <input
                  id="artist"
                  name="artist"
                  type="text"
                  value={formData.artist}
                  onChange={handleChange}
                  placeholder="Artist name"
                  className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
            
            {/* Status & Type & Year */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-2">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">On Hiatus</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-2">Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
                >
                  <option value="manga">Manga</option>
                  <option value="manhwa">Manhwa</option>
                  <option value="manhua">Manhua</option>
                  <option value="webtoon">Webtoon</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="year" className="block text-sm font-medium mb-2">Year</label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
              <textarea
                id="description"
                name="description"
                rows={6}
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter a brief description"
                className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
            
            {/* Age Rating */}
            <div>
              <label htmlFor="age_rating" className="block text-sm font-medium mb-2">Age Rating</label>
              <select
                id="age_rating"
                name="age_rating"
                value={formData.age_rating}
                onChange={handleChange}
                className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
              >
                <option value="all">All Ages</option>
                <option value="teen">Teen (13+)</option>
                <option value="mature">Mature (17+)</option>
                <option value="adult">Adult (18+)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Genres & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Genres */}
          <div>
            <label className="block text-sm font-medium mb-2">Genres</label>
            
            {/* Selected genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedGenres.map(genre => (
                <span 
                  key={genre} 
                  className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {genre}
                  <button 
                    type="button" 
                    onClick={() => removeGenre(genre)}
                    className="ml-2 hover:text-red-500"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
              {selectedGenres.length === 0 && (
                <span className="text-gray-400 text-sm">No genres selected</span>
              )}
            </div>
            
            {/* Add new genre */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                className="flex-grow p-2 bg-black/30 border border-white/20 focus:border-red-500 outline-none transition-colors"
                placeholder="Add a genre..."
              />
              <button
                type="button"
                onClick={addGenre}
                disabled={!newGenre}
                className="manga-border px-3 py-2 hover:text-green-500 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            
            {/* Common genres */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Common genres:</p>
              <div className="flex flex-wrap gap-2">
                {commonGenres.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => {
                      if (!selectedGenres.includes(genre)) {
                        setSelectedGenres([...selectedGenres, genre]);
                      }
                    }}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      selectedGenres.includes(genre) 
                        ? 'bg-blue-900 text-blue-100 cursor-not-allowed' 
                        : 'bg-black/30 hover:bg-gray-700 text-gray-300'
                    }`}
                    disabled={selectedGenres.includes(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            
            {/* Selected tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTags.map(tag => (
                <span 
                  key={tag} 
                  className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-red-500"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
              {selectedTags.length === 0 && (
                <span className="text-gray-400 text-sm">No tags selected</span>
              )}
            </div>
            
            {/* Add new tag */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-grow p-2 bg-black/30 border border-white/20 focus:border-red-500 outline-none transition-colors"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!newTag}
                className="manga-border px-3 py-2 hover:text-green-500 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            
            {/* Common tags */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Common tags:</p>
              <div className="flex flex-wrap gap-2">
                {commonTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!selectedTags.includes(tag)) {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      selectedTags.includes(tag) 
                        ? 'bg-blue-900 text-blue-100 cursor-not-allowed' 
                        : 'bg-black/30 hover:bg-gray-700 text-gray-300'
                    }`}
                    disabled={selectedTags.includes(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
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
            disabled={loading || !formData.title}
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : isEditing ? 'Update Manga' : 'Add Manga'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MangaForm;
