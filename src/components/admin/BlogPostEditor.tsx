import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Save } from 'lucide-react';

interface BlogPostEditorProps {
  blogPost?: any;
  onClose: () => void;
  onSaved: (post: any) => void;
}

interface MangaTitle {
  id: string;
  title: string;
}

const BlogPostEditor: React.FC<BlogPostEditorProps> = ({ blogPost, onClose, onSaved }) => {
  const isEditing = Boolean(blogPost);
  const [formData, setFormData] = useState({
    title: blogPost?.title || '',
    slug: blogPost?.slug || '',
    manga_id: blogPost?.manga_id || '',
    featured_image: blogPost?.featured_image || '',
    seo_description: blogPost?.seo_description || '',
    seo_keywords: blogPost?.seo_keywords || '',
    content: blogPost?.content || '',
    published_date: blogPost?.published_date ? new Date(blogPost.published_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
  });
  const [mangaList, setMangaList] = useState<MangaTitle[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMangaList = async () => {
      const { data, error } = await supabase.from('manga_entries').select('id, title').order('title');
      if (!error) setMangaList(data || []);
    };
    fetchMangaList();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateSlug = () => {
    setFormData((prev) => ({ ...prev, slug: prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const postData = {
        ...formData,
        manga_id: formData.manga_id || null,
        featured_image: formData.featured_image || null,
        published_date: formData.published_date ? new Date(formData.published_date).toISOString() : null,
      };
      let result;
      if (isEditing) {
        const { data, error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', blogPost.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(postData)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
      onSaved(result);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save blog post.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)'
    }}>
      <div style={{
        backgroundColor: '#111',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '0.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.5rem',
        position: 'relative'
      }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold manga-title">{isEditing ? 'Edit Blog Post' : 'Add New Blog Post'}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:text-red-500 transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 p-4 mb-6 flex items-start">
            <span className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"><X /></span>
            <div>
              <p className="font-bold text-red-500">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
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
                  placeholder="Blog post title"
                  className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
                />
              </div>
              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-2">Slug <span className="text-xs text-gray-500">(URL-friendly)</span></label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-white/20 bg-gray-800 text-gray-300 text-sm">/blog/</span>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                    className="flex-1 px-3 py-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none rounded-r"
                    placeholder="my-blog-post-title"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={generateSlug} 
                  className="mt-1 text-sm text-blue-400 hover:text-blue-300"
                >
                  Generate from title
                </button>
              </div>
              {/* Associated Manga */}
              <div>
                <label htmlFor="manga_id" className="block text-sm font-medium mb-2">Associated Manga <span className="text-xs text-gray-500">(Optional)</span></label>
                <select
                  id="manga_id"
                  name="manga_id"
                  value={formData.manga_id || ''}
                  onChange={handleChange}
                  className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
                >
                  <option value="">None (General Blog Post)</option>
                  {mangaList.map((manga) => (
                    <option key={manga.id} value={manga.id}>{manga.title}</option>
                  ))}
                </select>
              </div>
              {/* Featured Image */}
              <div>
                <label htmlFor="featured_image" className="block text-sm font-medium mb-2">Featured Image URL <span className="text-xs text-gray-500">(Optional)</span></label>
                <input
                  id="featured_image"
                  name="featured_image"
                  type="url"
                  value={formData.featured_image}
                  onChange={handleChange}
                  className="w-full p-2 bg-black/30 border border-white/20 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.featured_image && (
                  <img src={formData.featured_image} alt="Featured preview" className="h-32 w-auto object-cover rounded mt-2" />
                )}
              </div>
            </div>
            {/* Right column */}
            <div className="space-y-6">
              {/* SEO Description */}
              <div>
                <label htmlFor="seo_description" className="block text-sm font-medium mb-2">SEO Description <span className="text-xs text-gray-500">(150-160 chars)</span></label>
                <textarea
                  id="seo_description"
                  name="seo_description"
                  value={formData.seo_description}
                  onChange={handleChange}
                  rows={2}
                  required
                  className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
                  placeholder="SEO description"
                />
              </div>
              {/* SEO Keywords */}
              <div>
                <label htmlFor="seo_keywords" className="block text-sm font-medium mb-2">SEO Keywords <span className="text-xs text-gray-500">(Comma-separated)</span></label>
                <input
                  id="seo_keywords"
                  name="seo_keywords"
                  type="text"
                  value={formData.seo_keywords}
                  onChange={handleChange}
                  className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
                  placeholder="manga, manhwa, action, fantasy, etc."
                />
              </div>

              {/* Publish Date */}
              <div>
                <label htmlFor="published_date" className="block text-sm font-medium mb-2">Publish Date</label>
                <input
                  id="published_date"
                  name="published_date"
                  type="datetime-local"
                  value={formData.published_date}
                  onChange={handleChange}
                  className="w-full p-2 bg-black/30 border border-white/20 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">Content <span className="text-red-500">*</span></label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={10}
              required
              className="w-full p-2 bg-black/30 border border-white/20 focus:border-red-500 focus:outline-none transition-colors"
              placeholder="Write your blog post content here. HTML formatting is supported."
            />
            <div className="text-xs text-gray-400 mt-1">HTML formatting is supported.</div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 mt-6 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="manga-border px-4 py-2 hover:text-red-500 transition-colors flex items-center gap-2"
              disabled={saving}
            >
              <X className="w-5 h-5" /> Cancel
            </button>
            <button
              type="submit"
              className="bg-red-500/20 hover:bg-red-500/30 manga-border px-4 py-2 flex items-center gap-2 transition-all"
              disabled={saving || !formData.title || !formData.content}
            >
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogPostEditor;
