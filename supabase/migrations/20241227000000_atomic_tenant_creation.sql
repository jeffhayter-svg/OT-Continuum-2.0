-- ============================================================================
-- OT Continuum: Atomic Tenant Creation Function
-- ============================================================================
-- 
-- Purpose: Create tenant + user profile + admin membership atomically
-- Security: SECURITY DEFINER (runs as function owner, bypasses RLS)
-- Transaction: All-or-nothing - if any step fails, entire operation rolls back
--
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_tenant_atomic(UUID, TEXT, TEXT, TEXT);

-- Create atomic tenant creation function
CREATE OR REPLACE FUNCTION create_tenant_atomic(
  p_user_id UUID,
  p_user_email TEXT,
  p_organization_name TEXT,
  p_full_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges, bypasses RLS
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_tenant_name TEXT;
  v_result JSON;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;
  
  IF p_user_email IS NULL OR p_user_email = '' THEN
    RAISE EXCEPTION 'user_email cannot be empty';
  END IF;
  
  IF p_organization_name IS NULL OR TRIM(p_organization_name) = '' THEN
    RAISE EXCEPTION 'organization_name cannot be empty';
  END IF;
  
  IF p_full_name IS NULL OR TRIM(p_full_name) = '' THEN
    RAISE EXCEPTION 'full_name cannot be empty';
  END IF;

  -- Log start of operation
  RAISE NOTICE 'Starting atomic tenant creation for user %', p_user_id;

  -- STEP 1: Create tenant
  INSERT INTO tenants (name)
  VALUES (TRIM(p_organization_name))
  RETURNING id, name INTO v_tenant_id, v_tenant_name;
  
  RAISE NOTICE 'Created tenant: % (%)', v_tenant_name, v_tenant_id;

  -- STEP 2: Upsert user profile with tenant assignment
  INSERT INTO users (id, email, full_name, tenant_id, default_tenant_id)
  VALUES (p_user_id, p_user_email, TRIM(p_full_name), v_tenant_id, v_tenant_id)
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = TRIM(p_full_name),
    tenant_id = v_tenant_id,
    default_tenant_id = v_tenant_id,
    updated_at = NOW();
  
  RAISE NOTICE 'Created/updated user profile for %', p_user_email;

  -- STEP 3: Create tenant membership with admin role
  INSERT INTO tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, p_user_id, 'admin');
  
  RAISE NOTICE 'Created admin membership for user % in tenant %', p_user_id, v_tenant_id;

  -- STEP 4: Return success result as JSON
  v_result := json_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'tenant_name', v_tenant_name,
    'user_id', p_user_id,
    'role', 'admin',
    'message', 'Tenant created successfully'
  );

  RAISE NOTICE 'Atomic tenant creation completed successfully';
  
  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'Atomic tenant creation failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    
    -- Re-raise the exception to trigger rollback
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_tenant_atomic(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_tenant_atomic IS 
  'Atomically creates a tenant, user profile, and admin membership. ' ||
  'All operations succeed or fail together (transaction safety).';

-- ============================================================================
-- Verification Query (for testing)
-- ============================================================================
-- 
-- SELECT create_tenant_atomic(
--   'user-uuid-here',
--   'test@example.com',
--   'Test Organization',
--   'Test User'
-- );
--
-- ============================================================================
