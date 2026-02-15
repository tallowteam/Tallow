import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Info } from '@/components/icons';
import styles from './page.module.css';

export default function SelfHostingGuide() {
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
              <span>Self-Hosting</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Self-Hosting Tallow</h1>
            <p className={styles.heroDescription}>
              Run your own Tallow instance with complete control over your data.
              Deploy with Docker, configure signaling and TURN servers, and keep
              everything on your infrastructure.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>15 min read</span>
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
                  <a className={styles.tocLink} href="#prerequisites">Prerequisites</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#docker-quick-start">Docker Quick Start</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#docker-compose">Docker Compose</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#signaling-server">Signaling Server</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#turn-server">TURN Server</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#cloudflare-tunnel">Cloudflare Tunnel</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#synology-nas">Synology NAS</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#environment-variables">Environment Variables</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#updating">Updating</a>
                </li>
              </ul>
            </nav>

            {/* Prerequisites */}
            <section id="prerequisites" className={styles.section}>
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p className={styles.sectionDescription}>
                Before you begin, make sure you have the following tools and accounts ready.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Docker Engine</h3>
                    <p className={styles.stepText}>
                      Install Docker Engine 20.10+ or Docker Desktop. The container images
                      support amd64 and arm64 architectures.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Node.js (optional)</h3>
                    <p className={styles.stepText}>
                      Node.js 18+ is only needed if you want to run the signaling server
                      outside of Docker or build from source.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Domain name (optional)</h3>
                    <p className={styles.stepText}>
                      A domain name is required for SSL/TLS certificates and public-facing
                      deployments. For local-only use, you can skip this.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Hardware requirements</p>
                  <p className={styles.calloutText}>
                    Tallow is lightweight. A Raspberry Pi 4, an old laptop, or a small
                    VPS with 1 CPU core and 512 MB RAM is sufficient for most setups.
                  </p>
                </div>
              </div>
            </section>

            {/* Docker Quick Start */}
            <section id="docker-quick-start" className={styles.section}>
              <h2 className={styles.sectionTitle}>Docker Quick Start</h2>
              <p className={styles.sectionDescription}>
                Get Tallow running with a single command. This starts the web app with
                the built-in signaling server on port 3000.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Terminal</div>
                <pre className={styles.codeContent}>
                  <code>{`docker run -d \\
  --name tallow \\
  -p 3000:3000 \\
  -e TURN_URL=turn:your-server.com:3478 \\
  -e TURN_SECRET=your-shared-secret \\
  --restart unless-stopped \\
  ghcr.io/tallow/tallow:latest`}</code>
                </pre>
              </div>

              <p className={styles.sectionDescription}>
                Open <code>http://localhost:3000</code> in your browser. Devices on the
                same network can connect by navigating to your machine's IP address.
              </p>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>That's it for local use</p>
                  <p className={styles.calloutText}>
                    If you only need Tallow on your home or office network, this single
                    container is all you need. Read on for production-grade setups.
                  </p>
                </div>
              </div>
            </section>

            {/* Docker Compose */}
            <section id="docker-compose" className={styles.section}>
              <h2 className={styles.sectionTitle}>Docker Compose</h2>
              <p className={styles.sectionDescription}>
                For production deployments, use Docker Compose to run the web app,
                signaling server, and relay as separate services.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>docker-compose.yml</div>
                <pre className={styles.codeContent}>
                  <code>{`version: "3.9"

services:
  web:
    image: ghcr.io/tallow/tallow:latest
    ports:
      - "3000:3000"
    environment:
      - SIGNALING_URL=ws://signaling:4000
      - TURN_URL=turn:relay:3478
      - TURN_SECRET=\${TURN_SECRET}
    depends_on:
      - signaling
      - relay
    restart: unless-stopped

  signaling:
    image: ghcr.io/tallow/signaling:latest
    ports:
      - "4000:4000"
    environment:
      - PORT=4000
      - CORS_ORIGIN=http://localhost:3000
    restart: unless-stopped

  relay:
    image: coturn/coturn:latest
    ports:
      - "3478:3478"
      - "3478:3478/udp"
      - "49152-49200:49152-49200/udp"
    volumes:
      - ./turnserver.conf:/etc/turnserver.conf:ro
    restart: unless-stopped`}</code>
                </pre>
              </div>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Create a .env file</h3>
                    <p className={styles.stepText}>
                      Store your secrets in a <code>.env</code> file next to
                      <code> docker-compose.yml</code>. Never commit this file to version
                      control.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Start the stack</h3>
                    <p className={styles.stepText}>
                      Run <code>docker compose up -d</code> to start all three services
                      in the background.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Verify the deployment</h3>
                    <p className={styles.stepText}>
                      Run <code>docker compose ps</code> to confirm all services show
                      a healthy status, then open the web UI.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Signaling Server */}
            <section id="signaling-server" className={styles.section}>
              <h2 className={styles.sectionTitle}>Signaling Server</h2>
              <p className={styles.sectionDescription}>
                The signaling server coordinates WebRTC connections between peers.
                It handles room creation, device discovery, and SDP exchange
                but never sees your files.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>signaling server standalone</div>
                <pre className={styles.codeContent}>
                  <code>{`# Run the signaling server outside Docker
git clone https://github.com/tallow/tallow.git
cd tallow

npm install
node signaling-server.js`}</code>
                </pre>
              </div>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Default port</h3>
                    <p className={styles.stepText}>
                      The signaling server listens on port <code>4000</code> by default.
                      Override with the <code>PORT</code> environment variable.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>SSL / TLS</h3>
                    <p className={styles.stepText}>
                      For production, place the signaling server behind a reverse proxy
                      (nginx, Caddy) that terminates TLS. WebRTC requires secure
                      WebSocket (<code>wss://</code>) in browsers served over HTTPS.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>CORS configuration</h3>
                    <p className={styles.stepText}>
                      Set <code>CORS_ORIGIN</code> to the URL of your Tallow web app so
                      browsers can connect. Use a comma-separated list for multiple origins.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Zero knowledge</p>
                  <p className={styles.calloutText}>
                    The signaling server only relays encrypted WebRTC handshake messages.
                    It cannot read, store, or inspect any files transferred between peers.
                  </p>
                </div>
              </div>
            </section>

            {/* TURN Server */}
            <section id="turn-server" className={styles.section}>
              <h2 className={styles.sectionTitle}>TURN Server</h2>
              <p className={styles.sectionDescription}>
                A TURN (Traversal Using Relays around NAT) server relays traffic when
                direct peer-to-peer connections fail due to restrictive firewalls or
                symmetric NATs.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>turnserver.conf</div>
                <pre className={styles.codeContent}>
                  <code>{`# /etc/turnserver.conf
listening-port=3478
realm=tallow.example.com
server-name=tallow.example.com

# Authentication
use-auth-secret
static-auth-secret=your-shared-secret

# TLS (optional but recommended)
# cert=/etc/letsencrypt/live/tallow.example.com/fullchain.pem
# pkey=/etc/letsencrypt/live/tallow.example.com/privkey.pem

# Network
min-port=49152
max-port=49200
fingerprint
lt-cred-mech

# Logging
log-file=/var/log/turnserver.log
verbose`}</code>
                </pre>
              </div>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Install coturn</h3>
                    <p className={styles.stepText}>
                      On Debian/Ubuntu: <code>sudo apt install coturn</code>.
                      Alternatively use the Docker image shown in the Compose file above.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Set the shared secret</h3>
                    <p className={styles.stepText}>
                      The <code>static-auth-secret</code> must match the
                      <code> TURN_SECRET</code> environment variable in your Tallow web
                      app. Use a long, random string.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Open firewall ports</h3>
                    <p className={styles.stepText}>
                      Allow UDP/TCP on port <code>3478</code> and the relay port range
                      (<code>49152-49200</code>). Adjust the range based on expected
                      concurrent connections.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Bandwidth costs</p>
                  <p className={styles.calloutText}>
                    TURN relays all data through your server. Large file transfers will
                    consume significant bandwidth. Monitor usage carefully on metered
                    connections or VPS providers.
                  </p>
                </div>
              </div>
            </section>

            {/* Cloudflare Tunnel */}
            <section id="cloudflare-tunnel" className={styles.section}>
              <h2 className={styles.sectionTitle}>Cloudflare Tunnel</h2>
              <p className={styles.sectionDescription}>
                Cloudflare Tunnel lets you expose your self-hosted Tallow instance to
                the internet without opening ports on your router. Traffic is routed
                through Cloudflare's network with automatic TLS.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Install cloudflared</h3>
                    <p className={styles.stepText}>
                      Download and install the <code>cloudflared</code> daemon from
                      Cloudflare's releases page, or use the Docker image.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Authenticate and create tunnel</h3>
                    <p className={styles.stepText}>
                      Run <code>cloudflared tunnel login</code> to authenticate, then
                      <code> cloudflared tunnel create tallow</code> to create the tunnel.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Configure routing</h3>
                    <p className={styles.stepText}>
                      Map your domain to the local Tallow service. The signaling WebSocket
                      is automatically proxied.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>config.yml</div>
                <pre className={styles.codeContent}>
                  <code>{`# ~/.cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: tallow.example.com
    service: http://localhost:3000
  - hostname: signal.example.com
    service: http://localhost:4000
  - service: http_status:404`}</code>
                </pre>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Start the tunnel</div>
                <pre className={styles.codeContent}>
                  <code>{`cloudflared tunnel run tallow`}</code>
                </pre>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>No port forwarding needed</p>
                  <p className={styles.calloutText}>
                    Cloudflare Tunnel establishes an outbound connection from your
                    machine, so you never need to open inbound ports on your router
                    or firewall.
                  </p>
                </div>
              </div>
            </section>

            {/* Synology NAS */}
            <section id="synology-nas" className={styles.section}>
              <h2 className={styles.sectionTitle}>Synology NAS</h2>
              <p className={styles.sectionDescription}>
                Run Tallow on your Synology NAS using Container Manager (Docker).
                This turns your NAS into a private file transfer hub.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Open Container Manager</h3>
                    <p className={styles.stepText}>
                      Install Container Manager from the Synology Package Center if you
                      haven't already. Open it and go to the Registry tab.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Pull the Tallow image</h3>
                    <p className={styles.stepText}>
                      Search for <code>ghcr.io/tallow/tallow</code> in the registry and
                      download the <code>latest</code> tag. Synology NAS devices with
                      Intel or AMD CPUs use the amd64 image; models with ARM CPUs use arm64.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Create the container</h3>
                    <p className={styles.stepText}>
                      Map port <code>3000</code> to a local port, set the environment
                      variables listed below, and enable auto-restart.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Reverse proxy (optional)</h3>
                    <p className={styles.stepText}>
                      Use Synology's built-in reverse proxy (Control Panel &gt; Login
                      Portal &gt; Advanced &gt; Reverse Proxy) to serve Tallow on port
                      443 with your NAS's HTTPS certificate.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>QuickConnect not required</p>
                  <p className={styles.calloutText}>
                    Tallow works on your local network without Synology QuickConnect.
                    For remote access, use Cloudflare Tunnel or your own VPN instead
                    of exposing the NAS directly.
                  </p>
                </div>
              </div>
            </section>

            {/* Environment Variables */}
            <section id="environment-variables" className={styles.section}>
              <h2 className={styles.sectionTitle}>Environment Variables</h2>
              <p className={styles.sectionDescription}>
                Configure your Tallow deployment with these environment variables. All
                are optional and fall back to sensible defaults.
              </p>

              <div className={styles.envTable}>
                <div className={styles.envRow}>
                  <span className={styles.envName}>PORT</span>
                  <span className={styles.envDescription}>
                    Port the web server listens on.
                  </span>
                  <span className={styles.envDefault}>3000</span>
                </div>

                <div className={styles.envRow}>
                  <span className={styles.envName}>SIGNALING_URL</span>
                  <span className={styles.envDescription}>
                    WebSocket URL of the signaling server for WebRTC handshake.
                  </span>
                  <span className={styles.envDefault}>ws://localhost:4000</span>
                </div>

                <div className={styles.envRow}>
                  <span className={styles.envName}>TURN_URL</span>
                  <span className={styles.envDescription}>
                    TURN server address for NAT traversal relay.
                  </span>
                  <span className={styles.envDefault}>--</span>
                </div>

                <div className={styles.envRow}>
                  <span className={styles.envName}>TURN_SECRET</span>
                  <span className={styles.envDescription}>
                    Shared secret for TURN server time-limited credentials.
                  </span>
                  <span className={styles.envDefault}>--</span>
                </div>

                <div className={styles.envRow}>
                  <span className={styles.envName}>TURN_USERNAME</span>
                  <span className={styles.envDescription}>
                    Static TURN username (alternative to shared secret auth).
                  </span>
                  <span className={styles.envDefault}>--</span>
                </div>

                <div className={styles.envRow}>
                  <span className={styles.envName}>CORS_ORIGIN</span>
                  <span className={styles.envDescription}>
                    Allowed origin(s) for signaling server CORS. Comma-separated.
                  </span>
                  <span className={styles.envDefault}>*</span>
                </div>

                <div className={styles.envRow}>
                  <span className={styles.envName}>NODE_ENV</span>
                  <span className={styles.envDescription}>
                    Set to <code>production</code> for optimized builds and strict security headers.
                  </span>
                  <span className={styles.envDefault}>production</span>
                </div>

                <div className={styles.envRow}>
                  <span className={styles.envName}>LOG_LEVEL</span>
                  <span className={styles.envDescription}>
                    Logging verbosity: <code>debug</code>, <code>info</code>, <code>warn</code>, or <code>error</code>.
                  </span>
                  <span className={styles.envDefault}>info</span>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Keep secrets safe</p>
                  <p className={styles.calloutText}>
                    Never commit <code>TURN_SECRET</code> or credentials to version
                    control. Use Docker secrets, a <code>.env</code> file, or your
                    orchestrator's secret management.
                  </p>
                </div>
              </div>
            </section>

            {/* Updating */}
            <section id="updating" className={styles.section}>
              <h2 className={styles.sectionTitle}>Updating</h2>
              <p className={styles.sectionDescription}>
                Keep your self-hosted instance up to date with the latest security
                patches and features.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Update with Docker Compose</div>
                <pre className={styles.codeContent}>
                  <code>{`# Pull the latest images
docker compose pull

# Recreate containers with new images
docker compose up -d

# Remove old, unused images
docker image prune -f`}</code>
                </pre>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Update a standalone container</div>
                <pre className={styles.codeContent}>
                  <code>{`docker pull ghcr.io/tallow/tallow:latest
docker stop tallow
docker rm tallow

docker run -d \\
  --name tallow \\
  -p 3000:3000 \\
  -e TURN_URL=turn:your-server.com:3478 \\
  -e TURN_SECRET=your-shared-secret \\
  --restart unless-stopped \\
  ghcr.io/tallow/tallow:latest`}</code>
                </pre>
              </div>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Check the changelog</h3>
                    <p className={styles.stepText}>
                      Review the release notes before updating. Breaking changes or new
                      required environment variables will be highlighted.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Back up configuration</h3>
                    <p className={styles.stepText}>
                      Save your <code>docker-compose.yml</code>, <code>.env</code>,
                      and <code>turnserver.conf</code> files before upgrading. Tallow
                      stores no persistent data on disk, so there is no database to
                      migrate.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Test before production</h3>
                    <p className={styles.stepText}>
                      Run the new image locally or in a staging environment before
                      deploying to production. Verify signaling, TURN relay, and file
                      transfers all work as expected.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Zero downtime</p>
                  <p className={styles.calloutText}>
                    Active transfers are peer-to-peer and continue even while the web
                    server restarts. Only new connections are briefly affected during
                    the update window.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div>
            <Link href="/docs/guides/security" className={styles.navLink}>
              <span className={styles.navLabel}>
                <ArrowLeft /> Previous
              </span>
              <span className={styles.navTitle}>Security Guide</span>
            </Link>
            <Link href="/docs/guides" className={styles.navLink}>
              <span className={styles.navLabel}>
                Next <ArrowRight />
              </span>
              <span className={styles.navTitle}>All Guides</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
