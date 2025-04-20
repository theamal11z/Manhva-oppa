import React from 'react';
import { X, BookOpen, Calendar, User, Type, Package, Tag, ArrowLeft } from 'lucide-react';

type MangaViewProps = {
  manga: any;
  onClose: () => void;
};

const MangaView: React.FC<MangaViewProps> = ({ manga, onClose }) => {
  if (!manga) return null;
  
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'ongoing':
        return 'text-green-500';
      case 'completed':
        return 'text-blue-500';
      case 'hiatus':
        return 'text-yellow-500';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="manga-panel p-6 bg-black/30 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold manga-title">Manga Details</h2>
        <button 
          type="button" 
          onClick={onClose} 
          className="p-2 hover:text-red-500 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Cover Image */}
        <div className="col-span-1">
          <div className="bg-black/20 rounded overflow-hidden flex items-center justify-center h-[350px]">
            {manga.cover_image ? (
              <img 
                src={manga.cover_image} 
                alt={manga.title} 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <BookOpen className="w-16 h-16 text-gray-600 mb-2" />
                <p className="text-gray-400">No cover image available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Manga Details */}
        <div className="col-span-1 md:col-span-2">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{manga.title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`capitalize px-3 py-1 text-sm rounded-full bg-black/30 ${getStatusColor(manga.status)}`}>
              {manga.status || 'Unknown'}
            </span>
            <span className="capitalize px-3 py-1 text-sm rounded-full bg-black/30 text-gray-300">
              {manga.type || 'Manga'}
            </span>
            <span className="px-3 py-1 text-sm rounded-full bg-black/30 text-gray-300">
              {manga.age_rating || 'All Ages'}
            </span>
          </div>
          
          <div className="space-y-4 mb-6">
            {/* Information Groups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-300">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Author:</span>
                <span>{manga.author || 'Unknown'}</span>
              </div>
              
              {manga.artist && manga.artist !== manga.author && (
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">Artist:</span>
                  <span>{manga.artist}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Year:</span>
                <span>{manga.year || 'Unknown'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-300">
                <Type className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Type:</span>
                <span className="capitalize">{manga.type || 'Manga'}</span>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <div className="bg-black/20 p-4 rounded">
                {manga.description ? (
                  <p className="text-gray-300 whitespace-pre-line">{manga.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available.</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Genres and Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Genres */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold">Genres</h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {manga.genres && manga.genres.length > 0 ? (
                  manga.genres.map((genreItem: any) => (
                    <span 
                      key={genreItem.genres?.id || genreItem} 
                      className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm"
                    >
                      {genreItem.genres?.name || genreItem}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 italic">No genres specified</span>
                )}
              </div>
            </div>
            
            {/* Tags */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold">Tags</h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {manga.tags && manga.tags.length > 0 ? (
                  manga.tags.map((tagItem: any) => (
                    <span 
                      key={tagItem.tags?.id || tagItem} 
                      className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                    >
                      {tagItem.tags?.name || tagItem}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 italic">No tags specified</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Metadata */}
      <div className="border-t border-white/10 pt-4 mt-4 text-sm text-gray-400">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div>ID: {manga.id}</div>
          <div>Created: {new Date(manga.created_at).toLocaleDateString()}</div>
          {manga.updated_at && (
            <div>Updated: {new Date(manga.updated_at).toLocaleDateString()}</div>
          )}
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
          Back to List
        </button>
      </div>
    </div>
  );
};

export default MangaView;
