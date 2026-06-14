const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

const obfuscationOptions = {
  compact: true,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.8,
  transformObjectKeys: true,
  debugProtection: true,
  debugProtectionInterval: 4000
};

console.log('Obfuscating app.js using javascript-obfuscator API...');
try {
  const appSource = fs.readFileSync('src/app.js', 'utf8');
  const appObfuscated = JavaScriptObfuscator.obfuscate(appSource, obfuscationOptions).getObfuscatedCode();
  fs.writeFileSync('dist/app.js', appObfuscated, 'utf8');
  console.log('app.js obfuscated successfully.');
} catch (err) {
  console.error('Failed to obfuscate app.js:', err);
  process.exit(1);
}

console.log('Obfuscating parser.js using javascript-obfuscator API...');
try {
  const parserSource = fs.readFileSync('src/parser.js', 'utf8');
  const parserObfuscated = JavaScriptObfuscator.obfuscate(parserSource, obfuscationOptions).getObfuscatedCode();
  fs.writeFileSync('dist/parser.js', parserObfuscated, 'utf8');
  console.log('parser.js obfuscated successfully.');
} catch (err) {
  console.error('Failed to obfuscate parser.js:', err);
  process.exit(1);
}

console.log('Copying static assets to dist...');
try {
  fs.copyFileSync('index.html', 'dist/index.html');
  fs.copyFileSync('style.css', 'dist/style.css');
  fs.copyFileSync('vercel.json', 'dist/vercel.json');
  console.log('Static assets copied successfully.');
} catch (err) {
  console.error('Failed to copy static assets:', err);
  process.exit(1);
}

console.log('Copying obfuscated builds to root for deployment compatibility...');
try {
  fs.copyFileSync('dist/app.js', 'app.js');
  fs.copyFileSync('dist/parser.js', 'parser.js');
  console.log('Obfuscated builds copied to root successfully.');
} catch (err) {
  console.error('Failed to copy obfuscated builds to root:', err);
  process.exit(1);
}

console.log('Build completed successfully!');
