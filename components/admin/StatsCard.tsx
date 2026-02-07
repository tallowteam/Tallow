import { type ReactNode } from 'react';
import { ArrowUp, ArrowDown } from '@/components/icons';
import styles from './StatsCard.module.css';

export interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function StatsCard({ icon, label, value, trend, variant = 'default' }: StatsCardProps) {
  const getTrendColor = () => {
    if (!trend) {return undefined;}
    if (trend.direction === 'up') {
      return variant === 'error' ? 'negative' : 'positive';
    }
    return variant === 'error' ? 'positive' : 'negative';
  };

  const trendColor = getTrendColor();

  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>{icon}</div>
        {trend && (
          <div className={`${styles.trend} ${trendColor ? styles[trendColor] : ''}`}>
            {trend.direction === 'up' ? (
              <ArrowUp className={styles.trendIcon} />
            ) : (
              <ArrowDown className={styles.trendIcon} />
            )}
            <span className={styles.trendValue}>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.value}>{value}</div>
        <div className={styles.label}>{label}</div>
      </div>
    </div>
  );
}
