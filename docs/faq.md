# Tallow FAQ

Frequently asked questions about tallow, the post-quantum encrypted file transfer tool.

---

## Table of Contents

- [General](#general)
- [Security](#security)
- [Usage](#usage)
- [Relay](#relay)
- [Troubleshooting](#troubleshooting)

---

## General

### What is tallow?

Tallow is a command-line tool for sending files securely between two computers. It encrypts everything end-to-end using post-quantum cryptography, routes data through a relay server that never sees the plaintext, and requires no accounts, no cloud storage, and no configuration. You run `tallow send`, share a code phrase, and the other person runs `tallow receive`. That is it.

### How is tallow different from croc, Magic Wormhole, scp, and rsync?

| Feature | tallow | croc | Magic Wormhole | scp / rsync |
|---------|--------|------|----------------|-------------|
| **Quantum-safe encryption** | Yes (ML-KEM-1024 + X25519 hybrid) | No | No | No |
| **Language** | Rust (`#![forbid(unsafe_code)]`) | Go | Python | C |
| **Transport** | QUIC (0-RTT, multiplexed, UDP) | TCP | TCP + WebSocket | TCP (SSH) |
| **Compression** | Adaptive (zstd, brotli, lz4, lzma) | None | None | Optional (ssh -C) |
| **Resumable transfers** | Yes (checkpoints) | Yes | No | rsync yes, scp no |
| **Directory sync** | Built-in (`tallow sync`) | No | No | rsync yes |
| **Encrypted chat** | Built-in (`tallow chat`) | No | No | No |
| **Tor support** | SOCKS5 proxy (`--proxy`) | No | Partial | Via tor + ssh |
| **Key zeroization** | Secure (zeroize + mlock) | GC-managed | GC-managed | Varies |
| **Accounts required** | No | No | No | SSH keys |
| **Self-hostable relay** | Yes | Yes | Yes | N/A (direct) |

The main differences: tallow is quantum-safe, uses Rust's memory safety guarantees, provides built-in compression and sync, and treats the relay as fully hostile by design.

### Is tallow free? What license?

Tallow is free and open-source software licensed under [AGPL-3.0-or-later](https://www.gnu.org/licenses/agpl-3.0.html). You can use it, modify it, and distribute it freely. If you modify tallow and run it as a network service, the AGPL requires you to release your modifications.

### Who is behind tallow?

Tallow is developed by the [tallowteam](https://github.com/tallowteam) on GitHub. It is a community-driven project focused on making practical, security-maximalist file transfer available to everyone.

### Can I use tallow for commercial purposes?

Yes. The AGPL-3.0 license permits commercial use. You can use tallow within your organization, integrate it into your workflows, and even distribute it as part of a product. The only requirement is that if you modify the source code and provide it as a network service, you must make the modified source code available to users of that service.

---

## Security

### Is tallow really quantum-safe?

Yes. Tallow uses a **hybrid** key exchange that combines:

- **ML-KEM-1024** (NIST FIPS 203) -- a post-quantum key encapsulation mechanism based on lattice problems. This is resistant to attacks by future quantum computers.
- **X25519** (RFC 7748) -- a classical elliptic curve Diffie-Hellman. This protects against flaws in the post-quantum algorithm.

The hybrid approach means that an attacker would need to break **both** algorithms to compromise the key exchange. Even if ML-KEM turns out to have a weakness, X25519 still protects you (and vice versa).

The session key is derived via HKDF-SHA256 from both shared secrets, so the security level is the maximum of the two.

### What happens if the relay is compromised?

Nothing useful to the attacker. The relay is a zero-knowledge pass-through. It forwards encrypted bytes between peers and has no access to:

- The plaintext file content
- The encryption keys
- The code phrase
- The original filenames (when filename encryption is enabled)

Even with full control of the relay server (including memory inspection), an attacker sees only AES-256-GCM ciphertext encrypted with a key derived from a post-quantum key exchange. The relay never participates in the key exchange and cannot derive the session key.

### How does the code phrase work?

When you run `tallow send`, a code phrase is generated from the [EFF wordlist](https://www.eff.org/dice) -- for example, `stamp-daybreak-kindred-preface`. This code phrase serves two purposes:

1. **Room matching:** Both parties hash the code phrase with BLAKE3 to derive a room code. The relay uses this to match sender and receiver.
2. **Key exchange authentication:** The code phrase provides a shared secret that authenticates the key exchange, preventing a man-in-the-middle relay from substituting its own keys.

The code phrase is never sent to the relay in plaintext. Only its BLAKE3 hash is used for room matching.

By default, code phrases are 4 words long, providing approximately 51 bits of entropy (from the 7,776-word EFF list). You can increase this with `--words 6` or `--words 8`.

### Can someone intercept my files?

For a network attacker (someone sniffing your WiFi, a compromised router, or an ISP monitoring traffic): **No.** All data is encrypted with AES-256-GCM before it leaves your machine. The key is established via a post-quantum key exchange that cannot be broken by passive observation.

For a man-in-the-middle attacker (someone who controls the relay): **Extremely unlikely.** The code phrase authenticates the key exchange. An attacker would need to guess the code phrase to substitute their own keys. With a 4-word code phrase, there are ~7776^4 possibilities (roughly 51 bits of entropy).

For additional protection against sophisticated attackers, use the `--verify` flag to display a verification string after the key exchange. Both parties can compare this string out-of-band (phone call, in person) to confirm no MITM occurred.

### What is a "zero-knowledge" relay?

A zero-knowledge relay is a relay server that processes encrypted data without having access to the encryption keys or the plaintext. The tallow relay:

- Does not participate in the key exchange
- Does not store transferred data (pure pass-through)
- Does not log file contents, names, or sizes
- Does not require authentication from users (optional, for private relays)
- Cannot decrypt any data that passes through it

"Zero-knowledge" means the relay has zero knowledge of what is being transferred. It knows only that two peers are connected and bytes are flowing between them.

### How do safety numbers work?

Safety numbers provide a way to verify that no man-in-the-middle attack occurred during the key exchange. After a key exchange completes, both sides can compute a verification string derived from the shared session key.

Use the `--verify` flag:

```bash
tallow send myfile.txt --verify
tallow receive code-phrase --verify
```

Both sides will display a numeric or emoji safety number after connecting. Compare these out-of-band (phone, text, in person). If they match, the connection is authentic.

For emoji format (easier to compare verbally):

```bash
tallow identity fingerprint --emoji
```

### Is the code audited?

Tallow uses well-established, peer-reviewed cryptographic libraries from the RustCrypto ecosystem and NIST-standardized algorithms. The individual cryptographic primitives (ML-KEM, AES-GCM, X25519, BLAKE3) are implemented by widely-used crates with significant community review.

Tallow itself has not yet undergone a formal third-party security audit. The project follows security-first development practices:

- `#![forbid(unsafe_code)]` in all crates (except crypto internals with documented `// SAFETY:` justifications)
- Over 600 tests including property-based testing with `proptest`
- `cargo audit` and `cargo deny` for CVE scanning
- Constant-time operations for all secret-dependent comparisons
- Secure memory wiping with `zeroize` and RAM pinning with `mlock`

A formal audit is planned as the project matures.

### Why AGPL and not MIT?

The AGPL-3.0 license ensures that anyone who modifies tallow and runs it as a service (such as a public relay) must release their modifications. This prevents closed-source forks of the relay that could introduce backdoors or weaken the cryptography. For a security-critical tool, this transparency is important.

If you use tallow as a command-line tool without modifying the source, the AGPL imposes no additional obligations beyond what MIT would.

---

## Usage

### How do I send a file?

```bash
tallow send report.pdf
```

Tallow prints a code phrase. Share it with the receiver through any channel (text, email, phone, in person). The receiver then runs:

```bash
tallow receive stamp-daybreak-kindred-preface
```

### How do I send a directory?

Pass the directory path to `tallow send`:

```bash
tallow send ./my-project/
```

Tallow recursively sends all files in the directory. To exclude certain files:

```bash
tallow send ./my-project/ --exclude "*.log,node_modules,.git"
```

To automatically respect `.gitignore` rules:

```bash
tallow send ./my-project/ --git
```

### How do I send text or clipboard data?

**Send a text message directly:**

```bash
tallow send -t "The launch code is 42"
```

**Pipe data from stdin:**

```bash
echo "secret message" | tallow send
```

**Pipe from another command:**

```bash
tar czf - ./src | tallow send
```

The receiver gets the piped data and can redirect it:

```bash
tallow receive code-phrase > archive.tar.gz
```

### Can I resume interrupted transfers?

Yes. If a transfer is interrupted (network drop, Ctrl+C, power loss), tallow saves checkpoint state. To resume:

```bash
tallow receive code-phrase --resume-id <transfer-id>
```

The transfer ID is displayed when the transfer starts. Tallow resumes from the last successfully received chunk, so no data is re-transferred.

### How fast is tallow?

Transfer speed depends on:

- **Network bandwidth** between you and the relay (and between the relay and the receiver)
- **CPU speed** for encryption/decryption (AES-256-GCM with AES-NI hardware acceleration)
- **Compression ratio** of the data being sent

On a typical broadband connection with AES-NI hardware acceleration, tallow achieves throughput close to the network's maximum. The encryption and compression overhead is minimal because:

- AES-256-GCM with AES-NI can process multiple GB/s on modern CPUs
- QUIC transport provides 0-RTT connection setup and multiplexed streams
- Adaptive compression (zstd/lz4/brotli/lzma) picks the best algorithm for your data

You can limit bandwidth with `--throttle`:

```bash
tallow send large.iso --throttle 10MB   # limit to 10 MB/s
```

### What is the maximum file size?

There is no hard limit imposed by tallow. Files are chunked into 256 KB segments (configurable) and streamed through the relay, so memory usage is constant regardless of file size. Practical limits are:

- **Relay timeout:** The default room timeout is 600 seconds (10 minutes). For very large files on slow connections, you may need a relay with a longer timeout.
- **Disk space:** The receiver needs enough disk space for the received file.
- **Counter nonce space:** Tallow uses counter-based nonces with a 64-bit counter, allowing up to 2^64 chunks per session -- far more than any practical file.

Multi-gigabyte and multi-terabyte transfers work fine.

### Can I use tallow over Tor?

Yes. Tallow supports routing traffic through a SOCKS5 proxy, which includes Tor:

**Start Tor** (if not already running):

```bash
# Linux
sudo apt install tor && sudo systemctl start tor

# macOS
brew install tor && brew services start tor
```

**Send/receive through Tor:**

```bash
tallow send myfile.txt --proxy socks5://127.0.0.1:9050
tallow receive code-phrase --proxy socks5://127.0.0.1:9050
```

This routes all relay traffic through Tor, hiding your IP address from the relay. The relay sees the Tor exit node's IP, not yours.

Both sender and receiver should use `--proxy` for maximum anonymity. If only one side uses Tor, the other side's IP is still visible to the relay.

### How do I use a custom relay?

**Per-transfer:**

```bash
tallow send myfile.txt --relay your-server.com:4433
tallow receive code-phrase --relay your-server.com:4433
```

Both sender and receiver must specify the same relay.

**With a password-protected relay:**

```bash
tallow send myfile.txt --relay your-server.com:4433 --relay-pass "your-secret"
```

**Set a permanent default relay:**

```bash
tallow config set network.relay_servers '["your-server.com:4433"]'
```

Or via environment variable:

```bash
export TALLOW_RELAY="your-server.com:4433"
export TALLOW_RELAY_PASS="your-secret"
```

### Can I transfer between different operating systems?

Yes. Tallow is fully cross-platform. You can send from Linux to Windows, from macOS to a Raspberry Pi, or any other combination. The wire protocol is the same on all platforms.

The only consideration is filename compatibility. If you send a file from Linux with characters that are invalid on Windows (like `:`), tallow sanitizes the filename on the receiving side to prevent errors.

### How do I transfer multiple files?

Pass multiple files to `tallow send`:

```bash
tallow send file1.txt file2.pdf image.png
```

Or send an entire directory:

```bash
tallow send ./my-files/
```

### What compression does tallow use?

Tallow uses adaptive compression that automatically selects the best algorithm for your data:

| Algorithm | Best for | Speed | Ratio |
|-----------|----------|-------|-------|
| **lz4** | Already-compressed data, speed priority | Fastest | Low |
| **zstd** | General purpose (default) | Fast | Good |
| **brotli** | Text, web assets | Medium | Excellent |
| **lzma** | Maximum compression, archive use | Slow | Best |

By default, tallow uses `auto` mode, which analyzes the data and picks the best algorithm. You can override this:

```bash
tallow send large.iso --compress none    # skip compression (for already-compressed files)
tallow send dataset.csv --compress zstd  # force zstd
tallow send logs.txt --compress brotli   # force brotli for text
tallow send archive/ --compress lzma     # force maximum compression
```

### How do I check transfer integrity?

Tallow automatically verifies integrity at multiple levels:

1. **Per-chunk authentication:** Every 256 KB chunk is encrypted with AES-256-GCM, which provides authenticated encryption. Any tampered chunk is rejected.
2. **Chunk ordering:** Additional authenticated data (AAD) binds each chunk to its index, preventing reordering attacks.
3. **Total count verification:** The final chunk authenticates the total chunk count, preventing truncation attacks.
4. **Merkle tree integrity:** BLAKE3 Merkle trees provide whole-file integrity verification.

If any integrity check fails, the transfer is aborted and the partially received data is discarded. You do not need to manually verify integrity -- it is built into the protocol.

---

## Relay

### What is a relay?

A relay is a server that forwards encrypted bytes between the sender and receiver. It exists because most home networks are behind NAT (Network Address Translation), which makes direct peer-to-peer connections difficult.

The relay:
- Matches sender and receiver using a room code
- Forwards encrypted bytes between them
- Never decrypts, inspects, or stores the data
- Is treated as fully untrusted by the protocol

Think of it as a postal service that delivers sealed envelopes. It can see that an envelope went from A to B, but it cannot read the contents.

### Do I need to run my own relay?

No. Tallow connects to a community relay by default. Running your own relay is optional and recommended only if you:

- Want complete control over the infrastructure
- Need a relay in a specific geographic region for latency
- Want a private relay that only your team can use
- Need custom rate limits, connection limits, or timeouts

### How do I set up my own relay?

**Quick start:**

```bash
# Install
cargo install --git https://github.com/tallowteam/Tallow tallow-relay

# Run
tallow-relay serve --bind 0.0.0.0:4433

# Run with password protection
tallow-relay serve --bind 0.0.0.0:4433 --pass "your-secret"
```

**Production setup with systemd:**

See the [Systemd Integration](platform-setup.md#systemd-integration) section in the platform guide, or use the deployment script:

```bash
# On your server
git clone https://github.com/tallowteam/Tallow.git
bash Tallow/deploy/setup-relay.sh
```

**Docker:**

```bash
docker run -d -p 4433:4433/udp ghcr.io/tallowteam/tallow-relay:latest
```

**Tell clients to use your relay:**

```bash
tallow send myfile.txt --relay your-server.com:4433
```

### How do I password-protect my relay?

Start the relay with a password:

```bash
tallow-relay serve --bind 0.0.0.0:4433 --pass "your-secret"
```

Clients must provide the password to connect:

```bash
tallow send myfile.txt --relay your-server.com:4433 --relay-pass "your-secret"
```

The password is verified using BLAKE3 hashing with constant-time comparison. It is never transmitted in plaintext -- only a derived authentication token is sent.

You can also set the relay password via environment variable to keep it out of your shell history:

```bash
export TALLOW_RELAY_PASS="your-secret"
tallow send myfile.txt --relay your-server.com:4433
```

### What resources does a relay need?

The relay is lightweight. Requirements scale with concurrent connections:

| Concurrent rooms | RAM | CPU | Bandwidth |
|-----------------|-----|-----|-----------|
| 10 | ~50 MB | Minimal | Depends on transfers |
| 100 | ~100 MB | 1 core | Depends on transfers |
| 1,000 | ~500 MB | 1-2 cores | Depends on transfers |
| 10,000 | ~2 GB | 2-4 cores | Depends on transfers |

The relay passes through encrypted bytes without processing them, so CPU usage is minimal. The primary resource is bandwidth -- the relay must handle the combined throughput of all active transfers in both directions.

A free-tier cloud instance (1 vCPU, 1 GB RAM) can comfortably handle hundreds of concurrent rooms.

**Recommended configuration values (`relay.toml`):**

```toml
bind_addr = "0.0.0.0:4433"
max_connections = 10000    # maximum concurrent connections
max_rooms = 5000           # maximum concurrent rooms
rate_limit = 100           # requests per second per IP
room_timeout_secs = 600    # close inactive rooms after 10 minutes
```

### Can I use multiple relays?

Yes. You can configure multiple relay servers in your config:

```bash
tallow config set network.relay_servers '["relay1.example.com:4433", "relay2.example.com:4433"]'
```

However, both sender and receiver must connect to the **same** relay for a transfer. The code phrase includes an implicit relay selection. When using `--relay` on the command line, both parties must specify the same relay address.

---

## Troubleshooting

### "Connection refused" error

**Cause:** The relay server is not reachable or not running.

**Solutions:**

1. Check that you can reach the relay:
   ```bash
   tallow doctor
   ```

2. If using a custom relay, verify it is running:
   ```bash
   tallow-relay serve --bind 0.0.0.0:4433
   ```

3. Check firewall rules -- UDP port 4433 must be open (see platform-specific firewall sections).

4. If behind a corporate firewall, UDP may be blocked. Ask your network administrator about UDP 4433 access.

5. Try a different relay:
   ```bash
   tallow send myfile.txt --relay different-relay.com:4433
   ```

### "Connection lost" / timeout errors

**Cause:** The network connection was interrupted during a transfer.

**Solutions:**

1. Check your internet connection stability.

2. If on WiFi, try moving closer to the access point or switching to a wired connection.

3. If the transfer was interrupted, resume it:
   ```bash
   tallow receive code-phrase --resume-id <transfer-id>
   ```

4. For large files on unstable connections, consider throttling to reduce packet loss:
   ```bash
   tallow send large.iso --throttle 5MB
   ```

5. The relay has a room timeout (default: 600 seconds). If you are idle for longer than this, the room is closed. Restart the transfer.

### Transfer is very slow

**Possible causes and solutions:**

1. **Relay location:** If the relay is geographically far from both parties, latency adds up. Run your own relay closer to your region.

2. **Compression on already-compressed data:** Compressing already-compressed files (zip, mp4, jpg) wastes CPU. Use `--compress none`:
   ```bash
   tallow send movie.mp4 --compress none
   ```

3. **ISP throttling UDP:** Some ISPs throttle UDP traffic. This is hard to diagnose but switching to a different network may help.

4. **Relay bandwidth:** The community relay has finite bandwidth shared among all users. Run your own relay for dedicated throughput.

5. **Debug mode:** Enable verbose logging to see where time is spent:
   ```bash
   RUST_LOG=debug tallow send myfile.txt
   ```

### Firewall blocking transfers

Tallow uses **UDP port 4433** (QUIC protocol). If transfers fail with connection errors:

**Linux:**

```bash
# Check if port is blocked
sudo iptables -L -n | grep 4433

# Open it
sudo ufw allow 4433/udp    # Ubuntu
sudo firewall-cmd --permanent --add-port=4433/udp && sudo firewall-cmd --reload  # Fedora
```

**macOS:**

Check System Settings > Network > Firewall. Add tallow as an allowed application.

**Windows:**

```powershell
# Check
Get-NetFirewallRule | Where-Object { $_.LocalPort -eq 4433 }

# Open (as Administrator)
New-NetFirewallRule -DisplayName "Tallow" -Direction Inbound -Protocol UDP -LocalPort 4433 -Action Allow
```

**Note:** For the tallow client (not relay), you typically do not need to open firewall ports. Only outbound connections are made. Firewall rules are needed when running a relay server.

### "Permission denied" on Linux

**Cause:** File permission issues when saving received files.

**Solutions:**

1. Specify a writable output directory:
   ```bash
   tallow receive code-phrase --output ~/Downloads/
   ```

2. Check permissions on the target directory:
   ```bash
   ls -la ~/Downloads/
   ```

3. If tallow cannot create its config directory, create it manually:
   ```bash
   mkdir -p ~/.config/tallow ~/.local/share/tallow ~/.cache/tallow
   ```

4. Run `tallow doctor` to check for directory issues:
   ```bash
   tallow doctor
   ```

### Windows Defender blocking tallow

**Symptom:** Tallow is flagged as potentially harmful, quarantined, or blocked from running.

**Solutions:**

1. **Add an exclusion** in Windows Security:
   - Open Windows Security > Virus & threat protection > Manage settings
   - Scroll to Exclusions > Add or remove exclusions
   - Add the tallow binary path

   Or via PowerShell (as Administrator):
   ```powershell
   Add-MpPreference -ExclusionPath "C:\Users\$env:USERNAME\scoop\apps\tallow\current\tallow.exe"
   ```

2. **Restore from quarantine** if already quarantined:
   - Windows Security > Virus & threat protection > Protection history
   - Find the tallow entry > Actions > Restore

3. **Build from source** -- locally compiled binaries are less likely to trigger false positives:
   ```powershell
   cargo install --git https://github.com/tallowteam/Tallow tallow
   ```

### Code phrase not working

**Symptom:** Receiver enters the code phrase but nothing happens, or "room not found" error.

**Solutions:**

1. **Exact match required:** Code phrases are case-insensitive but must be exact. Double-check for typos. The format is `word-word-word-word` with hyphens.

2. **Both sides must use the same relay:** If the sender used `--relay custom-server:4433`, the receiver must also use `--relay custom-server:4433`.

3. **Room timeout:** If the sender started the transfer more than 10 minutes ago (default timeout), the room may have expired. Have the sender run `tallow send` again to get a new code phrase.

4. **Relay password mismatch:** If the relay requires a password, both sides must provide the same password with `--relay-pass`.

5. **Network issues:** Run `tallow doctor` on both sides to verify connectivity.

### Relay authentication failed

**Symptom:** Error message about relay authentication when connecting.

**Solutions:**

1. **Wrong password:** Verify you are using the correct relay password:
   ```bash
   tallow send myfile.txt --relay your-server:4433 --relay-pass "correct-password"
   ```

2. **Environment variable conflict:** Check if `TALLOW_RELAY_PASS` is set to a different value:
   ```bash
   echo $TALLOW_RELAY_PASS    # Linux/macOS
   echo %TALLOW_RELAY_PASS%   # Windows CMD
   echo $env:TALLOW_RELAY_PASS  # PowerShell
   ```

3. **Relay not password-protected:** If connecting to the community relay or a relay without a password, do not pass `--relay-pass`. Remove `TALLOW_RELAY_PASS` from your environment if set.

### How do I get debug logs?

Tallow uses the `RUST_LOG` environment variable for log verbosity:

```bash
# Basic debug output
RUST_LOG=debug tallow send myfile.txt

# Verbose trace output (very detailed)
RUST_LOG=trace tallow send myfile.txt

# Debug only the crypto module
RUST_LOG=tallow_crypto=debug tallow send myfile.txt

# Debug network and protocol
RUST_LOG=tallow_net=debug,tallow_protocol=debug tallow send myfile.txt
```

You can also use the `-v` flag for increasing verbosity:

```bash
tallow -v send myfile.txt     # verbose
tallow -vv send myfile.txt    # more verbose
tallow -vvv send myfile.txt   # maximum verbosity
```

**Saving logs to a file:**

```bash
RUST_LOG=debug tallow send myfile.txt 2> tallow-debug.log
```

**JSON-formatted output (for machine parsing):**

```bash
tallow --json send myfile.txt 2> tallow-output.json
```

### How do I report a bug?

1. **Check existing issues:** Search the [GitHub Issues](https://github.com/tallowteam/Tallow/issues) page to see if the bug is already reported.

2. **Gather diagnostic info:**
   ```bash
   tallow version
   tallow doctor
   ```

3. **Collect debug logs:**
   ```bash
   RUST_LOG=debug tallow send myfile.txt 2> debug.log
   ```

4. **Open a new issue** at [github.com/tallowteam/Tallow/issues](https://github.com/tallowteam/Tallow/issues) with:
   - Your platform and tallow version (`tallow version` output)
   - Steps to reproduce the bug
   - Expected behavior vs actual behavior
   - Debug logs (redact any sensitive information)
   - `tallow doctor` output

5. **Security vulnerabilities:** If the bug is a security vulnerability, do **not** open a public issue. Instead, follow the [Security Policy](https://github.com/tallowteam/Tallow/security) for responsible disclosure.
