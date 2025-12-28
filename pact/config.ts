// ============================================================================
// Pact Configuration
// ============================================================================

import { PactOptions } from '@pact-foundation/pact';
import * as path from 'node:path';

/**
 * Shared Pact configuration
 */
export const pactConfig = {
  // Directory where pact files are written
  pactfileWriteMode: 'update' as const,
  dir: path.resolve(process.cwd(), 'pact/pacts'),
  
  // Log level
  log: path.resolve(process.cwd(), 'pact/logs/pact.log'),
  logLevel: 'info' as const,
  
  // Specification version
  spec: 2,
  
  // Host and port for mock server
  host: '127.0.0.1',
  port: 9876,
  
  // Pact Broker (for CI/CD)
  broker: {
    brokerUrl: process.env.PACT_BROKER_BASE_URL || 'https://pact-broker.example.com',
    brokerToken: process.env.PACT_BROKER_TOKEN || '',
    publishVerificationResult: true,
    consumerVersion: process.env.GIT_COMMIT || 'local',
    providerVersion: process.env.GIT_COMMIT || 'local',
    tags: [process.env.GIT_BRANCH || 'local']
  }
};

/**
 * Consumer configuration
 */
export const consumerConfig = {
  consumer: 'ot-continuum-web',
  provider: 'ot-continuum-api',
  ...pactConfig
};

/**
 * Provider configuration
 */
export const providerConfig = {
  provider: 'ot-continuum-api',
  
  // Provider base URL (where Edge Functions are deployed)
  providerBaseUrl: process.env.PROVIDER_BASE_URL || 'http://localhost:54321/functions/v1/make-server-fb677d93',
  
  // Pact files to verify
  pactUrls: [
    path.resolve(process.cwd(), 'pact/pacts')
  ],
  
  // State handlers
  stateHandlers: {},
  
  // Request filters (add auth headers)
  requestFilter: (req: any, res: any, next: any) => {
    // Add Bearer token for authenticated endpoints
    const token = process.env.TEST_AUTH_TOKEN || 'test-token';
    req.headers['Authorization'] = `Bearer ${token}`;
    next();
  },
  
  ...pactConfig
};

/**
 * Mock authentication token for tests
 */
export const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTEyMzQtMTIzNC0xMjM0NTY3ODkwYWIiLCJ0ZW5hbnRfaWQiOiI4NzY1NDMyMS00MzIxLTQzMjEtNDMyMS04NzY1NDMyMTBkY2IiLCJyb2xlIjoiYWRtaW4iLCJzaXRlX2lkcyI6bnVsbCwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.dummysignature';

/**
 * Test tenant ID (from mock JWT)
 */
export const testTenantId = '87654321-4321-4321-4321-876543210dcb';

/**
 * Test user ID (from mock JWT)
 */
export const testUserId = '12345678-1234-1234-1234-1234567890ab';

/**
 * Test site ID
 */
export const testSiteId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

/**
 * Test risk ID
 */
export const testRiskId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Test workflow ID
 */
export const testWorkflowId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

/**
 * Test work item ID
 */
export const testWorkItemId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
