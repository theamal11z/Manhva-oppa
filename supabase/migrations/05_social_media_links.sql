-- Create social_media_links table
CREATE TABLE IF NOT EXISTS social_media_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform VARCHAR NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR,
  display_name VARCHAR NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to describe table
COMMENT ON TABLE social_media_links IS 'Stores social media platform links for the site';

-- Create index on platform for faster lookups
CREATE INDEX IF NOT EXISTS idx_social_media_platform ON social_media_links(platform);

-- Add triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_media_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_social_media_links_timestamp
BEFORE UPDATE ON social_media_links
FOR EACH ROW
EXECUTE FUNCTION update_social_media_links_updated_at();

-- Set RLS policies
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;

-- Everyone can view active social media links
CREATE POLICY "Anyone can view active social media links" 
ON social_media_links FOR SELECT 
USING (active = TRUE);

-- Only authenticated admins can insert/update/delete
CREATE POLICY "Admins can manage social media links" 
ON social_media_links FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- Insert some default social media links
INSERT INTO social_media_links (platform, url, icon, display_name, active, display_order)
VALUES
  ('facebook', 'https://facebook.com/mangaverse', 'facebook', 'Facebook', TRUE, 1),
  ('twitter', 'https://twitter.com/mangaverse', 'twitter', 'Twitter', TRUE, 2),
  ('instagram', 'https://instagram.com/mangaverse', 'instagram', 'Instagram', TRUE, 3),
  ('discord', 'https://discord.gg/mangaverse', 'discord', 'Discord', TRUE, 4);

-- Add function to manage social media links
CREATE OR REPLACE FUNCTION manage_social_media_link(
  p_id UUID DEFAULT NULL,
  p_platform VARCHAR DEFAULT '',
  p_url TEXT DEFAULT '',
  p_icon VARCHAR DEFAULT '',
  p_display_name VARCHAR DEFAULT '',
  p_active BOOLEAN DEFAULT TRUE,
  p_display_order INTEGER DEFAULT 0,
  p_action VARCHAR DEFAULT 'insert'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Admin privileges required');
  END IF;

  -- Handle action types
  CASE p_action
    WHEN 'insert' THEN
      INSERT INTO social_media_links (platform, url, icon, display_name, active, display_order)
      VALUES (p_platform, p_url, p_icon, p_display_name, p_active, p_display_order)
      RETURNING jsonb_build_object('id', id) INTO v_result;
      
      v_result := jsonb_build_object('success', true, 'data', v_result, 'message', 'Social media link created successfully');
      
    WHEN 'update' THEN
      IF p_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'ID is required for update operation');
      END IF;
      
      UPDATE social_media_links
      SET platform = p_platform,
          url = p_url,
          icon = p_icon,
          display_name = p_display_name,
          active = p_active,
          display_order = p_display_order
      WHERE id = p_id
      RETURNING jsonb_build_object('id', id) INTO v_result;
      
      v_result := jsonb_build_object('success', true, 'data', v_result, 'message', 'Social media link updated successfully');
      
    WHEN 'delete' THEN
      IF p_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'ID is required for delete operation');
      END IF;
      
      DELETE FROM social_media_links
      WHERE id = p_id
      RETURNING jsonb_build_object('id', id) INTO v_result;
      
      v_result := jsonb_build_object('success', true, 'data', v_result, 'message', 'Social media link deleted successfully');
      
    ELSE
      v_result := jsonb_build_object('success', false, 'message', 'Invalid action specified');
  END CASE;
  
  RETURN v_result;
END;
$$;
