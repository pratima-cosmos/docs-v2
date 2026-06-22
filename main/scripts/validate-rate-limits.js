#!/usr/bin/env node
/**
 * Validates all rate limit JSON files against the schema defined in CLAUDE.md.
 * Run: node main/scripts/validate-rate-limits.js
 * Run with stale check: node main/scripts/validate-rate-limits.js --check-stale
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'rate-limits');
const STALE_DAYS = 90;
const CHECK_STALE = process.argv.includes('--check-stale');

const VALID_ENVIRONMENTS = ['production', 'non-production', 'production-burst-2x', 'production-burst-3x', 'production-burst-4x', 'production-burst-30x', 'production-burst-60x'];
const VALID_LIMIT_KEYS = ['any', 'ip', 'user_id', 'session', 'email'];
const VALID_WINDOWS = ['second', 'minute', 'hour', 'day'];
const VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

let errors = [];
let warnings = [];

function error(file, msg) {
  errors.push(`[ERROR] ${file}: ${msg}`);
}

function warn(file, msg) {
  warnings.push(`[WARN]  ${file}: ${msg}`);
}

function validateFile(filePath) {
  const filename = path.basename(filePath);
  let data;

  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    error(filename, `Invalid JSON — ${e.message}`);
    return;
  }

  // Top-level required fields
  if (!data.schemaVersion) error(filename, 'Missing required field: schemaVersion');
  if (!data.tier) error(filename, 'Missing required field: tier');
  if (!data.label) error(filename, 'Missing required field: label');
  if (!data.lastVerified) {
    error(filename, 'Missing required field: lastVerified');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.lastVerified)) {
    error(filename, `lastVerified must be YYYY-MM-DD format, got: ${data.lastVerified}`);
  } else if (CHECK_STALE) {
    const verifiedDate = new Date(data.lastVerified);
    const daysSince = (Date.now() - verifiedDate) / (1000 * 60 * 60 * 24);
    if (daysSince > STALE_DAYS) {
      warn(filename, `lastVerified is ${Math.floor(daysSince)} days old (threshold: ${STALE_DAYS} days). Confirm values against enforcement source and update lastVerified.`);
    }
  }

  // tier should match filename (without .json)
  const expectedTier = path.basename(filePath, '.json');
  if (data.tier !== expectedTier) {
    error(filename, `tier field "${data.tier}" does not match filename "${expectedTier}"`);
  }

  if (!Array.isArray(data.apis)) {
    error(filename, 'Missing or invalid field: apis (must be an array)');
    return;
  }

  const seenPolicyIds = new Set();

  data.apis.forEach((api, apiIndex) => {
    const apiLabel = `apis[${apiIndex}] (${api.name || 'unnamed'})`;

    if (!api.name) error(filename, `${apiLabel}: missing name`);

    // Validate globalLimits
    if (!Array.isArray(api.globalLimits)) {
      error(filename, `${apiLabel}: globalLimits must be an array`);
    } else {
      api.globalLimits.forEach((limit, i) => {
        const label = `${apiLabel}.globalLimits[${i}]`;
        if (!VALID_ENVIRONMENTS.includes(limit.environment)) {
          error(filename, `${label}: invalid environment "${limit.environment}". Valid values: ${VALID_ENVIRONMENTS.join(', ')}`);
        }
        if (typeof limit.burstRps !== 'number') error(filename, `${label}: burstRps must be a number`);
        if (typeof limit.sustainedRps !== 'number') error(filename, `${label}: sustainedRps must be a number`);
      });
    }

    // Validate endpointPolicies
    if (!Array.isArray(api.endpointPolicies)) {
      error(filename, `${apiLabel}: endpointPolicies must be an array`);
    } else {
      api.endpointPolicies.forEach((policy, i) => {
        const label = `${apiLabel}.endpointPolicies[${i}]`;

        // Required fields
        if (!policy.policyId) {
          error(filename, `${label}: missing required field policyId`);
        } else {
          const globalKey = `${filename}::${policy.policyId}`;
          if (seenPolicyIds.has(globalKey)) {
            error(filename, `${label}: duplicate policyId "${policy.policyId}" within this file`);
          }
          seenPolicyIds.add(globalKey);
        }

        if (!policy.name) error(filename, `${label}: missing required field name`);

        if (!Array.isArray(policy.paths) || policy.paths.length === 0) {
          error(filename, `${label}: paths must be a non-empty array`);
        }

        if (!Array.isArray(policy.methods) || policy.methods.length === 0) {
          error(filename, `${label}: methods must be a non-empty array`);
        } else {
          policy.methods.forEach((m) => {
            if (!VALID_METHODS.includes(m)) {
              error(filename, `${label}: invalid method "${m}". Valid values: ${VALID_METHODS.join(', ')}`);
            }
          });
        }

        if (typeof policy.burstLimit !== 'number') error(filename, `${label}: burstLimit must be a number`);
        if (typeof policy.sustainedLimit !== 'number') error(filename, `${label}: sustainedLimit must be a number`);

        if (!VALID_WINDOWS.includes(policy.sustainedWindow)) {
          error(filename, `${label}: invalid sustainedWindow "${policy.sustainedWindow}". Valid values: ${VALID_WINDOWS.join(', ')}`);
        }

        if (!VALID_LIMIT_KEYS.includes(policy.limitKey)) {
          error(filename, `${label}: invalid limitKey "${policy.limitKey}". Valid values: ${VALID_LIMIT_KEYS.join(', ')}`);
        }
      });
    }
  });
}

// Run validation on all JSON files in the data directory
const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));

if (files.length === 0) {
  console.error(`No JSON files found in ${DATA_DIR}`);
  process.exit(1);
}

console.log(`Validating ${files.length} rate limit schema files...\n`);

files.forEach((file) => {
  validateFile(path.join(DATA_DIR, file));
});

if (warnings.length > 0) {
  console.log(warnings.join('\n'));
  console.log('');
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} error(s) found. Fix the above before merging.`);
  process.exit(1);
} else {
  console.log(`All ${files.length} file(s) valid.${warnings.length > 0 ? ` ${warnings.length} warning(s) above.` : ''}`);
}
