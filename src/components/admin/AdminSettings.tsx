import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../lib/settingsApi';
import SocialMediaManager from './SocialMediaManager';

const AdminSettings: React.FC = () => {
  // State for each setting (extend with real data/fetch logic)
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [featuredManga, setFeaturedManga] = useState('');
  const [announcement, setAnnouncement] = useState('');

  // Admin management
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdmin, setNewAdmin] = useState('');

  // Moderation
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [reviewModeration, setReviewModeration] = useState<'auto' | 'manual' | 'disabled'>('auto');
  const [blockedTags, setBlockedTags] = useState<string>('');
  
  // Active tab for settings sections
  const [activeTab, setActiveTab] = useState<'general' | 'admins' | 'moderation' | 'social'>('general');

  // Loading, error, and success states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSettings()
      .then((data) => {
        setSiteTitle(data.siteTitle || '');
        setSiteDescription(data.siteDescription || '');
        setMaintenanceMode(!!data.maintenanceMode);
        setFeaturedManga(data.featuredManga || '');
        setAnnouncement(data.announcement || '');
        setAdminEmails(data.adminEmails || []);
        setRegistrationEnabled(
          typeof data.registrationEnabled === 'boolean' ? data.registrationEnabled : true
        );
        setReviewModeration(data.reviewModeration || 'auto');
        setBlockedTags(data.blockedTags || '');
        setError(null);
      })
      .catch((err) => {
        setError('Failed to load settings: ' + (err?.message || err));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      await updateSettings({
        id: 'singleton',
        siteTitle,
        siteDescription,
        maintenanceMode,
        featuredManga,
        announcement,
        adminEmails,
        registrationEnabled,
        reviewModeration,
        blockedTags,
      });
      setSuccess(true);
    } catch (err: any) {
      setError('Failed to save settings: ' + (err?.message || err));
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  if (loading && activeTab !== 'social') return <div className="text-center text-gray-400 py-12">Loading settings...</div>;
  if (error && activeTab !== 'social') return <div className="text-center text-red-500 py-12">{error}</div>;

  return (
    <div className="space-y-8">
      {success && activeTab !== 'social' && (
        <div className="text-center text-green-500 mb-2">Settings saved!</div>
      )}
      
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 mb-6">
        <button 
          onClick={() => setActiveTab('general')} 
          className={`py-2 px-4 font-medium ${activeTab === 'general' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
        >
          General Settings
        </button>
        <button 
          onClick={() => setActiveTab('admins')} 
          className={`py-2 px-4 font-medium ${activeTab === 'admins' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
        >
          Admin Management
        </button>
        <button 
          onClick={() => setActiveTab('moderation')} 
          className={`py-2 px-4 font-medium ${activeTab === 'moderation' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
        >
          Moderation
        </button>
        <button 
          onClick={() => setActiveTab('social')} 
          className={`py-2 px-4 font-medium ${activeTab === 'social' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
        >
          Social Media
        </button>
      </div>

      {/* General Settings Tab Content */}
      {activeTab === 'general' && (
        <div>
          {/* Site Configuration */}
          <section className="p-4 border border-white/10 bg-black/20 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Site Configuration</h3>
            <label className="block mb-2">
              <span className="block text-gray-300">Site Title</span>
              <input type="text" className="manga-input" value={siteTitle} onChange={e => setSiteTitle(e.target.value)} />
            </label>
            <label className="block mb-2">
              <span className="block text-gray-300">Description</span>
              <input type="text" className="manga-input" value={siteDescription} onChange={e => setSiteDescription(e.target.value)} />
            </label>
            <div className="flex items-center mb-2">
              <input type="checkbox" id="maintenance" checked={maintenanceMode} onChange={e => setMaintenanceMode(e.target.checked)} />
              <label htmlFor="maintenance" className="ml-2 text-gray-300">Maintenance Mode</label>
            </div>
            <label className="block mb-2">
              <span className="block text-gray-300">Featured Manga (IDs, comma-separated)</span>
              <input type="text" className="manga-input" value={featuredManga} onChange={e => setFeaturedManga(e.target.value)} />
            </label>
            <label className="block mb-2">
              <span className="block text-gray-300">Announcement Banner</span>
              <input type="text" className="manga-input" value={announcement} onChange={e => setAnnouncement(e.target.value)} />
            </label>
          </section>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="manga-button bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed px-5 py-2"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Admin Management Tab Content */}
      {activeTab === 'admins' && (
        <div>
          <section className="p-4 border border-white/10 bg-black/20 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Admin Management</h3>
            <div className="mb-2">
              <span className="block text-gray-300 mb-1">Current Admins</span>
              <ul className="mb-2">
                {adminEmails.map((email, idx) => (
                  <li key={email} className="flex items-center justify-between">
                    <span>{email}</span>
                    <button
                      className="text-red-500 ml-2"
                      onClick={() => setAdminEmails(adminEmails.filter((_, i) => i !== idx))}
                      disabled={adminEmails.length === 1}
                    >Remove</button>
                  </li>
                ))}
              </ul>
              <div className="flex">
                <input
                  type="email"
                  className="manga-input flex-1 mr-2"
                  placeholder="Add admin email"
                  value={newAdmin}
                  onChange={e => setNewAdmin(e.target.value)}
                />
                <button
                  className="manga-border px-3 py-1"
                  onClick={() => {
                    if (newAdmin && !adminEmails.includes(newAdmin)) {
                      setAdminEmails([...adminEmails, newAdmin]);
                      setNewAdmin('');
                    }
                  }}
                >Add</button>
              </div>
            </div>
          </section>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="manga-button bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed px-5 py-2"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
      
      {/* Moderation Tab Content */}
      {activeTab === 'moderation' && (
        <div>
          <section className="p-4 border border-white/10 bg-black/20 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Moderation Settings</h3>
            <div className="flex items-center mb-2">
              <input 
                type="checkbox" 
                id="registration" 
                checked={registrationEnabled} 
                onChange={e => setRegistrationEnabled(e.target.checked)} 
              />
              <label htmlFor="registration" className="ml-2 text-gray-300">Enable New User Registration</label>
            </div>
            <label className="block mb-2">
              <span className="block text-gray-300">Review Moderation</span>
              <select
                className="manga-input"
                value={reviewModeration}
                onChange={e => setReviewModeration(e.target.value as any)}
              >
                <option value="auto">Automatic</option>
                <option value="manual">Manual</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
            <div className="block mb-2">
              <span className="block text-gray-300">Blocked Tags/Genres (comma-separated)</span>
              <textarea
                className="manga-input w-full h-24"
                value={blockedTags}
                onChange={e => setBlockedTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
              ></textarea>
            </div>
          </section>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="manga-button bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed px-5 py-2"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
      
      {/* Social Media Tab Content */}
      {activeTab === 'social' && <SocialMediaManager />}
    </div>
  );
};

export default AdminSettings;
