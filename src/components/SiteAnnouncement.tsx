import React, { useEffect, useState } from 'react';
import { getSettings } from '../lib/settingsApi';
import { BellRing } from 'lucide-react';

const SiteAnnouncement: React.FC = () => {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings.announcement && settings.announcement.trim() !== '') {
        setAnnouncement(settings.announcement);
      }
    });
  }, []);

  if (!announcement || !visible) return null;

  return (
    <div className="manga-panel bg-black/70 border border-red-500/50 py-4 px-8 my-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BellRing className="h-8 w-8 text-red-500" />
          <div>
            <span className="block manga-title text-2xl text-red-500 mb-1">MangaVerse Announcement</span>
            <p className="manga-title text-xl" style={{letterSpacing: '0.05em'}}>
              {announcement}
            </p>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="manga-border bg-black/50 hover:bg-red-500 px-4 py-2 transition-colors text-xl manga-title"
          style={{letterSpacing: '0.05em'}}
          aria-label="Dismiss announcement"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

export default SiteAnnouncement;
