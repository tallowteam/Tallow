/**
 * Storage Configuration Validation
 * Validates S3 and storage configuration at startup
 */

import { secureLog } from '../utils/secure-logger';

export interface StorageConfig {
  provider: 's3' | 'localStorage';
  isConfigured: boolean;
  region?: string;
  bucket?: string;
  warnings: string[];
  errors: string[];
}

/**
 * Validate S3 configuration
 */
export function validateStorageConfig(): StorageConfig {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check if running in server environment
  const isServer = typeof window === 'undefined';

  // Get environment variables
  const awsAccessKeyId = process.env['AWS_ACCESS_KEY_ID'];
  const awsSecretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];
  const awsRegion = process.env['AWS_REGION'];
  const awsS3Bucket = process.env['AWS_S3_BUCKET'];

  // Check S3 configuration
  const hasS3Config = !!(awsAccessKeyId && awsSecretAccessKey && awsS3Bucket);

  if (!isServer) {
    // Client-side: always use localStorage
    return {
      provider: 'localStorage',
      isConfigured: true,
      warnings: [],
      errors: [],
    };
  }

  if (!hasS3Config) {
    // S3 not configured
    warnings.push('S3 storage is not configured. Using localStorage fallback.');
    warnings.push('This is only suitable for development. Production deployments MUST use S3.');

    if (!awsAccessKeyId) {warnings.push('Missing AWS_ACCESS_KEY_ID');}
    if (!awsSecretAccessKey) {warnings.push('Missing AWS_SECRET_ACCESS_KEY');}
    if (!awsS3Bucket) {warnings.push('Missing AWS_S3_BUCKET');}

    return {
      provider: 'localStorage',
      isConfigured: false,
      warnings,
      errors,
    };
  }

  // S3 is configured
  const config: StorageConfig = {
    provider: 's3',
    isConfigured: true,
    region: awsRegion || 'us-east-1',
    bucket: awsS3Bucket,
    warnings,
    errors,
  };

  // Validate region
  if (!awsRegion) {
    warnings.push('AWS_REGION not set. Defaulting to us-east-1');
  }

  // Validate bucket name format
  if (awsS3Bucket) {
    const bucketNameRegex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;
    if (!bucketNameRegex.test(awsS3Bucket)) {
      errors.push('Invalid S3 bucket name format');
    }
  }

  // Production environment checks
  if (process.env['NODE_ENV'] === 'production') {
    if (!hasS3Config) {
      errors.push('S3 storage MUST be configured in production');
    }

    // Verify HTTPS in production
    const appUrl = process.env['NEXT_PUBLIC_APP_URL'];
    if (appUrl && !appUrl.startsWith('https://')) {
      warnings.push('Production should use HTTPS for secure file transfers');
    }
  }

  return config;
}

/**
 * Log storage configuration status
 */
export function logStorageConfig(): void {
  const config = validateStorageConfig();

  secureLog.log('[StorageConfig] Storage provider:', config.provider);

  if (config.provider === 's3') {
    secureLog.log('[StorageConfig] S3 Region:', config.region);
    secureLog.log('[StorageConfig] S3 Bucket:', config.bucket);
  }

  // Log warnings
  if (config.warnings.length > 0) {
    config.warnings.forEach(warning => {
      secureLog.warn('[StorageConfig]', warning);
    });
  }

  // Log errors
  if (config.errors.length > 0) {
    config.errors.forEach(error => {
      secureLog.error('[StorageConfig]', error);
    });
  }

  // Overall status
  if (config.isConfigured && config.errors.length === 0) {
    secureLog.log('[StorageConfig] Storage configuration is valid');
  } else if (config.errors.length > 0) {
    secureLog.error('[StorageConfig] Storage configuration has errors');
  } else {
    secureLog.warn('[StorageConfig] Storage is using fallback configuration');
  }
}

/**
 * Check if S3 is available
 */
export function isS3Available(): boolean {
  const config = validateStorageConfig();
  return config.provider === 's3' && config.isConfigured && config.errors.length === 0;
}

/**
 * Get storage recommendations for current environment
 */
export function getStorageRecommendations(): string[] {
  const recommendations: string[] = [];
  const config = validateStorageConfig();

  if (!config.isConfigured && process.env['NODE_ENV'] === 'production') {
    recommendations.push('Configure S3 storage for production deployments');
    recommendations.push('Create an S3 bucket in AWS console');
    recommendations.push('Create IAM user with S3 permissions: PutObject, GetObject, DeleteObject, ListBucket');
    recommendations.push('Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET environment variables');
  }

  if (config.provider === 's3') {
    recommendations.push('Enable S3 bucket versioning for data protection');
    recommendations.push('Configure S3 lifecycle rules to auto-delete old files after 30 days');
    recommendations.push('Enable S3 server access logging for audit trails');
    recommendations.push('Consider enabling S3 bucket encryption at rest');
  }

  if (config.provider === 'localStorage') {
    recommendations.push('localStorage is only suitable for development');
    recommendations.push('Files are stored in browser storage and not persistent across sessions');
    recommendations.push('Configure S3 for production deployments');
  }

  return recommendations;
}

/**
 * Graceful fallback handler
 */
export function handleStorageFallback(error: Error, operation: string): void {
  secureLog.error(`[StorageConfig] ${operation} failed:`, error);

  const config = validateStorageConfig();

  if (config.provider === 's3') {
    secureLog.warn('[StorageConfig] S3 operation failed. Consider checking:');
    secureLog.warn('- AWS credentials are valid and not expired');
    secureLog.warn('- S3 bucket exists and is accessible');
    secureLog.warn('- IAM user has required permissions');
    secureLog.warn('- Network connectivity to AWS');
    secureLog.warn('- AWS region is correct');
  }

  if (process.env['NODE_ENV'] === 'production') {
    secureLog.error('[StorageConfig] Storage failure in production environment');
  } else {
    secureLog.warn('[StorageConfig] Falling back to localStorage (development only)');
  }
}

export default {
  validateStorageConfig,
  logStorageConfig,
  isS3Available,
  getStorageRecommendations,
  handleStorageFallback,
};
