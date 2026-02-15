#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const REQUIRED_APPROVERS = [
  '002', // CIPHER
  '019', // CRYPTO-AUDITOR
  '078', // SECURITY-PENETRATOR
  '075', // DC-GOLF
  '086', // DC-HOTEL
  '001', // RAMSAD
];

function exitWithError(message) {
  console.error(`[verify-release-signoffs] ${message}`);
  process.exit(1);
}

function isValidIsoDate(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp);
}

function evidenceExists(evidencePath) {
  if (typeof evidencePath !== 'string' || evidencePath.trim().length === 0) {
    return false;
  }

  if (/^https?:\/\//i.test(evidencePath)) {
    return true;
  }

  const resolved = path.join(process.cwd(), evidencePath);
  return fs.existsSync(resolved);
}

function readSignoffFile(version) {
  const filePath = path.join(process.cwd(), 'release-signoffs', `${version}.json`);
  if (!fs.existsSync(filePath)) {
    exitWithError(
      `Missing required signoff file: release-signoffs/${version}.json. ` +
      'Use release-signoffs/TEMPLATE.json as the schema.'
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    exitWithError(`Invalid JSON in ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { parsed, filePath };
}

function validateSignoffs(version, payload) {
  if (!payload || typeof payload !== 'object') {
    exitWithError('Signoff payload must be an object.');
  }

  const release = payload.release;
  if (release !== version) {
    exitWithError(`release field mismatch: expected "${version}", received "${String(release)}".`);
  }

  const signoffs = payload.signoffs;
  if (!Array.isArray(signoffs)) {
    exitWithError('signoffs must be an array.');
  }

  const byApprover = new Map();
  for (const entry of signoffs) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    if (typeof entry.approver !== 'string') {
      continue;
    }
    byApprover.set(entry.approver, entry);
  }

  const missing = [];
  for (const approver of REQUIRED_APPROVERS) {
    const entry = byApprover.get(approver);
    if (!entry) {
      missing.push(`${approver}: missing signoff`);
      continue;
    }

    if (entry.status !== 'approved') {
      missing.push(`${approver}: status must be "approved"`);
    }

    if (!isValidIsoDate(entry.signedAt)) {
      missing.push(`${approver}: signedAt must be a valid ISO date`);
    }

    if (!evidenceExists(entry.evidence)) {
      missing.push(`${approver}: evidence path/link is required and must exist`);
    }
  }

  if (missing.length > 0) {
    exitWithError(
      'Security signoff verification failed:\n' +
      missing.map((item) => `- ${item}`).join('\n')
    );
  }
}

function main() {
  const version = process.argv[2];
  if (!version) {
    exitWithError('Usage: node scripts/verify-release-signoffs.js <release-tag>');
  }

  const { parsed, filePath } = readSignoffFile(version);
  validateSignoffs(version, parsed);

  console.log(`[verify-release-signoffs] Verified required security signoffs for ${version}.`);
  console.log(`[verify-release-signoffs] Source: ${filePath}`);
}

main();
