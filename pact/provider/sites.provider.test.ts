import { Verifier } from '@pact-foundation/pact';
import path from 'node:path';

// Provider verification test
const providerBaseUrl = process.env.PROVIDER_BASE_URL || 'http://localhost:54321/functions/v1';
const pactBrokerUrl = process.env.PACT_BROKER_URL;
const pactBrokerToken = process.env.PACT_BROKER_TOKEN;

const opts = {
  provider: 'OTContinuumAPI',
  providerBaseUrl,
  
  // Use pact broker if configured, otherwise use local pacts
  pactUrls: pactBrokerUrl 
    ? undefined 
    : [path.resolve(process.cwd(), 'pact', 'pacts', 'otcontinuumfrontend-otcontinuumapi.json')],
  
  pactBrokerUrl,
  pactBrokerToken,
  
  // Provider version
  providerVersion: process.env.GIT_COMMIT || '1.0.0',
  
  // State handlers for provider states
  stateHandlers: {
    'organization exists': async () => {
      // Setup: Ensure test organization exists
      console.log('Setting up: organization exists');
      return Promise.resolve();
    },
    'organization exists with sites': async () => {
      // Setup: Ensure organization with sites exists
      console.log('Setting up: organization exists with sites');
      return Promise.resolve();
    },
    'site exists': async () => {
      // Setup: Ensure test site exists
      console.log('Setting up: site exists');
      return Promise.resolve();
    },
  },
  
  // Request filters to add authentication
  requestFilter: (req: any, res: any, next: any) => {
    // Add auth token for requests
    if (!req.headers.authorization) {
      req.headers.authorization = `Bearer ${process.env.TEST_AUTH_TOKEN || 'test-token'}`;
    }
    next();
  },
  
  publishVerificationResult: process.env.CI === 'true',
  consumerVersionSelectors: [
    { latest: true },
  ],
};

describe('OT Continuum API Provider Verification', () => {
  it('validates the expectations of OTContinuumFrontend', async () => {
    const verifier = new Verifier(opts);
    const output = await verifier.verifyProvider();
    console.log('Pact Verification Complete!');
    console.log(output);
  });
});
