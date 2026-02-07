#!/usr/bin/env node

/**
 * Geist Fonts Installation Script
 *
 * This script downloads Geist Sans and Geist Mono fonts from the official
 * Vercel repository and places them in the correct directory structure.
 *
 * Usage:
 *   node scripts/install-geist-fonts.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Font configuration
const FONTS = [
  {
    name: 'Geist Sans',
    url: 'https://github.com/vercel/geist-font/raw/main/packages/next/dist/fonts/geist-sans/GeistVF.woff2',
    dir: 'public/fonts/geist',
    file: 'GeistVF.woff2',
  },
  {
    name: 'Geist Mono',
    url: 'https://github.com/vercel/geist-font/raw/main/packages/next/dist/fonts/geist-mono/GeistMonoVF.woff2',
    dir: 'public/fonts/geist-mono',
    file: 'GeistMonoVF.woff2',
  },
];

/**
 * Download a file from a URL
 */
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, destination)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(destination, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {});
      reject(err);
    });
  });
}

/**
 * Create directory recursively
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Format file size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Main installation function
 */
async function installFonts() {
  console.log('🔤 Geist Fonts Installation\n');
  console.log('This will download and install Geist Sans and Geist Mono fonts.');
  console.log('Source: Vercel Official Repository\n');

  let successCount = 0;
  let failCount = 0;

  for (const font of FONTS) {
    const destPath = path.join(process.cwd(), font.dir, font.file);

    try {
      // Check if font already exists
      if (fs.existsSync(destPath)) {
        const stats = fs.statSync(destPath);
        console.log(`✓ ${font.name} already installed (${formatBytes(stats.size)})`);
        successCount++;
        continue;
      }

      // Create directory
      ensureDir(path.join(process.cwd(), font.dir));

      // Download font
      console.log(`↓ Downloading ${font.name}...`);
      await downloadFile(font.url, destPath);

      const stats = fs.statSync(destPath);
      console.log(`✓ ${font.name} installed successfully (${formatBytes(stats.size)})`);
      successCount++;

    } catch (error) {
      console.error(`✗ Failed to install ${font.name}: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Installation complete: ${successCount} successful, ${failCount} failed`);

  if (successCount === FONTS.length) {
    console.log('\n✓ All fonts installed successfully!');
    console.log('  Restart your development server to see the changes.');
  } else if (successCount > 0) {
    console.log('\n⚠ Some fonts failed to install.');
    console.log('  You can manually download them from:');
    console.log('  https://vercel.com/font');
  } else {
    console.log('\n✗ Font installation failed.');
    console.log('  Please manually download fonts from:');
    console.log('  https://vercel.com/font');
  }

  console.log('\nFor more information, see: public/fonts/README.md');
}

// Run installation
installFonts().catch(error => {
  console.error('Installation error:', error);
  process.exit(1);
});
