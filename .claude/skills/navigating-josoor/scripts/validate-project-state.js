#!/usr/bin/env node

/**
 * Validates that the navigating-josoor skill's assumptions are still accurate.
 * Run this at the start of a session to catch stale documentation.
 *
 * Usage: node .claude/skills/navigating-josoor/scripts/validate-project-state.js
 */

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const WARN = '\x1b[33m⚠\x1b[0m';

let failures = 0;
let warnings = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ${PASS} ${label}`);
  } else {
    console.log(`  ${FAIL} ${label}`);
    failures++;
  }
}

function warn(label, condition) {
  if (condition) {
    console.log(`  ${PASS} ${label}`);
  } else {
    console.log(`  ${WARN} ${label} (may need skill update)`);
    warnings++;
  }
}

function portOpen(port) {
  try {
    const result = execSync(`ss -tlnp | grep :${port}`, { encoding: 'utf8', timeout: 5000 });
    return result.trim().length > 0;
  } catch { return false; }
}

function fileExists(path) {
  return existsSync(path);
}

function serviceActive(name) {
  try {
    const result = execSync(`systemctl is-active ${name} 2>/dev/null`, { encoding: 'utf8', timeout: 5000 });
    return result.trim() === 'active';
  } catch { return false; }
}

console.log('\n📋 Josoor Project State Validation\n');

// 1. Critical files
console.log('1. Critical Files:');
check('theme.css exists', fileExists('frontend/src/styles/theme.css'));
check('en.json exists', fileExists('frontend/src/i18n/en.json'));
check('ar.json exists', fileExists('frontend/src/i18n/ar.json'));
check('chainsService.ts exists', fileExists('frontend/src/services/chainsService.ts'));
check('JosoorShell.tsx exists', fileExists('frontend/src/app/josoor/JosoorShell.tsx'));
check('SectorDesk.tsx exists', fileExists('frontend/src/components/desks/SectorDesk.tsx'));
check('EnterpriseDesk.tsx exists', fileExists('frontend/src/components/desks/EnterpriseDesk.tsx'));
check('vite.config.ts exists', fileExists('frontend/vite.config.ts'));
check('TASKS.md exists', fileExists('TASKS.md'));
check('supabaseClient.ts exists', fileExists('frontend/src/lib/supabaseClient.ts'));

// 2. Services
console.log('\n2. VPS Services:');
warn('Frontend (port 3000)', portOpen(3000));
warn('Graph Server (port 3001)', portOpen(3001));
warn('Backend (port 8008)', portOpen(8008));
warn('Neo4j MCP (port 8080)', portOpen(8080));
warn('Noor MCP Router (port 8201)', portOpen(8201));

// 3. Systemd units
console.log('\n3. Systemd Services:');
warn('josoor-frontend.service', serviceActive('josoor-frontend'));
warn('josoor-backend.service', serviceActive('josoor-backend'));
warn('josoor-graph.service', serviceActive('josoor-graph'));
warn('josoor-mcp.service', serviceActive('josoor-mcp'));
warn('josoor-router-noor.service', serviceActive('josoor-router-noor'));

// 4. Proxy routing verification
console.log('\n4. Vite Proxy Routes:');
try {
  const viteConfig = readFileSync('frontend/vite.config.ts', 'utf8');
  check('/api/v1 → 8008', viteConfig.includes('8008') || viteConfig.includes('betaBE'));
  check('/api/business-chain → 3001', viteConfig.includes('3001'));
  check('/api/graph → 3001', viteConfig.includes('/api/graph'));
  check('/api/neo4j → 3001', viteConfig.includes('/api/neo4j'));
} catch {
  console.log(`  ${FAIL} Could not read vite.config.ts`);
  failures++;
}

// 5. i18n sync check
console.log('\n5. i18n Sync:');
try {
  const en = JSON.parse(readFileSync('frontend/src/i18n/en.json', 'utf8'));
  const ar = JSON.parse(readFileSync('frontend/src/i18n/ar.json', 'utf8'));
  const enKeys = Object.keys(en);
  const arKeys = Object.keys(ar);
  const missingInAr = enKeys.filter(k => !arKeys.includes(k));
  const missingInEn = arKeys.filter(k => !enKeys.includes(k));
  check(`Top-level keys match (en: ${enKeys.length}, ar: ${arKeys.length})`, missingInAr.length === 0 && missingInEn.length === 0);
  if (missingInAr.length > 0) console.log(`    Missing in ar.json: ${missingInAr.join(', ')}`);
  if (missingInEn.length > 0) console.log(`    Missing in en.json: ${missingInEn.join(', ')}`);
} catch (e) {
  console.log(`  ${FAIL} Could not parse i18n files: ${e.message}`);
  failures++;
}

// 6. Service files check
console.log('\n6. Service Layer:');
const expectedServices = [
  'chainsService.ts', 'ontologyService.ts', 'enterpriseService.ts',
  'chatService.ts', 'neo4jMcpService.ts', 'sectorService.ts',
  'dashboardService.ts', 'authService.ts'
];
for (const svc of expectedServices) {
  warn(svc, fileExists(`frontend/src/services/${svc}`));
}

// Summary
console.log('\n' + '─'.repeat(50));
if (failures === 0 && warnings === 0) {
  console.log(`${PASS} All checks passed. Skill documentation is current.`);
} else {
  if (failures > 0) console.log(`${FAIL} ${failures} failures — skill docs may be WRONG`);
  if (warnings > 0) console.log(`${WARN} ${warnings} warnings — services may be down or files moved`);
  console.log('\nIf files moved or services changed, update the navigating-josoor skill.');
}
console.log('');
