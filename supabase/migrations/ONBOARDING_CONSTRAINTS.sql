-- =====================================================
-- ONBOARDING DATABASE CONSTRAINTS
-- =====================================================
-- Apply in Supabase Dashboard → SQL Editor (Role: postgres)
--
-- These constraints ensure the onboarding flow works correctly:
-- 1. public.users.tenant_id must NOT be NULL
-- 2. public.users.id must be a foreign key to auth.users.id
-- =====================================================

-- Constraint 1: public.users.tenant_id NOT NULL
-- This ensures every user belongs to a tenant
ALTER TABLE public.users
  ALTER COLUMN tenant_id SET NOT NULL;

-- Constraint 2: public.users.id FK → auth.users.id
-- This ensures users table entries correspond to auth users
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify constraints are applied:

-- 1. Check NOT NULL constraint on tenant_id
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'tenant_id';
-- Expected: is_nullable = 'NO'

-- 2. Check foreign key constraint on id
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  a.attname AS column_name,
  af.attname AS referenced_column
FROM pg_constraint AS c
JOIN pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute AS af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE conrelid = 'public.users'::regclass
  AND contype = 'f'
  AND a.attname = 'id';
-- Expected: constraint exists referencing auth.users(id)

-- =====================================================
-- NOTES
-- =====================================================
-- 1. These constraints require existing data to be valid
-- 2. Before applying, ensure all existing users have a tenant_id
-- 3. Before applying, ensure all user.id values exist in auth.users
-- 4. The onboarding flow (TenantSetup) handles these constraints
--    by creating records in the correct order:
--    a) Create tenant
--    b) Upsert user with tenant_id
--    c) Insert tenant_member
-- =====================================================
