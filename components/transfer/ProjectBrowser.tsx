'use client';

import { useState, useEffect } from 'react';
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  searchProjects,
  getProjectStats,
  PROJECT_COLORS,
  PROJECT_ICONS,
  type ProjectFolder,
} from '@/lib/storage/project-organizer';
import { ProjectFileList } from './ProjectFileList';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDataSize } from '@/lib/storage/transfer-history';
import styles from './ProjectBrowser.module.css';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProjectBrowser() {
  const [projects, setProjects] = useState<ProjectFolder[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectFolder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    project: ProjectFolder;
  } | null>(null);
  const toast = useToast();

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) {return;}

    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const loadProjects = () => {
    const allProjects = getAllProjects();
    setProjects(allProjects);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchProjects(query);
      setProjects(results);
    } else {
      loadProjects();
    }
  };

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectClick = (project: ProjectFolder) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    loadProjects();
  };

  const handleContextMenu = (e: React.MouseEvent, project: ProjectFolder) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      project,
    });
  };

  const handleRenameProject = (project: ProjectFolder) => {
    const newName = prompt('Enter new project name:', project.name);
    if (newName && newName.trim() && newName !== project.name) {
      updateProject(project.id, { name: newName.trim() });
      loadProjects();
      toast?.success('Project renamed');
    }
    setContextMenu(null);
  };

  const handleChangeColor = (project: ProjectFolder) => {
    const currentIndex = PROJECT_COLORS.indexOf(project.color as any);
    const nextIndex = (currentIndex + 1) % PROJECT_COLORS.length;
    const nextColor = PROJECT_COLORS[nextIndex];
    if (nextColor) updateProject(project.id, { color: nextColor });
    loadProjects();
    setContextMenu(null);
  };

  const handleDeleteProject = (project: ProjectFolder) => {
    if (confirm(`Delete project "${project.name}"? Files will be moved to Unsorted.`)) {
      deleteProject(project.id);
      loadProjects();
      toast?.success('Project deleted');
    }
    setContextMenu(null);
  };

  // If a project is selected, show file list
  if (selectedProject) {
    return (
      <ProjectFileList
        project={selectedProject}
        onBack={handleBackToProjects}
        onProjectUpdate={loadProjects}
      />
    );
  }

  // Sort projects: Unsorted first, then by last updated
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.id === '__unsorted__') {return -1;}
    if (b.id === '__unsorted__') {return 1;}
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Projects</h2>
        <Button onClick={handleCreateProject} variant="primary" size="sm">
          <PlusIcon />
          New Project
        </Button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchIcon}>
          <SearchIcon />
        </div>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      <div className={styles.grid}>
        {sortedProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => handleProjectClick(project)}
            onContextMenu={(e) => handleContextMenu(e, project)}
          />
        ))}

        {sortedProjects.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FolderIcon />
            </div>
            <p>No projects found</p>
            <span>Create a project to organize your files</span>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={styles.contextMenuItem}
            onClick={() => handleRenameProject(contextMenu.project)}
          >
            <EditIcon />
            Rename
          </button>
          <button
            className={styles.contextMenuItem}
            onClick={() => handleChangeColor(contextMenu.project)}
          >
            <PaletteIcon />
            Change Color
          </button>
          {contextMenu.project.id !== '__unsorted__' && (
            <>
              <div className={styles.contextMenuDivider} />
              <button
                className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`}
                onClick={() => handleDeleteProject(contextMenu.project)}
              >
                <DeleteIcon />
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          loadProjects();
        }}
      />
    </div>
  );
}

// ============================================================================
// PROJECT CARD COMPONENT
// ============================================================================

interface ProjectCardProps {
  project: ProjectFolder;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function ProjectCard({ project, onClick, onContextMenu }: ProjectCardProps) {
  const stats = getProjectStats(project.id);
  const isUnsorted = project.id === '__unsorted__';

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {return 'Today';}
    if (days === 1) {return 'Yesterday';}
    if (days < 7) {return `${days} days ago`;}
    if (days < 30) {return `${Math.floor(days / 7)} weeks ago`;}
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`${styles.card} ${isUnsorted ? styles.cardUnsorted : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{ '--project-color': project.color } as React.CSSProperties}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>{project.icon}</div>
        {isUnsorted && <div className={styles.unsortedBadge}>Default</div>}
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{project.name}</h3>
        {project.description && (
          <p className={styles.cardDescription}>{project.description}</p>
        )}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.cardStats}>
          <span className={styles.cardFileCount}>
            {stats.fileCount} {stats.fileCount === 1 ? 'file' : 'files'}
          </span>
          {stats.totalSize > 0 && (
            <>
              <span className={styles.cardSeparator}>·</span>
              <span className={styles.cardSize}>{formatDataSize(stats.totalSize)}</span>
            </>
          )}
        </div>
        <div className={styles.cardUpdated}>
          {formatLastUpdated(project.updatedAt)}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CREATE PROJECT MODAL
// ============================================================================

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<(typeof PROJECT_COLORS)[number] | undefined>(PROJECT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState<(typeof PROJECT_ICONS)[number] | undefined>(PROJECT_ICONS[0]);
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast?.error('Project name is required');
      return;
    }

    createProject(name.trim(), description.trim() || undefined, selectedColor, selectedIcon);
    toast?.success('Project created');

    // Reset form
    setName('');
    setDescription('');
    setSelectedColor(PROJECT_COLORS[0]);
    setSelectedIcon(PROJECT_ICONS[0]);

    onSuccess();
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Create Project">
      <form onSubmit={handleSubmit} className={styles.createForm}>
        <div className={styles.formGroup}>
          <label htmlFor="project-name" className={styles.formLabel}>
            Project Name
          </label>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Client Work, Personal Photos"
            autoFocus
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="project-description" className={styles.formLabel}>
            Description (optional)
          </label>
          <textarea
            id="project-description"
            className={styles.formTextarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this project"
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Color</label>
          <div className={styles.colorPicker}>
            {PROJECT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`${styles.colorOption} ${
                  selectedColor === color ? styles.colorOptionActive : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Icon</label>
          <div className={styles.iconPicker}>
            {PROJECT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`${styles.iconOption} ${
                  selectedIcon === icon ? styles.iconOptionActive : ''
                }`}
                onClick={() => setSelectedIcon(icon)}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formActions}>
          <Button type="button" onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="13.5" cy="6.5" r=".5" />
      <circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" />
      <circle cx="6.5" cy="12.5" r=".5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
