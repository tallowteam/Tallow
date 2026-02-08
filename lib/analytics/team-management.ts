/**
 * Team Management - Admin Operations
 *
 * Manages team members, roles, and bulk license operations.
 * Plain module singleton pattern - safe for Turbopack.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: number;
  lastActive: number;
  transferCount: number;
  totalBytes: number;
  licenseKey: string | null;
}

export interface License {
  key: string;
  assignedTo: string | null;
  activatedAt: number | null;
  expiresAt: number | null;
  status: 'active' | 'expired' | 'revoked' | 'pending';
}

interface StoredTeamData {
  members: TeamMember[];
  licenses: License[];
  lastUpdated: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'tallow-team-management';
const LICENSE_VALIDITY_DAYS = 365;

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function loadTeamData(): StoredTeamData {
  if (typeof window === 'undefined') {
    return {
      members: [],
      licenses: [],
      lastUpdated: Date.now(),
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        members: [],
        licenses: [],
        lastUpdated: Date.now(),
      };
    }

    return JSON.parse(stored) as StoredTeamData;
  } catch (error) {
    console.error('[TeamManager] Failed to load team data:', error);
    return {
      members: [],
      licenses: [],
      lastUpdated: Date.now(),
    };
  }
}

function saveTeamData(data: StoredTeamData): void {
  if (typeof window === 'undefined') {return;}

  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[TeamManager] Failed to save team data:', error);
  }
}

// ============================================================================
// TEAM MANAGER SINGLETON
// ============================================================================

class TeamManagerClass {
  private data: StoredTeamData;

  constructor() {
    this.data = loadTeamData();
  }

  /**
   * Get all team members
   */
  getTeamMembers(): TeamMember[] {
    return [...this.data.members];
  }

  /**
   * Get a specific team member by ID
   */
  getTeamMember(id: string): TeamMember | undefined {
    return this.data.members.find((m) => m.id === id);
  }

  /**
   * Add a new team member
   */
  addTeamMember(
    name: string,
    email: string,
    role: 'admin' | 'member' | 'viewer' = 'member'
  ): TeamMember {
    const member: TeamMember = {
      id: this.generateId(),
      name,
      email,
      role,
      joinedAt: Date.now(),
      lastActive: Date.now(),
      transferCount: 0,
      totalBytes: 0,
      licenseKey: null,
    };

    this.data.members.push(member);
    saveTeamData(this.data);
    return member;
  }

  /**
   * Update team member role
   */
  updateMemberRole(id: string, role: 'admin' | 'member' | 'viewer'): void {
    const member = this.data.members.find((m) => m.id === id);
    if (member) {
      member.role = role;
      saveTeamData(this.data);
    }
  }

  /**
   * Remove a team member
   */
  removeTeamMember(id: string): void {
    const member = this.data.members.find((m) => m.id === id);
    if (member && member.licenseKey) {
      // Revoke license when removing member
      const license = this.data.licenses.find((l) => l.key === member.licenseKey);
      if (license) {
        license.status = 'revoked';
        license.assignedTo = null;
      }
    }

    this.data.members = this.data.members.filter((m) => m.id !== id);
    saveTeamData(this.data);
  }

  /**
   * Update member activity
   */
  updateMemberActivity(id: string, transferCount: number, bytes: number): void {
    const member = this.data.members.find((m) => m.id === id);
    if (member) {
      member.lastActive = Date.now();
      member.transferCount += transferCount;
      member.totalBytes += bytes;
      saveTeamData(this.data);
    }
  }

  /**
   * Generate bulk licenses
   */
  addBulkLicenses(count: number): License[] {
    const newLicenses: License[] = [];
    const expiresAt = Date.now() + LICENSE_VALIDITY_DAYS * 24 * 60 * 60 * 1000;

    for (let i = 0; i < count; i++) {
      const license: License = {
        key: this.generateLicenseKey(),
        assignedTo: null,
        activatedAt: null,
        expiresAt,
        status: 'pending',
      };
      newLicenses.push(license);
      this.data.licenses.push(license);
    }

    saveTeamData(this.data);
    return newLicenses;
  }

  /**
   * Assign license to team member
   */
  assignLicense(licenseKey: string, memberId: string): boolean {
    const license = this.data.licenses.find((l) => l.key === licenseKey);
    const member = this.data.members.find((m) => m.id === memberId);

    if (!license || !member) {
      return false;
    }

    if (license.status !== 'pending') {
      return false;
    }

    license.assignedTo = memberId;
    license.activatedAt = Date.now();
    license.status = 'active';
    member.licenseKey = licenseKey;

    saveTeamData(this.data);
    return true;
  }

  /**
   * Revoke a license
   */
  revokeLicense(licenseKey: string): boolean {
    const license = this.data.licenses.find((l) => l.key === licenseKey);
    if (!license) {
      return false;
    }

    license.status = 'revoked';
    if (license.assignedTo) {
      const member = this.data.members.find((m) => m.id === license.assignedTo);
      if (member) {
        member.licenseKey = null;
      }
    }
    license.assignedTo = null;

    saveTeamData(this.data);
    return true;
  }

  /**
   * Get all licenses
   */
  getLicenses(): License[] {
    return [...this.data.licenses];
  }

  /**
   * Get available (unassigned) licenses
   */
  getAvailableLicenses(): License[] {
    return this.data.licenses.filter((l) => l.status === 'pending' && !l.assignedTo);
  }

  /**
   * Get license statistics
   */
  getLicenseStats(): {
    total: number;
    active: number;
    pending: number;
    expired: number;
    revoked: number;
  } {
    const now = Date.now();

    // Update expired licenses
    this.data.licenses.forEach((license) => {
      if (
        license.status === 'active' &&
        license.expiresAt &&
        license.expiresAt < now
      ) {
        license.status = 'expired';
      }
    });
    saveTeamData(this.data);

    return {
      total: this.data.licenses.length,
      active: this.data.licenses.filter((l) => l.status === 'active').length,
      pending: this.data.licenses.filter((l) => l.status === 'pending').length,
      expired: this.data.licenses.filter((l) => l.status === 'expired').length,
      revoked: this.data.licenses.filter((l) => l.status === 'revoked').length,
    };
  }

  /**
   * Clear all team data (dangerous - use with caution)
   */
  clearAll(): void {
    this.data = {
      members: [],
      licenses: [],
      lastUpdated: Date.now(),
    };
    saveTeamData(this.data);
  }

  // Private helper methods

  private generateId(): string {
    const bytes = new Uint8Array(7);
    crypto.getRandomValues(bytes);
    const rand = Array.from(bytes).map(b => b.toString(36)).join('').substring(0, 7);
    return `tm_${Date.now()}_${rand}`;
  }

  private generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      const bytes = new Uint8Array(6);
      crypto.getRandomValues(bytes);
      segments.push(
        Array.from(bytes).map(b => b.toString(36)).join('').substring(0, 6).toUpperCase()
      );
    }
    return segments.join('-');
  }
}

// Export singleton instance
export const TeamManager = new TeamManagerClass();
