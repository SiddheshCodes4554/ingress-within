-- ========================================================
-- SCHEMA FOR ONBOARDING PROFILES
-- Run this in your Supabase SQL Editor
-- ========================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(15) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    consent_completed BOOLEAN DEFAULT false NOT NULL,
    profile_completed BOOLEAN DEFAULT false NOT NULL,
    notifications_completed BOOLEAN DEFAULT false NOT NULL,
    orientation_completed BOOLEAN DEFAULT false NOT NULL,
    assessment_completed BOOLEAN DEFAULT false NOT NULL,
    onboarding_completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT uq_profiles_phone UNIQUE (phone_number)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Users can view their own profile record" ON public.profiles;
CREATE POLICY "Users can view their own profile record" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile record" ON public.profiles;
CREATE POLICY "Users can update their own profile record" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Trigger to auto-create profile when a user record is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, phone_number)
    VALUES (NEW.id, NEW.phone_number)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created ON public.users;
CREATE TRIGGER on_user_created
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- 6. Backfill existing users who do not have a profile yet
INSERT INTO public.profiles (id, phone_number)
SELECT id, phone_number FROM public.users
ON CONFLICT (id) DO NOTHING;
