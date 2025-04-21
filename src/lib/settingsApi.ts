import { supabase } from './supabaseClient';

// SETTINGS TABLE STRUCTURE (suggested):
// id (uuid, PK), key (text, unique), value (jsonb), updated_at (timestamp)
// Use a single-row table for all settings or key-value pairs for flexibility.

const SETTINGS_TABLE = 'site_settings';

export async function getSettings() {
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select('settings')
    .eq('id', 'singleton')
    .single();
  if (error) throw error;
  return data?.settings || {};
}

export async function updateSettings(newSettings: any) {
  // Upsert a single row with all settings as a JSON object in the 'settings' field
  const { error } = await supabase
    .from(SETTINGS_TABLE)
    .upsert([
      { id: 'singleton', settings: newSettings, updated_at: new Date().toISOString() }
    ], { onConflict: ['id'] });
  if (error) throw error;
  return true;
}

// For key-value style, you can extend with getSetting(key) and setSetting(key, value)
