/**
 * SVGO Configuration
 * Optimizes SVG files while maintaining quality and accessibility
 */
module.exports = {
  multipass: true, // Run multiple optimization passes
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Don't merge paths as it can break animations
          mergePaths: false,
          // Keep some IDs for potential CSS/JS references
          cleanupIds: {
            minify: true,
            preserve: [],
            preservePrefixes: [],
            force: false,
            remove: true,
          },
        },
      },
    },
    // Remove script tags for security (updated plugin name)
    'removeScripts',
    // Optimize path data
    {
      name: 'convertPathData',
      params: {
        floatPrecision: 2,
        transformPrecision: 5,
        removeUseless: true,
        straightCurves: true,
        lineShorthands: true,
        curveSmoothShorthands: true,
      },
    },
    // Sort attributes for better gzip compression
    'sortAttrs',
  ],
};
