-- Migration: Create site_settings table for global site configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insert default settings (customize as needed)
INSERT INTO public.site_settings (id, settings)
VALUES (
  'singleton',
  '{
    "siteTitle": "Manhva-Oppa",
    "siteDescription": "AI-powered manga & manhwa recommendations.",
    "maintenanceMode": false,
    "featuredManga": "",
    "announcement": "",
    "adminEmails": [],
    "registrationEnabled": true,
    "reviewModeration": "auto",
    "blockedTags": ""
  }'
)
ON CONFLICT (id) DO NOTHING;
