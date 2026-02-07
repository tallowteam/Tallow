/**
 * Compliance Module
 *
 * GDPR and CCPA compliance verification and data management
 */

export { GDPRAudit, isGDPRCompliant, getComplianceScore } from './gdpr-audit';
export { CCPAAudit, isCCPACompliant, getPrivacyScore } from './ccpa-audit';
export {
  exportUserData,
  downloadUserData,
  eraseUserData,
  confirmAndEraseUserData,
  formatDataSize,
  getDataSummary,
  hasStoredData,
} from './data-export';

export type { AuditResult as GDPRAuditResult, GDPRComplianceReport, ComplianceStatus as GDPRComplianceStatus } from './gdpr-audit';
export type { AuditResult as CCPAAuditResult, CCPAComplianceReport, ComplianceStatus as CCPAComplianceStatus } from './ccpa-audit';
export type { UserDataExport } from './data-export';
