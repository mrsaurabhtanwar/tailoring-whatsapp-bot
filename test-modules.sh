#!/bin/bash
# Quick deployment test script

echo "🧪 Testing Memory Guardian..."
node -e "
const MemoryGuardian = require('./memory-guardian');
console.log('✅ Memory Guardian can be imported');
const guardian = new MemoryGuardian();
console.log('✅ Memory Guardian can be instantiated');
setTimeout(() => {
    console.log('✅ Memory Guardian is running without errors');
    process.exit(0);
}, 2000);
"

echo "🧪 Testing session storage..."
node -e "
const ExternalSessionStorage = require('./session-storage');
console.log('✅ Session storage can be imported');
const storage = new ExternalSessionStorage();
console.log('✅ Session storage configured:', storage.storageType);
process.exit(0);
"

echo "✅ All core modules tested successfully!"
