/**
 * Team Store - Zustand State Management
 *
 * Manages team/workspace modes for collaborative file sharing.
 * Supports team creation, member management, and shared folders.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TeamSettings {
  /** Maximum number of members allowed */
  maxMembers: number;
  /** Allow guests to join without approval */
  allowGuests: boolean;
  /** Auto-approve join requests */
  autoApprove: boolean;
  /** Shared folder paths accessible to team */
  sharedFolders: string[];
}

export interface Team {
  /** Unique team identifier */
  id: string;
  /** Team name */
  name: string;
  /** Team join code (8-char alphanumeric) */
  code: string;
  /** Creation timestamp */
  createdAt: number;
  /** Team owner ID */
  ownerId: string;
  /** Team settings */
  settings: TeamSettings;
}

export interface TeamMember {
  /** Unique member identifier */
  id: string;
  /** Member display name */
  name: string;
  /** Member role */
  role: TeamRole;
  /** Join timestamp */
  joinedAt: number;
  /** Online status */
  online: boolean;
  /** Avatar URL or data URI */
  avatar: string | null;
}

export interface SharedFile {
  /** Unique file identifier */
  id: string;
  /** Filename */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Contributor member ID */
  contributorId: string;
  /** Contributor name */
  contributorName: string;
  /** Upload timestamp */
  timestamp: number;
  /** File data URL (for preview/download) */
  dataUrl: string | null;
}

export interface TeamStoreState {
  // Team lists
  teams: Team[];
  activeTeam: Team | null;
  members: TeamMember[];
  sharedFiles: SharedFile[];

  // Loading states
  isLoading: boolean;
  isJoining: boolean;
  isCreating: boolean;

  // Error state
  error: string | null;

  // Actions - Team Management
  createTeam: (name: string, settings?: Partial<TeamSettings>) => Team;
  joinTeam: (code: string) => Promise<void>;
  leaveTeam: () => void;
  deleteTeam: (teamId: string) => void;
  setActiveTeam: (team: Team | null) => void;
  updateTeamSettings: (teamId: string, settings: Partial<TeamSettings>) => void;

  // Actions - Member Management
  addMember: (member: TeamMember) => void;
  removeMember: (memberId: string) => void;
  updateMemberRole: (memberId: string, role: TeamRole) => void;
  updateMemberOnlineStatus: (memberId: string, online: boolean) => void;
  clearMembers: () => void;

  // Actions - Shared Files
  addSharedFile: (file: SharedFile) => void;
  removeSharedFile: (fileId: string) => void;
  clearSharedFiles: () => void;

  // Actions - State Management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Selectors
  getTeamById: (id: string) => Team | undefined;
  getMemberById: (id: string) => TeamMember | undefined;
  getOnlineMembers: () => TeamMember[];
  getTeamOwner: () => TeamMember | undefined;
  canManageMembers: (memberId: string) => boolean;
  canUpdateSettings: (memberId: string) => boolean;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  maxMembers: 10,
  allowGuests: true,
  autoApprove: false,
  sharedFolders: [],
};

const initialState = {
  teams: [],
  activeTeam: null,
  members: [],
  sharedFiles: [],
  isLoading: false,
  isJoining: false,
  isCreating: false,
  error: null,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useTeamStore = create<TeamStoreState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          ...initialState,

          // Team Management
          createTeam: (name, settings = {}) => {
            const team: Team = {
              id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name,
              code: generateTeamCode(),
              createdAt: Date.now(),
              ownerId: 'current-user', // TODO: Replace with actual user ID
              settings: { ...DEFAULT_TEAM_SETTINGS, ...settings },
            };

            set((state) => ({
              teams: [...state.teams, team],
              activeTeam: team,
              members: [
                {
                  id: 'current-user',
                  name: 'You',
                  role: 'owner',
                  joinedAt: Date.now(),
                  online: true,
                  avatar: null,
                },
              ],
              sharedFiles: [],
            }));

            return team;
          },

          joinTeam: async (code) => {
            set({ isJoining: true, error: null });

            try {
              // Simulate network delay
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // In a real implementation, this would make an API call
              // For now, we'll check if team exists locally
              const team = get().teams.find((t) => t.code === code.toUpperCase());

              if (!team) {
                throw new Error('Invalid team code. Please check and try again.');
              }

              // Check if already a member
              const isMember = get().members.some((m) => m.id === 'current-user');
              if (isMember && get().activeTeam?.id === team.id) {
                throw new Error('You are already a member of this team.');
              }

              // Add current user as member
              const newMember: TeamMember = {
                id: 'current-user',
                name: 'You',
                role: 'member',
                joinedAt: Date.now(),
                online: true,
                avatar: null,
              };

              set({
                activeTeam: team,
                members: [newMember],
                sharedFiles: [],
                isJoining: false,
              });
            } catch (error) {
              set({
                error: error instanceof Error ? error.message : 'Failed to join team',
                isJoining: false,
              });
              throw error;
            }
          },

          leaveTeam: () => {
            set({
              activeTeam: null,
              members: [],
              sharedFiles: [],
              error: null,
            });
          },

          deleteTeam: (teamId) => {
            set((state) => ({
              teams: state.teams.filter((t) => t.id !== teamId),
              activeTeam: state.activeTeam?.id === teamId ? null : state.activeTeam,
              members: state.activeTeam?.id === teamId ? [] : state.members,
              sharedFiles: state.activeTeam?.id === teamId ? [] : state.sharedFiles,
            }));
          },

          setActiveTeam: (team) => {
            set({
              activeTeam: team,
              members: team ? get().members : [],
              sharedFiles: team ? get().sharedFiles : [],
            });
          },

          updateTeamSettings: (teamId, settings) => {
            set((state) => {
              const teamIndex = state.teams.findIndex((t) => t.id === teamId);
              if (teamIndex < 0) return state;

              const newTeams = [...state.teams];
              newTeams[teamIndex] = {
                ...newTeams[teamIndex],
                settings: { ...newTeams[teamIndex].settings, ...settings },
              };

              return {
                teams: newTeams,
                activeTeam:
                  state.activeTeam?.id === teamId
                    ? newTeams[teamIndex]
                    : state.activeTeam,
              };
            });
          },

          // Member Management
          addMember: (member) => {
            set((state) => {
              const exists = state.members.some((m) => m.id === member.id);
              if (exists) return state;

              return { members: [...state.members, member] };
            });
          },

          removeMember: (memberId) => {
            set((state) => ({
              members: state.members.filter((m) => m.id !== memberId),
            }));
          },

          updateMemberRole: (memberId, role) => {
            set((state) => ({
              members: state.members.map((m) =>
                m.id === memberId ? { ...m, role } : m
              ),
            }));
          },

          updateMemberOnlineStatus: (memberId, online) => {
            set((state) => ({
              members: state.members.map((m) =>
                m.id === memberId ? { ...m, online } : m
              ),
            }));
          },

          clearMembers: () => set({ members: [] }),

          // Shared Files
          addSharedFile: (file) => {
            set((state) => ({
              sharedFiles: [...state.sharedFiles, file],
            }));
          },

          removeSharedFile: (fileId) => {
            set((state) => ({
              sharedFiles: state.sharedFiles.filter((f) => f.id !== fileId),
            }));
          },

          clearSharedFiles: () => set({ sharedFiles: [] }),

          // State Management
          setLoading: (isLoading) => set({ isLoading }),
          setError: (error) => set({ error }),
          reset: () => set(initialState),

          // Selectors
          getTeamById: (id) => get().teams.find((t) => t.id === id),

          getMemberById: (id) => get().members.find((m) => m.id === id),

          getOnlineMembers: () => get().members.filter((m) => m.online),

          getTeamOwner: () =>
            get().members.find((m) => m.id === get().activeTeam?.ownerId),

          canManageMembers: (memberId) => {
            const member = get().getMemberById(memberId);
            return member?.role === 'owner' || member?.role === 'admin';
          },

          canUpdateSettings: (memberId) => {
            const member = get().getMemberById(memberId);
            return member?.role === 'owner';
          },
        }),
        {
          name: 'tallow-team-store',
          storage: createJSONStorage(() => safeStorage),
          partialize: (state) => ({
            teams: state.teams,
          }),
        }
      )
    ),
    { name: 'TeamStore' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectTeams = (state: TeamStoreState) => state.teams;
export const selectActiveTeam = (state: TeamStoreState) => state.activeTeam;
export const selectMembers = (state: TeamStoreState) => state.members;
export const selectSharedFiles = (state: TeamStoreState) => state.sharedFiles;
export const selectOnlineMembers = (state: TeamStoreState) =>
  state.members.filter((m) => m.online);
export const selectIsLoading = (state: TeamStoreState) => state.isLoading;
export const selectError = (state: TeamStoreState) => state.error;

/**
 * Non-hook accessor for useTeamStore.
 * Use this in callbacks / effects where you call .getState() so the React
 * compiler does not hoist it into a reactive subscription.
 */
export const teamStoreApi = useTeamStore;

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate a random 8-character alphanumeric team code
 */
function generateTeamCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0, O, I, 1)
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
