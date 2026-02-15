/**
 * Team Actions Module
 *
 * Plain TypeScript module (NOT a hook) for team store actions.
 * Uses teamStoreApi.getState() to avoid Turbopack infinite loops.
 *
 * CRITICAL: Never use useTeamStore() hooks in this file - only .getState()
 */

import { teamStoreApi, type Team, type TeamMember, type SharedFile } from '../stores/team-store';

// ============================================================================
// TEAM ACTIONS
// ============================================================================

/**
 * Create a new team
 * @param name Team name
 * @returns Created team object
 */
export function createTeamAction(name: string): Team {
  const store = teamStoreApi.getState();
  return store.createTeam(name);
}

/**
 * Join an existing team using a team code
 * @param code 8-character team code
 */
export async function joinTeamAction(code: string): Promise<void> {
  const store = teamStoreApi.getState();
  await store.joinTeam(code);
}

/**
 * Leave the current active team
 */
export function leaveTeamAction(): void {
  const store = teamStoreApi.getState();
  store.leaveTeam();
}

/**
 * Delete a team (owner only)
 * @param teamId Team identifier
 */
export function deleteTeamAction(teamId: string): void {
  const store = teamStoreApi.getState();
  store.deleteTeam(teamId);
}

// ============================================================================
// MEMBER ACTIONS
// ============================================================================

/**
 * Invite a member to the team
 * @param member Member details
 */
export function inviteMemberAction(member: TeamMember): void {
  const store = teamStoreApi.getState();
  store.addMember(member);
}

/**
 * Remove a member from the team
 * @param memberId Member identifier
 */
export function removeMemberAction(memberId: string): void {
  const store = teamStoreApi.getState();

  // Check permissions
  if (!store.canManageMembers('current-user')) {
    throw new Error('You do not have permission to remove members');
  }

  store.removeMember(memberId);
}

/**
 * Update a member's role
 * @param memberId Member identifier
 * @param role New role
 */
export function updateMemberRoleAction(memberId: string, role: TeamMember['role']): void {
  const store = teamStoreApi.getState();

  // Check permissions
  if (!store.canManageMembers('current-user')) {
    throw new Error('You do not have permission to change roles');
  }

  // Cannot change owner role
  const member = store.getMemberById(memberId);
  if (member?.role === 'owner') {
    throw new Error('Cannot change owner role');
  }

  store.updateMemberRole(memberId, role);
}

/**
 * Update team settings (owner only)
 * @param settings New settings
 */
export function updateTeamSettingsAction(settings: Partial<Team['settings']>): void {
  const store = teamStoreApi.getState();
  const activeTeam = store.activeTeam;

  if (!activeTeam) {
    throw new Error('No active team');
  }

  // Check permissions
  if (!store.canUpdateSettings('current-user')) {
    throw new Error('Only team owner can update settings');
  }

  store.updateTeamSettings(activeTeam.id, settings);
}

// ============================================================================
// SHARED FILES ACTIONS
// ============================================================================

/**
 * Add a file to the shared folder
 * @param file File to add
 */
export function addSharedFileAction(file: SharedFile): void {
  const store = teamStoreApi.getState();
  store.addSharedFile(file);

  // Broadcast to team members via DataChannel
  syncTeamState();
}

/**
 * Remove a file from the shared folder
 * @param fileId File identifier
 */
export function removeSharedFileAction(fileId: string): void {
  const store = teamStoreApi.getState();
  store.removeSharedFile(fileId);

  // Broadcast to team members
  syncTeamState();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a random 8-character alphanumeric team code
 * @returns Team code string
 */
export function generateTeamCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt((randomBytes[i] ?? 0) % chars.length);
  }
  return code;
}

/**
 * Sync team state to all members via DataChannel
 * Broadcasts current team state to connected peers
 */
export function syncTeamState(): void {
  const store = teamStoreApi.getState();
  const activeTeam = store.activeTeam;

  if (!activeTeam) {
    console.warn('[Team Actions] No active team to sync');
    return;
  }

  // Create state snapshot
  const stateSnapshot = {
    team: activeTeam,
    members: store.members,
    sharedFiles: store.sharedFiles,
    timestamp: Date.now(),
  };

  // TODO: Broadcast via WebRTC DataChannel to all connected team members
  // This would integrate with the existing P2P connection infrastructure
  console.info('[Team Actions] Broadcasting team state:', stateSnapshot);

  // Placeholder for actual implementation:
  // const connections = getActiveConnections();
  // connections.forEach(conn => {
  //   conn.send({
  //     type: 'team-state-sync',
  //     payload: stateSnapshot
  //   });
  // });
}

/**
 * Handle incoming team state sync from peers
 * @param stateSnapshot State snapshot from remote peer
 */
export function handleTeamStateSync(stateSnapshot: {
  team: Team;
  members: TeamMember[];
  sharedFiles: SharedFile[];
  timestamp: number;
}): void {
  const store = teamStoreApi.getState();

  // Validate snapshot
  if (!stateSnapshot.team || !stateSnapshot.members) {
    console.error('[Team Actions] Invalid state snapshot');
    return;
  }

  // Only accept updates for the active team
  if (store.activeTeam?.id !== stateSnapshot.team.id) {
    console.warn('[Team Actions] Received state for different team, ignoring');
    return;
  }

  // Update local state with remote changes
  store.setActiveTeam(stateSnapshot.team);

  // Merge members (keep local online status)
  const localMembers = store.members;
  stateSnapshot.members.forEach((remoteMember) => {
    const localMember = localMembers.find((m) => m.id === remoteMember.id);
    if (localMember) {
      // Update existing member
      store.updateMemberRole(remoteMember.id, remoteMember.role);
    } else {
      // Add new member
      store.addMember(remoteMember);
    }
  });

  // Update shared files
  store.clearSharedFiles();
  stateSnapshot.sharedFiles.forEach((file) => {
    store.addSharedFile(file);
  });

  console.info('[Team Actions] Team state synced from peer');
}

/**
 * Validate team code format
 * @param code Team code to validate
 * @returns True if valid
 */
export function isValidTeamCode(code: string): boolean {
  const codeRegex = /^[A-HJ-NP-Z2-9]{8}$/; // 8 chars, no ambiguous characters
  return codeRegex.test(code.toUpperCase());
}

/**
 * Format file size for display
 * @param bytes File size in bytes
 * @returns Formatted string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 B';}

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format timestamp for display
 * @param timestamp Unix timestamp
 * @returns Formatted time string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {return 'Just now';}
  if (diffMins < 60) {return `${diffMins}m ago`;}
  if (diffHours < 24) {return `${diffHours}h ago`;}
  if (diffDays < 7) {return `${diffDays}d ago`;}

  return date.toLocaleDateString();
}
