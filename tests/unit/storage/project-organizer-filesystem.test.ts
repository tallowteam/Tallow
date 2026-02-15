import { beforeEach, describe, expect, it } from 'vitest';
import {
  addFileToProject,
  createProject,
  getProjectDuplicateGroups,
  getProjectFiles,
  getProjectImageFiles,
  isImageProjectFile,
  sortProjectFiles,
  type ProjectFile,
} from '@/lib/storage/project-organizer';

function createTransfer(
  id: string,
  files: Array<{
    name: string;
    size: number;
    type: string;
    path?: string;
    hash?: string;
    thumbnail?: string;
  }>
) {
  return {
    id,
    peerId: 'peer-1',
    peerName: 'Silent Falcon',
    files,
  };
}

function makeProjectFile(overrides: Partial<ProjectFile>): ProjectFile {
  return {
    id: 'file-1',
    name: 'sample.txt',
    size: 100,
    type: 'text/plain',
    relativePath: 'docs/sample.txt',
    contentHash: 'hash-1',
    isDuplicate: false,
    thumbnail: null,
    addedAt: new Date('2026-02-13T00:00:00.000Z'),
    transferId: 'transfer-1',
    senderId: 'peer-1',
    senderName: 'Silent Falcon',
    ...overrides,
  };
}

describe('project-organizer filesystem controls', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('preserves folder structure from relative file paths', () => {
    const project = createProject('Filesystem');

    addFileToProject(project.id, createTransfer('transfer-path', [
      {
        name: 'photo.jpg',
        size: 1024,
        type: 'image/jpeg',
        path: 'photos/2026/trip/photo.jpg',
        hash: 'hash-photo',
      },
    ]));

    const files = getProjectFiles(project.id);
    expect(files).toHaveLength(1);
    expect(files[0]?.relativePath).toBe('photos/2026/trip/photo.jpg');
  });

  it('detects duplicates using content hash groups', () => {
    const project = createProject('Duplicates');

    addFileToProject(project.id, createTransfer('transfer-a', [
      {
        name: 'report-a.pdf',
        size: 2048,
        type: 'application/pdf',
        hash: 'same-content-hash',
      },
    ]));
    addFileToProject(project.id, createTransfer('transfer-b', [
      {
        name: 'report-b.pdf',
        size: 2048,
        type: 'application/pdf',
        hash: 'same-content-hash',
      },
    ]));

    const duplicateGroups = getProjectDuplicateGroups(project.id);
    expect(duplicateGroups).toHaveLength(1);
    expect(duplicateGroups[0]?.files).toHaveLength(2);

    const files = getProjectFiles(project.id);
    expect(files.some((file) => file.isDuplicate)).toBe(true);
  });

  it('sorts project files by supported fields', () => {
    const files: ProjectFile[] = [
      makeProjectFile({
        id: 'file-a',
        name: 'zeta.txt',
        size: 500,
        senderName: 'Zulu',
        relativePath: 'z/path.txt',
        addedAt: new Date('2026-02-13T02:00:00.000Z'),
      }),
      makeProjectFile({
        id: 'file-b',
        name: 'alpha.txt',
        size: 100,
        senderName: 'Alpha',
        relativePath: 'a/path.txt',
        addedAt: new Date('2026-02-13T01:00:00.000Z'),
      }),
    ];

    expect(sortProjectFiles(files, 'name', 'asc')[0]?.id).toBe('file-b');
    expect(sortProjectFiles(files, 'date', 'desc')[0]?.id).toBe('file-a');
    expect(sortProjectFiles(files, 'size', 'asc')[0]?.id).toBe('file-b');
    expect(sortProjectFiles(files, 'sender', 'asc')[0]?.id).toBe('file-b');
    expect(sortProjectFiles(files, 'path', 'asc')[0]?.id).toBe('file-b');
  });

  it('returns image-only collections for gallery views', () => {
    const project = createProject('Gallery');

    addFileToProject(project.id, createTransfer('transfer-gallery', [
      {
        name: 'capture.png',
        size: 1400,
        type: 'image/png',
        hash: 'hash-image',
        thumbnail: 'data:image/png;base64,AAA',
      },
      {
        name: 'notes.txt',
        size: 300,
        type: 'text/plain',
        hash: 'hash-text',
      },
    ]));

    const imageFiles = getProjectImageFiles(project.id);
    expect(imageFiles).toHaveLength(1);
    expect(imageFiles[0]?.name).toBe('capture.png');
    expect(isImageProjectFile(imageFiles[0]!)).toBe(true);
  });
});
