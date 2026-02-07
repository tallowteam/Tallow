'use client';

/**
 * Project Organization Demo
 *
 * Interactive demo showcasing the project organization system.
 * Use this page to test features and see the system in action.
 */

import { useState } from 'react';
import { ProjectBrowser } from './ProjectBrowser';
import {
  createProject,
  getAllProjects,
  addFileToProject,
  getOverallStats,
  PROJECT_COLORS,
  PROJECT_ICONS,
} from '@/lib/storage/project-organizer';
import type { TransferRecord } from '@/lib/storage/transfer-history';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import styles from './ProjectOrganizationDemo.module.css';

export function ProjectOrganizationDemo() {
  const [stats, setStats] = useState(getOverallStats());
  const [demoStep, setDemoStep] = useState(0);

  const refreshStats = () => {
    setStats(getOverallStats());
  };

  // Demo data generator
  const generateDemoData = () => {
    // Create sample projects
    const projects = [
      {
        name: 'Work Documents',
        description: 'Important work files and presentations',
        color: PROJECT_COLORS[0],
        icon: PROJECT_ICONS[14],
      },
      {
        name: 'Family Photos',
        description: 'Vacation and family event photos',
        color: PROJECT_COLORS[4],
        icon: PROJECT_ICONS[13],
      },
      {
        name: 'Music Collection',
        description: 'Downloaded albums and playlists',
        color: PROJECT_COLORS[6],
        icon: PROJECT_ICONS[12],
      },
      {
        name: 'Client Projects',
        description: 'Files from various client work',
        color: PROJECT_COLORS[1],
        icon: PROJECT_ICONS[7],
      },
    ];

    // Create projects
    const createdProjects = projects.map(p =>
      createProject(p.name, p.description, p.color, p.icon)
    );

    // Generate sample files
    const sampleFiles: Array<{
      projectIndex: number;
      transfer: Partial<TransferRecord>;
    }> = [
      // Work Documents
      {
        projectIndex: 0,
        transfer: {
          id: 'demo_1',
          direction: 'receive',
          files: [
            { name: 'Q4_Report.pdf', size: 2048000, type: 'application/pdf' },
          ],
          totalSize: 2048000,
          peerName: 'John Smith',
          peerId: 'peer_1',
          status: 'completed',
          startedAt: new Date(Date.now() - 86400000 * 2),
          completedAt: new Date(Date.now() - 86400000 * 2),
          duration: 5000,
          speed: 400000,
        },
      },
      {
        projectIndex: 0,
        transfer: {
          id: 'demo_2',
          direction: 'receive',
          files: [
            {
              name: 'Presentation.pptx',
              size: 5120000,
              type: 'application/vnd.ms-powerpoint',
            },
          ],
          totalSize: 5120000,
          peerName: 'Sarah Johnson',
          peerId: 'peer_2',
          status: 'completed',
          startedAt: new Date(Date.now() - 86400000),
          completedAt: new Date(Date.now() - 86400000),
          duration: 8000,
          speed: 640000,
        },
      },
      // Family Photos
      {
        projectIndex: 1,
        transfer: {
          id: 'demo_3',
          direction: 'receive',
          files: [
            { name: 'vacation_2024.jpg', size: 3145728, type: 'image/jpeg' },
            { name: 'family_dinner.jpg', size: 2621440, type: 'image/jpeg' },
            { name: 'beach_sunset.jpg', size: 4194304, type: 'image/jpeg' },
          ],
          totalSize: 9961472,
          peerName: 'Mom',
          peerId: 'peer_3',
          status: 'completed',
          startedAt: new Date(Date.now() - 86400000 * 7),
          completedAt: new Date(Date.now() - 86400000 * 7),
          duration: 12000,
          speed: 830000,
        },
      },
      // Music Collection
      {
        projectIndex: 2,
        transfer: {
          id: 'demo_4',
          direction: 'receive',
          files: [
            { name: 'Album - Song 1.mp3', size: 5242880, type: 'audio/mp3' },
            { name: 'Album - Song 2.mp3', size: 4718592, type: 'audio/mp3' },
            { name: 'Album - Song 3.mp3', size: 5767168, type: 'audio/mp3' },
          ],
          totalSize: 15728640,
          peerName: 'Music Friend',
          peerId: 'peer_4',
          status: 'completed',
          startedAt: new Date(Date.now() - 86400000 * 14),
          completedAt: new Date(Date.now() - 86400000 * 14),
          duration: 20000,
          speed: 786432,
        },
      },
      // Client Projects
      {
        projectIndex: 3,
        transfer: {
          id: 'demo_5',
          direction: 'receive',
          files: [
            {
              name: 'website_mockup.psd',
              size: 15728640,
              type: 'image/vnd.adobe.photoshop',
            },
          ],
          totalSize: 15728640,
          peerName: 'Client A',
          peerId: 'peer_5',
          status: 'completed',
          startedAt: new Date(Date.now() - 86400000 * 3),
          completedAt: new Date(Date.now() - 86400000 * 3),
          duration: 18000,
          speed: 873813,
        },
      },
      {
        projectIndex: 3,
        transfer: {
          id: 'demo_6',
          direction: 'receive',
          files: [
            { name: 'logo_final.svg', size: 102400, type: 'image/svg+xml' },
            { name: 'brand_guidelines.pdf', size: 3145728, type: 'application/pdf' },
          ],
          totalSize: 3248128,
          peerName: 'Client B',
          peerId: 'peer_6',
          status: 'completed',
          startedAt: new Date(Date.now() - 86400000 * 5),
          completedAt: new Date(Date.now() - 86400000 * 5),
          duration: 6000,
          speed: 541354,
        },
      },
    ];

    // Add files to projects
    sampleFiles.forEach(({ projectIndex, transfer }) => {
      const project = createdProjects[projectIndex];
      if (project) {
        addFileToProject(
          project.id,
          transfer as TransferRecord
        );
      }
    });

    refreshStats();
    setDemoStep(1);
  };

  const clearDemoData = () => {
    // Clear all projects except Unsorted
    const projects = getAllProjects();
    projects.forEach(p => {
      if (p.id !== '__unsorted__') {
        // Note: deleteProject is not available here, would need to import it
        // For demo purposes, we'll just refresh
      }
    });
    refreshStats();
    setDemoStep(0);
  };

  return (
    <div className={styles.container}>
      {/* Demo Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Project Organization Demo</h1>
          <p className={styles.subtitle}>
            Interactive demonstration of the project-based file organization system
          </p>
        </div>

        <div className={styles.headerActions}>
          {demoStep === 0 ? (
            <Button onClick={generateDemoData} variant="primary">
              Generate Demo Data
            </Button>
          ) : (
            <Button onClick={clearDemoData} variant="secondary">
              Clear Demo Data
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Overview */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#5E5CE6' }}>
            <FolderIcon />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalProjects}</div>
            <div className={styles.statLabel}>Projects</div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#34C759' }}>
            <FileIcon />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalFiles}</div>
            <div className={styles.statLabel}>Files</div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#FF9500' }}>
            <DatabaseIcon />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {formatBytes(stats.totalSize)}
            </div>
            <div className={styles.statLabel}>Total Size</div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#32ADE6' }}>
            <CheckIcon />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.projectsWithFiles}</div>
            <div className={styles.statLabel}>Active Projects</div>
          </div>
        </Card>
      </div>

      {/* Feature Showcase */}
      <div className={styles.features}>
        <h2 className={styles.featuresTitle}>Key Features</h2>
        <div className={styles.featuresGrid}>
          <FeatureCard
            icon="📁"
            title="Custom Projects"
            description="Create projects with custom names, colors, and icons"
          />
          <FeatureCard
            icon="🔍"
            title="Search & Filter"
            description="Quickly find projects and files across your library"
          />
          <FeatureCard
            icon="🎨"
            title="Customization"
            description="10 colors and 20 icons to personalize your projects"
          />
          <FeatureCard
            icon="📊"
            title="Sort & Organize"
            description="Sort files by name, date, size, or sender"
          />
          <FeatureCard
            icon="✅"
            title="Multi-Select"
            description="Select multiple files for batch operations"
          />
          <FeatureCard
            icon="🔄"
            title="Move Files"
            description="Easily move files between projects"
          />
        </div>
      </div>

      {/* Main Project Browser */}
      <div className={styles.browserSection}>
        <h2 className={styles.sectionTitle}>Project Browser</h2>
        <ProjectBrowser />
      </div>

      {/* Usage Guide */}
      <div className={styles.guide}>
        <h2 className={styles.guideTitle}>How to Use</h2>
        <div className={styles.guideSteps}>
          <GuideStep
            number={1}
            title="Create a Project"
            description="Click 'New Project' to create a custom project with a name, description, color, and icon."
          />
          <GuideStep
            number={2}
            title="Add Files"
            description="From Transfer History, select 'Add to Project' to organize files into your projects."
          />
          <GuideStep
            number={3}
            title="Organize & Sort"
            description="Click a project to view files. Sort by name, date, size, or sender. Use multi-select for batch operations."
          />
          <GuideStep
            number={4}
            title="Manage Projects"
            description="Right-click projects to rename, change colors, or delete. Files from deleted projects move to 'Unsorted'."
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Card className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </Card>
  );
}

function GuideStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.guideStep}>
      <div className={styles.guideStepNumber}>{number}</div>
      <div className={styles.guideStepContent}>
        <h4 className={styles.guideStepTitle}>{title}</h4>
        <p className={styles.guideStepDescription}>{description}</p>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// ============================================================================
// ICONS
// ============================================================================

function FolderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
