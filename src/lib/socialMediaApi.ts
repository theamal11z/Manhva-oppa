import { supabase } from './supabaseClient';

export interface SocialMediaLink {
  id?: string;
  platform: string;
  url: string;
  icon: string;
  display_name: string;
  active: boolean;
  display_order: number;
}

// Fetch all social media links
export async function getSocialMediaLinks(includeInactive = false) {
  const query = supabase
    .from('social_media_links')
    .select('*')
    .order('display_order', { ascending: true });

  if (!includeInactive) {
    query.eq('active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return data || [];
}

// Get a single social media link by ID
export async function getSocialMediaLink(id: string) {
  const { data, error } = await supabase
    .from('social_media_links')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}

// Add a new social media link
export async function addSocialMediaLink(link: Omit<SocialMediaLink, 'id'>) {
  const { data, error } = await supabase
    .from('social_media_links')
    .insert([link])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// Update an existing social media link
export async function updateSocialMediaLink(id: string, updates: Partial<SocialMediaLink>) {
  const { data, error } = await supabase
    .from('social_media_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// Delete a social media link
export async function deleteSocialMediaLink(id: string) {
  const { error } = await supabase
    .from('social_media_links')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
}

// Reorder social media links
export async function reorderSocialMediaLinks(orderedIds: string[]) {
  // Create batch of updates - each ID with its order position
  const updates = orderedIds.map((id, index) => ({
    id,
    display_order: index + 1,
  }));

  const { error } = await supabase
    .from('social_media_links')
    .upsert(updates, { onConflict: 'id' });
    
  if (error) throw error;
  return true;
}

// Common social media platforms with their default icons
export const COMMON_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: 'facebook' },
  { value: 'twitter', label: 'Twitter', icon: 'twitter' },
  { value: 'instagram', label: 'Instagram', icon: 'instagram' },
  { value: 'discord', label: 'Discord', icon: 'discord' },
  { value: 'youtube', label: 'YouTube', icon: 'youtube' },
  { value: 'twitch', label: 'Twitch', icon: 'twitch' },
  { value: 'tiktok', label: 'TikTok', icon: 'tiktok' },
  { value: 'reddit', label: 'Reddit', icon: 'reddit' },
  { value: 'pinterest', label: 'Pinterest', icon: 'pinterest' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { value: 'github', label: 'GitHub', icon: 'github' },
  { value: 'mastodon', label: 'Mastodon', icon: 'mastodon' },
  { value: 'patreon', label: 'Patreon', icon: 'patreon' },
];
