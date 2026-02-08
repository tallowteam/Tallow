'use client';

import { useState, type FormEvent } from 'react';
import { useTeamStore } from '@/lib/stores/team-store';
import {
  createTeamAction,
  joinTeamAction,
  leaveTeamAction,
  updateMemberRoleAction,
  removeMemberAction,
  isValidTeamCode,
} from '@/lib/teams/team-actions';
import type { Team, TeamMember, TeamRole } from '@/lib/stores/team-store';
import styles from './TeamPanel.module.css';

interface TeamPanelProps {
  onClose?: () => void;
}

export function TeamPanel({ onClose }: TeamPanelProps) {
  const { activeTeam, members, error } = useTeamStore();
  const [view, setView] = useState<'main' | 'create' | 'join'>('main');

  if (view === 'create') {
    return <CreateTeamView onBack={() => setView('main')} />;
  }

  if (view === 'join') {
    return <JoinTeamView onBack={() => setView('main')} />;
  }

  if (activeTeam) {
    return <ActiveTeamView team={activeTeam} members={members} {...(onClose ? { onClose } : {})} />;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Team Workspace</h2>
        {onClose && (
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close team panel"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <div className={styles.emptyState}>
        <TeamIcon />
        <h3 className={styles.emptyTitle}>No Active Team</h3>
        <p className={styles.emptySubtitle}>
          Create a team or join an existing one to collaborate with others
        </p>

        <div className={styles.actions}>
          <button
            onClick={() => setView('create')}
            className={styles.primaryButton}
          >
            <PlusIcon />
            <span>Create Team</span>
          </button>
          <button
            onClick={() => setView('join')}
            className={styles.secondaryButton}
          >
            <JoinIcon />
            <span>Join Team</span>
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <ErrorIcon />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CREATE TEAM VIEW
// ============================================================================

function CreateTeamView({ onBack }: { onBack: () => void }) {
  const [teamName, setTeamName] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [allowGuests, setAllowGuests] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      return;
    }

    setIsCreating(true);

    try {
      const team = createTeamAction(teamName.trim());
      console.info('[TeamPanel] Team created:', team);
      onBack();
    } catch (error) {
      console.error('[TeamPanel] Failed to create team:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton} aria-label="Go back">
          <BackIcon />
        </button>
        <h2 className={styles.title}>Create Team</h2>
      </div>

      <form onSubmit={handleCreate} className={styles.form}>
        <div className={styles.formField}>
          <label htmlFor="team-name" className={styles.formLabel}>
            Team Name
          </label>
          <input
            id="team-name"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="My Team"
            className={styles.formInput}
            maxLength={50}
            required
            autoFocus
            disabled={isCreating}
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="max-members" className={styles.formLabel}>
            Maximum Members
          </label>
          <input
            id="max-members"
            type="number"
            value={maxMembers}
            onChange={(e) => setMaxMembers(parseInt(e.target.value, 10))}
            className={styles.formInput}
            min={2}
            max={100}
            disabled={isCreating}
          />
        </div>

        <div className={styles.checkboxField}>
          <input
            id="allow-guests"
            type="checkbox"
            checked={allowGuests}
            onChange={(e) => setAllowGuests(e.target.checked)}
            className={styles.checkbox}
            disabled={isCreating}
          />
          <label htmlFor="allow-guests" className={styles.checkboxLabel}>
            Allow guests to join without approval
          </label>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onBack}
            className={styles.secondaryButton}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isCreating || !teamName.trim()}
          >
            {isCreating ? (
              <>
                <Spinner />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <CheckIcon />
                <span>Create Team</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// JOIN TEAM VIEW
// ============================================================================

function JoinTeamView({ onBack }: { onBack: () => void }) {
  const { isJoining, error, setError } = useTeamStore();
  const [teamCode, setTeamCode] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setError(null);

    const code = teamCode.trim().toUpperCase();

    if (!code) {
      setValidationError('Team code is required');
      return;
    }

    if (!isValidTeamCode(code)) {
      setValidationError('Invalid team code format (8 characters)');
      return;
    }

    try {
      await joinTeamAction(code);
      onBack();
    } catch (error) {
      console.error('[TeamPanel] Failed to join team:', error);
      setValidationError(error instanceof Error ? error.message : 'Failed to join team');
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton} aria-label="Go back">
          <BackIcon />
        </button>
        <h2 className={styles.title}>Join Team</h2>
      </div>

      <form onSubmit={handleJoin} className={styles.form}>
        <div className={styles.formField}>
          <label htmlFor="team-code" className={styles.formLabel}>
            Team Code
          </label>
          <input
            id="team-code"
            type="text"
            value={teamCode}
            onChange={(e) => {
              setTeamCode(e.target.value.toUpperCase());
              setValidationError('');
            }}
            placeholder="ABCD1234"
            className={styles.formInput}
            maxLength={8}
            required
            autoFocus
            disabled={isJoining}
            style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
          />
          <p className={styles.formHint}>
            Enter the 8-character code shared by your team
          </p>
        </div>

        {(validationError || error) && (
          <div className={styles.error} role="alert">
            <ErrorIcon />
            <span>{validationError || error}</span>
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onBack}
            className={styles.secondaryButton}
            disabled={isJoining}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isJoining || !teamCode.trim()}
          >
            {isJoining ? (
              <>
                <Spinner />
                <span>Joining...</span>
              </>
            ) : (
              <>
                <JoinIcon />
                <span>Join Team</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// ACTIVE TEAM VIEW
// ============================================================================

interface ActiveTeamViewProps {
  team: Team;
  members: TeamMember[];
  onClose?: () => void;
}

function ActiveTeamView({ team, members, onClose }: ActiveTeamViewProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { canManageMembers, canUpdateSettings } = useTeamStore();
  const isOwner = canUpdateSettings('current-user');
  const isAdmin = canManageMembers('current-user');

  const handleLeave = () => {
    if (confirm('Are you sure you want to leave this team?')) {
      leaveTeamAction();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(team.code);
    // TODO: Show toast notification
  };

  const onlineMembers = members.filter((m) => m.online);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>{team.name}</h2>
          <div className={styles.teamCode} onClick={handleCopyCode}>
            <span>Code: {team.code}</span>
            <CopyIcon />
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close team panel"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <div className={styles.content}>
        {/* Team Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{members.length}</span>
            <span className={styles.statLabel}>Members</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{onlineMembers.length}</span>
            <span className={styles.statLabel}>Online</span>
          </div>
        </div>

        {/* Members List */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Team Members</h3>
          <div className={styles.membersList}>
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                canManage={isAdmin && member.id !== 'current-user'}
                isCurrentUser={member.id === 'current-user'}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.teamActions}>
          {isOwner && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={styles.secondaryButton}
            >
              <SettingsIcon />
              <span>Settings</span>
            </button>
          )}
          <button onClick={handleLeave} className={styles.dangerButton}>
            <LeaveIcon />
            <span>Leave Team</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MEMBER CARD
// ============================================================================

interface MemberCardProps {
  member: TeamMember;
  canManage: boolean;
  isCurrentUser: boolean;
}

function MemberCard({ member, canManage, isCurrentUser }: MemberCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleRoleChange = (newRole: TeamRole) => {
    try {
      updateMemberRoleAction(member.id, newRole);
      setShowActions(false);
    } catch (error) {
      console.error('[TeamPanel] Failed to update role:', error);
    }
  };

  const handleRemove = () => {
    if (confirm(`Remove ${member.name} from the team?`)) {
      try {
        removeMemberAction(member.id);
      } catch (error) {
        console.error('[TeamPanel] Failed to remove member:', error);
      }
    }
  };

  return (
    <div className={styles.memberCard}>
      <div className={styles.memberInfo}>
        <div className={styles.memberAvatar}>
          {member.avatar ? (
            <img src={member.avatar} alt="" width={32} height={32} loading="lazy" />
          ) : (
            <UserIcon />
          )}
          {member.online && <div className={styles.onlineIndicator} />}
        </div>
        <div className={styles.memberDetails}>
          <div className={styles.memberName}>
            {member.name}
            {isCurrentUser && <span className={styles.youBadge}>You</span>}
          </div>
          <div className={styles.memberRole}>{getRoleLabel(member.role)}</div>
        </div>
      </div>

      {canManage && (
        <div className={styles.memberActions}>
          <button
            onClick={() => setShowActions(!showActions)}
            className={styles.actionButton}
            aria-label="Member actions"
          >
            <MoreIcon />
          </button>

          {showActions && (
            <div className={styles.actionsMenu}>
              <button onClick={() => handleRoleChange('admin')}>
                Promote to Admin
              </button>
              <button onClick={() => handleRoleChange('member')}>
                Change to Member
              </button>
              <button onClick={() => handleRoleChange('viewer')}>
                Change to Viewer
              </button>
              <button onClick={handleRemove} className={styles.dangerAction}>
                Remove from Team
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

function getRoleLabel(role: TeamRole): string {
  const labels: Record<TeamRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    viewer: 'Viewer',
  };
  return labels[role];
}

// ============================================================================
// ICONS
// ============================================================================

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function JoinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
      <line x1="19.07" y1="19.07" x2="16.24" y2="16.24" />
      <line x1="7.76" y1="7.76" x2="4.93" y2="4.93" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M1 12h6m6 0h6M6.8 6.8l4.2 4.2m0 6l-4.2 4.2" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}
