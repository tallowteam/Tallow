'use client';

import { useMemo } from 'react';
import styles from './TransferRateGraph.module.css';

export interface TransferRateGraphProps {
  /** Array of speed samples (in bytes per second) - last 30 samples */
  speeds: number[];
  /** Current transfer speed in bytes per second */
  currentSpeed: number;
}

export function TransferRateGraph({ speeds, currentSpeed }: TransferRateGraphProps) {
  // Convert bytes to MB for display
  const formatSpeed = (bytesPerSecond: number): string => {
    const mbps = bytesPerSecond / (1024 * 1024);
    if (mbps < 0.1) {
      const kbps = bytesPerSecond / 1024;
      return `${kbps.toFixed(1)} KB/s`;
    }
    return `${mbps.toFixed(1)} MB/s`;
  };

  // Calculate chart dimensions and data points
  const { points, gridLines } = useMemo(() => {
    if (speeds.length === 0) {
      return { points: '', maxSpeed: 0, gridLines: [] };
    }

    // Chart dimensions (viewBox)
    const width = 200;
    const height = 80;
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find max speed for scaling (convert to MB/s)
    const speedsInMB = speeds.map((s) => s / (1024 * 1024));
    const max = Math.max(...speedsInMB, 0.1); // Minimum 0.1 MB/s
    const maxSpeed = Math.ceil(max * 1.2); // Add 20% headroom

    // Generate SVG path points
    const step = chartWidth / Math.max(speeds.length - 1, 1);
    const pathPoints = speeds
      .map((speed, index) => {
        const speedMB = speed / (1024 * 1024);
        const x = padding.left + index * step;
        const y = padding.top + chartHeight - (speedMB / maxSpeed) * chartHeight;
        return `${x},${y}`;
      })
      .join(' ');

    // Create grid lines (3 horizontal lines)
    const gridLines = [0, 0.5, 1].map((ratio) => {
      const y = padding.top + chartHeight * (1 - ratio);
      const value = maxSpeed * ratio;
      return { y, value };
    });

    return { points: pathPoints, maxSpeed, gridLines };
  }, [speeds]);

  // Build SVG path for line chart
  const linePath = useMemo(() => {
    if (!points) {return '';}
    const pointArray = points.split(' ');
    if (pointArray.length === 0) {return '';}

    // Build smooth curve using line segments
    return `M ${pointArray.join(' L ')}`;
  }, [points]);

  // Build SVG path for gradient fill area
  const areaPath = useMemo(() => {
    if (!points) {return '';}
    const pointArray = points.split(' ');
    if (pointArray.length === 0) {return '';}

    const firstPoint = pointArray[0] ?? '';
    const lastPoint = pointArray[pointArray.length - 1] ?? '';
    const [firstX] = firstPoint.split(',');
    const [lastX] = lastPoint.split(',');

    // Create closed path for fill
    return `M ${firstPoint} L ${pointArray.slice(1).join(' L ')} L ${lastX},70 L ${firstX},70 Z`;
  }, [points]);

  if (speeds.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>Waiting for transfer data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>Transfer Rate</span>
        <span className={styles.currentSpeed}>{formatSpeed(currentSpeed)}</span>
      </div>
      <svg
        viewBox="0 0 200 80"
        className={styles.chart}
        role="img"
        aria-label={`Transfer rate graph showing current speed of ${formatSpeed(currentSpeed)}`}
      >
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" className={styles.gradientStart} />
            <stop offset="100%" className={styles.gradientEnd} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((line, index) => (
          <g key={index}>
            <line
              x1="10"
              y1={line.y}
              x2="190"
              y2={line.y}
              className={styles.gridLine}
              strokeDasharray="2,3"
            />
            <text
              x="12"
              y={line.y - 2}
              className={styles.gridLabel}
              fontSize="7"
            >
              {line.value.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          className={styles.area}
        />

        {/* Line chart */}
        <path
          d={linePath}
          fill="none"
          className={styles.line}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current point indicator */}
        {points && (
          <circle
            cx={points.split(' ').pop()?.split(',')[0] || 0}
            cy={points.split(' ').pop()?.split(',')[1] || 0}
            r="3"
            className={styles.currentPoint}
          />
        )}
      </svg>
    </div>
  );
}
