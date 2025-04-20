-- Create a function to safely get admin list without triggering RLS policies
CREATE OR REPLACE FUNCTION public.get_admin_list()
RETURNS SETOF json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- This function runs with security definer privilege (bypassing RLS)
  -- It returns admin user IDs safely without triggering the infinite recursion
  RETURN QUERY 
    SELECT json_build_object(
      'user_id', a.user_id
    )
    FROM public.admins a;
END;
$$;

-- Grant execute permission to the anonymous and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_admin_list() TO anon;
GRANT EXECUTE ON FUNCTION public.get_admin_list() TO authenticated;
