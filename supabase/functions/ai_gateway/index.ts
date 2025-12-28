// ============================================================================
// OT Continuum - AI Gateway Edge Function
// ============================================================================
// Handles AI requests for chat and report generation using Gemini
// Features:
// - Multi-tenant authorization
// - Chat mode: conversational AI for assistants
// - Report mode: structured document generation
// - Context-aware (site, asset, risk scoping)
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

// ============================================================================
// Types
// ============================================================================

type Mode = 'chat' | 'report';
type UseCase = 'signal_assistant' | 'risk_assistant' | 'exec_summary' | 'mitigation_plan';

interface AIGatewayRequest {
  tenant_id: string;
  mode: Mode;
  use_case: UseCase;
  input: Record<string, unknown>;
  context?: {
    site_id?: string;
    asset_id?: string;
    risk_id?: string;
  };
}

interface AIGatewayResponse {
  ok: boolean;
  provider: string;
  model: string;
  mode: Mode;
  use_case: UseCase;
  output: string;
  structured?: Record<string, unknown>;
}

interface ErrorResponse {
  ok: false;
  error: string;
  code: string;
  details?: string;
}

// ============================================================================
// CORS Headers
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// Configuration
// ============================================================================

const AI_MODELS = {
  chat: Deno.env.get('AI_MODEL_CHAT') || 'gemini-1.5-flash',
  report: Deno.env.get('AI_MODEL_REPORT') || 'gemini-1.5-pro',
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract Bearer token from Authorization header
 */
function getAuthToken(req: Request): string {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  return authHeader.substring(7);
}

/**
 * Create authenticated Supabase client
 */
function getSupabaseClient(token: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * Verify user has access to tenant
 */
async function verifyTenantAccess(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string
): Promise<boolean> {
  console.log(`[AI Gateway] Verifying tenant access: tenant=${tenantId}, user=${userId}`);
  
  const { data, error } = await supabase
    .from('tenant_members')
    .select('tenant_id')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[AI Gateway] Tenant verification error:', error);
    return false;
  }

  return !!data;
}

/**
 * Build Gemini API prompt based on use case
 */
function buildPrompt(useCase: UseCase, input: Record<string, unknown>): string {
  switch (useCase) {
    case 'signal_assistant':
      return buildSignalAssistantPrompt(input);
    
    case 'risk_assistant':
      return buildRiskAssistantPrompt(input);
    
    case 'exec_summary':
      return buildExecSummaryPrompt(input);
    
    case 'mitigation_plan':
      return buildMitigationPlanPrompt(input);
    
    default:
      return `Analyze the following input:\n\n${JSON.stringify(input, null, 2)}`;
  }
}

/**
 * Signal Assistant Prompt (Chat Mode)
 * Outputs: 4-8 bullets for operators
 */
function buildSignalAssistantPrompt(input: Record<string, unknown>): string {
  return `You are an OT security signal assistant helping plant operators investigate security events.

**CRITICAL RULES:**
- Only use the provided signal data below
- Do NOT invent or assume plant facts, equipment names, or network details
- If data is missing or unclear, explicitly say "unknown" or "data not provided"
- Be concise and operator-friendly
- No speculation or hallucinations

**YOUR TASK:**
Analyze the signal data and provide 4-8 bullet points covering:
1. What changed (describe the signal/event)
2. Likely cause (based ONLY on provided data, say "unknown" if unclear)
3. Immediate checks (specific to the signal type, if data supports it)
4. Escalation threshold (when to escalate to incident response)

**SIGNAL DATA:**
${JSON.stringify(input, null, 2)}

**OUTPUT FORMAT:**
Provide exactly 4-8 concise bullet points. Each bullet should be 1-2 sentences maximum.
Start each bullet with one of: "Changed:", "Cause:", "Check:", "Escalate if:"

Do not include explanations outside the bullets. Be direct and actionable.`;
}

/**
 * Risk Assistant Prompt (Chat Mode)
 * Outputs: Severity/likelihood recommendations + actions + evidence needs
 */
function buildRiskAssistantPrompt(input: Record<string, unknown>): string {
  return `You are an OT risk management assistant helping assess operational technology risks.

**CRITICAL RULES:**
- Only use the provided risk data below
- Do NOT invent plant details, equipment specs, or network architecture
- If information is missing, explicitly state "insufficient data" or "unknown"
- Base severity/likelihood only on provided evidence
- Be specific and actionable

**YOUR TASK:**
Analyze the risk data and provide:

1. **SEVERITY & LIKELIHOOD RATIONALE** (2-3 sentences)
   - Justify the recommended severity level based on provided impact data
   - Justify the recommended likelihood based on provided evidence
   - If current ratings seem wrong, explain why with evidence from input

2. **RECOMMENDED ACTIONS** (exactly 3 actions)
   - Action 1: Immediate/investigative
   - Action 2: Short-term control
   - Action 3: Long-term mitigation
   - Be specific to the risk type, but don't invent technical details

3. **EVIDENCE NEEDED** (2-4 items)
   - What additional data would confirm the risk severity?
   - What measurements or observations would validate likelihood?
   - Be specific but don't assume equipment exists

**RISK DATA:**
${JSON.stringify(input, null, 2)}

**OUTPUT FORMAT:**
Use this structure exactly:

SEVERITY & LIKELIHOOD:
[Your 2-3 sentence rationale here]

RECOMMENDED ACTIONS:
1. [Action 1]
2. [Action 2]
3. [Action 3]

EVIDENCE NEEDED:
- [Evidence item 1]
- [Evidence item 2]
- [Evidence item 3 if applicable]
- [Evidence item 4 if applicable]`;
}

/**
 * Executive Summary Prompt (Report Mode)
 * Outputs: Structured JSON for executive reporting
 */
function buildExecSummaryPrompt(input: Record<string, unknown>): string {
  return `You are an executive reporting assistant for OT security. Generate a concise executive summary.

**CRITICAL RULES:**
- Only use the provided data below
- Do NOT invent metrics, incidents, or organizational details
- List all assumptions you make in the "assumptions" field
- List all missing data in "data_gaps" field
- Use confidence levels honestly: "low" if data is sparse, "high" only if well-supported
- Do not hallucinate plant names, sites, or equipment

**YOUR TASK:**
Generate a JSON object with the following exact schema:

{
  "headline": "One sentence summary (10-15 words max)",
  "summary": "Executive summary paragraph (3-5 sentences covering key points)",
  "top_findings": [
    { "title": "Finding title", "detail": "1-2 sentence detail" }
  ],
  "risks": [
    { 
      "risk": "Risk description", 
      "why": "Why this matters", 
      "impact": "Potential impact if realized",
      "confidence": "low|med|high"
    }
  ],
  "recommended_actions": [
    { 
      "action": "Specific action to take", 
      "owner": "Role or team (or null if unknown)", 
      "horizon": "now|30d|90d" 
    }
  ],
  "assumptions": [
    "List any assumptions made in analysis"
  ],
  "data_gaps": [
    "List any critical missing data that would improve analysis"
  ]
}

**INPUT DATA:**
${JSON.stringify(input, null, 2)}

**OUTPUT REQUIREMENTS:**
- Return ONLY valid JSON, no markdown code blocks
- Include 2-5 top_findings
- Include 2-6 risks (only based on provided data)
- Include 3-7 recommended_actions
- Always include assumptions array (even if empty: [])
- Always include data_gaps array (be honest about missing data)
- Use confidence "low" if data is limited, "med" if partial, "high" if comprehensive
- Horizons: "now" = immediate, "30d" = this month, "90d" = this quarter

Return only the JSON object.`;
}

/**
 * Mitigation Plan Prompt (Report Mode)
 * Outputs: Structured JSON for risk mitigation planning
 */
function buildMitigationPlanPrompt(input: Record<string, unknown>): string {
  return `You are an OT security mitigation planner. Generate a detailed mitigation plan.

**CRITICAL RULES:**
- Only use the provided risk data below
- Do NOT invent technical solutions, vendors, or budget estimates
- If the risk description lacks detail, reflect that in data_gaps
- Be honest about effort/risk_reduction ratings
- Do not assume organizational structure, tools, or existing controls
- Focus on practical, achievable mitigations

**YOUR TASK:**
Generate a JSON object with the following exact schema:

{
  "goal": "One sentence goal for this mitigation plan",
  "mitigations": [
    {
      "title": "Mitigation name/approach",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "effort": "low|med|high",
      "risk_reduction": "low|med|high"
    }
  ],
  "quick_wins": [
    "Action that can be done immediately with minimal effort"
  ],
  "dependencies": [
    "What needs to be in place first (budget, approvals, tools, etc.)"
  ],
  "validation": [
    "How to verify the mitigation is working"
  ]
}

**INPUT DATA:**
${JSON.stringify(input, null, 2)}

**OUTPUT REQUIREMENTS:**
- Return ONLY valid JSON, no markdown code blocks
- Include 2-5 mitigations (ranked by impact/effort ratio)
- Each mitigation should have 3-6 specific steps
- Effort ratings:
  * "low" = can be done in days with existing resources
  * "med" = requires weeks or moderate budget
  * "high" = months or significant investment
- Risk_reduction ratings:
  * "low" = reduces risk score by <30%
  * "med" = reduces risk score by 30-60%
  * "high" = reduces risk score by >60%
- Include 2-4 quick_wins (things doable in 1-7 days)
- List all dependencies honestly (don't assume budget approval)
- Include 2-4 validation methods (measurable outcomes)
- If critical risk details are missing, note in a "note" field: "Limited risk detail provided; plan is generic"

Return only the JSON object.`;
}

/**
 * Call Gemini API
 */
async function callGemini(
  model: string,
  prompt: string,
  mode: Mode
): Promise<{ output: string; structured?: Record<string, unknown> }> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  console.log(`[AI Gateway] Calling Gemini: model=${model}, mode=${mode}`);

  // Build request body
  const requestBody: Record<string, unknown> = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  // For report mode, request structured output
  if (mode === 'report') {
    requestBody.generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
  }

  // Call Gemini API
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AI Gateway] Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  // Extract output
  const output = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  if (!output) {
    throw new Error('No output from Gemini API');
  }

  console.log(`[AI Gateway] Gemini response length: ${output.length} chars`);

  // For report mode, try to extract structured data
  let structured: Record<string, unknown> | undefined;
  if (mode === 'report') {
    try {
      // Attempt to parse JSON blocks from output
      const jsonMatch = output.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        structured = JSON.parse(jsonMatch[1]);
      } else {
        // Try to parse the entire output as JSON (if AI returned raw JSON)
        structured = JSON.parse(output);
      }
    } catch (e) {
      console.warn('[AI Gateway] Could not extract structured data:', e);
      // Try one more time: extract first { ... } block
      try {
        const jsonObjectMatch = output.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          structured = JSON.parse(jsonObjectMatch[0]);
        }
      } catch (e2) {
        console.warn('[AI Gateway] Second JSON extraction attempt failed:', e2);
      }
    }
  }

  return { output, structured };
}

/**
 * Validate request body
 */
function validateRequest(body: unknown): AIGatewayRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object');
  }

  const req = body as Partial<AIGatewayRequest>;

  if (!req.tenant_id || typeof req.tenant_id !== 'string') {
    throw new Error('tenant_id is required and must be a string');
  }

  if (!req.mode || !['chat', 'report'].includes(req.mode)) {
    throw new Error('mode must be either "chat" or "report"');
  }

  if (!req.use_case || !['signal_assistant', 'risk_assistant', 'exec_summary', 'mitigation_plan'].includes(req.use_case)) {
    throw new Error('use_case must be one of: signal_assistant, risk_assistant, exec_summary, mitigation_plan');
  }

  if (!req.input || typeof req.input !== 'object') {
    throw new Error('input is required and must be an object');
  }

  return req as AIGatewayRequest;
}

/**
 * Create error response
 */
function errorResponse(
  code: string,
  error: string,
  details?: string,
  status: number = 500
): Response {
  const body: ErrorResponse = {
    ok: false,
    error,
    code,
    ...(details && { details }),
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create success response
 */
function successResponse(data: AIGatewayResponse): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return errorResponse(
      'METHOD_NOT_ALLOWED',
      'Only POST requests are allowed',
      undefined,
      405
    );
  }

  try {
    // 1. Extract and validate auth token
    let token: string;
    try {
      token = getAuthToken(req);
    } catch (e) {
      return errorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        e instanceof Error ? e.message : String(e),
        401
      );
    }

    // 2. Create Supabase client
    const supabase = getSupabaseClient(token);

    // 3. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[AI Gateway] Auth error:', authError);
      return errorResponse(
        'UNAUTHORIZED',
        'Invalid or expired token',
        authError?.message,
        401
      );
    }

    console.log(`[AI Gateway] Authenticated user: ${user.id}`);

    // 4. Parse and validate request body
    let requestData: AIGatewayRequest;
    try {
      const body = await req.json();
      requestData = validateRequest(body);
    } catch (e) {
      return errorResponse(
        'INVALID_REQUEST',
        'Invalid request body',
        e instanceof Error ? e.message : String(e),
        400
      );
    }

    console.log(`[AI Gateway] Request: mode=${requestData.mode}, use_case=${requestData.use_case}, tenant=${requestData.tenant_id}`);

    // 5. Verify tenant access
    const hasAccess = await verifyTenantAccess(
      supabase,
      requestData.tenant_id,
      user.id
    );

    if (!hasAccess) {
      return errorResponse(
        'FORBIDDEN',
        'Access denied to this tenant',
        `User ${user.id} does not have access to tenant ${requestData.tenant_id}`,
        403
      );
    }

    console.log('[AI Gateway] Tenant access verified');

    // 6. Select model based on mode
    const model = requestData.mode === 'chat' ? AI_MODELS.chat : AI_MODELS.report;

    // 7. Build prompt
    const prompt = buildPrompt(requestData.use_case, requestData.input);

    // 8. Call Gemini
    let aiResult: { output: string; structured?: Record<string, unknown> };
    try {
      aiResult = await callGemini(model, prompt, requestData.mode);
    } catch (e) {
      console.error('[AI Gateway] Gemini call failed:', e);
      return errorResponse(
        'AI_ERROR',
        'Failed to generate AI response',
        e instanceof Error ? e.message : String(e),
        500
      );
    }

    // 9. Build response
    const response: AIGatewayResponse = {
      ok: true,
      provider: 'gemini',
      model,
      mode: requestData.mode,
      use_case: requestData.use_case,
      output: aiResult.output,
      ...(aiResult.structured && { structured: aiResult.structured }),
    };

    console.log('[AI Gateway] Success');
    return successResponse(response);

  } catch (e) {
    console.error('[AI Gateway] Unexpected error:', e);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      e instanceof Error ? e.message : String(e),
      500
    );
  }
});