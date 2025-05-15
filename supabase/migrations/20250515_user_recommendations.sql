-- Drop existing table first if it exists
DROP TABLE IF EXISTS public.user_recommendations CASCADE;

-- Create user_recommendations table
CREATE TABLE public.user_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendations JSONB DEFAULT '[]'::jsonb,
  profile JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  next_update TIMESTAMP WITH TIME ZONE DEFAULT now() + interval '7 days' NOT NULL,
  
  CONSTRAINT unique_user_recommendations UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own recommendations" 
ON public.user_recommendations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" 
ON public.user_recommendations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert recommendations" 
ON public.user_recommendations FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update any recommendations" 
ON public.user_recommendations FOR UPDATE USING (
  public.is_admin() OR auth.uid() = user_id
);

-- Create an update trigger to handle last_updated
CREATE OR REPLACE FUNCTION update_user_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  NEW.next_update = now() + interval '7 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_recommendations_updated_at
  BEFORE UPDATE ON public.user_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_recommendations_updated_at();

COMMENT ON TABLE public.user_recommendations IS 'Stores AI-generated personalized manga recommendations for users';
