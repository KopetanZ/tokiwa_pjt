-- Fix RLS for trainer_jobs table
-- This table contains reference data that should be readable by all authenticated users
-- but not modifiable by regular users

-- Enable RLS on trainer_jobs table
ALTER TABLE public.trainer_jobs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read trainer job definitions
-- This is reference data needed for the game
DROP POLICY IF EXISTS "Authenticated users can view trainer jobs" ON public.trainer_jobs;
CREATE POLICY "Authenticated users can view trainer jobs" 
    ON public.trainer_jobs 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Optionally, if you need anonymous access (for public API):
-- DROP POLICY IF EXISTS "Anonymous users can view trainer jobs" ON public.trainer_jobs;
-- CREATE POLICY "Anonymous users can view trainer jobs" 
--     ON public.trainer_jobs 
--     FOR SELECT 
--     TO anon 
--     USING (true);

-- Only allow service role or specific admin roles to modify trainer jobs
-- (This prevents regular users from modifying reference data)
DROP POLICY IF EXISTS "Service role can manage trainer jobs" ON public.trainer_jobs;
CREATE POLICY "Service role can manage trainer jobs" 
    ON public.trainer_jobs 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Verify the policies are in place
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'trainer_jobs';

SELECT 'RLS enabled and policies created for trainer_jobs table' AS status;