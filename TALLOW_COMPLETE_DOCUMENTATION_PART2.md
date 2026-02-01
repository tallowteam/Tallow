# TALLOW - COMPLETE DOCUMENTATION (PART 2)

*Continued from Part 1*

---

## 8. COMPONENTS CATALOG (141 Components)

### 8.1 UI Components (21 components)

**Location:** `components/ui/`

#### Button (`button.tsx`)
**Purpose:** Primary UI interaction element

**Variants:**
```typescript
type ButtonVariant =
  | 'default'      // Primary purple
  | 'destructive'  // Red for dangerous actions
  | 'outline'      // Bordered, transparent background
  | 'secondary'    // Muted background
  | 'ghost'        // Transparent with hover
  | 'link'         // Text link style

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'
```

**Props:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}
```

**Usage:**
```tsx
<Button variant="default" size="lg">Send File</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Cancel</Button>
```

#### Input (`input.tsx`)
**Purpose:** Text input fields

**Types:**
- `text` - Standard text input
- `password` - Password with show/hide
- `email` - Email with validation
- `number` - Numeric input
- `search` - Search with icon
- `tel` - Telephone number
- `url` - URL with validation

**Features:**
- Auto-focus support
- Disabled state
- Error states
- Placeholder text
- Icon support (left/right)

#### Dialog (`dialog.tsx`)
**Purpose:** Modal dialogs

**Components:**
```tsx
<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Description text</DialogDescription>
    </DialogHeader>
    <div>{/* Content */}</div>
    <DialogFooter>
      <Button>Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Features:**
- Focus trap
- ESC to close
- Click outside to close
- Accessible (ARIA)
- Scroll lock

#### Card (`card.tsx`)
**Purpose:** Content containers

**Structure:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Footer actions */}
  </CardFooter>
</Card>
```

#### Badge (`badge.tsx`)
**Purpose:** Status indicators

**Variants:**
```tsx
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Failed</Badge>
<Badge variant="outline">Draft</Badge>
```

#### Avatar (`avatar.tsx`)
**Purpose:** User profile pictures

**Components:**
```tsx
<Avatar>
  <AvatarImage src="/user.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

**Features:**
- Image loading
- Fallback initials
- Size variants
- Rounded/square

#### Progress (`progress.tsx`)
**Purpose:** Progress indicators

```tsx
<Progress value={75} max={100} />
```

**Styles:**
- Linear bar
- Animated fill
- Color based on value
- Accessible (ARIA)

#### Tabs (`tabs.tsx`)
**Purpose:** Tabbed navigation

```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

#### Select (`select.tsx`)
**Purpose:** Dropdown selection

```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Group</SelectLabel>
      <SelectItem value="1">Option 1</SelectItem>
      <SelectItem value="2">Option 2</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

#### Checkbox (`checkbox.tsx`)
```tsx
<Checkbox
  checked={isChecked}
  onCheckedChange={setIsChecked}
  disabled={false}
/>
```

#### Switch (`switch.tsx`)
```tsx
<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
/>
```

#### Slider (`slider.tsx`)
```tsx
<Slider
  min={0}
  max={100}
  step={1}
  value={[50]}
  onValueChange={([value]) => setValue(value)}
/>
```

#### Tooltip (`tooltip.tsx`)
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>
      <p>Tooltip content</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

#### Alert (`alert.tsx`)
```tsx
<Alert variant="default | destructive">
  <AlertTitle>Alert Title</AlertTitle>
  <AlertDescription>Alert message</AlertDescription>
</Alert>
```

#### Skeleton (`skeleton.tsx`)
**Purpose:** Loading placeholders

```tsx
<Skeleton className="h-4 w-full" />
<Skeleton className="h-20 w-20 rounded-full" />
```

#### Popover (`popover.tsx`)
```tsx
<Popover>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverContent>
    Content here
  </PopoverContent>
</Popover>
```

#### Dropdown Menu (`dropdown-menu.tsx`)
**Purpose:** Context menus

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Scroll Area (`scroll-area.tsx`)
```tsx
<ScrollArea className="h-[200px]">
  {/* Scrollable content */}
</ScrollArea>
```

#### Separator (`separator.tsx`)
```tsx
<Separator orientation="horizontal" />
<Separator orientation="vertical" />
```

#### Label (`label.tsx`)
```tsx
<Label htmlFor="input-id">Field Label</Label>
<Input id="input-id" />
```

#### Textarea (`textarea.tsx`)
```tsx
<Textarea
  placeholder="Enter text..."
  rows={4}
/>
```

### 8.2 Transfer Components (12 components)

**Location:** `components/transfer/`

#### FileSelector (`file-selector.tsx`)
**Purpose:** Multi-file selection with drag & drop

**Features:**
- Drag and drop zone
- Multiple file selection
- File preview thumbnails
- File type icons
- Size display
- Remove files
- File list management

**Props:**
```typescript
interface FileSelectorProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;           // Default: unlimited
  maxSize?: number;            // bytes, default: unlimited
  accept?: string;             // MIME types
  multiple?: boolean;          // Default: true
  disabled?: boolean;
}
```

**Usage:**
```tsx
<FileSelector
  onFilesSelected={(files) => console.log(files)}
  maxFiles={10}
  maxSize={26214400}  // 25MB
  accept="image/*,video/*,.pdf"
  multiple={true}
/>
```

#### FileSelectorWithPrivacy (`file-selector-with-privacy.tsx`)
**Purpose:** File selection with metadata stripping UI

**Features:**
- All FileSelector features
- Metadata extraction preview
- Privacy warnings
- Strip/keep options
- Trusted contact check
- Per-file metadata display

**Props:**
```typescript
interface FileSelectorWithPrivacyProps extends FileSelectorProps {
  stripMetadata: boolean;
  trustedContacts: string[];
  onMetadataWarning: (files: File[], metadata: Metadata[]) => void;
  showMetadataPreview?: boolean;
}
```

#### TransferCard (`transfer-card.tsx`)
**Purpose:** Display single transfer status

**Features:**
- File name and size
- Progress bar (0-100%)
- Transfer speed (MB/s)
- Time remaining
- Status indicator
- Cancel button
- Retry button
- Pause/resume

**Props:**
```typescript
interface TransferCardProps {
  transfer: Transfer;
  onCancel?: () => void;
  onRetry?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

interface Transfer {
  id: string;
  fileName: string;
  fileSize: number;
  transferred: number;
  speed: number;              // bytes/second
  status: 'uploading' | 'downloading' | 'complete' | 'failed' | 'paused';
  startTime: number;
  error?: string;
}
```

**Display:**
```
┌─────────────────────────────────────┐
│ 📄 document.pdf                     │
│ 2.5 MB / 10 MB                      │
│ ████████░░░░░░░░ 25%                │
│ 1.2 MB/s · 6s remaining             │
│ [Pause] [Cancel]                    │
└─────────────────────────────────────┘
```

#### TransferCardAnimated (`transfer-card-animated.tsx`)
**Purpose:** Animated transfer card with entrance effects

**Animations:**
- Slide in from right on mount
- Progress bar fill animation
- Pulse effect on status change
- Fade out on completion
- Shake on error

**Framer Motion Variants:**
```typescript
const cardVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, scale: 0.9 }
};

const progressVariants = {
  initial: { width: 0 },
  animate: { width: `${progress}%` }
};
```

#### TransferQueue (`transfer-queue.tsx`)
**Purpose:** List of active and completed transfers

**Features:**
- Multiple transfer display
- Auto-scroll to active transfer
- Completion notifications
- Clear completed button
- Export history
- Search/filter
- Sort by date/size/status

**Props:**
```typescript
interface TransferQueueProps {
  transfers: Transfer[];
  onClearCompleted?: () => void;
  onExportHistory?: () => void;
  maxVisible?: number;         // Default: 10
  groupByDate?: boolean;       // Default: true
}
```

**Layout:**
```
Active Transfers (2)
┌─────────────────────┐
│ 📄 file1.pdf (25%)  │
│ 📄 file2.jpg (75%)  │
└─────────────────────┘

Completed (5)
┌─────────────────────┐
│ ✓ file3.doc         │
│ ✓ file4.png         │
└─────────────────────┘

[Clear Completed] [Export]
```

#### TransferQueueAnimated (`transfer-queue-animated.tsx`)
**Purpose:** Animated queue with stagger effects

**Animations:**
- Staggered entrance (each item delays 50ms)
- Auto-scroll animation
- Remove animation (slide out left)
- Reorder animation
- Collapse/expand groups

#### TransferProgress (`transfer-progress.tsx`)
**Purpose:** Detailed progress metrics

**Displays:**
```typescript
interface TransferProgressProps {
  transferred: number;         // bytes transferred
  total: number;              // total file size
  speed: number;              // current speed (bytes/s)
  averageSpeed: number;       // average speed
  startTime: number;          // timestamp
  chunks: ChunkProgress[];    // per-chunk status
  showChunks?: boolean;       // show chunk details
}
```

**Visual:**
```
┌─────────────────────────────────────┐
│ Progress: 256 MB / 1 GB (25%)       │
│ Current Speed: 5.2 MB/s             │
│ Average Speed: 4.8 MB/s             │
│ Time Elapsed: 00:00:53              │
│ Time Remaining: 00:02:37            │
│                                     │
│ Chunks: 250 / 1000 complete         │
│ ████████████░░░░░░░░░░░░░░          │
└─────────────────────────────────────┘
```

#### TransferConfirmDialog (`transfer-confirm-dialog.tsx`)
**Purpose:** Pre-transfer confirmation

**Shows:**
- File details (name, size, type)
- Recipient information
- Encryption method (PQC/Classical)
- Privacy level (Direct/Relay/Onion)
- Estimated transfer time
- Password protection status
- Metadata stripping status

**Actions:**
- Confirm and start
- Cancel
- Change options

#### TransferOptionsDialog (`transfer-options-dialog.tsx`)
**Purpose:** Advanced transfer settings

**Options:**
```typescript
interface TransferOptions {
  chunkSize: number;           // 16KB - 256KB
  compressionLevel: number;    // 0-9
  encryptionStrength: 'standard' | 'high' | 'maximum';
  bandwidthLimit: number;      // bytes/second, 0 = unlimited
  priority: 'low' | 'normal' | 'high';
  stripMetadata: boolean;
  passwordProtected: boolean;
  privacyLevel: 'direct' | 'relay' | 'onion';
}
```

**UI Sections:**
1. Performance
   - Chunk size slider
   - Compression level
   - Bandwidth limit

2. Security
   - Encryption strength
   - Password protection
   - Metadata stripping

3. Privacy
   - Privacy level selector
   - Onion routing toggle

#### PasswordProtectionDialog (`password-protection-dialog.tsx`)
**Purpose:** Set password for file encryption

**Features:**
- Password input
- Confirm password
- Strength meter
- Requirements checklist
- Optional hint
- Generate password button
- Show/hide toggle

**Password Requirements:**
```typescript
const requirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true
};
```

**Strength Levels:**
- Weak (< 50 score)
- Fair (50-70)
- Good (70-85)
- Strong (85-95)
- Very Strong (95+)

#### PasswordInputDialog (`password-input-dialog.tsx`)
**Purpose:** Enter password to decrypt file

**Features:**
- Password input
- Show/hide toggle
- Hint display (if available)
- Retry on wrong password
- Forgot password link
- Cancel option

#### QRCodeGenerator (`qr-code-generator.tsx`)
**Purpose:** Generate QR code for connection sharing

**Features:**
- Connection URL QR code
- Device ID encoding
- Scan instructions
- Download QR image
- Share QR code
- Expiration timer
- Auto-refresh

**Props:**
```typescript
interface QRCodeGeneratorProps {
  connectionId: string;
  expiresIn: number;          // milliseconds
  onExpired?: () => void;
  size?: number;              // Default: 256
  includeMargin?: boolean;
}
```

**QR Data Format:**
```json
{
  "version": "1.0",
  "deviceId": "abc123...",
  "publicKey": "base64...",
  "expiresAt": 1234567890
}
```

#### Advanced Components

#### FolderSelector (`FolderSelector.tsx`)
**Purpose:** Select entire folder for transfer

**Features:**
- Recursive folder reading
- Directory tree view
- File count display
- Total size calculation
- Selective file inclusion
- Excluded patterns (.git, node_modules)

#### FolderTree (`FolderTree.tsx`)
**Purpose:** Hierarchical folder display

**Features:**
- Expandable/collapsible
- File count per folder
- Size per folder
- Checkbox selection
- Visual tree structure
- Search/filter

#### FolderProgress (`FolderProgress.tsx`)
**Purpose:** Progress for folder transfers

**Displays:**
- Overall progress
- Files completed / total
- Current file being transferred
- Per-file progress
- Folder structure maintained

#### FolderDownload (`FolderDownload.tsx`)
**Purpose:** Download and extract folders

**Features:**
- Download as ZIP
- Auto-extract option
- Preserve structure
- Progress tracking
- Error handling

#### AdvancedFileTransfer (`advanced-file-transfer.tsx`)
**Purpose:** Expert mode interface

**Features:**
- All options visible
- Manual chunk size
- Custom encryption params
- Network statistics
- Debug information
- Performance metrics
- Raw protocol view

#### PQCTransferDemo (`pqc-transfer-demo.tsx`)
**Purpose:** Visualize post-quantum encryption

**Shows:**
- Key generation animation
- Encapsulation process
- Key exchange visualization
- Encryption layers
- Security indicators
- Educational tooltips

### 8.3 Device Components (5 components)

**Location:** `components/devices/`

#### DeviceCard (`device-card.tsx`)
**Purpose:** Display single device

**Information Shown:**
```typescript
interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  platform: 'windows' | 'mac' | 'linux' | 'ios' | 'android';
  ipAddress?: string;
  connected: boolean;
  signalStrength: number;      // 0-100
  lastSeen: number;            // timestamp
  verified: boolean;
  trusted: boolean;
}
```

**Display:**
```
┌─────────────────────────────────┐
│ 💻 Alice's MacBook Pro          │
│ Desktop · macOS                 │
│ 📶 ████░ 80% signal             │
│ Last seen: 2 minutes ago        │
│ ✓ Verified                      │
│ [Connect] [Verify] [Remove]     │
└─────────────────────────────────┘
```

#### DeviceList (`device-list.tsx`)
**Purpose:** List all discovered devices

**Features:**
- Auto-refresh (every 5 seconds)
- Filter by platform
- Filter by connection status
- Sort by signal/name/last seen
- Search devices
- Bulk actions
- Empty state

#### DeviceListAnimated (`device-list-animated.tsx`)
**Purpose:** Animated device list

**Animations:**
- Slide in on discovery
- Pulse on new device
- Fade out on disconnect
- Reorder animation
- Connection animation

#### ManualConnect (`manual-connect.tsx`)
**Purpose:** Manual IP/port connection

**Features:**
- IP address input with validation
- Port input (default: 3001)
- Connection test button
- Save connection checkbox
- Recent connections list
- QR code scan option

**Form:**
```tsx
<ManualConnect
  onConnect={(ip, port) => connect(ip, port)}
  recentConnections={[
    { ip: '192.168.1.100', port: 3001, name: 'Home PC' }
  ]}
/>
```

#### QRScanner (`qr-scanner.tsx`)
**Purpose:** Scan QR code to connect

**Features:**
- Camera access
- QR code detection
- Auto-connect on successful scan
- Manual entry fallback
- Scan history
- Permission handling

### 8.4 Privacy Components (6 components)

**Location:** `components/privacy/`

#### MetadataStripDialog (`metadata-strip-dialog.tsx`)
**Purpose:** Show and strip metadata

**Displays:**
```typescript
interface DetectedMetadata {
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  camera?: {
    make: string;
    model: string;
    lens?: string;
  };
  timestamps?: {
    created: string;
    modified: string;
  };
  author?: string;
  software?: string;
}
```

**UI:**
- Metadata list with icons
- Map view for GPS data
- Strip all button
- Selective stripping
- Privacy warning level

#### MetadataViewer (`metadata-viewer.tsx`)
**Purpose:** Detailed metadata view

**Sections:**
1. Location Data
   - GPS coordinates
   - Map preview
   - Privacy risk: HIGH

2. Device Information
   - Camera make/model
   - Lens information
   - Privacy risk: MEDIUM

3. Timestamps
   - Creation date
   - Modification date
   - Privacy risk: LOW

4. Author Information
   - Author name
   - Copyright
   - Privacy risk: MEDIUM

#### PrivacySettingsPanel (`privacy-settings-panel.tsx`)
**Purpose:** Privacy preferences

**Settings:**
```typescript
interface PrivacySettings {
  autoStripMetadata: boolean;
  preserveOrientation: boolean;
  trustedContacts: string[];
  privacyLevel: 'direct' | 'relay' | 'onion';
  torEnabled: boolean;
  vpnDetection: boolean;
  logLevel: 'none' | 'errors' | 'all';
}
```

#### PrivacyWarning (`privacy-warning.tsx`)
**Purpose:** Privacy risk indicators

**Risk Levels:**
- 🟢 LOW: No sensitive metadata
- 🟡 MEDIUM: Device info present
- 🟠 HIGH: GPS location found
- 🔴 CRITICAL: Multiple sensitive fields

**Actions:**
- Strip now
- Review metadata
- Proceed anyway
- Cancel transfer

#### TorIndicator (`tor-indicator.tsx`)
**Purpose:** Tor connection status

**Displays:**
- Tor connection status
- Circuit information
- Entry/middle/exit nodes
- Exit node country
- Circuit refresh button

**Visual:**
```
┌─────────────────────────────┐
│ 🧅 Connected to Tor         │
│ Circuit: Germany → France → │
│          USA (exit)          │
│ [Refresh Circuit]           │
└─────────────────────────────┘
```

#### ConnectionPrivacyStatus (`connection-privacy-status.tsx`)
**Purpose:** Overall privacy status

**Displays:**
- Encryption: PQC + Classical
- Privacy level: Onion (3 hops)
- IP leak: Not detected
- Metadata: Stripped
- Privacy score: 95/100

### 8.5 Chat Components (2 components)

**Location:** `components/app/`

#### ChatPanel (`chat-panel.tsx`)
**Purpose:** Full chat interface

**Features:**
- Message list (scrollable, virtualized)
- Message input with emoji picker
- Typing indicator
- Read receipts
- Message status icons
- File attachment (drag & drop)
- Message search
- Scroll to bottom button
- Unread message indicator

**Message Types:**
```typescript
type MessageType = 'text' | 'file' | 'emoji' | 'system';

interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  senderId: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
  edited?: boolean;
}
```

#### ChatInput (`chat-input.tsx`)
**Purpose:** Message composition

**Features:**
- Auto-expanding textarea
- Emoji picker button
- File attachment button
- Send button
- Character count
- Shift+Enter for newline
- Enter to send
- Typing indicator
- Draft saving

### 8.6 Security Components (1 component)

**Location:** `components/security/`

#### VerificationDialog (`verification-dialog.tsx`)
**Purpose:** Verify peer identity

**Verification Methods:**

1. **Safety Numbers**
   - Display 60-digit number
   - User compares with peer
   - Confirm match

2. **QR Code Scan**
   - Show QR code
   - Peer scans code
   - Auto-verify

3. **Shared Secret**
   - Both enter secret word
   - Cryptographic verification

**UI:**
```tsx
<VerificationDialog
  peerId="abc123"
  peerName="Alice"
  onVerified={() => markTrusted()}
  onCancelled={() => close()}
/>
```

### 8.7 Friends Components (3 components)

**Location:** `components/friends/`

#### FriendsList (`friends-list.tsx`)
**Purpose:** Display saved friends

**Features:**
- Friend cards with avatars
- Online status indicator
- Last seen timestamp
- Quick transfer button
- Quick chat button
- Friend settings
- Search friends
- Sort options

#### AddFriendDialog (`add-friend-dialog.tsx`)
**Purpose:** Add new friend

**Methods:**
1. Scan QR code
2. Enter friend code (6-digit)
3. Nearby discovery (Bluetooth/WiFi)
4. Import from contacts
5. Share link

#### FriendSettingsDialog (`friend-settings-dialog.tsx`)
**Purpose:** Friend preferences

**Settings:**
- Friend name (editable)
- Custom avatar
- Auto-accept transfers
- Notification preferences
- Privacy settings (skip metadata strip)
- Remove friend

---

## 9. API ENDPOINTS (22 Endpoints)

### 9.1 Email Service (5 endpoints)

#### POST `/api/email/send`
**Purpose:** Send file via email

**Request Body:**
```typescript
{
  recipientEmail: string;      // Email address
  senderName: string;          // Display name
  file: File;                  // File to send
  password?: string;           // Optional password
  expiresIn?: number;          // milliseconds (default: 86400000 = 24h)
  message?: string;            // Optional message
}
```

**Response:**
```typescript
{
  success: boolean;
  downloadUrl: string;         // R2 public URL
  downloadId: string;          // File ID
  expiresAt: number;          // Expiration timestamp
  emailId: string;            // Resend email ID
}
```

**Error Responses:**
- `400` Invalid request (missing fields, invalid email)
- `413` File too large (>25MB)
- `429` Rate limit exceeded (5 requests/minute)
- `500` Server error

**Rate Limit:** 5 requests per minute per IP

#### POST `/api/email/batch`
**Purpose:** Send file to multiple recipients

**Request Body:**
```typescript
{
  recipients: string[];        // Array of emails (max 10)
  senderName: string;
  file: File;
  password?: string;
  message?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  results: Array<{
    email: string;
    status: 'sent' | 'failed';
    downloadUrl?: string;
    downloadId?: string;
    error?: string;
  }>;
  totalSent: number;
  totalFailed: number;
}
```

#### GET `/api/email/status/[id]`
**Purpose:** Check email delivery status

**Path Parameter:**
- `id` - Email ID from Resend

**Response:**
```typescript
{
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'complained';
  sentAt?: number;             // Timestamp
  deliveredAt?: number;
  error?: string;
  recipient: string;
}
```

#### GET `/api/email/download/[id]`
**Purpose:** Download emailed file

**Path Parameter:**
- `id` - Download ID from email link

**Query Parameters:**
- `password` - Optional password for encrypted files

**Response:**
- File stream (binary)
- Or redirect to R2 public URL

**Headers:**
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="file.ext"
Content-Length: <size>
```

#### POST `/api/email/webhook`
**Purpose:** Resend delivery webhook

**Headers:**
- `svix-id` - Webhook ID
- `svix-timestamp` - Timestamp
- `svix-signature` - HMAC signature

**Webhook Events:**
```typescript
type WebhookEvent =
  | 'email.sent'
  | 'email.delivered'
  | 'email.bounced'
  | 'email.complained'
  | 'email.opened'     // If tracking enabled
  | 'email.clicked'    // If tracking enabled
```

**Event Payload:**
```typescript
{
  type: WebhookEvent;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
  };
}
```

### 9.2 File Management (2 endpoints)

#### GET `/api/v1/download-file`
**Purpose:** Get file metadata before download

**Query Parameters:**
- `fileId` - File ID

**Response:**
```typescript
{
  fileName: string;            // Original filename (encrypted)
  fileSize: number;           // Size in bytes
  mimeType: string;
  uploadedAt: number;
  expiresAt: number;
  encrypted: boolean;
  passwordProtected: boolean;
  downloads: number;          // Download count
  maxDownloads?: number;      // Download limit
}
```

#### POST `/api/v1/send-file-email`
**Purpose:** Send specific file via email

**Request Body:**
```typescript
{
  fileId: string;             // Existing file ID
  recipientEmail: string;
  message?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  emailId: string;
  downloadUrl: string;
}
```

### 9.3 Communication (4 endpoints)

#### POST `/api/send-welcome`
**Purpose:** Send welcome email to new user

**Request Body:**
```typescript
{
  email: string;
  name: string;
}
```

**Email Content:**
- Welcome message
- Feature overview
- Getting started guide
- Support links

#### POST `/api/send-share-email`
**Purpose:** Share transfer link via email

**Request Body:**
```typescript
{
  recipientEmail: string;
  senderName: string;
  shareUrl: string;           // Transfer URL
  message?: string;
  fileName?: string;
}
```

#### POST `/api/v1/send-welcome`
**Versioned welcome email endpoint**

Identical to `/api/send-welcome` but versioned for future compatibility.

#### POST `/api/v1/send-share-email`
**Versioned share email endpoint**

Identical to `/api/send-share-email` but versioned.

### 9.4 Stripe Payments (4 endpoints)

#### POST `/api/stripe/create-checkout-session`
**Purpose:** Create Stripe checkout session

**Request Body:**
```typescript
{
  priceId: string;            // Stripe price ID
  successUrl: string;         // Redirect on success
  cancelUrl: string;          // Redirect on cancel
  mode: 'payment' | 'subscription';
  metadata?: Record<string, string>;
}
```

**Response:**
```typescript
{
  sessionId: string;          // Stripe session ID
  checkoutUrl: string;        // Redirect URL
}
```

**Usage:**
```typescript
const response = await fetch('/api/stripe/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: 'price_xxx',
    successUrl: `${window.location.origin}/donate/success`,
    cancelUrl: `${window.location.origin}/donate/cancel`,
    mode: 'payment'
  })
});

const { checkoutUrl } = await response.json();
window.location.href = checkoutUrl;
```

#### POST `/api/stripe/webhook`
**Purpose:** Handle Stripe webhooks

**Headers:**
- `stripe-signature` - Webhook signature

**Events Handled:**
```typescript
- checkout.session.completed
- payment_intent.succeeded
- payment_intent.failed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

**Processing:**
1. Verify signature
2. Parse event
3. Handle based on type
4. Return 200 OK

#### POST `/api/v1/stripe/create-checkout-session`
**Versioned checkout endpoint**

#### POST `/api/v1/stripe/webhook`
**Versioned webhook endpoint**

### 9.5 Transfer Rooms (1 endpoint)

#### POST `/api/rooms`
**Purpose:** Create/manage transfer rooms

**Actions:**

**Create Room:**
```typescript
POST /api/rooms
{
  action: 'create',
  name: string;
  password?: string;
  maxMembers?: number;        // Default: 10
}

Response: {
  roomId: string;
  roomCode: string;           // 6-digit code
  joinUrl: string;
  createdAt: number;
}
```

**Get Room Info:**
```typescript
POST /api/rooms
{
  action: 'get',
  roomCode: string;
}

Response: {
  name: string;
  members: number;
  maxMembers: number;
  createdAt: number;
  passwordProtected: boolean;
}
```

**Join Room:**
```typescript
POST /api/rooms
{
  action: 'join',
  roomCode: string;
  password?: string;
  deviceId: string;
  deviceName: string;
}

Response: {
  success: boolean;
  roomId: string;
  members: Member[];
}
```

**Leave Room:**
```typescript
POST /api/rooms
{
  action: 'leave',
  roomId: string;
  deviceId: string;
}
```

### 9.6 System Endpoints (6 endpoints)

#### GET `/api/health`
**Purpose:** Health check endpoint

**Response:**
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;             // milliseconds
  version: string;
  services: {
    database: 'up' | 'down';
    storage: 'up' | 'down';
    email: 'up' | 'down';
    signaling: 'up' | 'down';
  };
}
```

**Status Codes:**
- `200` - Healthy
- `503` - Unhealthy

#### GET `/api/ready`
**Purpose:** Kubernetes readiness probe

**Response:**
```typescript
{
  ready: boolean;
}
```

**Returns 200 when:**
- All services initialized
- Database connected
- Storage accessible

#### GET `/api/metrics`
**Purpose:** Prometheus metrics endpoint

**Response Format:** Prometheus text format

**Metrics:**
```
# Transfer metrics
tallow_transfers_total{status="success"} 12345
tallow_transfers_total{status="failed"} 123
tallow_bytes_transferred_total 1234567890

# Performance metrics
tallow_transfer_duration_seconds_bucket{le="1.0"} 100
tallow_transfer_duration_seconds_bucket{le="5.0"} 500
tallow_transfer_speed_bytes_per_second 5242880

# System metrics
tallow_active_connections 42
tallow_cpu_usage_percent 45.2
tallow_memory_usage_bytes 1073741824
```

#### POST `/api/csrf-token`
**Purpose:** Get CSRF token

**Response:**
```typescript
{
  token: string;              // 32-byte hex string
}
```

**Sets Cookie:**
```
Set-Cookie: csrf-token=<token>; Path=/; Secure; HttpOnly; SameSite=Strict
```

**Usage:**
```typescript
const { token } = await fetch('/api/csrf-token', {
  method: 'POST'
}).then(r => r.json());

// Include in subsequent requests
fetch('/api/email/send', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token
  }
});
```

#### POST `/api/cron/cleanup`
**Purpose:** Cleanup expired files (cron job)

**Authorization:**
```
Authorization: Bearer <CRON_SECRET>
```

**Process:**
1. List all R2 objects
2. Check expiration metadata
3. Delete expired files
4. Update database
5. Return statistics

**Response:**
```typescript
{
  filesDeleted: number;
  bytesFreed: number;
  errors: string[];
  duration: number;           // milliseconds
}
```

**Cron Schedule:** Every 1 hour

---

## 10. EXTERNAL INTEGRATIONS

### 10.1 Resend Email Service

**Location:** `lib/email/email-service.ts`

**Setup:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
```

**Send Email:**
```typescript
await resend.emails.send({
  from: 'Tallow <noreply@tallow.app>',
  to: recipientEmail,
  subject: `${senderName} sent you a file via Tallow`,
  react: FileTransferEmail({
    senderName,
    fileName,
    fileSize,
    downloadUrl,
    expiresAt,
    message
  }),
  tags: [
    { name: 'category', value: 'file-transfer' }
  ]
});
```

**Features Used:**
- Email sending
- React email templates
- Delivery tracking
- Bounce handling
- Webhook notifications

**Pricing:**
- Free tier: 100 emails/day
- Pro tier: $20/month for 50,000 emails

### 10.2 Cloudflare R2 Storage

**Location:** `lib/email-fallback/index.ts`

**Setup:**
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
});
```

**Upload:**
```typescript
await r2.send(new PutObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  Key: fileId,
  Body: encryptedFile,
  ContentType: 'application/octet-stream',
  Metadata: {
    originalName: btoa(file.name),
    uploadedAt: Date.now().toString(),
    expiresAt: (Date.now() + 86400000).toString()
  }
}));
```

**Download:**
```typescript
const response = await r2.send(new GetObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  Key: fileId
}));

const file = await streamToBuffer(response.Body);
```

**Features:**
- S3-compatible API
- Zero egress fees
- Global CDN
- Automatic HTTPS

**Pricing:**
- $0.015/GB storage per month
- No egress fees
- Free operations (up to 1M reads/month)

### 10.3 Plausible Analytics

**Location:** `components/analytics/plausible-script.tsx`

**Setup:**
```tsx
<Script
  defer
  data-domain="tallow.app"
  src="https://plausible.io/js/script.js"
/>
```

**Event Tracking:**
```typescript
window.plausible?.('Transfer Complete', {
  props: {
    fileSize: file.size,
    duration: transferTime,
    encryption: 'pqc'
  }
});
```

**Privacy:**
- No cookies
- No personal data collection
- No IP logging
- GDPR compliant

**Pricing:**
- $9/month for 10k pageviews

### 10.4 Sentry Error Tracking

**Location:** `lib/monitoring/sentry.ts`

**Initialization:**
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Remove PII
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  }
});
```

**Capture Error:**
```typescript
Sentry.captureException(error, {
  tags: { feature: 'file-transfer' },
  extra: { fileSize: file.size }
});
```

**Pricing:**
- Free tier: 5k errors/month
- $26/month for 50k errors

### 10.5 Stripe Payments

**Location:** `lib/stripe/config.ts`

**Client Setup:**
```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
```

**Server Setup:**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});
```

**Pricing:**
- 2.9% + $0.30 per transaction

### 10.6 LaunchDarkly Feature Flags

**Location:** `lib/feature-flags/launchdarkly.ts`

**Server SDK:**
```typescript
import { init } from '@launchdarkly/node-server-sdk';

const client = init(process.env.LAUNCHDARKLY_SDK_KEY!);
const enabled = await client.variation('pqc-encryption', user, false);
```

**Pricing:**
- Starter: $10/seat/month

---

*End of Part 2*

**Continue to Part 3 for Custom Hooks & Storage**
