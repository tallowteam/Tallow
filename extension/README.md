# Tallow - Quick Share Browser Extension

A browser extension that allows you to quickly share content from your browser to your Tallow app for secure, peer-to-peer file transfers.

## Features

- **Quick Sharing**: Share current page, selected text, screenshots, and images with one click
- **Context Menu Integration**: Right-click on any content to share it with Tallow
- **Keyboard Shortcuts**: Fast sharing with customizable keyboard shortcuts
- **Download Link Enhancement**: Automatically detect downloadable files and offer to share them via Tallow
- **Connection Status**: Real-time connection monitoring with your local Tallow app
- **Dark Theme**: Beautiful dark UI matching Tallow's design system

## Installation

### Development Mode (Load Unpacked)

1. **Clone or download** this repository
2. **Open Chrome/Edge** and navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. **Enable Developer Mode** (toggle in top right)
4. **Click "Load unpacked"**
5. **Select the `extension` folder** from this repository
6. The extension icon should appear in your browser toolbar

### Building for Production

The extension uses TypeScript and needs to be compiled before distribution:

```bash
# Install dependencies
npm install

# Compile TypeScript files
npm run build:extension

# Package for distribution
npm run package:extension
```

## Usage

### Prerequisites

Make sure your **Tallow app is running** on `http://localhost:3000` (or configure a custom URL in settings).

### Sharing Content

#### 1. Via Extension Popup
- Click the Tallow extension icon in your toolbar
- Choose what to share:
  - **Share Page**: Share the current page URL
  - **Share Text**: Share selected text from the page
  - **Screenshot**: Capture and share a screenshot
  - **Share Image**: Share images from the page

#### 2. Via Context Menu
- **Right-click** on any content (text, link, image, video)
- Select **"Share with Tallow"**
- Choose the specific content type to share

#### 3. Via Keyboard Shortcuts
- **Share selected text**: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
- **Share current page**: `Ctrl+Shift+U` (Windows/Linux) or `Cmd+Shift+U` (Mac)

#### 4. Download Link Detection
- Hover over downloadable file links
- A **"Share with Tallow"** button will appear
- Click to send the file URL to Tallow instead of downloading directly

### Configuration

Click the **settings icon** in the extension popup or navigate to the extension options page to configure:

- **Tallow App URL**: The URL where your Tallow app is running (default: `http://localhost:3000`)
- **Auto-open app**: Automatically open Tallow in a new tab after sharing
- **Notifications**: Show browser notifications when content is shared
- **Download buttons**: Enable/disable the hover buttons on download links

## Features in Detail

### Connection Status Monitoring
The extension continuously monitors the connection to your Tallow app and displays:
- **Green dot**: Connected and ready
- **Red dot**: Not connected (make sure Tallow is running)

### Share Types Supported
- **URLs**: Web page links
- **Text**: Selected text from any page
- **Screenshots**: Full-page screenshots
- **Images**: Individual images from web pages
- **Videos**: Video URLs
- **Audio**: Audio URLs
- **Files**: Download links and file URLs

### Security & Privacy
- All communication happens locally between the extension and your Tallow app
- No data is sent to external servers
- Supports Tallow's end-to-end encryption for transfers
- Permission scopes are minimal and required only for functionality

## Permissions Explained

The extension requires the following permissions:

- **activeTab**: Access the current tab's URL and content (only when you click the extension)
- **storage**: Save your settings and preferences
- **contextMenus**: Add "Share with Tallow" to right-click menus
- **tabs**: Capture screenshots and manage tab operations
- **scripting**: Inject share buttons on download links
- **host_permissions (localhost)**: Communicate with your local Tallow app

## Troubleshooting

### Extension shows "Disconnected"
1. Make sure the Tallow app is running on your computer
2. Check that the URL in settings matches where Tallow is running
3. Click "Test Connection" in the settings page
4. Try accessing `http://localhost:3000/api/health` in your browser

### Share buttons not appearing on download links
1. Check that "Show share buttons on download links" is enabled in settings
2. Try refreshing the page
3. Some download links may use JavaScript and won't be detected automatically

### Keyboard shortcuts not working
1. Check for conflicts with other extensions
2. Go to `chrome://extensions/shortcuts` to customize or verify shortcuts
3. Make sure you have text selected when using the text sharing shortcut

### Content not appearing in Tallow
1. Check that the Tallow app is running and connected
2. Verify the API endpoint is available (the extension communicates via `/api/extension/share`)
3. Check browser console for errors (F12 → Console)

## Development

### File Structure
```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.css             # Popup styles
├── popup.ts              # Popup logic
├── background.ts         # Background service worker
├── content.ts            # Content script (page injection)
├── content.css           # Content script styles
├── options.html          # Settings page UI
├── options.css           # Settings page styles
├── options.ts            # Settings page logic
├── icons/                # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md             # This file
```

### Building from TypeScript

The extension is written in TypeScript for type safety. To compile:

```bash
# Install TypeScript
npm install -g typescript

# Compile all .ts files
tsc extension/popup.ts --outDir extension/
tsc extension/background.ts --outDir extension/
tsc extension/content.ts --outDir extension/
tsc extension/options.ts --outDir extension/
```

Or add to your build script:

```json
{
  "scripts": {
    "build:extension": "tsc extension/*.ts --target ES2020 --module ES2020 --moduleResolution node"
  }
}
```

### Hot Reload During Development

Chrome/Edge extensions need to be manually reloaded during development:
1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the **reload icon** on the Tallow extension card

For a better development experience, consider using [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid).

## API Integration

The extension communicates with Tallow via a REST API endpoint:

### POST `/api/extension/share`

**Request Body (FormData):**
```
type: 'url' | 'text' | 'image' | 'screenshot' | 'file'
content: string | Blob
title: string (optional)
url: string (optional)
metadata: JSON string (optional)
```

**Response:**
```json
{
  "success": true,
  "transferId": "abc123"
}
```

**Example Implementation:**

```typescript
// In your Tallow app (Next.js API route)
// app/api/extension/share/route.ts

export async function POST(request: Request) {
  const formData = await request.formData();
  const type = formData.get('type');
  const content = formData.get('content');

  // Handle the shared content
  // ... your transfer logic here

  return Response.json({ success: true });
}
```

## Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This extension is part of the Tallow project. See the main project LICENSE file for details.

## Support

- **Website**: https://tallow.app
- **Documentation**: https://docs.tallow.app
- **Issues**: https://github.com/tallow/tallow/issues
- **Discussions**: https://github.com/tallow/tallow/discussions

## Version History

### 1.0.0 (Initial Release)
- Quick share popup with connection status
- Context menu integration for all content types
- Keyboard shortcuts for text and page sharing
- Download link detection and enhancement
- Settings page with connection testing
- Dark theme matching Tallow design system
- Full TypeScript implementation with type safety

---

Made with ❤️ for secure, peer-to-peer file sharing.
