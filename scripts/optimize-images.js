#!/usr/bin/env node

/**
 * Image Optimization Script
 * Converts PNG images to WebP and AVIF formats
 * Generates responsive image sizes
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  inputDir: path.join(__dirname, '../public'),
  outputDir: path.join(__dirname, '../public/optimized'),
  formats: ['webp', 'avif'],
  sizes: [192, 384, 512, 1024], // Responsive sizes
  quality: {
    webp: 85,
    avif: 80,
  },
};

// =============================================================================
// UTILITIES
// =============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getAllImages(dir, images = []) {
  if (!fs.existsSync(dir)) return images;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !fullPath.includes('optimized')) {
      getAllImages(fullPath, images);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        images.push(fullPath);
      }
    }
  });

  return images;
}

// =============================================================================
// IMAGE CONVERSION
// =============================================================================

async function convertToWebP(inputPath, outputPath, quality = 85) {
  return new Promise((resolve, reject) => {
    // Check if sharp is available
    try {
      const sharp = require('sharp');

      sharp(inputPath)
        .webp({ quality })
        .toFile(outputPath)
        .then(() => {
          console.log(`  ✅ WebP: ${outputPath}`);
          resolve(true);
        })
        .catch((error) => {
          console.error(`  ❌ Failed to convert to WebP: ${error.message}`);
          resolve(false);
        });
    } catch {
      // Sharp not available, use manual instructions
      console.warn('  ⚠️  Sharp not installed. Install with: npm install sharp --save-dev');
      resolve(false);
    }
  });
}

async function convertToAVIF(inputPath, outputPath, quality = 80) {
  return new Promise((resolve, reject) => {
    try {
      const sharp = require('sharp');

      sharp(inputPath)
        .avif({ quality })
        .toFile(outputPath)
        .then(() => {
          console.log(`  ✅ AVIF: ${outputPath}`);
          resolve(true);
        })
        .catch((error) => {
          console.error(`  ❌ Failed to convert to AVIF: ${error.message}`);
          resolve(false);
        });
    } catch {
      console.warn('  ⚠️  Sharp not installed. Install with: npm install sharp --save-dev');
      resolve(false);
    }
  });
}

async function resizeImage(inputPath, outputPath, width) {
  return new Promise((resolve) => {
    try {
      const sharp = require('sharp');

      sharp(inputPath)
        .resize(width, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFile(outputPath)
        .then(() => {
          console.log(`  ✅ Resized to ${width}px: ${outputPath}`);
          resolve(true);
        })
        .catch((error) => {
          console.error(`  ❌ Failed to resize: ${error.message}`);
          resolve(false);
        });
    } catch {
      resolve(false);
    }
  });
}

// =============================================================================
// OPTIMIZATION PROCESS
// =============================================================================

async function optimizeImage(imagePath) {
  const filename = path.basename(imagePath, path.extname(imagePath));
  const relativeDir = path.relative(CONFIG.inputDir, path.dirname(imagePath));
  const outputDir = path.join(CONFIG.outputDir, relativeDir);

  ensureDir(outputDir);

  console.log(`\n📸 Optimizing: ${path.relative(CONFIG.inputDir, imagePath)}`);

  // Get original size
  const originalSize = fs.statSync(imagePath).size;
  console.log(`  Original size: ${formatBytes(originalSize)}`);

  const results = {
    original: imagePath,
    formats: {},
  };

  // Convert to WebP
  if (CONFIG.formats.includes('webp')) {
    const webpPath = path.join(outputDir, `${filename}.webp`);
    await convertToWebP(imagePath, webpPath, CONFIG.quality.webp);

    if (fs.existsSync(webpPath)) {
      const webpSize = fs.statSync(webpPath).size;
      const savings = ((originalSize - webpSize) / originalSize) * 100;
      console.log(`    Saved ${savings.toFixed(1)}% (${formatBytes(webpSize)})`);
      results.formats.webp = webpPath;
    }
  }

  // Convert to AVIF
  if (CONFIG.formats.includes('avif')) {
    const avifPath = path.join(outputDir, `${filename}.avif`);
    await convertToAVIF(imagePath, avifPath, CONFIG.quality.avif);

    if (fs.existsSync(avifPath)) {
      const avifSize = fs.statSync(avifPath).size;
      const savings = ((originalSize - avifSize) / originalSize) * 100;
      console.log(`    Saved ${savings.toFixed(1)}% (${formatBytes(avifSize)})`);
      results.formats.avif = avifPath;
    }
  }

  // Generate responsive sizes for PNG/JPG icons
  if (filename.includes('icon')) {
    for (const size of CONFIG.sizes) {
      const resizedPath = path.join(
        outputDir,
        `${filename}-${size}${path.extname(imagePath)}`
      );
      await resizeImage(imagePath, resizedPath, size);
    }
  }

  return results;
}

function formatBytes(bytes) {
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('🎨 Image Optimization Tool\n');

  // Check if sharp is installed
  try {
    require.resolve('sharp');
  } catch {
    console.error('❌ Sharp is not installed.');
    console.log('\nInstall it with: npm install sharp --save-dev\n');
    process.exit(1);
  }

  // Get all images
  const images = getAllImages(CONFIG.inputDir);

  if (images.length === 0) {
    console.log('No images found to optimize.');
    return;
  }

  console.log(`Found ${images.length} image(s) to optimize\n`);

  // Ensure output directory
  ensureDir(CONFIG.outputDir);

  // Optimize each image
  const results = [];
  for (const image of images) {
    const result = await optimizeImage(image);
    results.push(result);
  }

  // Summary
  console.log('\n📊 Optimization Summary:');
  console.log(`  Images processed: ${results.length}`);
  console.log(`  WebP created: ${results.filter((r) => r.formats.webp).length}`);
  console.log(`  AVIF created: ${results.filter((r) => r.formats.avif).length}`);

  console.log('\n✅ Image optimization complete!');
  console.log(`\nOptimized images are in: ${CONFIG.outputDir}\n`);

  // Generate usage guide
  const guide = generateUsageGuide(results);
  const guidePath = path.join(CONFIG.outputDir, 'USAGE.md');
  fs.writeFileSync(guidePath, guide);
  console.log(`📄 Usage guide saved to: ${guidePath}\n`);
}

function generateUsageGuide(results) {
  let guide = `# Optimized Images Usage Guide

This directory contains optimized versions of images in WebP and AVIF formats.

## Usage in Next.js

Use the Next.js Image component with the \`formats\` prop:

\`\`\`tsx
import Image from 'next/image';

<Image
  src="/icon-192.png"
  alt="Description"
  width={192}
  height={192}
  formats={['image/avif', 'image/webp']}
/>
\`\`\`

## Manual Picture Element

For more control, use the HTML picture element:

\`\`\`html
<picture>
  <source srcset="/optimized/icon-192.avif" type="image/avif" />
  <source srcset="/optimized/icon-192.webp" type="image/webp" />
  <img src="/icon-192.png" alt="Description" />
</picture>
\`\`\`

## Optimized Images

`;

  results.forEach((result) => {
    const name = path.basename(result.original);
    guide += `\n### ${name}\n`;

    if (result.formats.webp) {
      guide += `- WebP: ${path.relative(CONFIG.outputDir, result.formats.webp)}\n`;
    }
    if (result.formats.avif) {
      guide += `- AVIF: ${path.relative(CONFIG.outputDir, result.formats.avif)}\n`;
    }
  });

  return guide;
}

main().catch((error) => {
  console.error('❌ Optimization failed:', error);
  process.exit(1);
});
