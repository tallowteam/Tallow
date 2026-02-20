# Tallow CLI — UX & UI Plan

## Design Philosophy

Tallow should feel like `age` meets `croc` with the visual polish of Charmbracelet. The guiding principle: **security tools should be delightful, not intimidating.** Users who feel confident understand what's happening, and users who understand make fewer security mistakes.

Three pillars borrowed from clig.dev and adapted for a security-first tool:

1. **Human-first security** — Default to the safest option, but make that option feel effortless, not punitive.
2. **Conversational trust** — Every interaction should build the user's confidence that the tool is working correctly. Security tools that go silent make people nervous.
3. **Progressive disclosure** — Simple surface, deep capabilities. `tallow send file.pdf` should just work. `tallow send --tor --paranoid --expire 5m file.pdf` is there when you need it.

---

## 1. Command Structure

### Core Commands

Modeled after age's radical simplicity and croc's "just works" UX. The entire mental model fits in one sentence: **sender generates a code, receiver enters it.**

```
tallow send <file|dir>          # Send a file or directory
tallow receive [code]           # Receive (interactive prompt if no code)
tallow relay                    # Self-host a relay
tallow keygen                   # Generate identity keypair
tallow config                   # View/edit config
tallow version                  # Version + crypto primitives info
```

No subcommand nesting beyond one level. If it needs sub-subcommands, the design is too complex.

### Flag Conventions (clig.dev compliant)

```
-o, --output <path>       # Output location
-t, --tor                 # Route through Tor (SOCKS5 proxy)
-r, --relay <url>         # Custom relay server
-k, --key <identity>      # Use specific identity for encryption
-p, --passphrase          # Additional passphrase layer
-q, --quiet               # Suppress progress output
-v, --verbose             # Detailed output (crypto handshake info)
-y, --yes                 # Skip confirmation prompts
    --json                # Machine-readable JSON output
    --dry-run             # Show what would happen
    --paranoid            # Maximum security mode (combines: Tor + passphrase + short expiry)
    --expire <duration>   # Auto-expire transfer code (e.g., 5m, 1h)
```

Key design decisions:
- Short flags only for frequently used options
- `--json` for scriptability (composability principle from clig.dev)
- `--paranoid` as a named security preset, not an obscure flag combo — this is a pattern Reddit users praise in security tools
- `--dry-run` shows the transfer plan: relay endpoint, encryption layers, estimated time

---

## 2. First-Run Experience

Inspired by Charmbracelet's `huh` interactive forms and the "first-run wizard" pattern.

### Zero-Config Cold Start

Running `tallow send photo.jpg` for the first time with no setup should immediately work — generate ephemeral keys, use the default relay, and print the receive code. No config file needed, no keygen ceremony.

### Optional Init Wizard

```
$ tallow init

  ╭──────────────────────────────────────╮
  │         Welcome to Tallow            │
  │   Post-quantum encrypted transfers   │
  ╰──────────────────────────────────────╯

  ? Generate a persistent identity? (recommended for repeat use)
    ▸ Yes, create one now
      No, use ephemeral keys each time

  ? Default security profile:
    ▸ Standard (end-to-end encryption, default relay)
      Elevated (+ passphrase required on every transfer)
      Paranoid (+ Tor routing, short expiry codes)

  ? Relay server:
    ▸ Tallow public relay (tallow.io)
      Self-hosted (enter URL)

  ✓ Config saved to ~/.config/tallow/config.toml
  ✓ Identity saved to ~/.config/tallow/identity.key

  Get started:  tallow send <file>
```

Key UX decisions:
- Arrow-key selection, not text input — reduces friction and typos
- Safe defaults are pre-selected (the `▸` marker)
- Config file written in TOML (human-readable, easy to hand-edit)
- Skip-able with `tallow init --defaults` for scripts

---

## 3. The Transfer Flow — Sender Side

This is Tallow's core interaction loop and where UX matters most.

### Happy Path

```
$ tallow send quarterly-report.pdf

  ╭─ Sending ──────────────────────────────────╮
  │                                            │
  │  📄 quarterly-report.pdf (2.4 MB)          │
  │                                            │
  │  Encryption: ML-KEM-1024 + X25519          │
  │  Relay:      tallow.io (ping: 23ms)        │
  │                                            │
  │  Code:  orbit-maple-thunder                │
  │                                            │
  │  On the other device, run:                 │
  │  tallow receive orbit-maple-thunder        │
  │                                            │
  ╰────────────────────────────────────────────╯

  ⏳ Waiting for receiver...
```

Then, when the receiver connects:

```
  ✓ Receiver connected
  ✓ Key exchange complete (post-quantum)

  Sending ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 2.4/2.4 MB  1.2 MB/s  00:02

  ✓ Transfer complete
  ✓ Integrity verified (SHA-256: a3f2...c891)
```

### UX Details That Matter

**The code phrase system** (inspired by magic-wormhole/croc, which Reddit consistently praises):
- Three-word codes from a curated wordlist: `orbit-maple-thunder`
- Words chosen for: pronounceability across languages, no homophones, no ambiguity over phone/text
- Entropy: ~40 bits from 3 words, sufficient for ephemeral one-time codes
- Codes expire after one use or configurable timeout

**The progress display** (following Evil Martians' CLI UX patterns):
- Rich progress bar with: percentage, transferred/total, speed, ETA
- Uses `indicatif` crate — the gold standard for Rust CLI progress
- Falls back to simple dot-ticker if terminal doesn't support ANSI

**The security banner**:
- Always shows which crypto primitives are active — builds trust
- Relay ping shown upfront so user knows if something is slow before transfer starts
- Post-quantum algorithm named explicitly — this is a differentiator, show it off

---

## 4. The Transfer Flow — Receiver Side

### Interactive Mode

```
$ tallow receive

  ? Enter transfer code: orbit-maple-thunder

  ╭─ Incoming Transfer ──────────────────────────╮
  │                                              │
  │  📄 quarterly-report.pdf (2.4 MB)            │
  │  From: (ephemeral key, no identity)          │
  │                                              │
  ╰──────────────────────────────────────────────╯

  ? Accept transfer? [Y/n] y

  Receiving ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 2.4/2.4 MB  1.2 MB/s  00:02

  ✓ Transfer complete
  ✓ Integrity verified
  ✓ Saved to ./quarterly-report.pdf
```

### Direct Mode

```
$ tallow receive orbit-maple-thunder
```

Skips the interactive prompt — important for scripting and for when someone texts you the code.

### Collision/Overwrite Handling

```
  ⚠ quarterly-report.pdf already exists

  ? What would you like to do?
    ▸ Save as quarterly-report (1).pdf
      Overwrite existing file
      Choose a different location
      Cancel
```

---

## 5. Error Handling & Recovery

The #1 complaint about CLI tools on Reddit/HN: **cryptic errors.** Tallow should never show a raw stack trace.

### Error Design Principles

Every error message should answer three questions:
1. **What happened?** (plain English, no jargon)
2. **Why?** (context-specific)
3. **What to do next?** (actionable suggestion)

### Error Examples

**Network failure:**
```
  ✗ Connection to relay lost after 1.8 MB transferred

  The relay server at tallow.io stopped responding.
  Your transfer can be resumed — the code is still valid.

  Try again:  tallow send --resume quarterly-report.pdf
  Or use:     tallow send --relay <backup-relay-url> quarterly-report.pdf
```

**Invalid code:**
```
  ✗ No transfer found for code "orbit-maple-thundr"

  Did you mean: orbit-maple-thunder ?

  Codes expire after 10 minutes by default.
  Ask the sender to generate a new code if it's expired.
```

**Tor not available:**
```
  ✗ Tor proxy not reachable at 127.0.0.1:9050

  Tallow tried to connect via Tor (--tor flag) but couldn't
  reach a local Tor daemon.

  Options:
    1. Start Tor:     sudo systemctl start tor
    2. Install Tor:   sudo apt install tor
    3. Skip Tor:      tallow send photo.jpg  (without --tor)
```

**Wrong passphrase:**
```
  ✗ Passphrase verification failed

  The sender encrypted this transfer with an additional passphrase.
  The one you entered didn't match.

  You have 2 attempts remaining before the transfer is invalidated.
```

### Typo Correction (git-style)

```
$ tallw send photo.jpg
  Did you mean: tallow send photo.jpg ?
```

The CLI should register common misspellings as shell aliases or provide a suggestion — modeled after git's fuzzy command matching that clig.dev specifically calls out as good practice.

---

## 6. Security UX

### Transparency Without Overwhelm

The `--verbose` flag shows the full handshake:

```
$ tallow send --verbose secret.pdf

  [handshake] Initiating ML-KEM-1024 key encapsulation...
  [handshake] X25519 ephemeral key exchange complete
  [handshake] Session key derived via HKDF-SHA256
  [handshake] AES-256-GCM cipher initialized
  [crypto]    File chunked: 24 × 100KB blocks
  [relay]     Connected to tallow.io:443 (TLS 1.3)
  [relay]     Relay cannot see file contents (E2E encrypted)

  Code:  orbit-maple-thunder
```

But the default output just shows: `Encryption: ML-KEM-1024 + X25519` — enough for trust, not enough to overwhelm.

### Paranoid Mode

A single flag that combines everything:

```
$ tallow send --paranoid secret.pdf

  🔒 Paranoid mode active
     ├─ Tor routing:       enabled (connecting...)
     ├─ Passphrase:        required
     ├─ Code expiry:       5 minutes
     ├─ Max attempts:      3
     └─ Metadata stripped: yes

  ? Set transfer passphrase: ••••••••••
  ? Confirm passphrase:      ••••••••••

  Code:  orbit-maple-thunder  (expires in 5:00)
```

### Security Audit Command

```
$ tallow audit

  ╭─ Security Audit ───────────────────────────────╮
  │                                                │
  │  Binary integrity:     ✓ verified              │
  │  Crypto primitives:    ✓ ML-KEM-1024, X25519   │
  │  Relay TLS:            ✓ TLS 1.3, pinned cert  │
  │  Identity key:         ✓ stored (encrypted)    │
  │  Config permissions:   ✓ 600 (owner only)      │
  │  Tor available:        ✗ not installed          │
  │                                                │
  │  Overall: Good (5/6 checks passed)             │
  │                                                │
  │  Recommendation: Install Tor for anonymity     │
  │  sudo apt install tor                          │
  │                                                │
  ╰────────────────────────────────────────────────╯
```

---

## 7. Output Modes & Composability

### Human Mode (default)

Rich formatting, progress bars, color, box-drawing characters. Detects terminal capabilities automatically.

### Quiet Mode (`--quiet`)

Minimal output — only the code phrase on send, only the filename on receive. For piping:

```
$ CODE=$(tallow send --quiet photo.jpg)
$ echo "Receive with: tallow receive $CODE"
```

### JSON Mode (`--json`)

Full machine-readable output for automation:

```json
{
  "status": "complete",
  "file": "quarterly-report.pdf",
  "size_bytes": 2516582,
  "code": "orbit-maple-thunder",
  "encryption": {
    "kem": "ML-KEM-1024",
    "kex": "X25519",
    "cipher": "AES-256-GCM"
  },
  "transfer": {
    "duration_ms": 2340,
    "speed_bps": 1075000,
    "integrity": "sha256:a3f2...c891"
  }
}
```

### Pipe Support

```
$ tar cf - ./documents | tallow send -    # Send from stdin
$ tallow receive orbit-maple-thunder -o - | tar xf -   # Receive to stdout
```

---

## 8. Configuration

### File Location

Follow XDG Base Directory spec:
- Config: `~/.config/tallow/config.toml`
- Identity keys: `~/.config/tallow/identity.key`
- Data/cache: `~/.local/share/tallow/`

### Config File (TOML)

```toml
# ~/.config/tallow/config.toml

[relay]
url = "tallow.io"
fallback = ["relay2.tallow.io"]

[security]
profile = "standard"     # standard | elevated | paranoid
default_expiry = "10m"
max_file_size = "10GB"

[tor]
enabled = false
proxy = "127.0.0.1:9050"

[ui]
color = "auto"           # auto | always | never
progress = "bar"         # bar | dots | none
emoji = true
```

### Environment Variable Overrides

```
TALLOW_RELAY=my-relay.example.com
TALLOW_TOR=true
TALLOW_COLOR=never
```

Convention: `TALLOW_` prefix, uppercased flag names. Environment overrides config file, flags override both.

---

## 9. Help System

### Tiered Help (clig.dev pattern)

**Quick help** — shows on no arguments or `--help`:

```
$ tallow

  Tallow — Post-quantum encrypted file transfer

  Usage:
    tallow send <file>          Send a file
    tallow receive [code]       Receive a file
    tallow config               Manage configuration
    tallow keygen               Generate identity keypair

  Flags:
    -t, --tor       Route through Tor
    -p, --passphrase  Add passphrase protection
    -h, --help      Show help for any command
    -V, --version   Show version info

  Examples:
    tallow send photo.jpg
    tallow receive orbit-maple-thunder
    tallow send --tor --paranoid secret.pdf

  Docs: https://tallow.io/docs
```

**Command-specific help** — `tallow send --help`:

```
$ tallow send --help

  Send a file or directory with end-to-end encryption

  Usage: tallow send [flags] <path>

  Arguments:
    <path>    File or directory to send (use - for stdin)

  Flags:
    -r, --relay <url>       Use custom relay server
    -k, --key <identity>    Encrypt to specific recipient
    -p, --passphrase        Require additional passphrase
    -t, --tor               Route via Tor for anonymity
        --expire <dur>      Code expiry time [default: 10m]
        --paranoid          Maximum security defaults
        --resume            Resume interrupted transfer
    -q, --quiet             Minimal output
        --json              JSON output
    -y, --yes               Skip confirmations

  Examples:
    tallow send report.pdf
    tallow send --tor --expire 5m secrets/
    cat data.bin | tallow send -
    tallow send --key age1abc...def report.pdf
```

**Deep reference** — `tallow help security`:

```
$ tallow help security

  Security Model
  ──────────────

  Tallow uses a layered encryption approach:

  Layer 1: Key Exchange
    Post-quantum: ML-KEM-1024 (NIST FIPS 203)
    Classical:    X25519 (Curve25519 ECDH)
    Combined via hybrid key exchange for defense-in-depth

  Layer 2: Symmetric Encryption
    AES-256-GCM authenticated encryption
    Session key derived via HKDF-SHA256

  Layer 3: Transport
    TLS 1.3 to relay (relay never sees plaintext)
    Optional: Tor SOCKS5 proxy for network anonymity

  The relay server is untrusted by design — it sees only
  encrypted blobs and cannot decrypt, modify, or attribute
  transfers to specific users.

  For full details: https://tallow.io/docs/security
```

---

## 10. Shell Completions

Generate completions for all major shells:

```
$ tallow completions bash >> ~/.bashrc
$ tallow completions zsh >> ~/.zshrc
$ tallow completions fish > ~/.config/fish/completions/tallow.fish
```

Tab-completion should cover: subcommands, flags, file paths, and even recently used relay URLs from config.

---

## 11. Visual Design System

### Color Palette

```
Primary:        Bright green (#00FF87)  — success states, progress bar fill
Accent:         Cyan (#00D7FF)          — info, highlights, code phrases
Warning:        Yellow (#FFD700)        — warnings, expiry notices
Error:          Red (#FF5F5F)           — errors, failed states
Muted:          Gray (#808080)          — secondary info, timestamps
Security:       Magenta (#FF87FF)       — security-related indicators
Box borders:    Dim white (#C0C0C0)     — frames, dividers
```

### Box Drawing

Use Unicode box-drawing characters for framing important information (transfer details, audit results). Charmbracelet's `lipgloss` in Go is the gold standard — for Rust, achieve similar with `ratatui` or custom formatting with the `crossterm` crate.

### Terminal Capability Detection

- 256-color/truecolor: Full palette
- 16-color: Mapped palette
- No color (pipe, `NO_COLOR` env): Stripped formatting
- Narrow terminal (<60 cols): Simplified layout, no boxes

---

## 12. Accessibility

- Respect `NO_COLOR` environment variable (https://no-color.org/)
- Screen reader friendly: `--no-emoji` flag replaces symbols with text (`[OK]` instead of `✓`)
- All progress info written to stderr (so stdout stays clean for piping)
- Exit codes follow standard conventions: 0 success, 1 general error, 2 usage error, 130 interrupted

---

## 13. Rust Implementation Stack

| Concern | Crate | Why |
|---|---|---|
| Argument parsing | `clap` (derive) | Industry standard, excellent help generation, shell completions built-in |
| Progress bars | `indicatif` | Gold standard for Rust CLI progress display |
| Terminal styling | `console` + `owo-colors` | Lightweight, handles capability detection |
| Interactive prompts | `dialoguer` | Arrow-key selection, password input, confirmation |
| Box drawing/layout | `crossterm` | Low-level terminal control for custom layouts |
| Config | `toml` + `dirs` | XDG paths + human-readable config |
| Error handling | `color-eyre` / `miette` | Beautiful, contextual error reports |
| Logging | `tracing` + `tracing-subscriber` | Structured logging, `--verbose` integration |

### When to Use `ratatui`

Ratatui is powerful but heavy. For Tallow v1, avoid full TUI mode. The interactive elements (prompts, progress bars) are well-served by `dialoguer` + `indicatif`. Consider ratatui only for a future `tallow dashboard` command showing relay status, active transfers, and connection monitoring.

---

## 14. Competitive Differentiation

| Feature | croc | magic-wormhole | age | **Tallow** |
|---|---|---|---|---|
| Post-quantum crypto | No | No | Partial (plugin) | **Native** |
| Progress display | Basic | Basic | N/A | **Rich** |
| Tor integration | SOCKS5 flag | Built-in | N/A | **First-class** |
| Resumable | Yes | No | N/A | **Yes** |
| Code phrases | Yes | Yes | N/A | **Yes** |
| Paranoid mode preset | No | No | No | **Yes** |
| Security audit | No | No | No | **Yes** |
| JSON output | No | No | No | **Yes** |
| Shell completions | No | No | No | **Yes** |
| Error UX | Basic | Basic | Good | **Excellent** |

Tallow's UX advantage: it takes the simplicity that people love about croc, the security focus of age, adds post-quantum crypto as a native differentiator, and wraps it all in modern CLI UX that makes users feel confident about security.

---

## 15. Implementation Priority

### Phase 1 — Core Loop (MVP)
- `send` / `receive` with code phrases
- `indicatif` progress bars
- Basic error messages with suggestions
- `--quiet` and `--json` flags
- `--help` with examples

### Phase 2 — Polish
- `tallow init` wizard with `dialoguer`
- Shell completions via `clap_complete`
- `--tor` integration
- `--paranoid` preset
- Rich box-drawing output
- Typo suggestions on invalid commands
- Resume interrupted transfers

### Phase 3 — Power Features
- `tallow audit` security checker
- `tallow keygen` with identity management
- `tallow config` interactive editor
- `tallow help <topic>` deep reference
- `NO_COLOR` + accessibility flags
- `--dry-run` mode
- Notification on transfer complete (terminal bell or OS notification)

### Phase 4 — Ecosystem
- `tallow relay` self-hosting with status dashboard
- `tallow completions` for bash/zsh/fish
- Man page generation from `clap`
- Homebrew formula, AUR package, Nix flake
- VHS-recorded demo GIFs for README (Charmbracelet's VHS tool)
