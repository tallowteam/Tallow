# Filesystem Agent Policy (AGENT 073)

## Objective
Enforce website/CLI filesystem behavior for received files: preserve folder structure, detect duplicates by content hash, provide image gallery browsing, and keep file views sortable by all supported fields.

## Required Controls
1. Folder structure preservation:
- Stored project files MUST persist a relative path field.
- Default path resolution MUST preserve sender-provided directory structure (no flattening).

2. Duplicate detection by content hash:
- Project files MUST store content-hash metadata when available.
- Duplicate grouping MUST be based on matching content-hash values, not filename alone.

3. Gallery view:
- Project file UI MUST include an image gallery mode for image file types.
- Gallery cards MUST expose path/size/date metadata and reuse duplicate indicators.

4. Sortability:
- File browsing MUST support sorting by name, date, size, sender, and path.

5. Release gate:
- `npm run verify:filesystem:agent` MUST pass in CI and release workflows.

## Evidence Anchors
- `lib/storage/project-organizer.ts`
- `components/transfer/ProjectFileList.tsx`
- `components/transfer/ProjectFileList.module.css`
- `tests/unit/storage/project-organizer-filesystem.test.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
