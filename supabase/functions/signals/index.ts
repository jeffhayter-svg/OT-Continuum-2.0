// ============================================================================
// Handler: Tenant Resolver (GET /me)
// ============================================================================

async function handleMe(req: Request, requestId: string): Promise<Response> {
  // Authenticate
  const auth = requireAuth(req);
  
  const supabase = createServiceClient();

  console.log(`[${requestId}] Fetching user profile and tenant/site access for user: ${auth.userId}`);

  // Fetch user profile
  const { data: userProfile, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, role, tenant_id, created_at')
    .eq('id', auth.userId)
    .single();

  if (userError || !userProfile) {
    console.error(`[${requestId}] User profile not found:`, userError);
    return errorResponse(
      'NOT_FOUND',
      'User profile not found',
      { userId: auth.userId },
      requestId,
      404
    );
  }

  // Fetch tenant information
  let tenantInfo = null;
  if (userProfile.tenant_id) {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, plan, status, created_at')
      .eq('id', userProfile.tenant_id)
      .single();

    if (!tenantError && tenant) {
      tenantInfo = tenant;
    }
  }

  // Fetch site access for the user
  let siteAccess = [];
  if (auth.tenantId) {
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, location, tenant_id')
      .eq('tenant_id', auth.tenantId)
      .order('name', { ascending: true });

    if (!sitesError && sites) {
      siteAccess = sites;
    }
  }

  const response = {
    user: {
      id: userProfile.id,
      email: userProfile.email,
      full_name: userProfile.full_name,
      role: userProfile.role,
      tenant_id: userProfile.tenant_id,
      created_at: userProfile.created_at,
    },
    tenant: tenantInfo,
    site_access: siteAccess,
  };

  console.log(`[${requestId}] User profile fetched successfully`);
  
  return successResponse(response, requestId);
}

// ============================================================================
// Handler: Signup (POST /auth/signup)
// ============================================================================

async function handleSignup(req: Request, requestId: string): Promise<Response> {
}