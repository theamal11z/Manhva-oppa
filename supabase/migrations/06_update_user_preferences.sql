-- Drop existing user_preferences table
DROP TABLE IF EXISTS public.user_preferences;

-- Recreate user_preferences table with updated schema
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_genres TEXT[] DEFAULT ARRAY[]::TEXT[],
  exclude_genres TEXT[] DEFAULT ARRAY[]::TEXT[],
  dark_mode BOOLEAN DEFAULT true,
  reading_direction TEXT CHECK (reading_direction IN ('rtl', 'ltr')) DEFAULT 'rtl',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences" 
ON public.user_preferences FOR SELECT USING (
  public.is_admin()
);

-- Create an update trigger to handle updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

COMMENT ON TABLE public.user_preferences IS 'User preferences for manga reading and site settings'; 