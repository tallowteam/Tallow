'use client';

import { useMemo, type JSX } from 'react';
import styles from './SimpleChart.module.css';

export type ChartType = 'line' | 'bar' | 'donut' | 'area';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface SimpleChartProps {
  data: ChartDataPoint[];
  type: ChartType;
  width?: number;
  height?: number;
  color?: string;
  showLabels?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  ariaLabel?: string;
}

export function SimpleChart({
  data,
  type,
  width = 400,
  height = 300,
  color = '#5e5ce6',
  showLabels = true,
  showGrid = true,
  animate = true,
  ariaLabel = 'Data visualization chart',
}: SimpleChartProps) {
  const chartContent = useMemo(() => {
    switch (type) {
      case 'line':
        return renderLineChart(data, width, height, color, showGrid, animate);
      case 'bar':
        return renderBarChart(data, width, height, color, showGrid, animate);
      case 'donut':
        return renderDonutChart(data, width, height, animate);
      case 'area':
        return renderAreaChart(data, width, height, color, showGrid, animate);
      default:
        return null;
    }
  }, [data, type, width, height, color, showGrid, animate]);

  return (
    <div className={styles.chartWrapper}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.chart}
        role="img"
        aria-label={ariaLabel}
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        <title>{ariaLabel}</title>
        <desc>{`Chart type ${type} with ${data.length} data point${data.length === 1 ? '' : 's'}.`}</desc>
        {chartContent}
      </svg>
      {showLabels && type !== 'donut' && (
        <div className={styles.labels}>
          {data.map((point, i) => (
            <div key={i} className={styles.label}>
              {point.label}
            </div>
          ))}
        </div>
      )}
      {showLabels && type === 'donut' && (
        <div className={styles.legend}>
          {data.map((point, i) => (
            <div key={i} className={styles.legendItem}>
              <div
                className={styles.legendColor}
                style={{ backgroundColor: point.color || getColorByIndex(i) }}
              />
              <span className={styles.legendLabel}>{point.label}</span>
              <span className={styles.legendValue}>{point.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CHART RENDERERS
// ============================================================================

function renderLineChart(
  data: ChartDataPoint[],
  width: number,
  height: number,
  color: string,
  showGrid: boolean,
  animate: boolean
): JSX.Element {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((point, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - (point.value / maxValue) * chartHeight;
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <g>
      {showGrid && renderGrid(width, height, padding)}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? styles.animatePath : undefined}
      />
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="4"
          fill={color}
          className={animate ? styles.animateDot : undefined}
          style={animate ? { animationDelay: `${i * 0.05}s` } : undefined}
          aria-label={`${data[i]?.label ?? `Point ${i + 1}`}: ${(data[i]?.value ?? 0).toFixed(2)}`}
        />
      ))}
    </g>
  );
}

function renderAreaChart(
  data: ChartDataPoint[],
  width: number,
  height: number,
  color: string,
  showGrid: boolean,
  animate: boolean
): JSX.Element {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((point, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - (point.value / maxValue) * chartHeight;
    return { x, y };
  });

  const areaPath = [
    `M ${padding} ${padding + chartHeight}`,
    ...points.map((p) => `L ${p.x} ${p.y}`),
    `L ${padding + chartWidth} ${padding + chartHeight}`,
    'Z',
  ].join(' ');

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <g>
      {showGrid && renderGrid(width, height, padding)}
      <path
        d={areaPath}
        fill={color}
        fillOpacity="0.2"
        className={animate ? styles.animatePath : undefined}
      />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? styles.animatePath : undefined}
      />
    </g>
  );
}

function renderBarChart(
  data: ChartDataPoint[],
  width: number,
  height: number,
  color: string,
  showGrid: boolean,
  animate: boolean
): JSX.Element {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = chartWidth / data.length * 0.8;
  const barGap = chartWidth / data.length * 0.2;

  return (
    <g>
      {showGrid && renderGrid(width, height, padding)}
      {data.map((point, i) => {
        const barHeight = (point.value / maxValue) * chartHeight;
        const x = padding + i * (barWidth + barGap) + barGap / 2;
        const y = padding + chartHeight - barHeight;

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={point.color || color}
            rx="4"
            className={animate ? styles.animateBar : undefined}
            style={animate ? { animationDelay: `${i * 0.05}s` } : undefined}
            aria-label={`${point.label}: ${point.value.toFixed(2)}`}
          />
        );
      })}
    </g>
  );
}

function renderDonutChart(
  data: ChartDataPoint[],
  width: number,
  height: number,
  animate: boolean
): JSX.Element {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  const innerRadius = radius * 0.6;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -Math.PI / 2; // Start at top

  return (
    <g>
      {data.map((point, i) => {
        const percentage = point.value / total;
        const angle = percentage * 2 * Math.PI;
        const endAngle = currentAngle + angle;

        const path = describeArc(centerX, centerY, radius, innerRadius, currentAngle, endAngle);
        const color = point.color || getColorByIndex(i);

        currentAngle = endAngle;

        return (
          <path
            key={i}
            d={path}
            fill={color}
            className={animate ? styles.animateDonut : undefined}
            style={animate ? { animationDelay: `${i * 0.1}s` } : undefined}
            aria-label={`${point.label}: ${point.value.toFixed(2)} percent`}
          />
        );
      })}
      <circle cx={centerX} cy={centerY} r={innerRadius} fill="var(--bg-elevated)" />
    </g>
  );
}

function renderGrid(width: number, height: number, padding: number): JSX.Element {
  const gridLines = 5;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  return (
    <g className={styles.grid}>
      {Array.from({ length: gridLines }).map((_, i) => {
        const y = padding + (i / (gridLines - 1)) * chartHeight;
        return (
          <line
            key={`h-${i}`}
            x1={padding}
            y1={y}
            x2={padding + chartWidth}
            y2={y}
            stroke="var(--border-default)"
            strokeOpacity="0.3"
            strokeDasharray="4 4"
          />
        );
      })}
      {Array.from({ length: gridLines }).map((_, i) => {
        const x = padding + (i / (gridLines - 1)) * chartWidth;
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1={padding}
            x2={x}
            y2={padding + chartHeight}
            stroke="var(--border-default)"
            strokeOpacity="0.3"
            strokeDasharray="4 4"
          />
        );
      })}
    </g>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function describeArc(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(centerX, centerY, outerRadius, endAngle);
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';

  return [
    'M',
    outerStart.x,
    outerStart.y,
    'A',
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    0,
    outerEnd.x,
    outerEnd.y,
    'L',
    innerEnd.x,
    innerEnd.y,
    'A',
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    1,
    innerStart.x,
    innerStart.y,
    'Z',
  ].join(' ');
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInRadians: number
): { x: number; y: number } {
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function getColorByIndex(index: number): string {
  const colors = COLOR_BLIND_SAFE_PALETTE;
  return colors[index % colors.length] ?? '#22c55e';
}

export const COLOR_BLIND_SAFE_PALETTE = [
  '#0072B2',
  '#E69F00',
  '#009E73',
  '#D55E00',
  '#CC79A7',
  '#56B4E9',
  '#F0E442',
  '#999999',
] as const;
