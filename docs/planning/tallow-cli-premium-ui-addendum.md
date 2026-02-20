# Tallow CLI — Premium UI & User-Friendliness Addendum

> Addendum to the main UX plan. This document covers the visual polish, micro-interactions, and "delight" features that take Tallow from a good CLI to the best-in-class terminal experience.

---

## 1. In-Terminal QR Code for Transfer Codes

Magic-wormhole already supports `--qr` to display a QR code in the terminal. Tallow should do this by default and do it better.

### Why This Matters
The most common Tallow use case is: you're on your laptop, you need to receive a file on your phone (or vice versa). Typing `orbit-maple-thunder` on a phone keyboard is friction. Scanning a QR code is instant.

### Implementation

```
$ tallow send photo.jpg

  ╭─ Sending ──────────────────────────────────────╮
  │                                                │
  │  📄 photo.jpg (2.4 MB)                         │
  │  Encryption: ML-KEM-1024 + X25519              │
  │                                                │
  │  ┌─────────────┐                               │
  │  │ █▀▀▀█ ▀█▀█  │  Code: orbit-maple-thunder    │
  │  │ █ ▄▄█ █▄▀▄  │                               │
  │  │ █▀▀▀█ ▄█▀▀  │  Scan QR or run:              │
  │  │ ▄▄▄▄▄ █▄█▄  │  tallow receive               │
  │  │ ██▀▄█▀▀▀█▀  │    orbit-maple-thunder        │
  │  │ ▄▄▄▄▄ ▀█▄▀  │                               │
  │  └─────────────┘                               │
  │                                                │
  ╰────────────────────────────────────────────────╯

  ⏳ Waiting for receiver...  (code expires in 9:42)
```

The QR code encodes a deep link: `tallow://receive/orbit-maple-thunder` — so if the receiver has Tallow installed with a URI handler (future PWA/mobile), scanning opens the app directly. Falls back to displaying the text code.

### Behavior
- QR displayed by default when terminal is wide enough (>80 cols)
- `--no-qr` to suppress (for narrow terminals or piping)
- `--qr-only` for maximum QR size (fills terminal width)
- Auto-detect: if stdout is not a TTY, skip the QR entirely
- Use the `qrcode` Rust crate for generation — zero external dependencies

---

## 2. Automatic Clipboard Copy

When a transfer code is generated, it should be copied to the clipboard automatically. This is one of those "obvious in hindsight" features that croc doesn't do.

```
$ tallow send report.pdf

  Code: orbit-maple-thunder  (copied to clipboard ✓)
```

### Implementation
- Use the `arboard` or `cli-clipboard` Rust crate (cross-platform)
- Only copy when running interactively (TTY check)
- `--no-clipboard` to disable
- On failure (headless server, Wayland without wl-copy), silently skip — never error on clipboard
- Also copies the full receive command: `tallow receive orbit-maple-thunder`

---

## 3. Animated State Machine — The Transfer Timeline

Instead of static text that gets replaced, show an animated step-by-step timeline that builds up as the transfer progresses. This makes the security process feel tangible.

### The Full Animation Sequence

**Phase 1: Connecting**
```
  ◐ Connecting to relay...
```

**Phase 2: Waiting (spinner animates)**
```
  ✓ Connected to relay (23ms)
  ◑ Waiting for receiver...  (code expires in 9:42)
```

**Phase 3: Handshake (this is the money shot — show the crypto)**
```
  ✓ Connected to relay (23ms)
  ✓ Receiver connected
  ◐ Key exchange...
    ├─ ML-KEM-1024 encapsulation ✓
    ├─ X25519 ephemeral exchange ✓
    └─ Session key derived ✓
```

**Phase 4: Transfer**
```
  ✓ Connected to relay (23ms)
  ✓ Receiver connected
  ✓ Key exchange complete (post-quantum)

  Sending ━━━━━━━━━━━━━━━━━╸━━━━━━━━━━━━ 42% 1.0/2.4 MB  1.2 MB/s  ETA 00:01
```

**Phase 5: Complete (stays on screen)**
```
  ✓ Connected to relay (23ms)
  ✓ Receiver connected
  ✓ Key exchange complete (post-quantum)
  ✓ Sent 2.4 MB in 2.0s (1.2 MB/s)
  ✓ Integrity verified (SHA-256 match)

  Transfer complete.
```

### Key Animation Details
- Each `✓` appears with a brief color flash: gray → green
- Spinner uses braille characters (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`) for smoothness
- The progress bar uses Unicode block elements for sub-character precision: `━╸` gives smoother movement than `█░`
- ETA shown only after 1 second of transfer (avoids jumpy initial estimates)
- Speed shown as rolling 3-second average (not instantaneous — less jitter)
- All timestamps right-aligned for visual consistency

### Indicatif Template Strings

```rust
// Spinner with elapsed time
let spinner_style = ProgressStyle::with_template(
    "  {spinner:.cyan} {msg}"
)?;

// Transfer progress bar
let bar_style = ProgressStyle::with_template(
    "  Sending {bar:40.green/dim} {percent}% {bytes}/{total_bytes}  {bytes_per_sec}  ETA {eta}"
)?.progress_chars("━╸━");

// Completed step
let done_style = ProgressStyle::with_template(
    "  {prefix:.green} {msg}"
)?;
```

---

## 4. Adaptive Terminal Layout

Tallow should look great in an 80-column terminal AND a tiny 40-column tmux pane. Too many CLI tools just truncate or wrap ugly.

### Wide Terminal (>100 cols) — Full Layout
```
  ╭─ Sending ──────────────────────────────────────────────────────╮
  │                                                                │
  │  📄 photo.jpg (2.4 MB)          Code: orbit-maple-thunder      │
  │  Encryption: ML-KEM-1024        Relay: tallow.io (23ms)        │
  │                                                                │
  │  ┌───────────┐                                                 │
  │  │ QR CODE   │  Scan to receive, or run:                       │
  │  │           │  tallow receive orbit-maple-thunder              │
  │  └───────────┘                                                 │
  ╰────────────────────────────────────────────────────────────────╯
```

### Standard Terminal (60-100 cols) — Compact Layout
```
  📄 photo.jpg (2.4 MB)
  Encryption: ML-KEM-1024 + X25519

  Code: orbit-maple-thunder  (copied ✓)
  Run:  tallow receive orbit-maple-thunder

  ⏳ Waiting for receiver...
```

### Narrow Terminal (<60 cols) — Minimal Layout
```
  photo.jpg (2.4 MB)
  Code: orbit-maple-thunder

  Waiting...
```

### Implementation
- Query terminal width on startup with `crossterm::terminal::size()`
- Dynamically select layout variant
- Progress bar width auto-scales to fill available space
- Box drawing only when there's room (>80 cols)
- QR code only when wide enough to display both QR and text side-by-side

---

## 5. Smart File Type Awareness

Show contextual information based on what's being transferred.

### File Type Icons and Context

```
  📄 report.pdf (2.4 MB)               # Documents
  🖼  vacation-photo.jpg (4.1 MB)       # Images  
  📦 project.tar.gz (128 MB)            # Archives
  🎬 demo-video.mp4 (1.2 GB)           # Video
  📁 documents/ (47 files, 89 MB)       # Directories
  🔒 secrets.age (1.2 KB)              # Encrypted files
  📋 clipboard (342 bytes)              # Clipboard text
```

### Directory Transfer Intelligence

When sending a directory, show a smart summary instead of just the name:

```
  📁 project/ 
     47 files across 12 directories
     Largest: video/demo.mp4 (890 MB)
     Total: 1.2 GB (will be compressed to ~940 MB)
```

### Multi-File Transfer with Multi-Progress

```
  Sending 3 files (4.2 GB total)

  vacation-photos.zip ━━━━━━━━━━━━━━━━━━━━━ 100%  1.2 GB  ✓
  demo-video.mp4      ━━━━━━━━━━━╸━━━━━━━━━  38%  1.1 GB  2.1 MB/s
  report.pdf          ⏸ queued                     2.4 MB

  Overall ━━━━━━━━━━━━━━━╸━━━━━━━━━━━━━━━━━ 45% 1.9/4.2 GB  ETA 00:18
```

Using `indicatif::MultiProgress` to render multiple bars simultaneously with an overall progress bar at the bottom.

---

## 6. Transfer Complete — The Celebration Moment

When a transfer finishes, it's a moment of success. Celebrate it appropriately.

### Visual Completion Summary

```
  ╭─ Transfer Complete ────────────────────────────╮
  │                                                │
  │  ✓ photo.jpg                                   │
  │                                                │
  │  Size:       2.4 MB                            │
  │  Time:       2.0 seconds                       │
  │  Speed:      1.2 MB/s                          │
  │  Encryption: ML-KEM-1024 + X25519              │
  │  Integrity:  SHA-256 verified ✓                │
  │                                                │
  ╰────────────────────────────────────────────────╯
```

### Desktop Notification

After a long transfer (>10 seconds), fire an OS-level notification so the user can tab back:

```rust
// Using the `notify-rust` crate
Notification::new()
    .summary("Tallow — Transfer Complete")
    .body("photo.jpg (2.4 MB) sent successfully")
    .icon("security-high")
    .show()?;
```

- macOS: native notification via `osascript` or `notify-rust`
- Linux: `libnotify` / `notify-send`
- Disable with `--no-notify`
- Terminal bell as fallback: `\x07`

### Completion Sound

A subtle terminal bell (`\x07`) on completion. Users who have terminal bells enabled get an audible cue. Those who don't, aren't affected. Optionally:

```toml
# config.toml
[ui]
sound = "bell"     # bell | none
notify = true      # OS notification on long transfers
```

---

## 7. Interactive Receive — Progressive Disclosure

The receiver side should feel safe and informative, especially for non-technical recipients.

### Step 1: Code Entry with Autocomplete

```
$ tallow receive

  ? Enter transfer code: orb█
    ┌──────────────────────────┐
    │ orbit-maple-thunder  ◄   │
    └──────────────────────────┘
```

If the relay has a pending transfer matching the partial code, suggest it. This is similar to how password managers suggest entries. The security model allows this since codes are ephemeral and single-use.

### Step 2: Transfer Preview (before accepting)

```
  ╭─ Incoming Transfer ──────────────────────────────╮
  │                                                  │
  │  📄 quarterly-report.pdf                          │
  │                                                  │
  │  Size:       2.4 MB                              │
  │  From:       ephemeral key (no identity)         │
  │  Encrypted:  ML-KEM-1024 + X25519               │
  │  Relay:      tallow.io                           │
  │                                                  │
  │  ⚠  This sender has no verified identity.        │
  │     Only accept if you're expecting this file.   │
  │                                                  │
  ╰──────────────────────────────────────────────────╯

  ? Accept this transfer?
    ▸ Yes, save to current directory
      Yes, save to ~/Downloads
      Choose location...
      Decline
```

Key UX choices:
- Show file metadata before downloading anything
- Security warning for ephemeral/unknown senders (but not scary — informational)
- For known identities: `From: alice (verified ✓)` — no warning
- Save location options prevent the "where did it go?" problem
- Arrow-key selection via `dialoguer`

### Step 3: During Transfer — Contextual Status Bar

```
  Receiving quarterly-report.pdf
  ━━━━━━━━━━━━━━━━━━━━━╸━━━━━━━━━ 67% 1.6/2.4 MB  1.2 MB/s  ETA 00:01

  Saving to: ./quarterly-report.pdf
  Press Ctrl+C to cancel (transfer can be resumed)
```

The "press Ctrl+C" hint is crucial — users need to know canceling is safe and resumable.

---

## 8. Color-Coded Security Levels

Use color as an instant visual indicator of the security posture:

### Green — Standard (E2E encrypted, relay)
```
  🟢 Standard security
  Encryption: ML-KEM-1024 + X25519
```

### Yellow — Elevated (+ passphrase)
```
  🟡 Elevated security
  Encryption: ML-KEM-1024 + X25519 + passphrase
```

### Magenta — Paranoid (+ Tor + passphrase + short expiry)
```
  🔮 Paranoid security
  Encryption: ML-KEM-1024 + X25519 + passphrase
  Routing: Tor (3 hops)
  Code expires: 5 minutes
```

The colors appear in the security status line throughout the transfer, providing constant visual feedback about the active protection level.

---

## 9. Contextual Hints & Nudges

The CLI should teach users how to use it better over time, without being annoying.

### First-Time Hints (shown once, then suppressed)

```
  Code: orbit-maple-thunder

  💡 Tip: Add --tor for anonymous transfers
     Run `tallow help security` for more options
```

Hints stored in `~/.local/share/tallow/hints.json` with timestamps. Each hint shown at most once. `--no-hints` to disable globally.

### Situational Nudges

**Large file without compression:**
```
  📦 database-dump.sql (2.1 GB, uncompressed)

  💡 This file may transfer faster if compressed first:
     gzip database-dump.sql && tallow send database-dump.sql.gz
```

**Repeated transfers to same person:**
```
  💡 You've sent 5 files to this device this week.
     Set up a persistent identity for faster key exchange:
     tallow keygen
```

**Slow relay:**
```
  ⚠ Relay latency: 340ms (higher than usual)

  💡 Try a closer relay or self-host:
     tallow send --relay my-relay.example.com photo.jpg
     tallow help relay
```

### "Did You Know?" on Idle

While waiting for a receiver (often 30+ seconds), rotate through brief tips:

```
  ⏳ Waiting for receiver...  (code expires in 8:23)

  💡 Did you know? Use --paranoid for maximum security (Tor + passphrase + 5min expiry)
```

Tips rotate every 15 seconds. Max 3 per wait session. Never repeat.

---

## 10. Undo / Recover / Resume

### Resume Interrupted Transfers

```
$ tallow send large-file.zip

  Sending ━━━━━━━━━━━━━━━╸━━━━━━━━━━━━━ 45% 450/1000 MB

  ^C  Transfer interrupted.

  To resume: tallow send --resume large-file.zip
  The receiver can use the same code.
```

On resume:
```
$ tallow send --resume large-file.zip

  ⟳ Resuming transfer from 450 MB (45%)
  Using existing code: orbit-maple-thunder

  Sending ━━━━━━━━━━━━━━━╺━━━━━━━━━━━━━ 45% → resuming...
```

### Transfer History

```
$ tallow history

  Recent transfers:
  ──────────────────────────────────────────────────
  2 min ago    ↑ sent     photo.jpg        2.4 MB    ✓
  1 hour ago   ↓ received report.pdf       890 KB    ✓
  Yesterday    ↑ sent     backup.tar.gz    1.2 GB    ✓
  3 days ago   ↑ sent     demo.mp4         450 MB    ✗ interrupted

  Resume interrupted: tallow send --resume demo.mp4
```

History stored locally, encrypted at rest. `tallow history clear` to wipe. No file contents stored — only metadata (name, size, timestamp, direction, status).

---

## 11. Inline Help Everywhere

Every interaction point should have contextual help available.

### Flag Suggestions on Error

```
$ tallow send --encrypt photo.jpg

  Unknown flag: --encrypt

  Did you mean one of these?
    --expire <duration>   Set code expiry time
    --paranoid            Maximum security mode

  Encryption is always on by default (ML-KEM-1024 + X25519).
  No flag needed.
```

### Interactive Help in Prompts

When a `dialoguer` prompt is active, `?` shows contextual help:

```
  ? Default security profile:
    ▸ Standard
      Elevated
      Paranoid

  Press ? for details about each option
```

Pressing `?`:

```
  Security Profiles:

  Standard   End-to-end encryption via post-quantum key exchange.
             Files are encrypted before leaving your machine.
             The relay server never sees plaintext.

  Elevated   Everything in Standard, plus a passphrase that both
             sender and receiver must know. Protects against
             code interception.

  Paranoid   Everything in Elevated, plus Tor routing (hides your
             IP from the relay), short code expiry (5 min), and
             metadata stripping.

  Press any key to return to selection...
```

---

## 12. Graceful Degradation Matrix

Tallow must look great everywhere, but degrade gracefully.

| Environment | Box Drawing | Color | QR | Spinner | Emoji | Progress Bar |
|---|---|---|---|---|---|---|
| Modern terminal (iTerm, Kitty, Ghostty) | Full Unicode | Truecolor | Yes | Braille | Native | Smooth (`━╸`) |
| Standard terminal (xterm, GNOME Terminal) | Full Unicode | 256-color | Yes | Braille | Native | Smooth |
| Windows Terminal | Full Unicode | Truecolor | Yes | Braille | Native | Smooth |
| Legacy Windows (cmd.exe) | ASCII (`+-\|`) | 16-color | No | ASCII (`\|/-`) | Text `[OK]` | Block (`#--`) |
| SSH session | Full Unicode | 256-color | No | Braille | Native | Smooth |
| Pipe / non-TTY | None | None | No | None | None | None |
| `NO_COLOR` env set | Full Unicode | None | Yes (monochrome) | Braille | Native | Monochrome |
| Screen reader (`--accessible`) | None | None | No | Text `[working...]` | Text labels | Text `45% (1.2/2.4 MB)` |

### Detection Logic (in order)

```rust
fn detect_capabilities() -> TermCapabilities {
    if !atty::is(Stream::Stderr) {
        return TermCapabilities::pipe();      // No formatting at all
    }
    if env::var("NO_COLOR").is_ok() {
        return TermCapabilities::no_color();   // Formatting without color
    }
    if env::var("TERM") == Ok("dumb".into()) {
        return TermCapabilities::dumb();       // Minimal ASCII
    }

    let color = detect_color_support();        // truecolor > 256 > 16 > none
    let unicode = detect_unicode_support();    // Full > limited > ASCII
    let width = terminal::size().map(|(w, _)| w).unwrap_or(80);

    TermCapabilities { color, unicode, width }
}
```

---

## 13. The "Copy-Paste UX" — Sharing the Receive Command

One of the most underrated UX details: when someone sends you a transfer code, they usually do it via chat/text/Slack. Make this seamless.

### Sender Output Optimized for Copy-Paste

The receive command is always on its own line, easy to triple-click select:

```
  Code: orbit-maple-thunder

  Share this with the receiver:
  tallow receive orbit-maple-thunder
```

### Clipboard Contains the Full Command

When auto-copied to clipboard, it copies:
```
tallow receive orbit-maple-thunder
```

Not just the code — the full command. So the receiver can paste directly into their terminal.

### URL Fallback for Non-CLI Recipients

```
  Code: orbit-maple-thunder

  For CLI:  tallow receive orbit-maple-thunder
  For web:  https://tallow.io/r/orbit-maple-thunder
```

The web URL (future PWA) lets non-CLI users receive files too. Shows the code is versatile.

---

## 14. Micro-Interactions That Build Trust

### The Encryption "Lock" Animation

When the key exchange completes, briefly flash a lock icon:

```
  ✓ Key exchange complete  🔒
```

The `🔒` appears with a brief brightening effect (bold → normal in 300ms). Subtle but reinforces that encryption is active.

### Integrity Verification Emphasis

After transfer, the integrity check gets its own visual moment:

```
  Verifying integrity...
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✓

  SHA-256: a3f2c891...  (matches sender)
```

The verification bar fills instantly (it's fast) but the visual creates a "the tool is checking" feeling.

### Relay Trust Indicator

```
  Relay: tallow.io 🛡️  (relay sees only encrypted data)
```

The shield + explanation appears once per session. Reassures users that the relay is untrusted-by-design.

---

## 15. Updated Rust Crate Stack for Premium UI

| Concern | Crate | Role |
|---|---|---|
| Progress & spinners | `indicatif` | Multi-progress, braille spinners, progress templates |
| Terminal styling | `console` | Capability detection, styled output, terminal width |
| Colors | `owo-colors` | Lightweight truecolor/256/16 support |
| Interactive prompts | `dialoguer` | Arrow-key select, confirm, password input, fuzzy match |
| Box drawing & layout | `comfy-table` or manual | Bordered output panels |
| QR code generation | `qrcode` + `unicode-width` | In-terminal QR codes from transfer codes |
| Clipboard | `arboard` | Cross-platform clipboard for code auto-copy |
| OS notifications | `notify-rust` | Desktop notifications on transfer complete |
| Error formatting | `miette` | Beautiful diagnostic errors with source context |
| Terminal detection | `atty` + `supports-color` | TTY check, color level detection |
| Human-readable units | `indicatif::HumanBytes` | "2.4 MB", "1.2 MB/s", "3 seconds" |

---

## 16. Implementation Priorities (UI-Specific)

### Must-Have for v1 (MVP feels polished)
- Braille spinner + smooth progress bar (`indicatif`)
- Animated step-by-step timeline (connect → handshake → transfer → done)
- Auto clipboard copy of receive command
- Adaptive layout (wide/standard/narrow)
- File type icons
- Color-coded security level indicator
- Graceful degradation (TTY detection, `NO_COLOR`)
- Copy-paste optimized output

### Should-Have for v1.1 (delightful)
- In-terminal QR code
- OS desktop notifications on long transfers
- Multi-file multi-progress bars
- Transfer history
- Contextual first-time hints
- Interactive receive with file preview
- `?` help in prompts

### Nice-to-Have for v2 (best-in-class)
- Code autocomplete on receive (partial match)
- Situational nudges (compression, identity)
- "Did you know?" tips during idle wait
- Real-time speed sparkline (mini-graph in progress bar)
- Receiver save-location picker
- Animated lock icon on key exchange
- Terminal bell / sound on completion
