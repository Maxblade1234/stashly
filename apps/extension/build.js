#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const envArg = args.find(a => a.startsWith('--env='));
const env = envArg ? envArg.split('=')[1] : 'dev';

const config = {
  dev: {
    API_URL: 'http://localhost:3000/api',
    WEBSITE_URL: 'http://localhost:3000',
  },
  prod: {
    API_URL: 'https://stashly.com/api',
    WEBSITE_URL: 'https://stashly.com',
  },
};

const envConfig = config[env] || config.dev;
const distDir = path.join(__dirname, 'dist');

console.log(`Building Stashly extension for ${env}...`);

// Clean dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Files to copy
const filesToCopy = [
  'manifest.json',
  'background.js',
  'content/detector.js',
  'content/overlay.js',
  'content/auto-apply.js',
  'popup/popup.html',
  'popup/popup.js',
  'popup/popup.css',
  'styles/overlay.css',
];

// Directories to ensure
const dirs = ['content', 'popup', 'styles', 'utils', 'icons'];
dirs.forEach(dir => {
  const fullDir = path.join(distDir, dir);
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }
});

// Copy files
filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${file}`);
  } else {
    console.warn(`  Warning: ${file} not found`);
  }
});

// Generate config.js with environment-specific URLs
const configContent = `// Auto-generated Stashly config (${env})
const CONFIG = {
  API_BASE_URL: '${envConfig.API_URL}',
  WEBSITE_URL: '${envConfig.WEBSITE_URL}',
  RETAILER_CACHE_TTL: ${60 * 60 * 1000},
  BALANCE_CACHE_TTL: ${5 * 60 * 1000},
  OVERLAY_DELAY_MS: 1500,
  AUTO_APPLY_RETRY_DELAY: 500,
  AUTO_APPLY_MAX_RETRIES: 3,
};
`;
fs.writeFileSync(path.join(distDir, 'utils', 'config.js'), configContent);
console.log('  Generated: utils/config.js');

// Copy API client and retailer manager
['utils/api.js', 'utils/retailers.js'].forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${file}`);
  }
});

// Copy icons if they exist
const iconsDir = path.join(__dirname, 'icons');
if (fs.existsSync(iconsDir)) {
  fs.readdirSync(iconsDir).forEach(file => {
    fs.copyFileSync(
      path.join(iconsDir, file),
      path.join(distDir, 'icons', file)
    );
  });
  console.log('  Copied: icons/');
}

// Create zip for Chrome Web Store (prod only)
if (env === 'prod') {
  console.log('\nTo create a zip for Chrome Web Store:');
  console.log(`  cd ${distDir} && zip -r ../stashly-extension.zip .`);
}

console.log(`\nBuild complete! Output: ${distDir}`);
console.log(`Environment: ${env}`);
console.log(`API URL: ${envConfig.API_URL}`);
