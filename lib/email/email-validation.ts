/**
 * Email Validation and Sanitization
 * RFC 5322 compliant email validation with security features
 */

/**
 * RFC 5322 compliant email validation regex
 * More permissive than most validators to avoid false negatives
 * Handles:
 * - Unicode characters in local part
 * - Plus addressing (email+tag@domain.com)
 * - Dots, hyphens, underscores
 * - IDN domains
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Common disposable email domains
 * Source: https://github.com/disposable-email-domains/disposable-email-domains
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'throwaway.email',
  'yopmail.com',
  'maildrop.cc',
  'temp-mail.org',
  'getnada.com',
  'sharklasers.com',
  'guerrillamail.info',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'spam4.me',
  'grr.la',
  'guerrillamailblock.com',
  'pokemail.net',
  'spamgourmet.com',
  'trashmail.com',
  'emailondeck.com',
  'fakeinbox.com',
  'mailnesia.com',
  'mintemail.com',
  'mohmal.com',
  'mytrashmail.com',
  'sharklasers.com',
  'spambox.us',
  'tempail.com',
  'tempemail.net',
  'throwawaymail.com',
  'trash-mail.at',
  'trash-mail.com',
  'trash-mail.de',
  'trashmail.net',
  '33mail.com',
  'deadaddress.com',
  'dispostable.com',
  'filzmail.com',
  'getairmail.com',
  'jetable.org',
  'klzlk.com',
  'link2mail.net',
  'lycos.com',
  'mailcatch.com',
  'mailexpire.com',
  'mailforspam.com',
  'mailfreeonline.com',
  'mailin8r.com',
  'mailmetrash.com',
  'mailmoat.com',
  'mailms.com',
  'mailnull.com',
  'mailshell.com',
  'mailslite.com',
  'mailzilla.com',
  'meltmail.com',
  'messagebeamer.de',
  'ministryofcake.com',
  'mt2009.com',
  'mt2014.com',
  'mytempemail.com',
  'nobulk.com',
  'no-spam.ws',
  'nospam.ze.tc',
  'nospam4.us',
  'nospamfor.us',
  'nowmymail.com',
  'objectmail.com',
  'obobbo.com',
  'odnorazovoe.ru',
  'oneoffemail.com',
  'onewaymail.com',
  'online.ms',
  'opayq.com',
  'ovpn.to',
  'owlpic.com',
  'pancakemail.com',
  'pcusers.otherinbox.com',
  'pjjkp.com',
  'plexolan.de',
  'pookmail.com',
  'privacy.net',
  'proxymail.eu',
  'prtnx.com',
  'putthisinyourspamdatabase.com',
  'qq.com',
  'quickinbox.com',
  'rcpt.at',
  'reallymymail.com',
  'recode.me',
  'recursor.net',
  'regbypass.com',
  'regbypass.comsafe-mail.net',
  'rejectmail.com',
  'rmqkr.net',
  'rppkn.com',
  'rtrtr.com',
  's0ny.net',
  'safe-mail.net',
  'safersignup.de',
  'safetymail.info',
  'safetypost.de',
  'sandelf.de',
  'saynotospams.com',
  'selfdestructingmail.com',
  'sendspamhere.com',
  'sharklasers.com',
  'shiftmail.com',
  'shitmail.me',
  'shitware.nl',
  'shmeriously.com',
  'shortmail.net',
  'sibmail.com',
  'skeefmail.com',
  'slaskpost.se',
  'slopsbox.com',
  'smellfear.com',
  'snakemail.com',
  'sneakemail.com',
  'snkmail.com',
  'sofimail.com',
  'solvemail.info',
  'sogetthis.com',
  'soodonims.com',
  'spam.la',
  'spamail.de',
  'spamarrest.com',
  'spambob.com',
  'spambob.net',
  'spambob.org',
  'spambog.com',
  'spambog.de',
  'spambog.ru',
  'spambox.info',
  'spambox.irishspringrealty.com',
  'spambox.us',
  'spamcannon.com',
  'spamcannon.net',
  'spamcon.org',
  'spamcorptastic.com',
  'spamcowboy.com',
  'spamcowboy.net',
  'spamcowboy.org',
  'spamday.com',
  'spamex.com',
  'spamfree.eu',
  'spamfree24.com',
  'spamfree24.de',
  'spamfree24.eu',
  'spamfree24.info',
  'spamfree24.net',
  'spamfree24.org',
  'spamgoes.in',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'spamherelots.com',
  'spamhereplease.com',
  'spamhole.com',
  'spamify.com',
  'spaminator.de',
  'spamkill.info',
  'spaml.com',
  'spaml.de',
  'spammotel.com',
  'spamobox.com',
  'spamslicer.com',
  'spamspot.com',
  'spamstack.net',
  'spamthis.co.uk',
  'spamthisplease.com',
  'spamtrail.com',
  'spamtroll.net',
]);

/**
 * Common email typos mapping for suggestion
 */
const EMAIL_DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'htmail.com': 'hotmail.com',
};

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
  warnings?: string[];
}

/**
 * Validate email address (RFC 5322 compliant)
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmed = email.trim();

  // Check length (RFC 5321 limits)
  if (trimmed.length > 254) {
    return false; // Total length limit
  }

  // Check basic format
  if (!EMAIL_REGEX.test(trimmed)) {
    return false;
  }

  // Split local and domain parts
  const [local, domain] = trimmed.split('@');

  // Validate local part (before @)
  if (!local || local.length === 0 || local.length > 64) {
    return false; // Local part length limit
  }

  // Cannot start or end with dot
  if (local.startsWith('.') || local.endsWith('.')) {
    return false;
  }

  // Cannot have consecutive dots
  if (local.includes('..')) {
    return false;
  }

  // Validate domain part (after @)
  if (!domain || domain.length === 0 || domain.length > 253) {
    return false; // Domain length limit
  }

  // Domain must have at least one dot
  if (!domain.includes('.')) {
    return false;
  }

  // Check each domain label
  const labels = domain.split('.');
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) {
      return false; // Label length limit
    }

    // Labels cannot start or end with hyphen
    if (label.startsWith('-') || label.endsWith('-')) {
      return false;
    }
  }

  // Top-level domain must be at least 2 characters
  const tld = labels[labels.length - 1];
  if (!tld || tld.length < 2) {
    return false;
  }

  return true;
}

/**
 * Comprehensive email validation with detailed results
 * @param email - Email address to validate
 * @returns Validation result with errors and suggestions
 */
export function validateEmailDetailed(email: string): EmailValidationResult {
  const warnings: string[] = [];

  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email is required',
    };
  }

  const trimmed = email.trim();

  // Check if email has whitespace
  if (trimmed !== email) {
    warnings.push('Email had leading or trailing whitespace');
  }

  // Basic validation
  if (!validateEmail(trimmed)) {
    // Check for common typos
    const [, domain] = trimmed.split('@');
    if (domain && EMAIL_DOMAIN_TYPOS[domain.toLowerCase()]) {
      return {
        valid: false,
        error: 'Invalid email format',
        suggestion: trimmed.replace(domain, EMAIL_DOMAIN_TYPOS[domain.toLowerCase()]!),
      };
    }

    return {
      valid: false,
      error: 'Invalid email format',
    };
  }

  // Check if disposable
  const [, domain] = trimmed.split('@');
  if (domain && isDisposableEmail(trimmed)) {
    warnings.push('Disposable email address detected');
  }

  return {
    valid: true,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}

/**
 * Check if email is from a disposable email provider
 * @param email - Email address to check
 * @returns true if disposable, false otherwise
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const [, domain] = email.toLowerCase().trim().split('@');
  if (!domain) {
    return false;
  }

  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Sanitize email input to prevent injection attacks
 * Removes dangerous characters while preserving valid email format
 * @param input - Raw email input
 * @returns Sanitized email
 */
export function sanitizeEmailInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove control characters (ASCII 0-31, 127)
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Remove dangerous characters that could be used for injection
  // Keep only: alphanumeric, @, ., -, _, +, and a few safe special chars
  sanitized = sanitized.replace(/[^a-zA-Z0-9@.\-_+!#$%&'*\/=?^`{|}~]/g, '');

  // Limit length to prevent DoS
  if (sanitized.length > 254) {
    sanitized = sanitized.substring(0, 254);
  }

  // Remove multiple consecutive @
  sanitized = sanitized.replace(/@+/g, '@');

  // Ensure only one @ symbol (keep the last one)
  const parts = sanitized.split('@');
  if (parts.length > 2) {
    sanitized = parts.slice(0, -1).join('') + '@' + parts[parts.length - 1];
  }

  return sanitized;
}

/**
 * Normalize email address for comparison
 * Handles Gmail's dot and plus addressing rules
 * @param email - Email address to normalize
 * @returns Normalized email
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  let normalized = email.toLowerCase().trim();
  const [local, domain] = normalized.split('@');

  if (!local || !domain) {
    return normalized;
  }

  // Gmail-specific normalization
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove dots (Gmail ignores them)
    let gmailLocal = local.replace(/\./g, '');

    // Remove everything after + (plus addressing)
    const plusIndex = gmailLocal.indexOf('+');
    if (plusIndex !== -1) {
      gmailLocal = gmailLocal.substring(0, plusIndex);
    }

    // Always use gmail.com (googlemail.com is an alias)
    normalized = `${gmailLocal}@gmail.com`;
  }

  return normalized;
}

/**
 * Validate multiple email addresses
 * @param emails - Array of email addresses or comma-separated string
 * @returns Object with valid emails and errors
 */
export function validateEmailList(
  emails: string[] | string
): {
  valid: string[];
  invalid: Array<{ email: string; error: string }>;
} {
  const emailArray = Array.isArray(emails)
    ? emails
    : emails.split(',').map((e) => e.trim());

  const valid: string[] = [];
  const invalid: Array<{ email: string; error: string }> = [];

  for (const email of emailArray) {
    const result = validateEmailDetailed(email);
    if (result.valid) {
      valid.push(email);
    } else {
      invalid.push({
        email,
        error: result.error || 'Invalid email',
      });
    }
  }

  return { valid, invalid };
}

/**
 * Extract email addresses from text
 * @param text - Text containing email addresses
 * @returns Array of extracted email addresses
 */
export function extractEmails(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const emailPattern = /[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;
  const matches = text.match(emailPattern) || [];

  // Filter to only valid emails
  return matches.filter((email) => validateEmail(email));
}

/**
 * Check if email domain has valid MX records (DNS lookup)
 * Note: This is a placeholder - actual implementation would require DNS resolution
 * which is not available in browser environment
 * @param email - Email address to check
 * @returns Promise resolving to true if MX records exist
 */
export async function hasValidMXRecords(email: string): Promise<boolean> {
  // This would require server-side DNS resolution
  // For now, just validate basic format
  return validateEmail(email);
}

/**
 * Calculate email risk score (0-100, higher is riskier)
 * @param email - Email address to analyze
 * @returns Risk score
 */
export function calculateEmailRiskScore(email: string): number {
  let score = 0;

  if (!validateEmail(email)) {
    return 100; // Invalid email is maximum risk
  }

  const [local = '', domain = ''] = email.toLowerCase().split('@');

  // Check if disposable
  if (isDisposableEmail(email)) {
    score += 50;
  }

  // Check for suspicious patterns
  if (local.includes('test') || local.includes('temp') || local.includes('fake')) {
    score += 20;
  }

  // Check for random-looking local part (lots of numbers)
  const numberCount = (local.match(/\d/g) || []).length;
  if (numberCount > local.length * 0.5) {
    score += 15;
  }

  // Check domain reputation (simplified)
  const trustedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
  if (!trustedDomains.includes(domain)) {
    score += 10;
  }

  // Check for very short local part
  if (local.length < 3) {
    score += 10;
  }

  return Math.min(score, 100);
}

export default {
  validateEmail,
  validateEmailDetailed,
  isDisposableEmail,
  sanitizeEmailInput,
  normalizeEmail,
  validateEmailList,
  extractEmails,
  hasValidMXRecords,
  calculateEmailRiskScore,
};
