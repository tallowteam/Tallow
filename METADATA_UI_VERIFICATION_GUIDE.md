# Metadata Stripping UI Integration - Verification Guide

## Quick Verification Checklist

Use this guide to verify all metadata stripping UI integrations are working correctly.

## 1. FileSelectorWithPrivacy Integration

### Location
`/app` (main application page, Send tab)

### Verification Steps

1. Navigate to `/app` in browser
2. Click on "Send" tab
3. Look for the file selector area

#### Expected Behavior:

**Privacy Toggle Card**:
- [ ] Card with Shield icon appears above file selector
- [ ] Toggle labeled "Strip metadata automatically"
- [ ] Description text: "Remove GPS, camera info, and timestamps from images/videos"
- [ ] Toggle is functional (can be turned on/off)

**File Selection with Images/Videos**:
- [ ] Select a photo with GPS data (e.g., from phone camera)
- [ ] File appears in the selected files list
- [ ] If metadata detected, warning badge appears on file
- [ ] Privacy summary shows at top of file list
- [ ] Summary text: "X file(s) contain(s) sensitive metadata"

**File Status Badges**:
- [ ] Files with stripped metadata show green "Stripped" badge with Shield icon
- [ ] Files with metadata show amber "Metadata" badge with AlertTriangle icon
- [ ] Eye icon button appears on hover for files supporting metadata

**File Actions**:
- [ ] Click eye icon on file with metadata
- [ ] MetadataViewer dialog opens (see section 3)

### Code Verification

```bash
# Check component is imported
grep "FileSelectorWithPrivacy" app/app/page.tsx

# Check component is used
grep "<FileSelectorWithPrivacy" app/app/page.tsx
```

Expected output:
```
import { FileSelectorWithPrivacy, FileWithData } from "@/components/transfer/file-selector-with-privacy";
<FileSelectorWithPrivacy
```

## 2. PrivacySettingsPanel Integration

### Location
`/app/privacy-settings` (Privacy & Anonymity settings page)

### Verification Steps

1. Navigate to Settings (gear icon in top right)
2. Click "Privacy & Anonymity"
3. Scroll down past Connection Privacy Status

#### Expected Behavior:

**Panel Header**:
- [ ] "Privacy Protection" heading with Shield icon
- [ ] Description: "Control how your files are protected before transfer"
- [ ] "Reset to Defaults" button in top right

**Main Toggle Card**:
- [ ] "Enable Metadata Stripping" toggle
- [ ] Status badge shows "Active" (green) or "Inactive" (grey)
- [ ] Toggle is functional

**Metadata Stripping Options Section**:
- [ ] "Strip metadata by default" toggle
- [ ] "Preserve image orientation" toggle
- [ ] "Show metadata warnings" toggle
- [ ] All options disabled when main toggle is off

**File Type Preferences Section**:
- [ ] "Strip from images" toggle with Image icon
- [ ] "Strip from videos" toggle with Video icon and info tooltip
- [ ] Tooltip shows: "Video metadata stripping requires advanced processing"

**Privacy Notifications Section**:
- [ ] "Alert on sensitive data" toggle
- [ ] "Require confirmation before stripping" toggle

**Trusted Contacts Section**:
- [ ] Shows count badge
- [ ] Message: "Skip metadata stripping when sending to trusted contacts"
- [ ] Shows "No trusted contacts configured" if empty

**Information Card**:
- [ ] Blue info card at bottom
- [ ] "What gets removed?" heading
- [ ] Bullet list of metadata types

**Settings Persistence**:
- [ ] Toggle any setting
- [ ] Toast notification: "Privacy settings updated"
- [ ] Refresh page
- [ ] Setting remains in same state

### Code Verification

```bash
# Check component is imported
grep "PrivacySettingsPanel" app/app/privacy-settings/page.tsx

# Check component is used
grep "<PrivacySettingsPanel" app/app/privacy-settings/page.tsx
```

Expected output:
```
import { PrivacySettingsPanel } from '@/components/privacy/privacy-settings-panel';
<PrivacySettingsPanel />
```

## 3. MetadataViewer Integration

### Location
Accessible from MetadataStripDialog in `/app` Send tab

### Verification Steps

1. Navigate to `/app`
2. Enable "Strip metadata automatically" toggle
3. Enable "Require confirmation before stripping" in privacy settings
4. Select an image with EXIF data (photo from camera)
5. MetadataStripDialog appears
6. Click "View Details" or "View Metadata" button

#### Expected Behavior:

**Dialog Header**:
- [ ] "File Metadata" title with Info icon
- [ ] Shows filename in description

**Sensitive Data Warning** (if applicable):
- [ ] Amber warning card appears
- [ ] "Sensitive Metadata Detected" heading
- [ ] Lists detected types as badges (GPS, Camera Info, etc.)

**No Sensitive Data** (if clean):
- [ ] Green success card appears
- [ ] "No Sensitive Data" heading with Shield icon

**Metadata Sections** (scrollable):

Location Data (if present):
- [ ] MapPin icon
- [ ] "Sensitive" badge in red
- [ ] Shows: Latitude, Longitude, Altitude, GPS Timestamp

Camera & Device (if present):
- [ ] Camera icon
- [ ] "Sensitive" badge in red
- [ ] Shows: Make, Model, Software, Lens

Date & Time (if present):
- [ ] Calendar icon
- [ ] "Sensitive" badge in red
- [ ] Shows: Date Taken, Date Digitized, Created, Modified

Author & Copyright (if present):
- [ ] User icon
- [ ] "Sensitive" badge in red
- [ ] Shows: Artist, Author, Copyright

Technical Details:
- [ ] FileText icon
- [ ] No sensitive badge
- [ ] Shows: Width, Height, Orientation, Color Space

**Action Buttons**:
- [ ] "Close" button (grey)
- [ ] "Strip Metadata & Continue" button (blue) - only if sensitive data present

**Loading State**:
- [ ] Spinner shown while extracting metadata
- [ ] No content flashing

**Empty State**:
- [ ] If no metadata: "No metadata found in this file"
- [ ] FileText icon with opacity

### Code Verification

```bash
# Check component is imported
grep "MetadataViewer" app/app/page.tsx

# Check dialog state management
grep "showMetadataViewer\|selectedFileForViewer" app/app/page.tsx

# Check component is rendered
grep "<MetadataViewer" app/app/page.tsx
```

Expected output:
```
import { MetadataViewer } from '@/components/privacy/metadata-viewer';
const [showMetadataViewer, setShowMetadataViewer] = useState(false);
const [selectedFileForViewer, setSelectedFileForViewer] = useState<File | null>(null);
<MetadataViewer
```

## 4. End-to-End Integration Test

### Full User Flow Test

1. **Setup**:
   - [ ] Go to `/app/privacy-settings`
   - [ ] Enable "Metadata Stripping"
   - [ ] Enable "Require confirmation before stripping"
   - [ ] Enable "Alert on sensitive data"
   - [ ] Toast confirms: "Privacy settings updated"

2. **File Selection**:
   - [ ] Go to `/app`
   - [ ] Open Send tab
   - [ ] Privacy toggle is visible and enabled
   - [ ] Select photo with GPS data from phone

3. **Metadata Detection**:
   - [ ] MetadataStripDialog appears automatically
   - [ ] Shows file name and metadata warning
   - [ ] "View Details" button is visible

4. **Metadata Viewing**:
   - [ ] Click "View Details"
   - [ ] MetadataViewer opens
   - [ ] Amber warning card shows sensitive data detected
   - [ ] GPS section shows coordinates
   - [ ] Camera section shows device model
   - [ ] Close viewer

5. **Metadata Stripping**:
   - [ ] Back in MetadataStripDialog
   - [ ] Click "Strip Metadata & Continue"
   - [ ] Toast confirms: "Metadata removed from 1 file"
   - [ ] File appears with green "Stripped" badge

6. **Transfer**:
   - [ ] Select recipient
   - [ ] Click Send
   - [ ] File transfers successfully
   - [ ] Recipient receives clean file without metadata

### Auto-Strip Flow Test

1. **Setup**:
   - [ ] Go to `/app/privacy-settings`
   - [ ] Disable "Require confirmation before stripping"
   - [ ] Keep "Metadata Stripping" enabled

2. **File Selection**:
   - [ ] Select image with metadata
   - [ ] No dialog appears (auto-stripped)
   - [ ] Toast immediately shows: "Metadata removed from 1 file"
   - [ ] File has green "Stripped" badge

### Manual View Flow Test

1. **Setup**:
   - [ ] Disable metadata stripping toggle in Send tab
   - [ ] Select image with metadata

2. **Manual Metadata View**:
   - [ ] File shows amber "Metadata" badge
   - [ ] Hover over file
   - [ ] Eye icon appears
   - [ ] Click eye icon
   - [ ] MetadataViewer opens
   - [ ] View all metadata
   - [ ] Close viewer
   - [ ] File remains with original metadata

## 5. Browser DevTools Verification

### Console Checks

Open browser console and verify:

```javascript
// Check FileSelectorWithPrivacy is loaded
console.log('FileSelectorWithPrivacy component:',
  document.querySelector('[class*="file-selector"]'));

// Check PrivacySettingsPanel is loaded on privacy page
console.log('PrivacySettingsPanel:',
  document.querySelector('[class*="privacy-settings"]'));

// Check MetadataViewer imports
import { extractMetadata } from '@/lib/privacy/metadata-stripper';
console.log('Metadata stripper loaded:', typeof extractMetadata === 'function');
```

### Network Checks

- [ ] No network requests during metadata extraction (all client-side)
- [ ] Settings saved to IndexedDB, not sent to server
- [ ] File processing happens locally

### Performance Checks

- [ ] File selection remains smooth with metadata detection
- [ ] Large image processing doesn't freeze UI
- [ ] Settings panel loads quickly

## 6. Accessibility Verification

### Keyboard Navigation

1. **FileSelectorWithPrivacy**:
   - [ ] Tab to privacy toggle
   - [ ] Space/Enter toggles it
   - [ ] Tab to file selector
   - [ ] Enter opens file picker

2. **PrivacySettingsPanel**:
   - [ ] Tab through all toggles
   - [ ] Space/Enter toggles each
   - [ ] Focus indicators visible
   - [ ] Logical tab order

3. **MetadataViewer**:
   - [ ] Tab to dialog (auto-focused)
   - [ ] Tab through sections
   - [ ] Tab to buttons
   - [ ] Escape closes dialog

### Screen Reader

- [ ] Toggle states announced ("On"/"Off")
- [ ] File status badges announced
- [ ] Dialog titles read aloud
- [ ] Metadata sections properly labeled

## 7. Mobile Verification

### Responsive Design

1. **FileSelectorWithPrivacy**:
   - [ ] Privacy toggle card fits mobile width
   - [ ] File list scrollable on mobile
   - [ ] Touch targets large enough (44x44px)

2. **PrivacySettingsPanel**:
   - [ ] All cards stack vertically
   - [ ] Toggles remain accessible
   - [ ] Text remains readable
   - [ ] No horizontal scrolling

3. **MetadataViewer**:
   - [ ] Dialog fits mobile screen
   - [ ] Metadata sections scroll
   - [ ] Buttons accessible
   - [ ] Close button reachable

### Touch Interactions

- [ ] Toggle switches respond to touch
- [ ] Buttons have proper touch feedback
- [ ] Dialogs can be dismissed with gesture
- [ ] Eye icon buttons work on touch

## 8. Error Handling Verification

### Edge Cases

1. **Corrupted Image**:
   - [ ] Select corrupted/invalid image
   - [ ] No crash, graceful error handling
   - [ ] File still selectable
   - [ ] Warning toast shown

2. **Unsupported File Type**:
   - [ ] Select .txt or .zip file
   - [ ] No metadata badge shown
   - [ ] No eye icon visible
   - [ ] File processes normally

3. **Very Large File**:
   - [ ] Select large image (>50MB)
   - [ ] Loading indicator shows
   - [ ] No timeout error
   - [ ] Metadata extracted successfully

4. **Offline Mode**:
   - [ ] Disconnect network
   - [ ] Metadata extraction still works (client-side)
   - [ ] Settings persist (IndexedDB)

## 9. State Management Verification

### State Persistence

1. **Privacy Settings**:
   - [ ] Change settings
   - [ ] Refresh page
   - [ ] Settings remain
   - [ ] Close browser
   - [ ] Reopen app
   - [ ] Settings still saved

2. **File Selection**:
   - [ ] Select files
   - [ ] Switch tabs
   - [ ] Return to Send tab
   - [ ] Files still selected
   - [ ] Metadata status preserved

### State Synchronization

- [ ] Toggle in Send tab affects strip behavior
- [ ] Privacy settings apply immediately
- [ ] Multiple files processed correctly
- [ ] No race conditions with async operations

## Success Criteria

All checkboxes should be checked for complete verification. If any fail:

1. Check browser console for errors
2. Verify component imports in code
3. Check that files haven't been modified incorrectly
4. Test in different browser
5. Clear browser cache and retry

## Automated Test Command

```bash
# Run E2E tests (when available)
npm run test:e2e -- metadata-stripping

# Run unit tests for components
npm run test -- metadata-viewer privacy-settings-panel file-selector-with-privacy

# Type check
npm run type-check

# Build test
npm run build
```

## Reporting Issues

If verification fails, provide:
1. Which checkbox failed
2. Browser and version
3. Console error messages
4. Screenshots if UI issue
5. Steps to reproduce

## Additional Resources

- Component source code:
  - `components/transfer/file-selector-with-privacy.tsx`
  - `components/privacy/privacy-settings-panel.tsx`
  - `components/privacy/metadata-viewer.tsx`

- Documentation:
  - `METADATA_STRIPPING_UI_INTEGRATION_COMPLETE.md`
  - `METADATA_STRIPPING.md`
  - `PRIVACY_FEATURES.md`
