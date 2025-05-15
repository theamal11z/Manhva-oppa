import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { saveOnboardingPreferences } from '../lib/recommendationEngine';

interface Genre {
  id: string;
  name: string;
}

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

const RecommendationOnboarding: React.FC<OnboardingProps> = ({ userId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [excludedGenres, setExcludedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGenres();
    
    // Add CSS fixes for the buttons
    const styleEl = document.createElement('style');
    styleEl.id = 'onboarding-fix-styles';
    styleEl.textContent = `
      /* Fix z-index issues for onboarding component */
      .manga-panel {
        position: relative;
        z-index: 10;
      }
      
      .manga-panel button {
        position: relative;
        z-index: 20;
        cursor: pointer;
      }
      
      .grid button {
        position: relative;
        z-index: 30;
        pointer-events: auto !important;
      }
      
      /* Ensure navigation doesn't interfere */
      nav.fixed {
        z-index: 5;
      }
    `;
    
    // Add the style element to the head
    document.head.appendChild(styleEl);
    
    // Clean up function
    return () => {
      const existingStyle = document.getElementById('onboarding-fix-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('genres')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setGenres(data || []);
    } catch (err: any) {
      console.error('Error fetching genres:', err);
      setError(err.message || 'Failed to load genres');
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genreName: string, list: 'favorites' | 'excluded') => {
    if (list === 'favorites') {
      if (selectedGenres.includes(genreName)) {
        setSelectedGenres(selectedGenres.filter(g => g !== genreName));
      } else {
        // Remove from excluded if it's being added to favorites
        setExcludedGenres(excludedGenres.filter(g => g !== genreName));
        setSelectedGenres([...selectedGenres, genreName]);
      }
    } else {
      if (excludedGenres.includes(genreName)) {
        setExcludedGenres(excludedGenres.filter(g => g !== genreName));
      } else {
        // Remove from favorites if it's being added to excluded
        setSelectedGenres(selectedGenres.filter(g => g !== genreName));
        setExcludedGenres([...excludedGenres, genreName]);
      }
    }
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save user preferences and generate initial recommendations
      const success = await saveOnboardingPreferences(userId, {
        favoriteGenres: selectedGenres,
        excludeGenres: excludedGenres
      });

      if (!success) {
        throw new Error('Failed to save preferences');
      }

      onComplete();
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="manga-panel p-6 bg-black/40 max-w-3xl mx-auto">
      <h2 className="manga-title text-2xl mb-6 transform -rotate-1">Personalize Your Recommendations</h2>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-300 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Select Your Favorite Genres</h3>
            <p className="text-gray-300 mb-4">
              Choose genres you enjoy to help us recommend manga tailored to your tastes.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {genres.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.name, 'favorites')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    selectedGenres.includes(genre.name)
                      ? 'bg-red-500/30 border border-red-500 text-white'
                      : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <div></div>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              disabled={selectedGenres.length === 0}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Genres You Want to Avoid</h3>
            <p className="text-gray-300 mb-4">
              Select any genres you'd prefer not to see in your recommendations.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {genres
                .filter(genre => !selectedGenres.includes(genre.name))
                .map(genre => (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.name, 'excluded')}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      excludedGenres.includes(genre.name)
                        ? 'bg-gray-500/30 border border-gray-500 text-white'
                        : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                  Processing...
                </span>
              ) : (
                'Save & Generate Recommendations'
              )}
            </button>
          </div>
        </div>
      )}
      
      <div className="flex justify-center mt-6">
        <div className="flex gap-2">
          <div className={`h-2 w-8 rounded-full ${step === 1 ? 'bg-red-500' : 'bg-gray-700'}`}></div>
          <div className={`h-2 w-8 rounded-full ${step === 2 ? 'bg-red-500' : 'bg-gray-700'}`}></div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationOnboarding;
