import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the Recommendation type (can be imported from a shared types file if available)
interface Recommendation {
  id: string;
  title: string;
  cover_image: string;
  reason: string;
  match_percentage: number;
  genres: string[];
  // updated_at: string; // Not used in card display, can be omitted if not needed for other logic here
}

interface RecommendationCardProps {
  rec: Recommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ rec }) => {
  const navigate = useNavigate();
  const dragStartY = useRef<number>(0);
  const dragDistance = useRef<number>(0);

  const handleCardClick = () => {
    if (dragDistance.current < 15) {
      navigate(`/manga/${rec.id}`);
    } else {
      // Optional: console.log for debugging drag-vs-click, but remove for production
      // console.log(`[Card Click] Navigation prevented due to dragDistance: ${dragDistance.current}`);
    }
    // Reset drag distance after click attempt
    dragDistance.current = 0;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches.length === 1) {
      dragStartY.current = e.touches[0].clientY;
      dragDistance.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches.length === 1) {
      dragDistance.current = Math.abs(e.touches[0].clientY - dragStartY.current);
    }
  };

  // Mouse equivalents for drag detection (optional, can be simplified if only touch is primary concern)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY;
    dragDistance.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only calculate if mouse button is pressed (e.buttons === 1 for left click)
    if (e.buttons === 1) {
        dragDistance.current = Math.abs(e.clientY - dragStartY.current);
    }
  };
  
  const handleMouseUp = () => {
    // dragDistance is already set by mouseMove, click handler will use it.
    // Optionally reset dragDistance here if click doesn't always follow up, but usually does.
  };

  return (
    <div
      className="manga-card bg-gray-800/50 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-700/50 hover:-translate-y-1 cursor-pointer"
      tabIndex={0}
      role="button"
      onClick={handleCardClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp} // important to get final drag distance for mouse
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleCardClick} // onTouchEnd can also trigger the click logic after scroll
    >
      <div className="relative h-56 overflow-hidden">
        <img 
          src={rec.cover_image} 
          alt={rec.title} 
          className="w-full h-full object-cover"
          loading="lazy" // Added lazy loading for images
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-cover.jpg'; // Ensure this placeholder exists in public folder
          }}
        />
        <div className="absolute bottom-0 right-0 bg-red-500 text-white px-2 py-1 text-sm font-semibold">
          {rec.match_percentage}% Match
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{rec.title}</h3>
        <div className="flex flex-wrap gap-1 mb-3">
          {rec.genres.slice(0, 3).map((genre: string, idx: number) => (
            <span key={idx} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
              {genre}
            </span>
          ))}
          {rec.genres.length > 3 && (
            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
              +{rec.genres.length - 3}
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm line-clamp-2">{rec.reason}</p>
      </div>
    </div>
  );
};

export default React.memo(RecommendationCard);
