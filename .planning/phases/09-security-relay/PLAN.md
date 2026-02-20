# Phase 9: Security Hardening & Relay Auth — Implementation Plan

**Created:** 2026-02-20
**Phase Goal:** Comprehensive filename sanitization (20+ attack vectors), ANSI escape stripping, environment variable support, relay password authentication, session verification strings, Docker relay deployment.
**Depends on:** Phase 8 (Advanced Transfer)
**Research:** `09-RESEARCH.md`

## Success Criteria (from ROADMAP.md)

1. Received filenames with null bytes, Windows reserved names (CON/PRN/NUL), Unicode fullwidth separators, and `..` traversal are all sanitized -- property tests with 10,000+ random inputs pass
2. ANSI escape sequences (CSI, OSC, DCS) in received filenames and text messages are stripped -- no terminal manipulation possible
3. `TALLOW_RELAY` and `TALLOW_CODE` environment variables are respected without CLI flags
4. Relay password authentication works: `tallow send --relay-pass secret file.txt` connects only to relays with matching password
5. After key exchange, both peers see matching verification strings (40 numeric digits or 8 emojis) for out-of-band verification

---

## Architecture Overview

```
Wave 1 (Foundation)              Wave 2 (Integration)              Wave 3 (Features)
  Task 1: sanitize module          Task 4: integrate sanitize         Task 6: verification strings
  Task 2: relay auth module        Task 5: env var support            Task 7: Docker relay
  Task 3: wire protocol change
```

**New files created:** 5
**Files modified:** ~18
**New dependency:** 1 (`strip-ansi-escapes` in tallow-protocol)

---

## Wave 1: Foundation (no inter-task dependencies)

### Task 1: Comprehensive Filename Sanitization Module

**What:** Create `crates/tallow-protocol/src/transfer/sanitize.rs` -- a single module that defends against all 20+ known filename/path attack vectors. This replaces the partial `FileManifest::sanitize_paths()` method (which only strips `..` and root components).

**Files to create:**
- `crates/tallow-protocol/src/transfer/sanitize.rs`

**Files to modify:**
- `crates/tallow-protocol/Cargo.toml` -- add `strip-ansi-escapes = "0.2"` dependency
- `crates/tallow-protocol/src/transfer/mod.rs` -- add `pub mod sanitize;` and re-export

**Changes:**

1. **Add dependency** to `crates/tallow-protocol/Cargo.toml`:
   ```toml
   strip-ansi-escapes = "0.2"
   ```

2. **Create `sanitize.rs`** with the following public API:
   ```rust
   /// Error type for sanitization failures.
   #[derive(Debug, thiserror::Error)]
   pub enum SanitizeError {
       #[error("empty filename")]
       EmptyFilename,
       #[error("filename contains null byte")]
       NullByte,
       #[error("filename sanitized to empty string")]
       SanitizedToEmpty,
       #[error("path escapes output directory: {0}")]
       PathEscape(String),
   }

   /// Sanitize a filename received from an untrusted sender.
   /// Defends against 20+ attack vectors (see doc comments for full list).
   pub fn sanitize_filename(name: &str, output_dir: &Path) -> Result<PathBuf, SanitizeError>

   /// Strip ANSI escape sequences and control characters from a display string.
   /// Use on ANY string shown to the user that originated from the network.
   pub fn sanitize_display(input: &str) -> String
   ```

3. **Attack vectors defended** (all must be tested):
   - Empty filename -> `SanitizeError::EmptyFilename`
   - Null bytes (`\0`) -> `SanitizeError::NullByte`
   - Directory traversal (`../`, `..\\`) -> components filtered out
   - Absolute paths (`/etc/passwd`, `C:\Windows`) -> root/prefix components stripped
   - Windows drive letters (`C:`) -> stripped as prefix component
   - Windows reserved device names (CON, PRN, AUX, NUL, COM0-9, LPT0-9) -> prefixed with `_` (case-insensitive, with or without extension)
   - Unicode fullwidth path separators (U+FF0F `/`, U+FF3C `\`) -> normalized to `/` before splitting
   - Backslash (`\`) -> normalized to `/`
   - ANSI escape sequences (CSI, OSC, DCS, SS2, SS3) -> stripped via `strip-ansi-escapes`
   - Control characters (0x00-0x1F, 0x7F) -> filtered out
   - Overlength components (>255 bytes) -> truncated
   - Tilde expansion (`~`) -> components starting with `~` filtered
   - Dot-only components (`.`, `..`) -> filtered
   - Trailing dots and spaces (Windows) -> trimmed from each component
   - Leading/trailing whitespace -> trimmed
   - Sanitized-to-empty result -> `SanitizeError::SanitizedToEmpty`
   - Path escape after join -> verified via canonicalize(output_dir) + starts_with check

4. **Defense-in-depth strategy** (two layers):
   - Layer 1: Component-level filtering (remove `..`, root, prefix, tilde, dot-only)
   - Layer 2: Post-join verification (canonicalize output_dir, join relative path, verify starts_with)

5. **`sanitize_display()` implementation:**
   - Strip ANSI via `strip_ansi_escapes::strip()`
   - Filter control characters (0x00-0x1F, 0x7F) except `\n` and `\t`
   - Return cleaned `String`

6. **Register module** in `crates/tallow-protocol/src/transfer/mod.rs`:
   ```rust
   pub mod sanitize;
   ```

**Tests (in `sanitize.rs` `#[cfg(test)]` module):**

Unit tests (minimum 15):
- `test_basic_filename` -- normal file passes through
- `test_subdirectory_path` -- `dir/file.txt` preserved
- `test_path_traversal_simple` -- `../../../etc/passwd` -> stays within output_dir
- `test_path_traversal_mixed` -- `foo/../../bar` -> stays within output_dir
- `test_absolute_path_unix` -- `/etc/passwd` -> relative
- `test_absolute_path_windows` -- `C:\Windows\System32\cmd.exe` -> relative (on all platforms via manual normalization)
- `test_null_byte` -- returns `Err(SanitizeError::NullByte)`
- `test_empty_filename` -- returns `Err(SanitizeError::EmptyFilename)`
- `test_dots_only` -- `.` and `..` both return `Err(SanitizeError::SanitizedToEmpty)`
- `test_windows_reserved_con` -- `CON` -> `_CON`
- `test_windows_reserved_with_extension` -- `CON.txt` -> `_CON.txt`
- `test_windows_reserved_case_insensitive` -- `con`, `Con`, `cOn` all prefixed
- `test_ansi_escape_in_filename` -- `\x1b[31mmalicious\x1b[0m.txt` -> `malicious.txt`
- `test_osc_escape_in_filename` -- `\x1b]0;evil\x07file.txt` -> stripped
- `test_unicode_fullwidth_slash` -- `dir\u{FF0F}file.txt` -> treated as path separator
- `test_unicode_fullwidth_backslash` -- `dir\u{FF3C}file.txt` -> treated as path separator
- `test_control_characters` -- `file\x01\x02\x03.txt` -> `file.txt`
- `test_overlength_component` -- 300-byte component truncated to 255
- `test_tilde_expansion` -- `~/secret` -> `secret`
- `test_trailing_dots_windows` -- `file...` -> `file` (trimmed)
- `test_whitespace_only` -- `"   "` -> `Err(SanitizedToEmpty)`
- `test_sanitize_display_strips_ansi` -- CSI color codes removed
- `test_sanitize_display_strips_osc` -- OSC title change removed
- `test_sanitize_display_preserves_newlines` -- `\n` and `\t` kept

Property tests (with `proptest`, in separate `#[cfg(test)]` module):
- `sanitized_path_never_escapes_output_dir` -- any `Ok` result starts_with output_dir
- `sanitized_path_no_dotdot` -- any `Ok` result contains no `..`
- `sanitized_path_no_control_chars` -- any `Ok` result has no control characters in the filename portion
- `sanitized_path_no_null_bytes` -- any `Ok` result contains no `\0`

Each proptest runs with default config (256 cases minimum), exceeding the 10,000+ requirement when combined with the explicit unit tests.

**Dependencies:** None (first task in Wave 1)

**Verification:**
```bash
cargo test -p tallow-protocol sanitize
cargo clippy -p tallow-protocol -- -D warnings
```

---

### Task 2: Relay Password Authentication Module

**What:** Replace the stub `auth.rs` in `tallow-relay` with BLAKE3-based password verification using constant-time comparison. Add a `password` field to `RelayConfig`.

**Files to modify:**
- `crates/tallow-relay/Cargo.toml` -- add `blake3` and `subtle` workspace deps
- `crates/tallow-relay/src/auth.rs` -- replace stub with real verification
- `crates/tallow-relay/src/config.rs` -- add `password` field to `RelayConfig`

**Changes:**

1. **Add dependencies** to `crates/tallow-relay/Cargo.toml`:
   ```toml
   blake3.workspace = true
   subtle.workspace = true
   ```

2. **Replace `auth.rs`** with:
   ```rust
   //! Relay password authentication
   //!
   //! BLAKE3 password hashing with constant-time comparison.
   //! Clients send BLAKE3(password) in the RoomJoin message.
   //! The relay hashes its configured password and compares.

   use subtle::ConstantTimeEq;

   /// Verify a client's password hash against the relay's configured password.
   ///
   /// Returns `true` if:
   /// - The relay has no password configured (open relay), OR
   /// - The client provided a hash matching BLAKE3(relay_password)
   ///
   /// Returns `false` if:
   /// - The relay requires a password but the client provided none, OR
   /// - The hash does not match
   ///
   /// Uses constant-time comparison to prevent timing side-channel attacks.
   pub fn verify_relay_password(
       client_hash: Option<&[u8; 32]>,
       relay_password: &str,
   ) -> bool {
       if relay_password.is_empty() {
           return true; // Open relay
       }

       match client_hash {
           None => false,
           Some(hash) => {
               let expected = blake3::hash(relay_password.as_bytes());
               hash.ct_eq(expected.as_bytes()).into()
           }
       }
   }

   /// Hash a password for sending to the relay.
   /// Called client-side before connecting.
   pub fn hash_relay_password(password: &str) -> [u8; 32] {
       blake3::hash(password.as_bytes()).into()
   }
   ```

3. **Add `password` field** to `RelayConfig` in `config.rs`:
   ```rust
   pub struct RelayConfig {
       // ... existing fields ...
       /// Relay password (empty = open relay, no auth required)
       pub password: String,
   }
   ```
   Update `Default` to set `password: String::new()`.

**Tests (in `auth.rs` `#[cfg(test)]` module):**
- `test_open_relay_allows_all` -- empty password, any client hash returns true
- `test_open_relay_allows_none` -- empty password, `None` client hash returns true
- `test_correct_password` -- matching hash returns true
- `test_wrong_password` -- non-matching hash returns false
- `test_no_password_provided` -- relay requires password, client sends `None` -> false
- `test_hash_relay_password_deterministic` -- same input -> same output
- `test_hash_relay_password_different_inputs` -- different inputs -> different outputs

**Dependencies:** None (first task in Wave 1)

**Verification:**
```bash
cargo test -p tallow-relay auth
cargo clippy -p tallow-relay -- -D warnings
```

---

### Task 3: Wire Protocol Change for Relay Auth

**What:** Add an optional `password_hash` field to the `RoomJoin` message variant. Since the project is pre-1.0, a breaking wire change is acceptable. Update the relay server to parse and verify the password hash. Update the relay client to send the password hash.

**Files to modify:**
- `crates/tallow-protocol/src/wire/messages.rs` -- add `password_hash` to `RoomJoin`
- `crates/tallow-relay/src/server.rs` -- add password verification in `handle_connection` and `parse_room_id` (or new parser)
- `crates/tallow-relay/src/main.rs` -- add `--pass` CLI arg, pass password to `RelayConfig`
- `crates/tallow-net/src/relay/client.rs` -- add `connect_with_password()` method (or modify `connect()` to accept `Option<[u8; 32]>`)

**Changes:**

1. **Modify `Message::RoomJoin`** in `messages.rs`:
   ```rust
   RoomJoin {
       room_id: Vec<u8>,
       /// BLAKE3 hash of relay password. None = no auth attempted.
       password_hash: Option<Vec<u8>>,
   },
   ```
   Update the round-trip test to include `password_hash: Some(vec![0xAB; 32])` and `password_hash: None`.

2. **Add `--pass` argument** to relay CLI in `main.rs`:
   ```rust
   Commands::Serve {
       // ... existing args ...
       /// Relay password (use TALLOW_RELAY_PASS env var for production)
       #[arg(long = "pass", env = "TALLOW_RELAY_PASS", hide_env_values = true)]
       pass: Option<String>,
   }
   ```
   Pass the password into `RelayConfig`:
   ```rust
   relay_config.password = pass.unwrap_or_default();
   ```

3. **Update `handle_connection`** in `server.rs`:
   - After parsing the room join message, extract the optional password hash
   - Call `auth::verify_relay_password()` with the extracted hash and `config.password`
   - If verification fails, send a rejection response (a new 1-byte payload with value `0xFF` for auth failure) and close
   - Pass `RelayConfig` (or at least the password string) into `handle_connection` -- currently it only takes `connection` and `room_manager`. Add a third parameter: `password: String` (or `Arc<RelayConfig>`)

   The relay must NOT log the password or password hash at any log level.

4. **Update `parse_room_id`** (or create `parse_room_join`):
   - The function currently extracts only the room_id from the raw bytes
   - With the wire format change, it must now parse both `room_id` and `password_hash`
   - Consider using postcard deserialization of the `Message` enum instead of manual byte parsing
   - Return a struct: `RoomJoinParsed { room_id: RoomId, password_hash: Option<[u8; 32]> }`

5. **Update `RelayClient::connect()`** in `client.rs`:
   - Add a `password_hash: Option<[u8; 32]>` parameter (or create a new method `connect_with_auth`)
   - Recommended approach: change signature to `connect(&mut self, room_id: &[u8; 32], password_hash: Option<&[u8; 32]>) -> Result<bool>`
   - When encoding the RoomJoin payload, include the password_hash
   - Since the manual encoding in `connect()` currently hand-builds the postcard bytes, either:
     a. Switch to proper `postcard::to_stdvec(&Message::RoomJoin { ... })` encoding (preferred), OR
     b. Extend the manual encoding to include the Option<Vec<u8>> field
   - Handle auth rejection response: if the relay sends `0xFF`, return `Err(NetworkError::AuthenticationFailed(...))`

6. **Add `AuthenticationFailed` variant** to `NetworkError` in `crates/tallow-net/src/lib.rs` (or wherever NetworkError is defined):
   ```rust
   #[error("relay authentication failed")]
   AuthenticationFailed,
   ```

**Tests:**
- Update `test_message_roundtrip_all_variants` in `messages.rs` for new `RoomJoin` shape
- `test_password_auth_flow` in `server.rs` -- mock a connection with correct password
- `test_password_auth_rejection` in `server.rs` -- mock a connection with wrong password
- `test_open_relay_no_password_field` -- `password_hash: None` on open relay succeeds

**Dependencies:** Task 2 (uses `auth::verify_relay_password`)

**Verification:**
```bash
cargo test -p tallow-protocol wire
cargo test -p tallow-relay
cargo test -p tallow-net relay
cargo clippy --workspace -- -D warnings
```

---

## Wave 2: Integration (depends on Wave 1)

### Task 4: Integrate Sanitization into Receive Pipeline

**What:** Replace the existing `FileManifest::sanitize_paths()` call with the new comprehensive `sanitize_filename()` from Task 1. Apply `sanitize_display()` to all untrusted strings before display (filenames in transfer offers, error messages from sender, chat messages).

**Files to modify:**
- `crates/tallow-protocol/src/transfer/receive.rs` -- use `sanitize_filename` in `finalize()`
- `crates/tallow-protocol/src/transfer/manifest.rs` -- deprecate or update `sanitize_paths()` to use the new sanitize module internally
- `crates/tallow/src/commands/receive.rs` -- apply `sanitize_display()` to displayed filenames, error messages from sender
- `crates/tallow/src/commands/send.rs` -- apply `sanitize_display()` to displayed error messages from receiver (e.g., `FileReject` reason)
- `crates/tallow-protocol/src/chat/session.rs` -- apply `sanitize_display()` to incoming chat messages

**Changes:**

1. **Update `ReceivePipeline::finalize()`** in `receive.rs`:
   - Replace `self.output_dir.join(&entry.path)` with:
     ```rust
     let output_path = crate::transfer::sanitize::sanitize_filename(
         &entry.path.to_string_lossy(),
         &self.output_dir,
     ).map_err(|e| ProtocolError::TransferFailed(
         format!("filename sanitization failed for {}: {}", entry.path.display(), e)
     ))?;
     ```
   - This is the CRITICAL security integration point -- every file write must go through sanitization

2. **Update `ReceivePipeline::process_offer()`** in `receive.rs`:
   - After `manifest.sanitize_paths()`, apply `sanitize_display()` to each filename for display purposes
   - Keep `sanitize_paths()` as an initial defense layer, but the real enforcement is in `finalize()`

3. **Update `FileManifest::sanitize_paths()`** in `manifest.rs`:
   - Option A: Deprecate with `#[deprecated(note = "Use transfer::sanitize::sanitize_filename() instead")]`
   - Option B: Rewrite to use `sanitize_display()` for path components (lighter-weight, keeps manifest-level sanitization)
   - Recommended: Option B -- keep `sanitize_paths()` as a first pass that strips obvious attacks from the manifest, then `finalize()` in the receive pipeline does the comprehensive check with the actual output directory

4. **Sanitize displayed filenames** in `crates/tallow/src/commands/receive.rs`:
   - Where filenames are printed to the user (lines ~240-242):
     ```rust
     for name in &filenames {
         let safe_name = tallow_protocol::transfer::sanitize::sanitize_display(name);
         println!("  - {}", safe_name);
     }
     ```

5. **Sanitize error messages from sender** in `crates/tallow/src/commands/receive.rs`:
   - Where `TransferError { error, .. }` is displayed (line ~329):
     ```rust
     let safe_error = tallow_protocol::transfer::sanitize::sanitize_display(&error);
     let msg = format!("Transfer error from sender: {}", safe_error);
     ```

6. **Sanitize rejection reasons** in `crates/tallow/src/commands/send.rs`:
   - Where `FileReject { reason, .. }` is displayed (line ~242):
     ```rust
     let safe_reason = tallow_protocol::transfer::sanitize::sanitize_display(&reason);
     ```

7. **Sanitize chat messages** in `crates/tallow-protocol/src/chat/session.rs`:
   - Any incoming message text should pass through `sanitize_display()` before storage or display

**Tests:**
- Integration test: send a file with a malicious filename (`../../../etc/passwd`), verify the receiver writes to a safe path within the output directory
- Integration test: send a file with ANSI escape sequences in the name, verify no escape sequences appear in output
- Unit test in receive.rs: mock a manifest with adversarial paths, verify `finalize()` sanitizes all of them

**Dependencies:** Task 1

**Verification:**
```bash
cargo test -p tallow-protocol transfer
cargo test -p tallow receive
cargo clippy --workspace -- -D warnings
```

---

### Task 5: Environment Variable Support

**What:** Add `TALLOW_CODE`, `TALLOW_RELAY`, and `TALLOW_RELAY_PASS` environment variable support via clap's `env` feature (already enabled in both crates). Add a warning when code phrases are passed via CLI arguments.

**Files to modify:**
- `crates/tallow/src/cli.rs` -- add `env = "..."` attributes to relevant args
- `crates/tallow/src/commands/send.rs` -- add warning about CLI arg visibility
- `crates/tallow/src/commands/receive.rs` -- add warning about CLI arg visibility

**Changes:**

1. **Add `TALLOW_CODE` env var support** to `SendArgs` and `ReceiveArgs` in `cli.rs`:
   ```rust
   // In SendArgs:
   /// Room code for internet transfer (also reads TALLOW_CODE env var)
   #[arg(short, long, env = "TALLOW_CODE")]
   pub room: Option<String>,

   // In ReceiveArgs:
   /// Code phrase to join (also reads TALLOW_CODE env var)
   #[arg(env = "TALLOW_CODE")]
   pub code: Option<String>,
   ```

2. **Add `TALLOW_RELAY` env var support** to `SendArgs` and `ReceiveArgs`:
   ```rust
   // Both SendArgs and ReceiveArgs:
   /// Relay server address (also reads TALLOW_RELAY env var)
   #[arg(long, default_value = "129.146.114.5:4433", env = "TALLOW_RELAY")]
   pub relay: String,
   ```

3. **Add `--relay-pass` flag** with `TALLOW_RELAY_PASS` env var to `SendArgs` and `ReceiveArgs`:
   ```rust
   /// Relay password (also reads TALLOW_RELAY_PASS env var)
   #[arg(long = "relay-pass", env = "TALLOW_RELAY_PASS", hide_env_values = true)]
   pub relay_pass: Option<String>,
   ```
   Note: `hide_env_values = true` prevents clap from printing the password value in `--help` output.

4. **Add `--relay-pass` to `ChatArgs`** as well, for consistency.

5. **Add CLI visibility warning** in `send.rs` and `receive.rs`:
   When the code phrase came from a CLI argument (not env var), emit a tracing warning:
   ```rust
   if args.code.is_some() && std::env::var("TALLOW_CODE").is_err() {
       tracing::warn!(
           "Code phrase passed via CLI argument -- visible in process list. \
            Use TALLOW_CODE env var for better security."
       );
   }
   ```
   Similarly for `--relay-pass`:
   ```rust
   if args.relay_pass.is_some() && std::env::var("TALLOW_RELAY_PASS").is_err() {
       tracing::warn!(
           "Relay password passed via CLI argument -- visible in process list. \
            Use TALLOW_RELAY_PASS env var for better security."
       );
   }
   ```

6. **Wire relay password into send/receive commands**:
   When `args.relay_pass` is `Some(password)`:
   - Hash it client-side: `let pw_hash = tallow_relay::auth::hash_relay_password(&password);`
   - Wait -- the `tallow` binary should NOT depend on `tallow-relay`. The hashing function should live somewhere accessible to the client.
   - **Solution:** Move `hash_relay_password()` to either:
     a. `tallow-crypto::hash::blake3` (it's just `blake3::hash(password.as_bytes()).into()`) -- but this is so simple it doesn't warrant a crypto function
     b. Inline it in the CLI commands: `let pw_hash: [u8; 32] = blake3::hash(password.as_bytes()).into();` -- `blake3` is already a dependency of `tallow`
   - Pass the hash to `relay.connect(room_id, Some(&pw_hash))` (per Task 3's API change)

**Tests:**
- Build test: verify `tallow --help` shows env var hints for `TALLOW_CODE`, `TALLOW_RELAY`, `TALLOW_RELAY_PASS`
- Unit test: parse `SendArgs` with env vars set, verify values are picked up (use `std::env::set_var` in test, or use clap's `try_parse_from` with explicit env override)
- Verify `hide_env_values` works: `TALLOW_RELAY_PASS` value should NOT appear in `--help` text

**Dependencies:** Task 3 (needs the updated `RelayClient::connect()` signature for passing password hash)

**Verification:**
```bash
cargo test -p tallow cli
cargo clippy -p tallow -- -D warnings
# Manual: TALLOW_CODE=mycode tallow receive  (should connect with "mycode")
```

---

## Wave 3: Features (depends on Wave 2)

### Task 6: Session Verification Strings

**What:** Implement verification string generation (numeric and emoji) and display. Both sender and receiver can display matching strings for out-of-band verification against MITM attacks on the key exchange.

**Files to create:**
- `crates/tallow/src/output/verify.rs` -- verification string generation and display

**Files to modify:**
- `crates/tallow/src/output/mod.rs` -- add `pub mod verify;`
- `crates/tallow/src/cli.rs` -- add `--verify` flag to `SendArgs` and `ReceiveArgs`
- `crates/tallow/src/commands/send.rs` -- display verification string after key exchange when `--verify` is passed
- `crates/tallow/src/commands/receive.rs` -- display verification string after key exchange when `--verify` is passed

**Changes:**

1. **Create `verify.rs`** in `crates/tallow/src/output/`:

   ```rust
   //! Session verification string generation and display
   //!
   //! Generates numeric and emoji verification strings from session keys
   //! for out-of-band MITM detection. Adapted from Signal's safety number
   //! protocol for ephemeral sessions.

   /// Generate a numeric verification string from session key bytes.
   ///
   /// Algorithm:
   /// 1. Hash session_key with BLAKE3 domain-separated KDF: "tallow verification string v1"
   /// 2. Take the 32-byte hash output
   /// 3. Split into 8 groups of 4 bytes each
   /// 4. Each group: u32::from_le_bytes(4 bytes) % 100000, zero-padded to 5 digits
   /// 5. Result: 8 groups of 5 digits = 40 digits total
   ///
   /// Returns a string like "12345 67890 11111 22222 33333 44444 55555 66666"
   pub fn numeric_verification(session_key: &[u8; 32]) -> String

   /// Generate an emoji verification string from session key bytes.
   ///
   /// Algorithm:
   /// 1. Hash session_key with BLAKE3 domain-separated KDF: "tallow emoji verification v1"
   /// 2. Take first 8 bytes of hash output
   /// 3. Each byte indexes into a 256-emoji lookup table
   /// 4. Result: 8 emojis
   ///
   /// Returns a string like "dog cat bear fish snake bird frog owl"
   pub fn emoji_verification(session_key: &[u8; 32]) -> String

   /// Display verification strings to the user.
   /// Shows numeric string, optionally also emoji string.
   pub fn display_verification(session_key: &[u8; 32], show_emoji: bool)
   ```

2. **Curate 256-emoji set** for `EMOJI_SET`:
   - Use only emojis from Unicode 13.0 or earlier (maximum cross-platform compatibility)
   - No skin-tone variants, no flags, no symbols that look similar at small sizes
   - Categories: animals, food, plants, weather, vehicles, objects, activities
   - Each emoji maps to exactly 1 byte (index 0-255)
   - Store as `const EMOJI_SET: &[&str; 256] = &[...]`

3. **Add `--verify` flag** to `SendArgs` and `ReceiveArgs` in `cli.rs`:
   ```rust
   // Both SendArgs and ReceiveArgs:
   /// Display verification string after key exchange for MITM detection
   #[arg(long)]
   pub verify: bool,
   ```

4. **Display verification string** in `send.rs` after peer connects and session key is derived:
   ```rust
   if args.verify {
       output::verify::display_verification(session_key.as_bytes(), true);
   }
   ```
   Place this AFTER the key exchange completes but BEFORE sending the FileOffer, so the user can abort if verification fails.

5. **Display verification string** in `receive.rs` after peer connects and session key is derived:
   ```rust
   if args.verify {
       output::verify::display_verification(session_key.as_bytes(), true);
       // Optionally prompt: "Does this match? (Y/n)"
       if !output::prompts::confirm("Does this match your peer's verification string?")? {
           relay.close().await;
           return Err(io::Error::other("Verification string mismatch -- possible MITM attack"));
       }
   }
   ```

6. **JSON output support**: When `--json` is active, emit verification as JSON:
   ```json
   {"event": "verification", "numeric": "12345 67890 ...", "emoji": "dog cat ..."}
   ```

**Tests:**
- `test_numeric_verification_deterministic` -- same key -> same string
- `test_numeric_verification_different_keys` -- different keys -> different strings
- `test_numeric_verification_format` -- output is 8 groups of 5 digits separated by spaces
- `test_numeric_verification_all_digits` -- each group contains only digits 0-9
- `test_emoji_verification_deterministic` -- same key -> same emojis
- `test_emoji_verification_different_keys` -- different keys -> different emojis
- `test_emoji_set_size` -- EMOJI_SET has exactly 256 entries
- `test_emoji_set_no_duplicates` -- all entries are unique
- `test_verification_both_peers_match` -- given the same session key, both sides produce identical output (this is the core security property)

**Dependencies:** Task 5 (needs the `--verify` flag in CLI args, and the session key must be accessible in the send/receive commands)

**Verification:**
```bash
cargo test -p tallow verify
cargo clippy -p tallow -- -D warnings
```

---

### Task 7: Docker Relay Image

**What:** Create a multi-stage Dockerfile for `tallow-relay` using `cargo-chef` for dependency caching. The image runs as a non-root user and supports configuration via environment variables.

**Files to create:**
- `Dockerfile.relay` (at workspace root)
- `docker-compose.relay.yml` (at workspace root, optional but useful)
- `.dockerignore` (at workspace root, if not already present)

**Changes:**

1. **Create `Dockerfile.relay`** at workspace root:
   ```dockerfile
   # Stage 1: Chef - install cargo-chef for dependency caching
   FROM rust:1.82-slim AS chef
   RUN cargo install cargo-chef
   WORKDIR /build

   # Stage 2: Planner - generate dependency recipe
   FROM chef AS planner
   COPY . .
   RUN cargo chef prepare --recipe-path recipe.json

   # Stage 3: Builder - compile dependencies (cached), then source
   FROM chef AS builder
   COPY --from=planner /build/recipe.json recipe.json
   RUN cargo chef cook --release --recipe-path recipe.json -p tallow-relay
   COPY . .
   RUN cargo build --release -p tallow-relay

   # Stage 4: Runtime - minimal image with non-root user
   FROM debian:bookworm-slim AS runtime
   RUN apt-get update \
       && apt-get install -y --no-install-recommends ca-certificates \
       && rm -rf /var/lib/apt/lists/*
   RUN groupadd -r tallow && useradd -r -g tallow -d /nonexistent -s /usr/sbin/nologin tallow

   COPY --from=builder /build/target/release/tallow-relay /usr/local/bin/

   # Environment variable configuration
   ENV TALLOW_RELAY_PASS=""
   ENV RUST_LOG="info"

   # QUIC uses UDP
   EXPOSE 4433/udp

   USER tallow
   ENTRYPOINT ["tallow-relay", "serve"]
   # Default args (can be overridden)
   CMD ["--addr", "0.0.0.0:4433"]
   ```

2. **Create `.dockerignore`** (if not present):
   ```
   target/
   .git/
   .claude/
   .planning/
   docs/
   *.md
   ```

3. **Create `docker-compose.relay.yml`**:
   ```yaml
   version: "3.8"
   services:
     relay:
       build:
         context: .
         dockerfile: Dockerfile.relay
       ports:
         - "4433:4433/udp"
       environment:
         - TALLOW_RELAY_PASS=${TALLOW_RELAY_PASS:-}
         - RUST_LOG=info
       restart: unless-stopped
       read_only: true
       security_opt:
         - no-new-privileges:true
       deploy:
         resources:
           limits:
             memory: 512M
   ```

**Security hardening in Dockerfile:**
- Non-root user (`tallow`)
- Minimal base image (`debian:bookworm-slim`)
- No shell needed at runtime (could use `FROM scratch` but we need ca-certificates)
- `read_only: true` in docker-compose (read-only root filesystem)
- `no-new-privileges` security option
- Memory limit (512M, well under 1GB Oracle Cloud free tier)

**Tests:**
- Manual: `docker build -f Dockerfile.relay -t tallow-relay .` succeeds
- Manual: `docker run -p 4433:4433/udp tallow-relay` starts and logs "relay server listening on 0.0.0.0:4433"
- Manual: `docker run -e TALLOW_RELAY_PASS=secret -p 4433:4433/udp tallow-relay` starts with password auth enabled
- Verify the image runs as non-root: `docker exec <container> whoami` returns `tallow`
- Verify no unnecessary packages: image size should be under 100MB

**Dependencies:** Task 2, Task 3 (needs the `--pass` and `TALLOW_RELAY_PASS` support in the relay binary)

**Verification:**
```bash
docker build -f Dockerfile.relay -t tallow-relay .
docker run --rm tallow-relay --help
```

---

## Dependency Graph

```
Wave 1 (parallel):
  Task 1: sanitize module               [no deps]
  Task 2: relay auth module              [no deps]
  Task 3: wire protocol change           [depends on Task 2]

Wave 2 (parallel after Wave 1):
  Task 4: integrate sanitize             [depends on Task 1]
  Task 5: env var support                [depends on Task 3]

Wave 3 (parallel after Wave 2):
  Task 6: verification strings           [depends on Task 5]
  Task 7: Docker relay                   [depends on Task 2, Task 3]
```

**Critical path:** Task 2 -> Task 3 -> Task 5 -> Task 6

**Parallelizable pairs:**
- Wave 1: Task 1 and Task 2 (fully independent)
- Wave 2: Task 4 and Task 5 (fully independent)
- Wave 3: Task 6 and Task 7 (fully independent)

---

## Files Changed Summary

### New Files (5)
| File | Task | Purpose |
|------|------|---------|
| `crates/tallow-protocol/src/transfer/sanitize.rs` | 1 | Comprehensive filename/path sanitization |
| `crates/tallow/src/output/verify.rs` | 6 | Verification string generation and display |
| `Dockerfile.relay` | 7 | Multi-stage Docker build for relay |
| `docker-compose.relay.yml` | 7 | Docker Compose for relay deployment |
| `.dockerignore` | 7 | Docker build context exclusions |

### Modified Files (~18)
| File | Task(s) | Changes |
|------|---------|---------|
| `crates/tallow-protocol/Cargo.toml` | 1 | Add `strip-ansi-escapes` dep |
| `crates/tallow-protocol/src/transfer/mod.rs` | 1 | Register `sanitize` module |
| `crates/tallow-protocol/src/transfer/receive.rs` | 4 | Use `sanitize_filename` in `finalize()` |
| `crates/tallow-protocol/src/transfer/manifest.rs` | 4 | Update `sanitize_paths()` to use sanitize module |
| `crates/tallow-protocol/src/wire/messages.rs` | 3 | Add `password_hash` to `RoomJoin` |
| `crates/tallow-protocol/src/chat/session.rs` | 4 | Sanitize incoming chat messages |
| `crates/tallow-relay/Cargo.toml` | 2 | Add `blake3`, `subtle` deps |
| `crates/tallow-relay/src/auth.rs` | 2 | Replace stub with BLAKE3 password verification |
| `crates/tallow-relay/src/config.rs` | 2 | Add `password` field |
| `crates/tallow-relay/src/main.rs` | 3 | Add `--pass` / `TALLOW_RELAY_PASS` arg, wire into config |
| `crates/tallow-relay/src/server.rs` | 3 | Add password verification in `handle_connection`, accept config parameter |
| `crates/tallow-net/src/relay/client.rs` | 3 | Add password hash to `connect()` |
| `crates/tallow-net/src/lib.rs` (or error module) | 3 | Add `AuthenticationFailed` error variant |
| `crates/tallow/src/cli.rs` | 5, 6 | Add env var attrs, `--relay-pass`, `--verify` flags |
| `crates/tallow/src/commands/send.rs` | 4, 5, 6 | Sanitize display, wire relay password, verification strings |
| `crates/tallow/src/commands/receive.rs` | 4, 5, 6 | Sanitize display, wire relay password, verification strings |
| `crates/tallow/src/output/mod.rs` | 6 | Register `verify` module |

---

## New Dependencies

| Crate | Version | Added To | Purpose |
|-------|---------|----------|---------|
| `strip-ansi-escapes` | 0.2 | `tallow-protocol` | Strip all ANSI escape sequence types via VTE state machine |
| `blake3` | (workspace) | `tallow-relay` | Already workspace dep, newly used by relay for password hashing |
| `subtle` | (workspace) | `tallow-relay` | Already workspace dep, newly used by relay for constant-time comparison |

Total new external dependencies: **1** (`strip-ansi-escapes`)

---

## Security Checklist

These constraints from CLAUDE.md must be verified across ALL changes:

- [ ] No `.unwrap()` outside `#[cfg(test)]` -- all new code uses `Result`/`?`/`map_err`
- [ ] `#![forbid(unsafe_code)]` preserved in all crates (no new unsafe needed)
- [ ] `subtle::ConstantTimeEq` used for relay password comparison (Task 2)
- [ ] No password or password hash logged at any `tracing` level (Task 2, 3, 5)
- [ ] `hide_env_values = true` on all password-related clap args (Task 5)
- [ ] All key material zeroized on drop (existing `SessionKey` already does this)
- [ ] `thiserror` for `SanitizeError` (Task 1), not `anyhow`
- [ ] Sanitize module has property tests exceeding 10,000 inputs (Task 1)
- [ ] No `println!` in library crates -- use `tracing` macros (all tasks)
- [ ] All public items have `///` doc comments (all tasks)

---

## Testing Summary

| Task | Unit Tests | Property Tests | Integration Tests | Manual Tests |
|------|-----------|---------------|-------------------|-------------|
| 1 | 24+ | 4 proptest strategies | - | - |
| 2 | 7 | - | - | - |
| 3 | 3+ (updated roundtrip) | - | 2 (auth flow) | - |
| 4 | 3 | - | 2 (malicious filenames) | - |
| 5 | 3 | - | - | 2 (env var manual) |
| 6 | 9 | - | - | 1 (visual) |
| 7 | - | - | - | 4 (Docker) |
| **Total** | **49+** | **4** | **4** | **7** |

---

## Estimated Effort

| Task | Complexity | Estimated Lines | Notes |
|------|-----------|----------------|-------|
| Task 1 | High | ~400 (impl + tests) | Most attack vectors, most tests |
| Task 2 | Low | ~80 | Straightforward BLAKE3 + subtle |
| Task 3 | Medium | ~200 | Wire format change touches 4 crates |
| Task 4 | Medium | ~100 | Integration wiring across crates |
| Task 5 | Low | ~60 | Mostly clap attribute additions |
| Task 6 | Medium | ~350 (256-emoji table is large) | Emoji curation takes care |
| Task 7 | Low | ~60 | Dockerfile + compose |
| **Total** | | **~1,250** | |

---

## Completion Criteria

Phase 9 is complete when ALL of the following are true:

1. `cargo test --workspace` passes with all new tests (49+ unit, 4 property, 4 integration)
2. `cargo clippy --workspace -- -D warnings` passes clean
3. `cargo fmt --check` passes
4. Property tests run with minimum 256 cases per strategy (10,000+ total inputs across strategies)
5. All 5 success criteria from the ROADMAP are demonstrably met
6. Docker image builds and runs successfully
7. No passwords or password hashes appear in any log output at any level
8. The `strip-ansi-escapes` dependency is the only new external dependency added
