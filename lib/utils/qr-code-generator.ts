/**
 * Simple Visual Code Generator
 *
 * Generates a grid-based visual code from a room code string.
 * This creates a deterministic visual pattern that can be used
 * for visual verification and sharing.
 */

export interface VisualCodeOptions {
  size?: number;
  gridSize?: number;
  colorScheme?: 'monochrome' | 'gradient' | 'accent';
  includeUrl?: boolean;
  padding?: number;
}

/**
 * Hash function to generate deterministic values from string
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a deterministic color from a string
 */
function stringToColor(str: string, index: number, scheme: 'monochrome' | 'gradient' | 'accent'): string {
  if (scheme === 'monochrome') {
    // Simple black/white pattern
    const hash = simpleHash(str + index);
    return hash % 2 === 0 ? '#000000' : '#FFFFFF';
  }

  if (scheme === 'accent') {
    // Use accent color variations
    const hash = simpleHash(str + index);
    const lightness = 40 + (hash % 30);
    return `hsl(210, 100%, ${lightness}%)`;
  }

  // Gradient scheme - use various colors
  const hash = simpleHash(str + index);
  const hue = hash % 360;
  const saturation = 70 + (hash % 30);
  const lightness = 50 + (hash % 20);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generate visual code grid data
 */
export function generateVisualCodeData(
  data: string,
  gridSize: number = 8,
  scheme: 'monochrome' | 'gradient' | 'accent' = 'accent'
): string[][] {
  const grid: string[][] = [];

  for (let y = 0; y < gridSize; y++) {
    const row: string[] = [];
    for (let x = 0; x < gridSize; x++) {
      const index = y * gridSize + x;
      const cell = data.charAt(index % data.length);
      const color = stringToColor(data + cell + index, index, scheme);
      row.push(color);
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Generate SVG visual code
 */
export function generateVisualCodeSVG(
  data: string,
  options: VisualCodeOptions = {}
): string {
  const {
    size = 256,
    gridSize = 8,
    colorScheme = 'accent',
    includeUrl = false,
    padding = 16,
  } = options;

  const grid = generateVisualCodeData(data, gridSize, colorScheme);
  const cellSize = (size - padding * 2) / gridSize;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

  // Background
  svg += `<rect width="${size}" height="${size}" fill="#ffffff" rx="8"/>`;

  // Grid cells
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const color = grid[y][x];
      const cx = padding + x * cellSize + cellSize / 2;
      const cy = padding + y * cellSize + cellSize / 2;
      const radius = cellSize * 0.4;

      svg += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}"/>`;
    }
  }

  // Optional URL text at bottom
  if (includeUrl) {
    const textY = size - 8;
    svg += `<text x="${size / 2}" y="${textY}" text-anchor="middle" font-family="monospace" font-size="10" fill="#666">${data}</text>`;
  }

  svg += '</svg>';

  return svg;
}

/**
 * Generate data URL for visual code
 */
export function generateVisualCodeDataURL(
  data: string,
  options: VisualCodeOptions = {}
): string {
  const svg = generateVisualCodeSVG(data, options);
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate QR-like code with URL encoding
 * This creates a more sophisticated visual code that includes
 * corner markers for orientation (similar to QR codes)
 */
export function generateEnhancedVisualCode(
  url: string,
  options: VisualCodeOptions = {}
): string {
  const {
    size = 256,
    gridSize = 12,
    colorScheme = 'monochrome',
    padding = 16,
  } = options;

  const grid = generateVisualCodeData(url, gridSize, colorScheme);
  const cellSize = (size - padding * 2) / gridSize;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

  // Background
  svg += `<rect width="${size}" height="${size}" fill="#ffffff" rx="12"/>`;

  // Corner markers (positioning squares like QR codes)
  const markerSize = cellSize * 3;
  const markerPositions = [
    { x: padding, y: padding }, // Top-left
    { x: size - padding - markerSize, y: padding }, // Top-right
    { x: padding, y: size - padding - markerSize }, // Bottom-left
  ];

  markerPositions.forEach(({ x, y }) => {
    // Outer square
    svg += `<rect x="${x}" y="${y}" width="${markerSize}" height="${markerSize}" fill="none" stroke="#000000" stroke-width="2"/>`;
    // Inner square
    const innerSize = markerSize * 0.4;
    const innerOffset = (markerSize - innerSize) / 2;
    svg += `<rect x="${x + innerOffset}" y="${y + innerOffset}" width="${innerSize}" height="${innerSize}" fill="#000000"/>`;
  });

  // Data grid cells (avoid corners)
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // Skip corner marker areas
      const isTopLeft = x < 3 && y < 3;
      const isTopRight = x >= gridSize - 3 && y < 3;
      const isBottomLeft = x < 3 && y >= gridSize - 3;

      if (isTopLeft || isTopRight || isBottomLeft) {
        continue;
      }

      const color = grid[y][x];
      const cx = padding + x * cellSize + cellSize / 2;
      const cy = padding + y * cellSize + cellSize / 2;
      const radius = cellSize * 0.35;

      svg += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}"/>`;
    }
  }

  svg += '</svg>';

  return svg;
}

/**
 * Generate enhanced visual code as data URL
 */
export function generateEnhancedVisualCodeDataURL(
  url: string,
  options: VisualCodeOptions = {}
): string {
  const svg = generateEnhancedVisualCode(url, options);
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Download visual code as SVG file
 */
export function downloadVisualCode(
  data: string,
  filename: string = 'room-code.svg',
  options: VisualCodeOptions = {}
): void {
  const svg = generateEnhancedVisualCode(data, options);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
