const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

console.log('Running javascript-obfuscator for app.js...');
execSync('npx javascript-obfuscator src/app.js --output dist/app.js --compact true --self-defending true --string-array true --string-array-encoding base64 --string-array-threshold 0.8 --transform-object-keys true --debug-protection true --debug-protection-interval 4000', { stdio: 'inherit' });

console.log('Running javascript-obfuscator for parser.js...');
execSync('npx javascript-obfuscator src/parser.js --output dist/parser.js --compact true --self-defending true --string-array true --string-array-encoding base64 --string-array-threshold 0.8 --transform-object-keys true --debug-protection true --debug-protection-interval 4000', { stdio: 'inherit' });

console.log('Copying static assets to dist...');
fs.copyFileSync('index.html', 'dist/index.html');
fs.copyFileSync('style.css', 'dist/style.css');
fs.copyFileSync('vercel.json', 'dist/vercel.json');

console.log('Copying obfuscated builds to root for deployment compatibility...');
fs.copyFileSync('dist/app.js', 'app.js');
fs.copyFileSync('dist/parser.js', 'parser.js');

console.log('Build completed successfully!');
