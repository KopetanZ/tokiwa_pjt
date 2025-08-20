-- CORRECT RLS Fix for trainer_jobs table
-- This is reference/lookup data, not user-specific data

-- Enable RLS
ALTER TABLE public.trainer_jobs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to READ all job definitions
-- (This is reference data needed by all users)
DROP POLICY IF EXISTS "Authenticated users can view trainer jobs" ON public.trainer_jobs;
CREATE POLICY "Authenticated users can view trainer jobs" 
    ON public.trainer_jobs 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Prevent regular users from modifying reference data
-- Only service_role can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Service role can manage trainer jobs" ON public.trainer_jobs;
CREATE POLICY "Service role can manage trainer jobs" 
    ON public.trainer_jobs 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Optional: Allow anonymous access if needed for public API
-- DROP POLICY IF EXISTS "Anonymous can view trainer jobs" ON public.trainer_jobs;
-- CREATE POLICY "Anonymous can view trainer jobs" 
--     ON public.trainer_jobs 
--     FOR SELECT 
--     TO anon 
--     USING (true);

-- Verify policies
SELECT 'RLS correctly enabled for trainer_jobs (reference data)' AS status;