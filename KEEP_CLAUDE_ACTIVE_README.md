# Keep Claude Code Active - Auto Progress Script

## Purpose

This script prevents Claude Code from timing out by:
1. Simulating keyboard activity (pressing and erasing a key)
2. Auto-accepting progress prompts (pressing Enter)

## Available Scripts

### 1. PowerShell Version (Recommended)
**File:** `scripts/keep-claude-active.ps1`

**Advantages:**
- ✅ No dependencies required
- ✅ Works on all Windows systems
- ✅ Built-in Windows Forms support
- ✅ Most reliable

**Usage:**
```powershell
# Basic usage (30 second interval)
.\scripts\keep-claude-active.ps1

# Custom interval (60 seconds)
.\scripts\keep-claude-active.ps1 -IntervalSeconds 60

# Custom key to press
.\scripts\keep-claude-active.ps1 -Key "j"

# Disable auto-accept
.\scripts\keep-claude-active.ps1 -AutoAccept:$false

# Combined options
.\scripts\keep-claude-active.ps1 -IntervalSeconds 45 -Key "m" -AutoAccept:$true
```

### 2. Node.js Version
**File:** `scripts/keep-claude-active.js`

**Requirements:**
- Node.js installed
- robotjs package (`npm install robotjs`)

**Usage:**
```bash
# Install dependency first
npm install robotjs

# Basic usage
node scripts/keep-claude-active.js

# With environment variables
INTERVAL=60 KEY=j AUTO_ACCEPT=true VERBOSE=true node scripts/keep-claude-active.js
```

### 3. Windows Batch Launcher
**File:** `scripts/keep-claude-active.bat`

**Features:**
- Interactive menu
- Auto-detects and installs dependencies
- Launches your preferred version

**Usage:**
```cmd
# Double-click the file, or run:
.\scripts\keep-claude-active.bat
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| **Interval** | 30 seconds | Time between activity simulations |
| **Key** | `k` | Keyboard key to press (and erase) |
| **Auto Accept** | `true` | Whether to auto-press Enter |
| **Verbose** | `false` | Show detailed logs (Node.js only) |

## How It Works

```
┌─────────────────────────────────────┐
│  1. Wait for interval (e.g., 30s)  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Press configured key (e.g., k)  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Wait 100ms                      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Press Backspace (erase key)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Wait 500ms                      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. Press Enter (auto-accept)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  7. Loop back to step 1             │
└─────────────────────────────────────┘
```

## Example Output

```
=== Claude Code Keep-Alive Script ===
Interval: 30 seconds
Key to press: k
Auto-accept: true

Press Ctrl+C to stop
Starting in 3 seconds...

[14:23:45] Iteration #1
  ✓ Key pressed and erased
  ✓ Progress accepted
  ⏳ Waiting 30 seconds...

[14:24:15] Iteration #2
  ✓ Key pressed and erased
  ✓ Progress accepted
  ⏳ Waiting 30 seconds...

[14:24:45] Iteration #3
  ✓ Key pressed and erased
  ✓ Progress accepted
  ⏳ Waiting 30 seconds...
```

## Tips

### 1. Keep Claude Code Window in Focus
For the script to work, the Claude Code terminal should be the active window. The script will type into whatever window is focused.

### 2. Use a Safe Key
Choose a key that won't interfere with Claude's processing:
- ✅ Good: `k`, `j`, `m`, `l` (random letters)
- ❌ Bad: `y` (might confirm prompts), `n` (might deny)

### 3. Adjust Interval
- **Shorter interval (15-20s)**: More activity, less risk of timeout
- **Longer interval (45-60s)**: Less intrusive, but higher timeout risk
- **Recommended: 30s** - Good balance

### 4. Stop the Script
Press `Ctrl+C` in the script's terminal to stop it gracefully.

### 5. Run in Background
You can minimize the script terminal and it will continue running.

## Troubleshooting

### PowerShell Execution Policy Error
```powershell
# Run this in PowerShell as Administrator:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### robotjs Installation Error (Node.js)
The robotjs package requires build tools. If it fails:
1. Use the PowerShell version instead (no dependencies)
2. Or install Windows Build Tools:
   ```bash
   npm install --global windows-build-tools
   npm install robotjs
   ```

### Script Not Working
1. **Make sure Claude Code terminal is focused** - The script types into the active window
2. **Check interval** - Make sure it's frequent enough
3. **Try different key** - Some keys might be captured by other tools
4. **Use verbose mode** (Node.js):
   ```bash
   VERBOSE=true node scripts/keep-claude-active.js
   ```

## Safety

This script is **safe** because:
- ✅ It only simulates keyboard input (non-destructive)
- ✅ It erases typed characters immediately
- ✅ It can be stopped anytime with Ctrl+C
- ✅ It doesn't modify any files
- ✅ It doesn't make network requests
- ✅ It's transparent (shows all actions)

## Use Cases

### Long Agent Runs
When you have agents running for 30+ minutes:
```powershell
.\scripts\keep-claude-active.ps1 -IntervalSeconds 20
```

### Overnight Processing
For very long operations (hours):
```powershell
.\scripts\keep-claude-active.ps1 -IntervalSeconds 45
```

### Testing and Development
When you want to see what's happening:
```bash
VERBOSE=true INTERVAL=15 node scripts/keep-claude-active.js
```

## Integration with Claude Code

This script is designed specifically for Claude Code's behavior:
- **Activity Detection**: Claude Code detects keyboard input as user activity
- **Progress Prompts**: Auto-accepts "Continue?" prompts
- **Timeout Prevention**: Keeps the session alive during long operations

## Alternatives

If you don't want to use automation scripts:

1. **Manual Activity**: Press a key every 30 seconds manually
2. **Shorter Tasks**: Break work into smaller chunks
3. **Session Persistence**: Use Claude's conversation continuation features

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Try the PowerShell version (most compatible)
3. Verify Claude Code terminal is focused
4. Test with a shorter interval (15-20 seconds)

## License

This script is part of the Tallow project and follows the same MIT license.

---

**Quick Start:**
```powershell
# Just run this:
.\scripts\keep-claude-active.ps1
```

**That's it!** The script will keep Claude Code active automatically.
