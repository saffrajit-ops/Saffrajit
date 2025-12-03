#!/usr/bin/env node

/**
 * Quick test to verify Vercel setup is correct
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Vercel Setup...\n');

let errors = 0;

// Test 1: Check index.js exists
console.log('1. Checking index.js...');
if (fs.existsSync('index.js')) {
    console.log('   ✅ index.js exists');
} else {
    console.log('   ❌ index.js NOT FOUND');
    errors++;
}

// Test 2: Check vercel.json
console.log('\n2. Checking vercel.json...');
if (fs.existsSync('vercel.json')) {
    const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

    if (config.builds && config.builds[0].src === 'index.js') {
        console.log('   ✅ vercel.json configured correctly');
    } else {
        console.log('   ❌ vercel.json not pointing to index.js');
        errors++;
    }
} else {
    console.log('   ❌ vercel.json NOT FOUND');
    errors++;
}

// Test 3: Check src/app.js
console.log('\n3. Checking src/app.js...');
if (fs.existsSync('src/app.js')) {
    const appContent = fs.readFileSync('src/app.js', 'utf8');

    if (appContent.includes('connectDB')) {
        console.log('   ✅ Database connection included');
    } else {
        console.log('   ⚠️  Database connection not found in app.js');
    }

    if (appContent.includes('module.exports = app')) {
        console.log('   ✅ App exported correctly');
    } else {
        console.log('   ❌ App not exported');
        errors++;
    }
} else {
    console.log('   ❌ src/app.js NOT FOUND');
    errors++;
}

// Test 4: Check package.json
console.log('\n4. Checking package.json...');
if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    const required = ['express', 'mongoose', 'dotenv', 'cors'];
    let missingDeps = [];

    required.forEach(dep => {
        if (!pkg.dependencies || !pkg.dependencies[dep]) {
            missingDeps.push(dep);
        }
    });

    if (missingDeps.length === 0) {
        console.log('   ✅ All required dependencies present');
    } else {
        console.log(`   ❌ Missing dependencies: ${missingDeps.join(', ')}`);
        errors++;
    }
} else {
    console.log('   ❌ package.json NOT FOUND');
    errors++;
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors === 0) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n🚀 Your backend is ready for Vercel deployment!');
    console.log('\nNext steps:');
    console.log('1. Run: vercel');
    console.log('2. Add environment variables in Vercel dashboard');
    console.log('3. Run: vercel --prod');
    console.log('\nSee VERCEL_DEPLOY_CHECKLIST.md for detailed instructions.');
} else {
    console.log(`❌ ${errors} ERROR(S) FOUND`);
    console.log('\nPlease fix the errors above before deploying.');
    process.exit(1);
}
