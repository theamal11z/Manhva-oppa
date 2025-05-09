import React, { useState, useEffect } from 'react';
import { getSocialMediaLinks, SocialMediaLink } from '../lib/socialMediaApi';
import * as LucideIcons from 'lucide-react';

interface SocialMediaLinksProps {
  className?: string;
  iconSize?: number;
  iconClassName?: string;
  labelClassName?: string;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  maxLinks?: number;
}

const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  className = '',
  iconSize = 24,
  iconClassName = '',
  labelClassName = '',
  showLabels = false,
  orientation = 'horizontal',
  maxLinks
}) => {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        const links = await getSocialMediaLinks();
        setSocialLinks(links);
      } catch (err: any) {
        console.error('Failed to load social media links:', err);
        setError(err.message || 'Failed to load social media links');
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  if (loading) return null; // Don't show anything while loading
  if (error || socialLinks.length === 0) return null; // Don't show errors or empty lists

  // If maxLinks is set, limit the number of links shown
  const linksToShow = maxLinks ? socialLinks.slice(0, maxLinks) : socialLinks;

  // Helper to get the appropriate icon
  const getIcon = (iconName: string) => {
    // Check if the icon exists in Lucide icons
    const IconComponent = (LucideIcons as any)[iconName] || 
                        (LucideIcons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1)] || 
                        LucideIcons.Link;
    
    return <IconComponent size={iconSize} />;
  };

  return (
    <div className={`${className} ${orientation === 'vertical' ? 'flex-col' : 'flex'} flex gap-4`}>
      {linksToShow.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center ${orientation === 'vertical' ? 'mb-2' : ''} ${
            iconClassName || 'text-gray-400 hover:text-white transition-colors'
          }`}
          title={link.display_name}
        >
          <span className="mr-2">{getIcon(link.icon)}</span>
          {showLabels && (
            <span className={labelClassName || 'text-sm'}>{link.display_name}</span>
          )}
        </a>
      ))}
    </div>
  );
};

export default SocialMediaLinks;
