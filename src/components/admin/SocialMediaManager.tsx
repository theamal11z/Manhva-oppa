import React, { useState, useEffect } from 'react';
import { 
  getSocialMediaLinks, 
  addSocialMediaLink, 
  updateSocialMediaLink, 
  deleteSocialMediaLink, 
  reorderSocialMediaLinks,
  SocialMediaLink,
  COMMON_PLATFORMS
} from '../../lib/socialMediaApi';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';
import { X, Plus, Trash2, Move, Edit, ExternalLink } from 'lucide-react';

const SocialMediaManager: React.FC = () => {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialMediaLink | null>(null);
  
  // Form states
  const [platform, setPlatform] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [active, setActive] = useState(true);

  // Load all social media links
  const loadLinks = async () => {
    try {
      setLoading(true);
      const links = await getSocialMediaLinks(true); // Include inactive links
      setSocialLinks(links);
      setError(null);
    } catch (err: any) {
      setError(`Failed to load social media links: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  // Reset the form
  const resetForm = () => {
    setPlatform('');
    setCustomPlatform('');
    setUrl('');
    setIcon('');
    setDisplayName('');
    setActive(true);
    setShowAddForm(false);
    setEditingLink(null);
  };

  // Set form values when editing
  const prepareEditForm = (link: SocialMediaLink) => {
    const isPredefined = COMMON_PLATFORMS.some(p => p.value === link.platform);
    setPlatform(isPredefined ? link.platform : 'custom');
    setCustomPlatform(isPredefined ? '' : link.platform);
    setUrl(link.url);
    setIcon(link.icon);
    setDisplayName(link.display_name);
    setActive(link.active);
    setEditingLink(link);
    setShowAddForm(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const actualPlatform = platform === 'custom' ? customPlatform : platform;
      const defaultIcon = COMMON_PLATFORMS.find(p => p.value === platform)?.icon || icon;
      
      const linkData: Omit<SocialMediaLink, 'id'> = {
        platform: actualPlatform,
        url,
        icon: defaultIcon || actualPlatform,
        display_name: displayName,
        active,
        display_order: editingLink ? editingLink.display_order : socialLinks.length + 1
      };

      if (editingLink && editingLink.id) {
        await updateSocialMediaLink(editingLink.id, linkData);
        setSuccess('Social media link updated successfully!');
      } else {
        await addSocialMediaLink(linkData);
        setSuccess('Social media link added successfully!');
      }
      
      // Reload links and reset form
      await loadLinks();
      resetForm();
      
    } catch (err: any) {
      setError(`Failed to save social media link: ${err.message || err}`);
    } finally {
      setLoading(false);
      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => setSuccess(null), 3000);
      }
    }
  };

  // Handle link deletion
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this social media link?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteSocialMediaLink(id);
      setSuccess('Social media link deleted successfully!');
      await loadLinks();
    } catch (err: any) {
      setError(`Failed to delete social media link: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(socialLinks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setSocialLinks(items);
    
    try {
      await reorderSocialMediaLinks(items.map(item => item.id as string));
      setSuccess('Social media links reordered successfully!');
    } catch (err: any) {
      setError(`Failed to reorder links: ${err.message || err}`);
      await loadLinks(); // Reload original order if failed
    }
  };

  // When platform changes, set icon and display name accordingly
  useEffect(() => {
    if (platform && platform !== 'custom') {
      const selectedPlatform = COMMON_PLATFORMS.find(p => p.value === platform);
      if (selectedPlatform) {
        setIcon(selectedPlatform.icon);
        if (!editingLink) {
          setDisplayName(selectedPlatform.label);
        }
      }
    }
  }, [platform, editingLink]);

  if (loading && socialLinks.length === 0) {
    return <div className="text-center text-gray-400 py-12">Loading social media links...</div>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-900/30 border border-red-500 text-red-300 p-3 rounded">{error}</div>}
      {success && <div className="bg-green-900/30 border border-green-500 text-green-300 p-3 rounded">{success}</div>}
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Social Media Links</h2>
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="manga-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Link
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="p-4 border border-white/10 bg-black/40 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{editingLink ? 'Edit Social Media Link' : 'Add New Social Media Link'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-1">Platform</label>
                <select 
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value)}
                  className="manga-input w-full"
                  required
                >
                  <option value="">Select a platform</option>
                  {COMMON_PLATFORMS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                  <option value="custom">Custom platform</option>
                </select>
              </div>
              
              {platform === 'custom' && (
                <div>
                  <label className="block text-gray-300 mb-1">Custom Platform Name</label>
                  <input 
                    type="text" 
                    value={customPlatform} 
                    onChange={(e) => setCustomPlatform(e.target.value)}
                    className="manga-input w-full"
                    placeholder="e.g. Medium"
                    required={platform === 'custom'}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-gray-300 mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="manga-input w-full"
                  placeholder="e.g. Facebook"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">URL</label>
                <input 
                  type="url" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)}
                  className="manga-input w-full"
                  placeholder="https://facebook.com/youraccount"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Icon</label>
                <input 
                  type="text" 
                  value={icon} 
                  onChange={(e) => setIcon(e.target.value)}
                  className="manga-input w-full"
                  placeholder="Icon name (uses system icons)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Icon name from Lucide Icons or platform name
                </p>
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="active" 
                  checked={active} 
                  onChange={(e) => setActive(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-red-500"
                />
                <label htmlFor="active" className="ml-2 text-gray-300">
                  Active (visible on site)
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={resetForm}
                className="manga-button bg-gray-800 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="manga-button bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : editingLink ? 'Update Link' : 'Add Link'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* List of Social Media Links */}
      <div className="border border-white/10 bg-black/20 rounded-lg overflow-hidden">
        {socialLinks.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No social media links added yet. Click "Add New Link" to get started.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="social-links">
              {(provided: DroppableProvided) => (
                <ul
                  className="divide-y divide-white/10"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {socialLinks.map((link, index) => (
                    <Draggable key={link.id} draggableId={link.id || `temp-${index}`} index={index}>
                      {(provided: DraggableProvided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between p-3 ${!link.active ? 'opacity-60 bg-gray-900/30' : ''}`}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div {...provided.dragHandleProps} className="cursor-move text-gray-400">
                              <Move size={18} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="font-medium">{link.display_name}</span>
                                {!link.active && (
                                  <span className="ml-2 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400 flex items-center gap-1">
                                <span>{link.platform}</span>
                                <span>•</span>
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center text-blue-400 hover:text-blue-300"
                                >
                                  <span className="truncate max-w-[200px]">{link.url}</span>
                                  <ExternalLink size={12} className="ml-1" />
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => prepareEditForm(link)}
                              className="p-1 text-gray-400 hover:text-white"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => link.id && handleDelete(link.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default SocialMediaManager;
