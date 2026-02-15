import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Info } from '@/components/icons';
import styles from './page.module.css';

export default function TroubleshootingGuide() {
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
              <span>Troubleshooting</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Troubleshooting</h1>
            <p className={styles.heroDescription}>
              Fix common issues with connections, transfers, and compatibility.
              Step-by-step solutions for every problem you might encounter.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>10 min read</span>
              <span className={styles.badge}>Reference</span>
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
                  <a href="#connection-issues" className={styles.tocLink}>Connection Issues</a>
                </li>
                <li>
                  <a href="#slow-transfers" className={styles.tocLink}>Slow Transfers</a>
                </li>
                <li>
                  <a href="#firewall-nat" className={styles.tocLink}>Firewall &amp; NAT</a>
                </li>
                <li>
                  <a href="#browser-compatibility" className={styles.tocLink}>Browser Compatibility</a>
                </li>
                <li>
                  <a href="#mobile-issues" className={styles.tocLink}>Mobile Issues</a>
                </li>
                <li>
                  <a href="#self-hosting" className={styles.tocLink}>Self-Hosting Issues</a>
                </li>
                <li>
                  <a href="#error-messages" className={styles.tocLink}>Error Messages</a>
                </li>
                <li>
                  <a href="#getting-help" className={styles.tocLink}>Getting More Help</a>
                </li>
              </ul>
            </nav>

            {/* ===== 1. Connection Issues ===== */}
            <section id="connection-issues" className={styles.section}>
              <h2 className={styles.sectionTitle}>Connection Issues</h2>
              <p className={styles.sectionDescription}>
                Problems discovering or connecting to other devices are the most common issues.
                Work through the diagnostic steps first, then check specific problems below.
              </p>

              <div className={styles.diagnosticSteps}>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Verify same network</h3>
                    <p className={styles.stepText}>
                      Both devices must be on the same WiFi or Ethernet network.
                      Check Settings &gt; WiFi on each device to confirm the network name matches.
                    </p>
                  </div>
                </div>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Restart Tallow on both devices</h3>
                    <p className={styles.stepText}>
                      Close and reopen Tallow on both devices. Wait at least 10 seconds
                      for mDNS discovery to complete.
                    </p>
                  </div>
                </div>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Check firewall and antivirus</h3>
                    <p className={styles.stepText}>
                      Temporarily disable your firewall or antivirus to test. If that fixes it,
                      add Tallow to the allow list (port 5353 for mDNS).
                    </p>
                  </div>
                </div>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Try a room code instead</h3>
                    <p className={styles.stepText}>
                      If local discovery fails, switch to Internet mode and use a room code
                      to connect. This bypasses mDNS entirely.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  Can&apos;t find other devices
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> mDNS multicast traffic is blocked by your router,
                  a corporate network policy, or AP isolation is enabled on the access point.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Try connecting both devices to a personal hotspot, disable
                  AP isolation in your router settings, or switch to Internet mode with a room code.
                </p>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  Connection drops mid-transfer
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> Unstable WiFi signal, router timeout on idle connections,
                  or the device entered sleep mode during transfer.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Move closer to the router, disable sleep mode during
                  transfers, and use Ethernet if available. Tallow supports resumable transfers
                  &mdash; try again and it will pick up where it left off.
                </p>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  &quot;No peers found&quot; message
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> The other device does not have Tallow open, is on a
                  different network, or mDNS is blocked.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Ensure Tallow is running on both devices. Verify both
                  are on the same WiFi network. Power cycle your router if the issue persists.
                </p>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Network Tip</p>
                  <p className={styles.calloutText}>
                    Guest WiFi networks often block device-to-device communication.
                    Always use the main WiFi network for local transfers.
                  </p>
                </div>
              </div>
            </section>

            {/* ===== 2. Slow Transfers ===== */}
            <section id="slow-transfers" className={styles.section}>
              <h2 className={styles.sectionTitle}>Slow Transfers</h2>
              <p className={styles.sectionDescription}>
                Transfer speed depends on your network conditions, device capabilities,
                and the connection path. Use these steps to diagnose and improve performance.
              </p>

              <div className={styles.diagnosticSteps}>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Check connection indicator</h3>
                    <p className={styles.stepText}>
                      Look at the connection quality indicator in Tallow. If it shows
                      &quot;Relay&quot; instead of &quot;Direct,&quot; your data is being
                      routed through a TURN server, which is much slower.
                    </p>
                  </div>
                </div>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Test network speed</h3>
                    <p className={styles.stepText}>
                      Run a quick speed test on both devices. If your network is slow,
                      Tallow cannot transfer faster than your network allows.
                    </p>
                  </div>
                </div>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Reduce network congestion</h3>
                    <p className={styles.stepText}>
                      Pause large downloads, video streams, and cloud sync on other devices.
                      Network bandwidth is shared across all devices.
                    </p>
                  </div>
                </div>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Switch to 5 GHz or Ethernet</h3>
                    <p className={styles.stepText}>
                      Use the 5 GHz WiFi band for less interference and higher throughput.
                      For the fastest transfers, connect both devices via Ethernet.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  Transfer using TURN relay instead of direct
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> A firewall or symmetric NAT is preventing a direct
                  peer-to-peer connection. Traffic is relayed through a TURN server, adding latency.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Open UDP ports in your firewall, enable UPnP on your
                  router, or switch both devices to the same local network for a direct connection.
                </p>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  Chunk size affecting performance
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> The default chunk size may not be optimal for your
                  network conditions. Very small chunks increase overhead; very large chunks
                  increase memory usage.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Tallow&apos;s adaptive bitrate system automatically tunes
                  chunk size. If you notice issues, restart the transfer to allow re-calibration.
                  On stable local networks, larger chunks (256 KB+) generally perform better.
                </p>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Adaptive Bitrate</p>
                  <p className={styles.calloutText}>
                    Tallow continuously monitors your connection and adjusts transfer parameters
                    in real time. In most cases, no manual tuning is needed.
                  </p>
                </div>
              </div>
            </section>

            {/* ===== 3. Firewall & NAT ===== */}
            <section id="firewall-nat" className={styles.section}>
              <h2 className={styles.sectionTitle}>Firewall &amp; NAT</h2>
              <p className={styles.sectionDescription}>
                Firewalls and Network Address Translation (NAT) can block peer-to-peer
                connections. Here is how to work around them.
              </p>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  Corporate firewall blocks WebRTC
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> Many corporate firewalls block UDP traffic and
                  WebRTC entirely. This prevents both discovery and direct peer connections.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Ask your IT team to whitelist WebRTC traffic, or use
                  Tallow&apos;s TURN relay fallback. You can also connect through a VPN or
                  use Internet mode with a room code.
                </p>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  Symmetric NAT prevents direct connection
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> Symmetric NAT assigns different external ports per
                  destination, making it impossible for STUN-based hole-punching to work.
                  This is common on carrier-grade NAT (CGNAT) and enterprise networks.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Tallow automatically detects symmetric NAT and falls
                  back to TURN relay. For better performance, enable UPnP or port forwarding
                  on your router, or transfer files on a local network.
                </p>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  TURN relay not connecting
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> The TURN server might be unreachable due to network
                  restrictions, or TURN credentials may have expired.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Check your internet connection. Tallow refreshes
                  TURN credentials automatically. If self-hosting, verify your TURN server
                  is running and accessible on the configured ports (usually 3478 or 443).
                </p>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Firewall Ports</p>
                  <p className={styles.calloutText}>
                    Tallow uses UDP port 5353 for local discovery (mDNS), dynamic UDP ports
                    for WebRTC, and TCP/UDP 3478 or 443 for TURN. Ask your network admin
                    to allow these if connections fail.
                  </p>
                </div>
              </div>
            </section>

            {/* ===== 4. Browser Compatibility ===== */}
            <section id="browser-compatibility" className={styles.section}>
              <h2 className={styles.sectionTitle}>Browser Compatibility</h2>
              <p className={styles.sectionDescription}>
                Tallow works best in modern browsers. Some older browsers or restricted
                environments may lack required APIs.
              </p>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  WebRTC not supported
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> Very old browsers (IE 11, older Edge Legacy) do not
                  support WebRTC. Some privacy-focused browsers disable it by default.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Use a modern browser: Chrome 90+, Firefox 90+, Safari 15+,
                  or Edge 90+. In Brave or Firefox, check that WebRTC is not disabled in
                  privacy settings.
                </p>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  WebCrypto API missing
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> The page is loaded over HTTP instead of HTTPS, or
                  you are using a browser that does not implement the WebCrypto API.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Always access Tallow over HTTPS. WebCrypto requires a
                  secure context. If developing locally, use <code>localhost</code> (which is
                  treated as secure) or set up a local TLS certificate.
                </p>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  WASM not available
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> WebAssembly is disabled by a Content Security Policy
                  or by browser settings. Some older mobile browsers lack WASM support.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Tallow includes JavaScript fallbacks for WASM features.
                  Performance may be reduced. Update your browser or check that CSP headers
                  include <code>wasm-unsafe-eval</code> if self-hosting.
                </p>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Recommended Browsers</p>
                  <p className={styles.calloutText}>
                    For the best experience, use Chrome, Edge, or Firefox on desktop, and
                    Safari or Chrome on mobile. All modern evergreen browsers are supported.
                  </p>
                </div>
              </div>
            </section>

            {/* ===== 5. Mobile Issues ===== */}
            <section id="mobile-issues" className={styles.section}>
              <h2 className={styles.sectionTitle}>Mobile Issues</h2>
              <p className={styles.sectionDescription}>
                Mobile browsers have stricter resource limits. Here are common problems
                and their solutions.
              </p>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  PWA installation not available
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> The browser does not support PWA installation, or
                  Tallow was not accessed over HTTPS.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> On Android, use Chrome and tap &quot;Add to Home
                  Screen&quot; from the menu. On iOS, use Safari and tap the Share button, then
                  &quot;Add to Home Screen.&quot; Ensure you are on the HTTPS version of the site.
                </p>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  Transfer stops when screen locks
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> Mobile browsers suspend background tabs and
                  WebRTC connections when the screen is locked or the app is backgrounded.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Keep the screen on during transfers. On Android, enable
                  &quot;Keep screen on while charging&quot; in developer options. On iOS, set
                  Auto-Lock to &quot;Never&quot; temporarily in Display settings.
                </p>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  Safari restrictions on iOS
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> Safari on iOS has limited WebRTC support and
                  aggressive background throttling. Service workers and some Web APIs
                  behave differently compared to Chrome.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Keep Safari in the foreground during transfers. For
                  large files, consider using a desktop browser. Tallow automatically adapts
                  to Safari&apos;s limitations where possible.
                </p>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>iOS Limitation</p>
                  <p className={styles.calloutText}>
                    All browsers on iOS use the WebKit engine (even Chrome for iOS). This
                    means WebRTC limitations in Safari also apply to Chrome, Firefox, and
                    other browsers on iOS.
                  </p>
                </div>
              </div>
            </section>

            {/* ===== 6. Self-Hosting Issues ===== */}
            <section id="self-hosting" className={styles.section}>
              <h2 className={styles.sectionTitle}>Self-Hosting Issues</h2>
              <p className={styles.sectionDescription}>
                Running your own Tallow instance? These are the most common configuration
                problems.
              </p>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  Docker container cannot reach the network
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> Docker&apos;s default bridge network isolates
                  containers from the host network. mDNS and multicast traffic do not
                  cross the bridge.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Use <code>--network host</code> when running the
                  Docker container, or configure macvlan networking. Ensure UDP port 5353
                  is forwarded if using bridge mode.
                </p>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  Signaling server not reachable
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> The signaling server URL is misconfigured, TLS
                  certificates are invalid, or the WebSocket port is blocked by a firewall.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Verify the <code>NEXT_PUBLIC_SIGNALING_URL</code>{' '}
                  environment variable. Ensure the signaling server has valid TLS certificates
                  (browsers require WSS, not WS). Check that your firewall allows the signaling port.
                </p>
              </div>

              <div className={styles.issueCard}>
                <h3 className={styles.issueTitle}>
                  <AlertCircle style={{ width: 20, height: 20, color: 'var(--warning-500)' }} />
                  TURN server not working
                </h3>
                <p className={styles.issueCause}>
                  <strong>Cause:</strong> TURN credentials are expired, the server is not
                  listening on the expected ports, or TLS is misconfigured.
                </p>
                <p className={styles.issueFix}>
                  <strong>Fix:</strong> Test your TURN server with an online WebRTC tester.
                  Verify it listens on port 3478 (UDP/TCP) and 443 (TLS). Ensure credentials
                  are correctly set in your environment variables.
                </p>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Docker Compose</p>
                  <p className={styles.calloutText}>
                    The recommended way to self-host is with Docker Compose. See the project
                    README for a complete <code>docker-compose.yml</code> that includes the
                    web app, signaling server, and TURN server.
                  </p>
                </div>
              </div>
            </section>

            {/* ===== 7. Common Error Messages ===== */}
            <section id="error-messages" className={styles.section}>
              <h2 className={styles.sectionTitle}>Common Error Messages</h2>
              <p className={styles.sectionDescription}>
                A quick reference for error codes and messages you may see in Tallow.
              </p>

              <div className={styles.errorTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Error</th>
                      <th>Meaning</th>
                      <th>Fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>ERR_ICE_FAILED</code></td>
                      <td>WebRTC could not establish a peer connection.</td>
                      <td>Check firewall settings. Tallow will fall back to TURN relay automatically.</td>
                    </tr>
                    <tr>
                      <td><code>ERR_SIGNALING_TIMEOUT</code></td>
                      <td>Could not reach the signaling server within the timeout period.</td>
                      <td>Check your internet connection. If self-hosting, verify the signaling server is running.</td>
                    </tr>
                    <tr>
                      <td><code>ERR_CRYPTO_UNAVAILABLE</code></td>
                      <td>WebCrypto API is not available in this context.</td>
                      <td>Access Tallow over HTTPS. Use <code>localhost</code> for local development.</td>
                    </tr>
                    <tr>
                      <td><code>ERR_TRANSFER_REJECTED</code></td>
                      <td>The receiving device declined the incoming transfer.</td>
                      <td>Contact the recipient and ask them to accept the transfer.</td>
                    </tr>
                    <tr>
                      <td><code>ERR_DISK_FULL</code></td>
                      <td>The receiving device ran out of disk space.</td>
                      <td>Free up disk space on the receiving device and retry.</td>
                    </tr>
                    <tr>
                      <td><code>ERR_FILE_TOO_LARGE</code></td>
                      <td>The file exceeds the browser&apos;s memory or storage limit.</td>
                      <td>Try a smaller file, use a desktop browser, or split the file into parts.</td>
                    </tr>
                    <tr>
                      <td><code>ERR_ROOM_NOT_FOUND</code></td>
                      <td>The room code entered does not match any active room.</td>
                      <td>Verify the room code. Rooms expire after the session ends.</td>
                    </tr>
                    <tr>
                      <td><code>ERR_AUTH_FAILED</code></td>
                      <td>Key exchange or authentication handshake failed.</td>
                      <td>This may indicate a network issue or MITM attempt. Retry the connection.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={`${styles.callout} ${styles.errorCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Unknown Errors</p>
                  <p className={styles.calloutText}>
                    If you encounter an error not listed here, open the browser developer console
                    (F12) and check for detailed error messages. Include these when reporting
                    issues on GitHub.
                  </p>
                </div>
              </div>
            </section>

            {/* ===== 8. Getting More Help ===== */}
            <section id="getting-help" className={styles.section}>
              <h2 className={styles.sectionTitle}>Getting More Help</h2>
              <p className={styles.sectionDescription}>
                If the steps above did not resolve your issue, here are more resources.
              </p>

              <div className={styles.helpGrid}>
                <div className={styles.helpCard}>
                  <h3 className={styles.helpCardTitle}>GitHub Issues</h3>
                  <p className={styles.helpCardText}>
                    Search existing issues or file a new one on the Tallow GitHub repository.
                    Include your browser, OS, network type, and any error messages.
                  </p>
                </div>

                <div className={styles.helpCard}>
                  <h3 className={styles.helpCardTitle}>Debug Logging</h3>
                  <p className={styles.helpCardText}>
                    Open the browser console (F12 &gt; Console) before reproducing the issue.
                    Tallow logs connection events, transfer progress, and error details to
                    the console for debugging.
                  </p>
                </div>

                <div className={styles.helpCard}>
                  <h3 className={styles.helpCardTitle}>Community</h3>
                  <p className={styles.helpCardText}>
                    Join the Tallow community for real-time help. Other users and contributors
                    can often help diagnose tricky network or browser issues.
                  </p>
                </div>
              </div>

              <div className={styles.diagnosticSteps}>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Reproduce the issue</h3>
                    <p className={styles.stepText}>
                      Note the exact steps that trigger the problem. Try to reproduce it
                      consistently before reporting.
                    </p>
                  </div>
                </div>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Collect debug info</h3>
                    <p className={styles.stepText}>
                      Open the browser console (F12), reproduce the issue, and copy any error
                      messages. Note your browser version and operating system.
                    </p>
                  </div>
                </div>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Search existing issues</h3>
                    <p className={styles.stepText}>
                      Check the GitHub Issues page for similar reports. Your problem may already
                      have a known fix or workaround.
                    </p>
                  </div>
                </div>
                <div className={styles.diagnosticStep}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>File a bug report</h3>
                    <p className={styles.stepText}>
                      If no existing issue matches, create a new one with your reproduction
                      steps, debug logs, browser version, and OS details.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Open Source</p>
                  <p className={styles.calloutText}>
                    Tallow is open source. You can inspect the code, submit fixes, and
                    contribute improvements. Every bug report helps make Tallow better
                    for everyone.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div className={styles.navigationContainer}>
            <Link href="/docs/guides/security" className={styles.navLink}>
              <span className={styles.navLabel}>Previous</span>
              <span className={styles.navTitle}>
                <ArrowLeft />
                Security Guide
              </span>
            </Link>
            <Link href="/docs/guides" className={styles.navLink} style={{ textAlign: 'right' }}>
              <span className={styles.navLabel}>Up next</span>
              <span className={styles.navTitle} style={{ justifyContent: 'flex-end' }}>
                All Guides
                <ArrowRight />
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
