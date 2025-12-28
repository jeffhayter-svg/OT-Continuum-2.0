#!/usr/bin/env node

/**
 * Check if it's safe to deploy using Pact "can-i-deploy"
 * 
 * This script checks with the Pact Broker to see if the consumer can be
 * safely deployed based on provider verification results.
 * 
 * Usage:
 *   npm run pact:can-deploy
 * 
 * Environment Variables:
 *   PACT_BROKER_BASE_URL - URL of the Pact Broker
 *   PACT_BROKER_TOKEN - Authentication token for Pact Broker
 *   GIT_COMMIT - Git commit hash
 */

const { CanDeploy } = require('@pact-foundation/pact-node');

const brokerUrl = process.env.PACT_BROKER_BASE_URL;
const brokerToken = process.env.PACT_BROKER_TOKEN;
const consumerVersion = process.env.GIT_COMMIT || getGitCommit() || 'local';

if (!brokerUrl) {
  console.log('⚠️  PACT_BROKER_BASE_URL not set - skipping can-i-deploy check');
  console.log('   This check requires a Pact Broker');
  process.exit(0);
}

console.log('🔍 Checking if deployment is safe...');
console.log(`   Broker URL: ${brokerUrl}`);
console.log(`   Consumer Version: ${consumerVersion}`);

const opts = {
  pacticipant: 'ot-continuum-web',
  pacticipantVersion: consumerVersion,
  pactBroker: brokerUrl,
  pactBrokerToken: brokerToken,
  output: 'table',
  verbose: true
};

const canDeploy = new CanDeploy(opts);

canDeploy
  .canDeploy()
  .then((result) => {
    console.log('✅ Safe to deploy!');
    console.log(result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ NOT safe to deploy!');
    console.error(error.message);
    process.exit(1);
  });

/**
 * Get git commit hash
 */
function getGitCommit() {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return null;
  }
}
