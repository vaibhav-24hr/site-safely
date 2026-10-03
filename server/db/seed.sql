-- ==============================================================================
-- Site Safety Forms — Initial Seed Data
-- ==============================================================================

-- 1. Insert Initial Active Job Sites
INSERT INTO public.sites (id, name, address, active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Oakridge Residential - Phase 2', '104 Elm Street, Austin, TX 78701', TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Downtown Commercial Tower', '500 Congress Ave, Austin, TX 78704', TRUE),
    ('33333333-3333-3333-3333-333333333333', 'Harbor Point Framing', '1200 Lakefront Blvd, Austin, TX 78746', TRUE),
    ('44444444-4444-4444-4444-444444444444', 'Sunset Industrial Park', '8800 Highway 71, Del Valle, TX 78617', TRUE)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, address = EXCLUDED.address, active = EXCLUDED.active;

-- Notes for User Accounts:
-- Users will be created directly via Supabase Auth (or the seed script in Phase 9).
-- The auth trigger 'on_auth_user_created' will automatically populate public.users.
