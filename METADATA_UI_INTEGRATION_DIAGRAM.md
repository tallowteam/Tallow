# Metadata Stripping UI Integration - Visual Diagram

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│ App Page (/app)                                                 │
│ File: app/app/page.tsx                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ Send Tab                                               │    │
│  │                                                        │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │ FileSelectorWithPrivacy ✓ NEW                │   │    │
│  │  │ Component: file-selector-with-privacy.tsx    │   │    │
│  │  ├──────────────────────────────────────────────┤   │    │
│  │  │                                                │   │    │
│  │  │ ┌────────────────────────────────────────┐  │   │    │
│  │  │ │ Privacy Toggle Card                     │  │   │    │
│  │  │ │ [Shield Icon] Strip metadata            │  │   │    │
│  │  │ │ [Toggle Switch] On/Off                  │  │   │    │
│  │  │ └────────────────────────────────────────┘  │   │    │
│  │  │                                                │   │    │
│  │  │ ┌────────────────────────────────────────┐  │   │    │
│  │  │ │ File Selector Tabs                      │  │   │    │
│  │  │ │ [ Files | Folder | Text ]              │  │   │    │
│  │  │ └────────────────────────────────────────┘  │   │    │
│  │  │                                                │   │    │
│  │  │ ┌────────────────────────────────────────┐  │   │    │
│  │  │ │ Selected Files List                     │  │   │    │
│  │  │ │ ┌────────────────────────────────────┐ │  │   │    │
│  │  │ │ │ photo.jpg              [Eye] [X]   │ │  │   │    │
│  │  │ │ │ [Camera Icon] [Stripped Badge]     │ │  │   │    │
│  │  │ │ └────────────────────────────────────┘ │  │   │    │
│  │  │ │ ┌────────────────────────────────────┐ │  │   │    │
│  │  │ │ │ video.mp4              [Eye] [X]   │ │  │   │    │
│  │  │ │ │ [Video Icon] [Metadata Badge]      │ │  │   │    │
│  │  │ │ └────────────────────────────────────┘ │  │   │    │
│  │  │ └────────────────────────────────────────┘  │   │    │
│  │  │                                                │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                                                        │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ Dialogs (Overlays)                                     │    │
│  │                                                        │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │ MetadataStripDialog                           │   │    │
│  │  │ ┌────────────────────────────────────────┐  │   │    │
│  │  │ │ Sensitive metadata detected!            │  │   │    │
│  │  │ │ photo.jpg contains:                     │  │   │    │
│  │  │ │ • GPS coordinates                        │  │   │    │
│  │  │ │ • Camera info                            │  │   │    │
│  │  │ │                                          │  │   │    │
│  │  │ │ [View Details]  [Strip]  [Keep]        │  │   │    │
│  │  │ └────────────────────────────────────────┘  │   │    │
│  │  │                 │                            │   │    │
│  │  │                 │ Click "View Details"       │   │    │
│  │  │                 ▼                            │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                                                        │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │ MetadataViewer ✓ NEW                         │   │    │
│  │  │ Component: metadata-viewer.tsx                │   │    │
│  │  │ ┌────────────────────────────────────────┐  │   │    │
│  │  │ │ File Metadata                           │  │   │    │
│  │  │ │ photo.jpg                               │  │   │    │
│  │  │ │                                          │  │   │    │
│  │  │ │ ⚠ Sensitive Metadata Detected           │  │   │    │
│  │  │ │                                          │  │   │    │
│  │  │ │ ┌─ Location Data ────────── SENSITIVE ┐ │  │   │    │
│  │  │ │ │ Latitude: 37.7749                    │ │  │   │    │
│  │  │ │ │ Longitude: -122.4194                 │ │  │   │    │
│  │  │ │ └──────────────────────────────────────┘ │  │   │    │
│  │  │ │                                          │  │   │    │
│  │  │ │ ┌─ Camera & Device ───── SENSITIVE ───┐ │  │   │    │
│  │  │ │ │ Make: Apple                          │ │  │   │    │
│  │  │ │ │ Model: iPhone 15 Pro                 │ │  │   │    │
│  │  │ │ └──────────────────────────────────────┘ │  │   │    │
│  │  │ │                                          │  │   │    │
│  │  │ │ [Close]  [Strip Metadata & Continue]   │  │   │    │
│  │  │ └────────────────────────────────────────┘  │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                                                        │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ Privacy Settings Page (/app/privacy-settings)                   │
│ File: app/app/privacy-settings/page.tsx                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ Privacy Check Status                                   │    │
│  │ [Eye Icon] Last checked: Just now                      │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ Privacy Level Selection                                │    │
│  │ [Shield Icon] Choose protection level                  │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ Connection Privacy Status                              │    │
│  │ [Globe Icon] Real-time status                          │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ PrivacySettingsPanel ✓ NEW                            │    │
│  │ Component: privacy-settings-panel.tsx                  │    │
│  ├───────────────────────────────────────────────────────┤    │
│  │                                                        │    │
│  │ ┌──────────────────────────────────────────────┐     │    │
│  │ │ Privacy Protection                            │     │    │
│  │ │ [Reset to Defaults]                          │     │    │
│  │ └──────────────────────────────────────────────┘     │    │
│  │                                                        │    │
│  │ ┌──────────────────────────────────────────────┐     │    │
│  │ │ Enable Metadata Stripping  [Active Badge]    │     │    │
│  │ │                                   [Toggle ON] │     │    │
│  │ └──────────────────────────────────────────────┘     │    │
│  │                                                        │    │
│  │ ┌──────────────────────────────────────────────┐     │    │
│  │ │ Metadata Stripping Options                    │     │    │
│  │ │ • Strip by default          [Toggle ON]      │     │    │
│  │ │ • Preserve orientation      [Toggle OFF]     │     │    │
│  │ │ • Show warnings            [Toggle ON]      │     │    │
│  │ └──────────────────────────────────────────────┘     │    │
│  │                                                        │    │
│  │ ┌──────────────────────────────────────────────┐     │    │
│  │ │ File Type Preferences                         │     │    │
│  │ │ [Image Icon] Strip from images  [Toggle ON]  │     │    │
│  │ │ [Video Icon] Strip from videos  [Toggle OFF] │     │    │
│  │ └──────────────────────────────────────────────┘     │    │
│  │                                                        │    │
│  │ ┌──────────────────────────────────────────────┐     │    │
│  │ │ Privacy Notifications                         │     │    │
│  │ │ • Alert on sensitive data   [Toggle ON]      │     │    │
│  │ │ • Require confirmation      [Toggle ON]      │     │    │
│  │ └──────────────────────────────────────────────┘     │    │
│  │                                                        │    │
│  │ ┌──────────────────────────────────────────────┐     │    │
│  │ │ Trusted Contacts  [0 Badge]                   │     │    │
│  │ │ No trusted contacts configured                │     │    │
│  │ └──────────────────────────────────────────────┘     │    │
│  │                                                        │    │
│  │ ┌──────────────────────────────────────────────┐     │    │
│  │ │ ℹ️ What gets removed?                          │     │    │
│  │ │ • GPS location and altitude                   │     │    │
│  │ │ • Camera make, model, lens                    │     │    │
│  │ │ • Date/time when taken                        │     │    │
│  │ │ • Software and editing history                │     │    │
│  │ │ • Author and copyright data                   │     │    │
│  │ └──────────────────────────────────────────────┘     │    │
│  │                                                        │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ Privacy Tips                                           │    │
│  │ Best practices and recommendations                     │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────┐
│ User Selects    │
│ File with EXIF  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ FileSelectorWithPrivacy         │
│ • Detects file type             │
│ • supportsMetadataStripping()   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Extract Metadata                │
│ lib/privacy/metadata-stripper   │
│ • extractMetadata(file)         │
└────────┬────────────────────────┘
         │
         ├──── No metadata ───────► Add to queue normally
         │
         ▼
┌─────────────────────────────────┐
│ Has Sensitive Metadata          │
│ Check Privacy Settings          │
└────────┬────────────────────────┘
         │
         ├──── Auto-strip enabled ─┐
         │                          │
         │                          ▼
         │              ┌──────────────────────┐
         │              │ Strip Metadata       │
         │              │ • stripMetadata()    │
         │              │ • Create new File    │
         │              └──────────┬───────────┘
         │                          │
         │                          ▼
         │              ┌──────────────────────┐
         │              │ Add to queue with    │
         │              │ "Stripped" badge     │
         │              └──────────────────────┘
         │
         ├──── Confirmation required ─┐
         │                             │
         │                             ▼
         │                ┌──────────────────────────┐
         │                │ MetadataStripDialog      │
         │                │ • Show warning           │
         │                │ • List sensitive data    │
         │                └──────────┬───────────────┘
         │                            │
         │                            ├── View Details
         │                            │
         │                            ▼
         │                ┌──────────────────────────┐
         │                │ MetadataViewer ✓ NEW    │
         │                │ • Show all metadata      │
         │                │ • Categorized sections   │
         │                │ • Sensitivity indicators │
         │                └──────────┬───────────────┘
         │                            │
         │                            │ User decides
         │                            │
         │                            ├── Strip ───┐
         │                            │            │
         │                            └── Keep ────┤
         │                                          │
         └── Manual mode ─────────────────────────┤
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │ Transfer Process │
                                          │ Files with badges│
                                          └──────────────────┘
```

## State Management Flow

```
┌────────────────────────────────────────────────────────────┐
│ App Component State (app/app/page.tsx)                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  selectedFiles: FileWithData[]                             │
│    ├─ file: File (original or stripped)                    │
│    ├─ metadata?: MetadataInfo                             │
│    └─ metadataStripped?: boolean                          │
│                                                            │
│  showMetadataDialog: boolean                               │
│    └─ Controls MetadataStripDialog visibility              │
│                                                            │
│  filesWithMetadata: Array<{name, metadata}>                │
│    └─ Files pending strip decision                         │
│                                                            │
│  showMetadataViewer: boolean ✓ NEW                        │
│    └─ Controls MetadataViewer dialog visibility            │
│                                                            │
│  selectedFileForViewer: File | null ✓ NEW                 │
│    └─ Current file in MetadataViewer                       │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ FileSelectorWithPrivacy State                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  stripMetadataEnabled: boolean                             │
│    └─ Toggle state from privacy settings                   │
│                                                            │
│  showMetadataViewer: boolean (local)                       │
│    └─ Controls inline viewer                               │
│                                                            │
│  showStripDialog: boolean                                  │
│    └─ Controls confirmation dialog                         │
│                                                            │
│  pendingFiles: FileWithData[]                              │
│    └─ Files awaiting strip confirmation                    │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ PrivacySettingsPanel State                                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  settings: PrivacySettings                                 │
│    ├─ stripMetadataEnabled: boolean                        │
│    ├─ stripMetadataByDefault: boolean                      │
│    ├─ preserveOrientation: boolean                        │
│    ├─ showMetadataWarnings: boolean                       │
│    ├─ stripFromImages: boolean                            │
│    ├─ stripFromVideos: boolean                            │
│    ├─ notifyOnSensitiveData: boolean                      │
│    ├─ requireConfirmationBeforeStrip: boolean             │
│    └─ trustedContacts: string[]                            │
│                                                            │
│  loading: boolean                                          │
│    └─ Settings load state                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Integration Points Map

```
┌──────────────────────────────────────────────────────────┐
│                    INTEGRATION POINTS                     │
└──────────────────────────────────────────────────────────┘

1. File Selection Integration
   app/app/page.tsx:2136
   ├─ Component: <FileSelectorWithPrivacy>
   ├─ Props: onFilesSelected, selectedFiles, etc.
   └─ Triggers: Metadata detection on file selection

2. Metadata Viewer Trigger
   app/app/page.tsx:2571-2577
   ├─ Handler: onViewMetadata in MetadataStripDialog
   ├─ Finds: File with metadata from selectedFiles
   └─ Opens: MetadataViewer dialog with file

3. Metadata Viewer Dialog
   app/app/page.tsx:2582-2591
   ├─ Component: <MetadataViewer>
   ├─ Props: file, isOpen, onClose, showStripButton
   └─ Displays: Full metadata details

4. Privacy Settings Panel
   app/app/privacy-settings/page.tsx:259
   ├─ Component: <PrivacySettingsPanel>
   ├─ Location: After Connection Privacy Status
   └─ Controls: Global metadata stripping config

5. Settings Storage
   lib/privacy/privacy-settings.ts
   ├─ Storage: IndexedDB via SecureStorage
   ├─ Functions: get/update/resetPrivacySettings
   └─ Sync: Real-time updates across components

6. Metadata Processing
   lib/privacy/metadata-stripper.ts
   ├─ Functions: extractMetadata, stripMetadata
   ├─ Support: Images (JPEG, PNG, WebP, HEIC)
   └─ Future: Videos (MP4, MOV)
```

## Component Communication

```
┌─────────────────┐
│ App Page        │
│ (Parent)        │
└────────┬────────┘
         │
         │ Props ↓
         │
         ├──────────────────────────────────┐
         │                                   │
┌────────▼──────────┐            ┌──────────▼─────────┐
│FileSelectorWith   │            │MetadataViewer      │
│Privacy            │            │                    │
│                   │            │                    │
│ Opens dialog ────────────────► │ Shows details      │
│                   │            │                    │
│ ↓ Metadata        │            │ ↑ File data        │
│   detected        │            │   from parent      │
└───────────────────┘            └────────────────────┘
         │
         │ Reads settings
         ▼
┌───────────────────┐
│Privacy Settings   │
│(IndexedDB)        │
└───────────────────┘


┌─────────────────┐
│Privacy Settings │
│Page             │
└────────┬────────┘
         │
         │ Contains
         ▼
┌───────────────────┐
│PrivacySettings    │
│Panel              │
│                   │
│ ↕ Updates         │
│                   │
└────────┬──────────┘
         │
         │ Writes settings
         ▼
┌───────────────────┐
│Privacy Settings   │
│(IndexedDB)        │
└───────────────────┘
```

## File Structure

```
Tallow/
├── app/
│   ├── app/
│   │   ├── page.tsx ✓ MODIFIED
│   │   │   └── Lines: 43, 71, 161-162, 2136, 2571-2577, 2582-2591
│   │   └── privacy-settings/
│   │       └── page.tsx ✓ MODIFIED
│   │           └── Lines: 13, 259
│   └── api/
│       └── email/
│           └── download/
│               └── [id]/
│                   └── route.ts ✓ FIXED
│                       └── Line: 77 (TypeScript error)
│
├── components/
│   ├── privacy/
│   │   ├── metadata-viewer.tsx ✓ USED
│   │   ├── privacy-settings-panel.tsx ✓ USED
│   │   └── metadata-strip-dialog.tsx (existing)
│   └── transfer/
│       └── file-selector-with-privacy.tsx ✓ USED
│
├── lib/
│   └── privacy/
│       ├── metadata-stripper.ts (core logic)
│       └── privacy-settings.ts (settings mgmt)
│
└── docs/
    ├── METADATA_STRIPPING_UI_INTEGRATION_COMPLETE.md
    ├── METADATA_UI_VERIFICATION_GUIDE.md
    ├── TASKS_9_10_COMPLETION_SUMMARY.md
    └── METADATA_UI_INTEGRATION_DIAGRAM.md (this file)
```

## Legend

```
✓ NEW      - Newly added in this integration
✓ MODIFIED - Existing file modified
✓ USED     - Existing component now used
✓ FIXED    - Bug fixed during integration
[Toggle]   - Interactive switch control
[Button]   - Clickable button
[Badge]    - Status indicator
[Icon]     - Visual icon
───►       - Data flow direction
```

## Quick Reference

### Finding the Components in Browser

1. **FileSelectorWithPrivacy**:
   - URL: `/app`
   - Tab: Send
   - Look for: Privacy toggle card above file selector

2. **PrivacySettingsPanel**:
   - URL: `/app/privacy-settings`
   - Location: Between "Connection Privacy Status" and "Privacy Tips"
   - Look for: "Privacy Protection" heading with Shield icon

3. **MetadataViewer**:
   - Trigger: Select file with metadata, click eye icon
   - Or: In MetadataStripDialog, click "View Details"
   - Look for: "File Metadata" dialog with categorized sections

### Key User Actions

1. **Enable/Disable Stripping**:
   - Send tab: Toggle in privacy card
   - Settings: Main toggle in PrivacySettingsPanel

2. **View File Metadata**:
   - Hover over file with metadata badge
   - Click eye icon
   - Or click "View Details" in strip dialog

3. **Configure Settings**:
   - Navigate to Settings > Privacy & Anonymity
   - Scroll to PrivacySettingsPanel
   - Toggle any option
   - Settings save automatically

### Developer Quick Access

```bash
# Component files
code components/transfer/file-selector-with-privacy.tsx
code components/privacy/privacy-settings-panel.tsx
code components/privacy/metadata-viewer.tsx

# Integration points
code app/app/page.tsx:43          # Import
code app/app/page.tsx:2136        # Usage
code app/app/page.tsx:2582        # Dialog
code app/app/privacy-settings/page.tsx:259  # Settings panel

# Documentation
code METADATA_STRIPPING_UI_INTEGRATION_COMPLETE.md
code METADATA_UI_VERIFICATION_GUIDE.md
code TASKS_9_10_COMPLETION_SUMMARY.md
```
