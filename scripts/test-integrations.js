#!/usr/bin/env node

/**
 * Real Integration Testing Script
 * Tests GitHub Actions, AWS, and Docker integrations
 */

const https = require('https');
const { execSync } = require('child_process');

console.log('🧪 Starting Real Integration Tests\n');

// Test 1: GitHub Actions API
async function testGitHubActions() {
  console.log('1️⃣ Testing GitHub Actions API...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/anandavicky123/syncerticaenterprise/actions/workflows',
      headers: {
        'Authorization': 'token ***REMOVED***',
        'User-Agent': 'Syncertica-Enterprise-Test'
      }
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.total_count !== undefined) {
            console.log('   ✅ GitHub API Connection: SUCCESS');
            console.log(`   📊 Workflows found: ${parsed.total_count}`);
            console.log(`   🔑 Rate limit remaining: ${res.headers['x-ratelimit-remaining']}`);
            
            if (parsed.workflows && parsed.workflows.length > 0) {
              console.log('   📋 Available workflows:');
              parsed.workflows.forEach(w => {
                console.log(`      - ${w.name} (${w.state})`);
              });
            }
            resolve(true);
          } else {
            console.log('   ❌ Unexpected API response format');
            resolve(false);
          }
        } catch (e) {
          console.log('   ❌ JSON Parse Error:', e.message);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log('   ❌ GitHub API Test: FAILED -', e.message);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.log('   ❌ GitHub API Test: TIMEOUT');
      resolve(false);
    });
  });
}

// Test 2: AWS Credentials
function testAWSCredentials() {
  console.log('\n2️⃣ Testing AWS Credentials...');
  
  try {
    // Check if AWS CLI is available
    const awsVersion = execSync('aws --version', { encoding: 'utf8', stdio: 'pipe' });
    console.log('   ✅ AWS CLI Available:', awsVersion.trim());
    
    // Test STS get-caller-identity with environment variables
    process.env.AWS_ACCESS_KEY_ID = '***REMOVED***';
    process.env.AWS_SECRET_ACCESS_KEY = '***REMOVED***';
    process.env.AWS_DEFAULT_REGION = 'us-east-1';
    
    const identity = execSync('aws sts get-caller-identity', { encoding: 'utf8', stdio: 'pipe' });
    const parsed = JSON.parse(identity);
    
    console.log('   ✅ AWS Credentials: VALID');
    console.log(`   👤 User ID: ${parsed.UserId}`);
    console.log(`   🏷️  Account: ${parsed.Account}`);
    console.log(`   🔑 ARN: ${parsed.Arn}`);
    
    return true;
  } catch (error) {
    console.log('   ❌ AWS Test Failed:', error.message);
    return false;
  }
}

// Test 3: Docker
function testDocker() {
  console.log('\n3️⃣ Testing Docker...');
  
  try {
    // Check Docker version
    const dockerVersion = execSync('docker --version', { encoding: 'utf8', stdio: 'pipe' });
    console.log('   ✅ Docker Available:', dockerVersion.trim());
    
    // Test Docker Hub login (non-interactive check)
    const dockerInfo = execSync('docker info', { encoding: 'utf8', stdio: 'pipe' });
    console.log('   ✅ Docker Daemon: RUNNING');
    
    // Check if we can pull a test image
    console.log('   🔄 Testing Docker pull...');
    execSync('docker pull hello-world', { stdio: 'pipe' });
    console.log('   ✅ Docker Pull: SUCCESS');
    
    // Test local build capability
    console.log('   🔄 Testing Docker build capability...');
    const buildTest = execSync('docker build --help', { encoding: 'utf8', stdio: 'pipe' });
    console.log('   ✅ Docker Build: AVAILABLE');
    
    return true;
  } catch (error) {
    console.log('   ❌ Docker Test Failed:', error.message);
    return false;
  }
}

// Test 4: Application Dependencies
function testApplicationDeps() {
  console.log('\n4️⃣ Testing Application Dependencies...');
  
  try {
    // Check Node.js version
    const nodeVersion = execSync('node --version', { encoding: 'utf8' });
    console.log('   ✅ Node.js Version:', nodeVersion.trim());
    
    // Check npm version
    const npmVersion = execSync('npm --version', { encoding: 'utf8' });
    console.log('   ✅ npm Version:', npmVersion.trim());
    
    // Check if package.json dependencies are installed
    const packageCheck = execSync('npm list --depth=0', { encoding: 'utf8', stdio: 'pipe' });
    console.log('   ✅ Dependencies: INSTALLED');
    
    // Check if .env.local exists
    const fs = require('fs');
    if (fs.existsSync('.env.local')) {
      console.log('   ✅ Environment file: FOUND');
    } else {
      console.log('   ⚠️  Environment file: NOT FOUND');
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ Application Test Failed:', error.message);
    return false;
  }
}

// Test 5: Build and Start Application
function testApplicationBuild() {
  console.log('\n5️⃣ Testing Application Build...');
  
  try {
    // Test TypeScript compilation
    console.log('   🔄 Testing TypeScript compilation...');
    execSync('npm run type-check', { stdio: 'pipe' });
    console.log('   ✅ TypeScript: VALID');
    
    // Test linting
    console.log('   🔄 Testing ESLint...');
    execSync('npm run lint', { stdio: 'pipe' });
    console.log('   ✅ Linting: PASSED');
    
    // Test build process
    console.log('   🔄 Testing build process...');
    execSync('npm run build', { stdio: 'pipe' });
    console.log('   ✅ Build: SUCCESS');
    
    return true;
  } catch (error) {
    console.log('   ❌ Build Test Failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  const results = {
    github: false,
    aws: false,
    docker: false,
    app: false,
    build: false
  };
  
  results.github = await testGitHubActions();
  results.aws = testAWSCredentials();
  results.docker = testDocker();
  results.app = testApplicationDeps();
  results.build = testApplicationBuild();
  
  // Summary
  console.log('\n🎯 TEST SUMMARY');
  console.log('================');
  console.log(`GitHub Actions API: ${results.github ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`AWS Credentials:    ${results.aws ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Docker Integration: ${results.docker ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Application Deps:   ${results.app ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Build Process:      ${results.build ? '✅ PASS' : '❌ FAIL'}`);
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n📊 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - Ready for production deployment!');
  } else {
    console.log('⚠️  Some tests failed - Check configuration before deployment');
  }
}

// Run tests
runAllTests().catch(console.error);
