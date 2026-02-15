import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Info,
} from '@/components/icons';
import styles from './page.module.css';

export default function CLIToolGuide() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <ol className={styles.breadcrumbList}>
            <li>
              <Link href="/docs">Docs</Link>
            </li>
            <li>
              <Link href="/docs/guides">Guides</Link>
            </li>
            <li>
              <span>CLI Tool</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>CLI Tool</h1>
            <p className={styles.heroDescription}>
              Send files from the terminal with code phrases, like croc but quantum-safe.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>8 min read</span>
              <span className={styles.badge}>Advanced</span>
            </div>
          </div>
        </section>

        {/* Content */}
        <article className={styles.article}>
          <div className={styles.contentContainer}>
            {/* Table of Contents */}
            <nav className={styles.toc}>
              <h2 className={styles.tocTitle}>On this page</h2>
              <ul className={styles.tocList}>
                <li>
                  <a className={styles.tocLink} href="#installation">Installation</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#quick-start">Quick Start</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#sending-files">Sending Files</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#receiving-files">Receiving Files</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#code-phrases">Code Phrases</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#pipe-support">Pipe Support</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#configuration">Configuration</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#cross-platform">Cross-Platform</a>
                </li>
              </ul>
            </nav>

            {/* Installation */}
            <section id="installation" className={styles.section}>
              <h2 className={styles.sectionTitle}>Installation</h2>
              <p className={styles.sectionDescription}>
                Install the Tallow CLI using your preferred package manager, or download a prebuilt binary.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>npm</div>
                <div className={styles.codeContent}>
                  <code>npm install -g @tallow/cli</code>
                </div>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Homebrew (macOS / Linux)</div>
                <div className={styles.codeContent}>
                  <code>brew install tallow</code>
                </div>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Cargo (Rust)</div>
                <div className={styles.codeContent}>
                  <code>cargo install tallow-cli</code>
                </div>
              </div>

              <p className={styles.sectionDescription}>
                Prebuilt binaries are also available for direct download:
              </p>

              <div className={styles.commandTable}>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>Windows x64</span>
                  <span className={styles.commandDescription}>64-bit Windows 10 and later</span>
                  <span className={styles.commandExample}>tallow-win-x64.exe</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>macOS Intel</span>
                  <span className={styles.commandDescription}>Intel-based Macs (x86_64)</span>
                  <span className={styles.commandExample}>tallow-darwin-x64</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>macOS ARM</span>
                  <span className={styles.commandDescription}>Apple Silicon Macs (M1/M2/M3/M4)</span>
                  <span className={styles.commandExample}>tallow-darwin-arm64</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>Linux x64</span>
                  <span className={styles.commandDescription}>64-bit Linux distributions</span>
                  <span className={styles.commandExample}>tallow-linux-x64</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>Linux ARM</span>
                  <span className={styles.commandDescription}>ARM64 Linux (Raspberry Pi 4+, etc.)</span>
                  <span className={styles.commandExample}>tallow-linux-arm64</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>FreeBSD</span>
                  <span className={styles.commandDescription}>FreeBSD 13 and later</span>
                  <span className={styles.commandExample}>tallow-freebsd-x64</span>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.infoCallout}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Verify your download</p>
                  <p className={styles.calloutText}>
                    Each binary ships with a SHA-256 checksum and a detached GPG signature.
                    Always verify before running.
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Start */}
            <section id="quick-start" className={styles.section}>
              <h2 className={styles.sectionTitle}>Quick Start</h2>
              <p className={styles.sectionDescription}>
                Get up and running in under a minute. Two commands are all you need.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Send a file</h3>
                    <p className={styles.stepText}>
                      Run the send command with the file you want to transfer. Tallow generates a
                      three-word code phrase and waits for the receiver.
                    </p>
                    <div className={styles.codeBlock}>
                      <div className={styles.codeHeader}>Terminal</div>
                      <div className={styles.codeContent}>
{`$ tallow send file.zip
Sending file.zip (24.8 MB)
Code phrase: orbit-mango-thunder

Waiting for receiver...`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Receive the file</h3>
                    <p className={styles.stepText}>
                      On the receiving machine, enter the code phrase. The transfer starts immediately
                      with post-quantum encrypted end-to-end encryption.
                    </p>
                    <div className={styles.codeBlock}>
                      <div className={styles.codeHeader}>Terminal</div>
                      <div className={styles.codeContent}>
{`$ tallow receive orbit-mango-thunder
Connecting...
Receiving file.zip (24.8 MB)
[====================] 100%  12.4 MB/s

Done. Saved to ./file.zip`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.successCallout}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Quantum-safe by default</p>
                  <p className={styles.calloutText}>
                    Every transfer uses hybrid ML-KEM + X25519 key exchange and ChaCha20-Poly1305
                    encryption. No flags or configuration needed.
                  </p>
                </div>
              </div>
            </section>

            {/* Sending Files */}
            <section id="sending-files" className={styles.section}>
              <h2 className={styles.sectionTitle}>Sending Files</h2>
              <p className={styles.sectionDescription}>
                The <code>send</code> command supports single files, multiple files, directories, and several
                flags to customise your transfer.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Single file</div>
                <div className={styles.codeContent}>
                  <code>tallow send report.pdf</code>
                </div>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Multiple files</div>
                <div className={styles.codeContent}>
                  <code>tallow send photo1.jpg photo2.jpg photo3.jpg</code>
                </div>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Entire directory</div>
                <div className={styles.codeContent}>
                  <code>tallow send ./project-folder/</code>
                </div>
              </div>

              <h3 className={styles.sectionTitle} style={{ fontSize: 'var(--font-size-xl)', borderBottom: 'none', paddingBottom: 0 }}>
                Flags
              </h3>

              <div className={styles.commandTable}>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>--code &lt;phrase&gt;</span>
                  <span className={styles.commandDescription}>Use a custom code phrase instead of a random one</span>
                  <span className={styles.commandExample}>tallow send file.zip --code my-secret-phrase</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>--password</span>
                  <span className={styles.commandDescription}>Prompt for a password to add an extra layer of encryption</span>
                  <span className={styles.commandExample}>tallow send file.zip --password</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>--compress</span>
                  <span className={styles.commandDescription}>Compress files with Brotli before sending (great for text)</span>
                  <span className={styles.commandExample}>tallow send logs/ --compress</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>--progress</span>
                  <span className={styles.commandDescription}>Show a detailed progress bar with transfer speed and ETA</span>
                  <span className={styles.commandExample}>tallow send backup.tar.gz --progress</span>
                </div>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Full example with flags</div>
                <div className={styles.codeContent}>
{`$ tallow send ./documents/ --code quarterly-report --compress --progress
Compressing 147 files...
Code phrase: quarterly-report

Waiting for receiver...
[====================] 100%  8.2 MB/s  ETA 0s

Transfer complete. 147 files sent (312 MB).`}
                </div>
              </div>
            </section>

            {/* Receiving Files */}
            <section id="receiving-files" className={styles.section}>
              <h2 className={styles.sectionTitle}>Receiving Files</h2>
              <p className={styles.sectionDescription}>
                Use the <code>receive</code> command with a code phrase to download files from a sender.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Basic receive</div>
                <div className={styles.codeContent}>
                  <code>tallow receive orbit-mango-thunder</code>
                </div>
              </div>

              <h3 className={styles.sectionTitle} style={{ fontSize: 'var(--font-size-xl)', borderBottom: 'none', paddingBottom: 0 }}>
                Flags
              </h3>

              <div className={styles.commandTable}>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>--output &lt;dir&gt;</span>
                  <span className={styles.commandDescription}>Save files to a specific directory instead of the current one</span>
                  <span className={styles.commandExample}>tallow receive code --output ~/Downloads</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>--yes</span>
                  <span className={styles.commandDescription}>Auto-accept the transfer without a confirmation prompt</span>
                  <span className={styles.commandExample}>tallow receive code --yes</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>--verify</span>
                  <span className={styles.commandDescription}>Print the BLAKE3 hash of each received file for manual verification</span>
                  <span className={styles.commandExample}>tallow receive code --verify</span>
                </div>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Overwrite prompt</div>
                <div className={styles.codeContent}>
{`$ tallow receive orbit-mango-thunder --output ./backups/
Connecting...
file.zip already exists. Overwrite? [y/N/a(ll)] y

Receiving file.zip (24.8 MB)
[====================] 100%  12.4 MB/s

Done. Saved to ./backups/file.zip`}
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.warningCallout}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Overwrite behaviour</p>
                  <p className={styles.calloutText}>
                    By default, the CLI asks before overwriting existing files. Use <code>--yes</code> to
                    skip all prompts (useful in scripts), but be careful with automated pipelines.
                  </p>
                </div>
              </div>
            </section>

            {/* Code Phrases */}
            <section id="code-phrases" className={styles.section}>
              <h2 className={styles.sectionTitle}>Code Phrases</h2>
              <p className={styles.sectionDescription}>
                Code phrases are the human-friendly way to connect sender and receiver. They replace
                IP addresses and port numbers with memorable words.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Generated automatically</h3>
                    <p className={styles.stepText}>
                      When you run <code>tallow send</code>, the CLI generates a three-word phrase from a
                      curated word list (e.g., <code>orbit-mango-thunder</code>). The phrase is short
                      enough to read aloud or type from memory.
                    </p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Custom codes</h3>
                    <p className={styles.stepText}>
                      Use <code>--code</code> to set your own phrase. This is useful when you agree on a
                      code over a phone call or in person. Minimum 4 characters.
                    </p>
                    <div className={styles.codeBlock}>
                      <div className={styles.codeHeader}>Terminal</div>
                      <div className={styles.codeContent}>
                        <code>tallow send report.pdf --code monday-standup</code>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Expiry</h3>
                    <p className={styles.stepText}>
                      Code phrases expire after the transfer completes or after 24 hours of inactivity,
                      whichever comes first. Expired codes cannot be reused.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.infoCallout}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Entropy</p>
                  <p className={styles.calloutText}>
                    Three-word phrases from the default list provide approximately 48 bits of entropy,
                    comparable to a strong random PIN. Custom phrases are hashed with Argon2id.
                  </p>
                </div>
              </div>
            </section>

            {/* Pipe Support */}
            <section id="pipe-support" className={styles.section}>
              <h2 className={styles.sectionTitle}>Pipe Support</h2>
              <p className={styles.sectionDescription}>
                The CLI integrates with Unix pipes, letting you stream data through Tallow
                without touching the filesystem.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Send from stdin</div>
                <div className={styles.codeContent}>
{`# Pipe a file directly
cat database-dump.sql | tallow send --pipe

# Pipe command output
pg_dump mydb | tallow send --pipe --code db-backup

# Compress on the fly
tar czf - ./project/ | tallow send --pipe`}
                </div>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Receive to stdout</div>
                <div className={styles.codeContent}>
{`# Save to a specific file
tallow receive db-backup --pipe > dump.sql

# Pipe into another command
tallow receive db-backup --pipe | psql mydb

# Decompress on the fly
tallow receive archive-code --pipe | tar xzf -`}
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.successCallout}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Streaming encryption</p>
                  <p className={styles.calloutText}>
                    Pipe mode uses chunked streaming encryption. Data is encrypted and sent in real-time
                    without buffering the entire payload in memory.
                  </p>
                </div>
              </div>
            </section>

            {/* Configuration */}
            <section id="configuration" className={styles.section}>
              <h2 className={styles.sectionTitle}>Configuration</h2>
              <p className={styles.sectionDescription}>
                Persistent settings live in a TOML config file. Override any default with flags or
                environment variables.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>~/.tallow/config.toml</div>
                <div className={styles.codeContent}>
{`# Default download directory
output_dir = "~/Downloads/tallow"

# Always show progress bar
progress = true

# Enable compression by default
compress = false

# Custom TURN server (for NAT traversal)
[relay]
url = "turn:relay.example.com:443"
username = "user"
credential = "secret"

# Logging
[log]
level = "info"        # debug | info | warn | error
file = "~/.tallow/tallow.log"`}
                </div>
              </div>

              <h3 className={styles.sectionTitle} style={{ fontSize: 'var(--font-size-xl)', borderBottom: 'none', paddingBottom: 0 }}>
                Environment Variables
              </h3>

              <div className={styles.commandTable}>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>TALLOW_OUTPUT</span>
                  <span className={styles.commandDescription}>Override the default output directory</span>
                  <span className={styles.commandExample}>export TALLOW_OUTPUT=~/files</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>TALLOW_RELAY</span>
                  <span className={styles.commandDescription}>Set a custom relay/TURN server URL</span>
                  <span className={styles.commandExample}>export TALLOW_RELAY=turn:my.server:443</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>TALLOW_LOG</span>
                  <span className={styles.commandDescription}>Set the log level</span>
                  <span className={styles.commandExample}>export TALLOW_LOG=debug</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>TALLOW_NO_COLOR</span>
                  <span className={styles.commandDescription}>Disable coloured output (CI-friendly)</span>
                  <span className={styles.commandExample}>export TALLOW_NO_COLOR=1</span>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.infoCallout}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Priority order</p>
                  <p className={styles.calloutText}>
                    CLI flags override environment variables, which override config file values,
                    which override built-in defaults.
                  </p>
                </div>
              </div>
            </section>

            {/* Cross-Platform */}
            <section id="cross-platform" className={styles.section}>
              <h2 className={styles.sectionTitle}>Cross-Platform</h2>
              <p className={styles.sectionDescription}>
                Tallow CLI ships as a single self-contained binary for six platforms. No runtime
                dependencies required.
              </p>

              <div className={styles.commandTable}>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>Windows x64</span>
                  <span className={styles.commandDescription}>Windows 10+ (64-bit). Runs in PowerShell, cmd, or WSL.</span>
                  <span className={styles.commandExample}>tallow-win-x64.exe</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>macOS Intel</span>
                  <span className={styles.commandDescription}>macOS 12+ on Intel processors (x86_64).</span>
                  <span className={styles.commandExample}>tallow-darwin-x64</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>macOS ARM</span>
                  <span className={styles.commandDescription}>macOS 12+ on Apple Silicon (M1/M2/M3/M4).</span>
                  <span className={styles.commandExample}>tallow-darwin-arm64</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>Linux x64</span>
                  <span className={styles.commandDescription}>glibc 2.17+ (Ubuntu 18.04+, Debian 10+, Fedora 28+).</span>
                  <span className={styles.commandExample}>tallow-linux-x64</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>Linux ARM64</span>
                  <span className={styles.commandDescription}>ARM64 boards and servers (Raspberry Pi 4+, AWS Graviton).</span>
                  <span className={styles.commandExample}>tallow-linux-arm64</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>FreeBSD x64</span>
                  <span className={styles.commandDescription}>FreeBSD 13+ on 64-bit x86 hardware.</span>
                  <span className={styles.commandExample}>tallow-freebsd-x64</span>
                </div>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Install from binary (Linux / macOS)</div>
                <div className={styles.codeContent}>
{`# Download
curl -LO https://github.com/tallow/cli/releases/latest/download/tallow-linux-x64

# Make executable
chmod +x tallow-linux-x64

# Move to PATH
sudo mv tallow-linux-x64 /usr/local/bin/tallow

# Verify
tallow --version`}
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.successCallout}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Zero dependencies</p>
                  <p className={styles.calloutText}>
                    Tallow CLI is a statically-linked binary. No Node.js, Python, or system libraries
                    needed. Download, make executable, and run.
                  </p>
                </div>
              </div>
            </section>

            {/* Command Reference */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Command Reference</h2>
              <p className={styles.sectionDescription}>
                Quick reference for the most common commands and options.
              </p>

              <div className={styles.commandTable}>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>tallow send &lt;file&gt;</span>
                  <span className={styles.commandDescription}>Send a file or directory</span>
                  <span className={styles.commandExample}>tallow send ./docs/</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>tallow receive &lt;code&gt;</span>
                  <span className={styles.commandDescription}>Receive using a code phrase</span>
                  <span className={styles.commandExample}>tallow receive orbit-mango-thunder</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>tallow send --pipe</span>
                  <span className={styles.commandDescription}>Send data from stdin</span>
                  <span className={styles.commandExample}>cat file | tallow send --pipe</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>tallow receive --pipe</span>
                  <span className={styles.commandDescription}>Receive data to stdout</span>
                  <span className={styles.commandExample}>tallow receive code --pipe &gt; out</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>tallow --version</span>
                  <span className={styles.commandDescription}>Print CLI version and build info</span>
                  <span className={styles.commandExample}>tallow --version</span>
                </div>
                <div className={styles.commandRow}>
                  <span className={styles.commandName}>tallow --help</span>
                  <span className={styles.commandDescription}>Show help for all commands and flags</span>
                  <span className={styles.commandExample}>tallow send --help</span>
                </div>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div>
            <Link href="/docs/guides/keyboard-shortcuts" className={styles.navLink}>
              <span className={styles.navLabel}>
                <ArrowLeft />
                Previous
              </span>
              <span className={styles.navTitle}>Keyboard Shortcuts</span>
            </Link>
            <Link href="/docs/guides/self-hosting" className={styles.navLink} style={{ textAlign: 'right' }}>
              <span className={styles.navLabel} style={{ justifyContent: 'flex-end' }}>
                Next
                <ArrowRight />
              </span>
              <span className={styles.navTitle}>Self-Hosting</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
