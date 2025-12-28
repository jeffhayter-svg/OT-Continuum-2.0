// ============================================================================
// AI Gateway - Test Suite
// ============================================================================
// Run with: deno test --allow-net --allow-env ai_gateway/test.ts
// ============================================================================

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';

const BASE_URL = Deno.env.get('TEST_BASE_URL') || 'http://localhost:54321/functions/v1/ai_gateway';
const AUTH_TOKEN = Deno.env.get('TEST_AUTH_TOKEN') || '';
const TENANT_ID = Deno.env.get('TEST_TENANT_ID') || '550e8400-e29b-41d4-a716-446655440000';

// ============================================================================
// Helper Functions
// ============================================================================

async function callAIGateway(body: unknown, token: string = AUTH_TOKEN) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return { response, data };
}

// ============================================================================
// Tests
// ============================================================================

Deno.test('AI Gateway - OPTIONS request returns CORS headers', async () => {
  const response = await fetch(BASE_URL, {
    method: 'OPTIONS',
  });

  assertEquals(response.status, 200);
  assertExists(response.headers.get('Access-Control-Allow-Origin'));
  assertExists(response.headers.get('Access-Control-Allow-Methods'));
});

Deno.test('AI Gateway - Missing auth token returns 401', async () => {
  const { response, data } = await callAIGateway({
    tenant_id: TENANT_ID,
    mode: 'chat',
    use_case: 'signal_assistant',
    input: { test: 'data' },
  }, '');

  assertEquals(response.status, 401);
  assertEquals(data.ok, false);
  assertEquals(data.code, 'UNAUTHORIZED');
});

Deno.test('AI Gateway - Invalid request body returns 400', async () => {
  const { response, data } = await callAIGateway({
    // Missing required fields
    mode: 'chat',
  });

  assertEquals(response.status, 400);
  assertEquals(data.ok, false);
  assertEquals(data.code, 'INVALID_REQUEST');
});

Deno.test('AI Gateway - Invalid mode returns 400', async () => {
  const { response, data } = await callAIGateway({
    tenant_id: TENANT_ID,
    mode: 'invalid_mode',
    use_case: 'signal_assistant',
    input: { test: 'data' },
  });

  assertEquals(response.status, 400);
  assertEquals(data.ok, false);
  assertEquals(data.code, 'INVALID_REQUEST');
  assertExists(data.details);
});

Deno.test('AI Gateway - Invalid use_case returns 400', async () => {
  const { response, data } = await callAIGateway({
    tenant_id: TENANT_ID,
    mode: 'chat',
    use_case: 'invalid_use_case',
    input: { test: 'data' },
  });

  assertEquals(response.status, 400);
  assertEquals(data.ok, false);
  assertEquals(data.code, 'INVALID_REQUEST');
});

Deno.test('AI Gateway - Valid chat request succeeds', async () => {
  if (!AUTH_TOKEN) {
    console.log('Skipping: TEST_AUTH_TOKEN not set');
    return;
  }

  const { response, data } = await callAIGateway({
    tenant_id: TENANT_ID,
    mode: 'chat',
    use_case: 'signal_assistant',
    input: {
      signal_type: 'test_signal',
      severity: 'low',
      description: 'This is a test signal',
    },
  });

  assertEquals(response.status, 200);
  assertEquals(data.ok, true);
  assertEquals(data.provider, 'gemini');
  assertEquals(data.mode, 'chat');
  assertEquals(data.use_case, 'signal_assistant');
  assertExists(data.model);
  assertExists(data.output);
});

Deno.test('AI Gateway - Valid report request succeeds', async () => {
  if (!AUTH_TOKEN) {
    console.log('Skipping: TEST_AUTH_TOKEN not set');
    return;
  }

  const { response, data } = await callAIGateway({
    tenant_id: TENANT_ID,
    mode: 'report',
    use_case: 'exec_summary',
    input: {
      period: 'Test Period',
      total_risks: 10,
      critical_risks: 2,
    },
  });

  assertEquals(response.status, 200);
  assertEquals(data.ok, true);
  assertEquals(data.provider, 'gemini');
  assertEquals(data.mode, 'report');
  assertEquals(data.use_case, 'exec_summary');
  assertExists(data.model);
  assertExists(data.output);
  // Structured data may or may not be present
});

Deno.test('AI Gateway - Risk assistant use case', async () => {
  if (!AUTH_TOKEN) {
    console.log('Skipping: TEST_AUTH_TOKEN not set');
    return;
  }

  const { response, data } = await callAIGateway({
    tenant_id: TENANT_ID,
    mode: 'chat',
    use_case: 'risk_assistant',
    input: {
      risk_title: 'Unpatched system',
      likelihood: 4,
      impact: 5,
      current_controls: ['Firewall', 'IDS'],
    },
    context: {
      site_id: '660e8400-e29b-41d4-a716-446655440001',
    },
  });

  assertEquals(response.status, 200);
  assertEquals(data.ok, true);
  assertEquals(data.use_case, 'risk_assistant');
  assertExists(data.output);
});

Deno.test('AI Gateway - Mitigation plan use case', async () => {
  if (!AUTH_TOKEN) {
    console.log('Skipping: TEST_AUTH_TOKEN not set');
    return;
  }

  const { response, data } = await callAIGateway({
    tenant_id: TENANT_ID,
    mode: 'report',
    use_case: 'mitigation_plan',
    input: {
      risk_title: 'Legacy PLC vulnerabilities',
      likelihood: 4,
      impact: 5,
      budget: 50000,
      timeline: '6 months',
    },
    context: {
      risk_id: '770e8400-e29b-41d4-a716-446655440002',
    },
  });

  assertEquals(response.status, 200);
  assertEquals(data.ok, true);
  assertEquals(data.use_case, 'mitigation_plan');
  assertExists(data.output);
});

Deno.test('AI Gateway - Unauthorized tenant access returns 403', async () => {
  if (!AUTH_TOKEN) {
    console.log('Skipping: TEST_AUTH_TOKEN not set');
    return;
  }

  // Use a tenant ID the user doesn't have access to
  const { response, data } = await callAIGateway({
    tenant_id: '00000000-0000-0000-0000-000000000000',
    mode: 'chat',
    use_case: 'signal_assistant',
    input: { test: 'data' },
  });

  assertEquals(response.status, 403);
  assertEquals(data.ok, false);
  assertEquals(data.code, 'FORBIDDEN');
});

Deno.test('AI Gateway - GET request returns 405', async () => {
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  });

  assertEquals(response.status, 405);
  const data = await response.json();
  assertEquals(data.code, 'METHOD_NOT_ALLOWED');
});

// ============================================================================
// Performance Tests
// ============================================================================

Deno.test('AI Gateway - Response time < 10s for chat mode', async () => {
  if (!AUTH_TOKEN) {
    console.log('Skipping: TEST_AUTH_TOKEN not set');
    return;
  }

  const start = Date.now();
  
  const { response } = await callAIGateway({
    tenant_id: TENANT_ID,
    mode: 'chat',
    use_case: 'signal_assistant',
    input: {
      signal_type: 'performance_test',
      description: 'Simple test input',
    },
  });

  const duration = Date.now() - start;
  
  assertEquals(response.status, 200);
  console.log(`Response time: ${duration}ms`);
  
  // Chat mode should be fast
  assertEquals(duration < 10000, true, `Response took ${duration}ms, expected < 10000ms`);
});

// ============================================================================
// Integration Tests
// ============================================================================

Deno.test('AI Gateway - End-to-end signal analysis flow', async () => {
  if (!AUTH_TOKEN) {
    console.log('Skipping: TEST_AUTH_TOKEN not set');
    return;
  }

  // Simulate a complete flow
  const signal = {
    signal_type: 'unauthorized_access',
    severity: 'high',
    source: 'firewall_logs',
    timestamp: new Date().toISOString(),
    ip_address: '192.168.1.100',
    attempts: 15,
  };

  const { response, data } = await callAIGateway({
    tenant_id: TENANT_ID,
    mode: 'chat',
    use_case: 'signal_assistant',
    input: signal,
    context: {
      site_id: '660e8400-e29b-41d4-a716-446655440001',
    },
  });

  assertEquals(response.status, 200);
  assertEquals(data.ok, true);
  assertExists(data.output);
  
  // Output should contain some analysis
  assertEquals(data.output.length > 50, true, 'Expected substantial output');
});

console.log(`
=====================================================
AI Gateway Test Suite
=====================================================

Environment:
  BASE_URL: ${BASE_URL}
  AUTH_TOKEN: ${AUTH_TOKEN ? '✅ Set' : '❌ Not set'}
  TENANT_ID: ${TENANT_ID}

Usage:
  export TEST_AUTH_TOKEN=<your-token>
  export TEST_TENANT_ID=<your-tenant-id>
  deno test --allow-net --allow-env ai_gateway/test.ts

Note: Tests requiring AUTH_TOKEN will be skipped if not set
=====================================================
`);
