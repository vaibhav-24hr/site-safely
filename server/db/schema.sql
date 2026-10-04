-- ==============================================================================
-- Site Safety Forms — Database Schema
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
-- Mirrors Supabase auth.users with app-specific profile data (role, full_name)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('framer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SITES TABLE
-- Active construction job sites
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. USER_SITES TABLE (Worker Site Assignment)
-- Associates workers with assigned sites so administrators can track missing submissions
CREATE TABLE IF NOT EXISTS public.user_sites (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, site_id)
);

-- 4. SUBMISSIONS TABLE
-- Daily safety checklist completed by workers
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- 8 Fixed Safety Checklist Items (Yes/No toggles)
    ppe_hard_hat BOOLEAN NOT NULL DEFAULT FALSE,
    ppe_vest BOOLEAN NOT NULL DEFAULT FALSE,
    ppe_boots BOOLEAN NOT NULL DEFAULT FALSE,
    ppe_eye_protection BOOLEAN NOT NULL DEFAULT FALSE,
    fall_protection BOOLEAN NOT NULL DEFAULT FALSE,
    ladders_scaffolding BOOLEAN NOT NULL DEFAULT FALSE,
    tools_cords BOOLEAN NOT NULL DEFAULT FALSE,
    hazards_identified BOOLEAN NOT NULL DEFAULT FALSE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PHOTOS TABLE
-- Photos uploaded as evidence for a specific safety submission
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    url VARCHAR(1000) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_submissions_user_date ON public.submissions(user_id, submission_date);
CREATE INDEX IF NOT EXISTS idx_submissions_site_date ON public.submissions(site_id, submission_date);
CREATE INDEX IF NOT EXISTS idx_submissions_date ON public.submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_photos_submission ON public.photos(submission_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ==============================================================================
-- AUTOMATIC USER SYNC (Trigger)
-- Automatically inserts a row into public.users when a user is created in Supabase Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Crew Member'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'framer')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- SITES POLICIES: Any authenticated user can view active sites
CREATE POLICY "Authenticated users can view active sites"
    ON public.sites FOR SELECT
    TO authenticated
    USING (active = TRUE);

-- USERS POLICIES: Users can view their own profile; Admins can view all
CREATE POLICY "Users can view own profile or admins view all"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- SUBMISSIONS POLICIES:
-- Framers can view their own submissions; Admins can view all submissions
CREATE POLICY "Framers view own submissions, Admins view all"
    ON public.submissions FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Framers can insert their own submissions
CREATE POLICY "Workers can insert own submissions"
    ON public.submissions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- PHOTOS POLICIES:
CREATE POLICY "Users view photos of accessible submissions"
    ON public.photos FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.submissions s 
            WHERE s.id = photos.submission_id 
            AND (s.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
        )
    );

CREATE POLICY "Users insert photos for their own submissions"
    ON public.photos FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.submissions s 
            WHERE s.id = photos.submission_id 
            AND s.user_id = auth.uid()
        )
    );
