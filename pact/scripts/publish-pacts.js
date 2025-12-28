#!/usr/bin/env node

/**
 * Publish Pact contracts to Pact Broker
 * 
 * This script publishes consumer contract files to a Pact Broker for sharing
 * with the provider team and tracking contract versions.
 * 
 * Usage:
 *   npm run pact:publish
 * 
 * Environment Variables:
 *   PACT_BROKER_BASE_URL - URL of the Pact Broker (required for publishing)
 *   PACT_BROKER_TOKEN - Authentication token for Pact Broker
 *   GIT_COMMIT - Git commit hash (used as consumer version)
 *   GIT_BRANCH - Git branch name (used as tag)
 */

const { Publisher } = require('@pact-foundation/pact-node');
const path = require('path');

// Broker configuration
const brokerUrl = process.env.PACT_BROKER_BASE_URL;
const brokerToken = process.env.PACT_BROKER_TOKEN;
const consumerVersion = process.env.GIT_COMMIT || getGitCommit() || 'local';
const branch = process.env.GIT_BRANCH || getGitBranch() || 'local';

// Check if broker is configured
if (!brokerUrl) {
  console.log('⚠️  PACT_BROKER_BASE_URL not set - skipping publish');
  console.log('   To publish to a broker, set PACT_BROKER_BASE_URL environment variable');
  console.log('   Example: export PACT_BROKER_BASE_URL=https://your-broker.com');
  process.exit(0);
}

console.log('📤 Publishing Pact contracts to broker...');
console.log(`   Broker URL: ${brokerUrl}`);
console.log(`   Consumer Version: ${consumerVersion}`);
console.log(`   Branch: ${branch}`);

const opts = {
  pactFilesOrDirs: [path.resolve(__dirname, '../pacts')],
  pactBroker: brokerUrl,
  pactBrokerToken: brokerToken,
  consumerVersion: consumerVersion,
  tags: [branch],
  verbose: true
};

const publisher = new Publisher(opts);

publisher
  .publishPacts()
  .then(() => {
    console.log('✅ Pact contracts published successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to publish Pact contracts:', error);
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

/**
 * Get git branch name
 */
function getGitBranch() {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch {
    return null;
  }
}
