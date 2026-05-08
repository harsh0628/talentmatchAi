#!/usr/bin/env node

/**
 * Azure Function App Validator
 * Validates the Function App structure before deployment
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: [],
  failed: []
};

function check(name, condition, details = '') {
  if (condition) {
    checks.passed.push({ name, details });
    console.log(`✅ ${name}${details ? ': ' + details : ''}`);
  } else {
    checks.failed.push({ name, details });
    console.error(`❌ ${name}${details ? ': ' + details : ''}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('Azure Function App Validation');
console.log('='.repeat(60) + '\n');

// 1. Check required files
console.log('📋 Checking Required Files...');
check('host.json exists', fs.existsSync('host.json'), 'Valid JSON format');
check('package.json exists', fs.existsSync('package.json'));
check('HttpTrigger/function.json exists', fs.existsSync('HttpTrigger/function.json'));
check('HttpTrigger/index.js exists', fs.existsSync('HttpTrigger/index.js'));
check('src/app.js exists', fs.existsSync('src/app.js'));

// 2. Validate JSON files
console.log('\n📝 Validating JSON Files...');
try {
  const hostJson = JSON.parse(fs.readFileSync('host.json', 'utf8'));
  check('host.json valid JSON', true, `version ${hostJson.version}`);
  check('host.json has version', hostJson.version === '2.0');
  check('host.json extensions configured', hostJson.extensions !== undefined);
} catch (err) {
  check('host.json valid JSON', false, err.message);
}

try {
  const funcJson = JSON.parse(fs.readFileSync('HttpTrigger/function.json', 'utf8'));
  check('function.json valid JSON', true);
  check('function.json has bindings', funcJson.bindings && funcJson.bindings.length > 0);
} catch (err) {
  check('function.json valid JSON', false, err.message);
}

try {
  const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  check('package.json valid JSON', true);
  check('package.json has main entry', pkgJson.main === 'HttpTrigger/index.js');
  check('package.json has build script', pkgJson.scripts && pkgJson.scripts.build);
  check('package.json has dependencies', pkgJson.dependencies && Object.keys(pkgJson.dependencies).length > 0);
} catch (err) {
  check('package.json valid JSON', false, err.message);
}

// 3. Check Node modules
console.log('\n📦 Checking Dependencies...');
check('node_modules exists', fs.existsSync('node_modules'));
check('Express installed', fs.existsSync('node_modules/express'));
check('@codegenie/serverless-express installed', fs.existsSync('node_modules/@codegenie/serverless-express'));

// 4. Try loading modules
console.log('\n🔧 Testing Module Loading...');
try {
  const app = require('./src/app');
  check('Express app loads', true);
} catch (err) {
  check('Express app loads', false, err.message);
}

try {
  const handler = require('./HttpTrigger/index');
  check('HttpTrigger handler loads', true);
} catch (err) {
  check('HttpTrigger handler loads', false, err.message);
}

// 5. Check environment variables
console.log('\n🔐 Environment Variables Check...');
const requiredEnvVars = [
  'MONGODB_URI',
  'CLIENT_URL',
  'NODE_ENV',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

const hasAllRequired = requiredEnvVars.every(v => process.env[v]);
check('Critical environment variables', hasAllRequired, `Set: ${requiredEnvVars.filter(v => process.env[v]).length}/${requiredEnvVars.length}`);

// 6. Summary
console.log('\n' + '='.repeat(60));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${checks.passed.length}`);
console.log(`❌ Failed: ${checks.failed.length}`);

if (checks.failed.length > 0) {
  console.log('\n⚠️ Issues to Fix:');
  checks.failed.forEach(check => {
    console.log(`  - ${check.name}${check.details ? ': ' + check.details : ''}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 All validation checks passed!');
  console.log('✅ Ready to deploy to Azure Functions\n');
  process.exit(0);
}
