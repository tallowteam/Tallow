import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Info } from '@/components/icons';
import styles from './page.module.css';

export default function RoomSystemGuide() {
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
              <span>Room System</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Room System &amp; Group Transfers</h1>
            <p className={styles.heroDescription}>
              Create rooms, share codes, and transfer files to multiple devices at once.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>8 min read</span>
              <span className={styles.badge}>Intermediate</span>
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
                  <a className={styles.tocLink} href="#what-are-rooms">What Are Rooms?</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#creating-a-room">Creating a Room</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#joining-a-room">Joining a Room</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#room-permissions">Room Permissions</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#group-transfers">Group Transfers</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#room-encryption">Room Encryption</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#persistent-rooms">Persistent Rooms</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#best-practices">Best Practices</a>
                </li>
              </ul>
            </nav>

            {/* ------------------------------------------------
                Section 1: What Are Rooms?
                ------------------------------------------------ */}
            <section id="what-are-rooms" className={styles.section}>
              <h2 className={styles.sectionTitle}>What Are Rooms?</h2>
              <p className={styles.sectionDescription}>
                A room is a temporary or persistent virtual space where two or more devices
                can connect and exchange files. Each room is identified by a unique 6-digit
                code that acts as a shared secret between participants.
              </p>
              <p className={styles.sectionDescription}>
                Rooms solve a fundamental problem: how do devices that have never met find
                each other on the internet? Instead of exchanging IP addresses or scanning
                QR codes, both sides simply enter the same short code and Tallow's signaling
                server pairs them together.
              </p>

              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Temporary Rooms</h3>
                  <ul className={styles.comparisonList}>
                    <li>Created on-the-fly for a single transfer session</li>
                    <li>Automatically destroyed when the last participant leaves</li>
                    <li>Room code expires after 30-60 minutes of inactivity</li>
                    <li>No credentials stored on any server</li>
                  </ul>
                </div>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Persistent Rooms</h3>
                  <ul className={styles.comparisonList}>
                    <li>Survive beyond a single session</li>
                    <li>Optional password protection for recurring use</li>
                    <li>Ideal for teams or repeated device-to-device transfers</li>
                    <li>Can be deleted manually by the room creator</li>
                  </ul>
                </div>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>How Peers Connect</h3>
                  <ul className={styles.comparisonList}>
                    <li>Both devices send the room code to the signaling server</li>
                    <li>Server pairs them and relays ICE candidates</li>
                    <li>WebRTC peer connection is established directly</li>
                    <li>Signaling server is no longer needed after handshake</li>
                  </ul>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Zero Knowledge</p>
                  <p className={styles.calloutText}>
                    The signaling server only sees room codes and encrypted ICE candidates. It
                    never sees file names, sizes, or content. Once the P2P connection is live,
                    all data flows directly between devices.
                  </p>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------
                Section 2: Creating a Room
                ------------------------------------------------ */}
            <section id="creating-a-room" className={styles.section}>
              <h2 className={styles.sectionTitle}>Creating a Room</h2>
              <p className={styles.sectionDescription}>
                Setting up a room takes seconds. Follow these steps on the device that will
                host the transfer.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Open the Transfer Page</h3>
                    <p className={styles.stepText}>
                      Navigate to the Transfer page in Tallow. You can reach it from the main
                      navigation bar or by pressing <strong>Ctrl+T</strong> / <strong>Cmd+T</strong>.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Select Internet P2P Mode</h3>
                    <p className={styles.stepText}>
                      In the mode selector at the top, choose <strong>Internet P2P</strong>.
                      This enables room-based connectivity instead of local mDNS discovery.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Click "Create Room"</h3>
                    <p className={styles.stepText}>
                      Press the <strong>Create Room</strong> button. Tallow generates a
                      cryptographically random 6-digit code and registers it with the signaling
                      server.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Share the 6-Digit Code</h3>
                    <p className={styles.stepText}>
                      Copy the room code and send it to the people you want to connect with.
                      Use a secure channel such as an encrypted messaging app, a phone call,
                      or an in-person conversation.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Keep the Code Private</p>
                  <p className={styles.calloutText}>
                    Anyone who knows the room code can attempt to join. Treat it like a
                    one-time password and share it only with intended recipients.
                  </p>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------
                Section 3: Joining a Room
                ------------------------------------------------ */}
            <section id="joining-a-room" className={styles.section}>
              <h2 className={styles.sectionTitle}>Joining a Room</h2>
              <p className={styles.sectionDescription}>
                If someone shares a room code with you, joining is just as straightforward.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Enter the Room Code</h3>
                    <p className={styles.stepText}>
                      On the Transfer page, switch to Internet P2P mode and type or paste the
                      6-digit code into the <strong>Join Room</strong> field.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Connect</h3>
                    <p className={styles.stepText}>
                      Click <strong>Join</strong>. Tallow contacts the signaling server,
                      locates the room, and begins the WebRTC handshake with the host.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Wait for Host Approval</h3>
                    <p className={styles.stepText}>
                      The room creator receives a notification showing your device name. Once
                      they approve, the peer-to-peer connection is established and you can
                      begin transferring files.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Auto-Approve for Friends</p>
                  <p className={styles.calloutText}>
                    If the joining device belongs to someone in your Friends list, they can be
                    auto-approved. This skips the manual approval step for trusted contacts.
                  </p>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------
                Section 4: Room Permissions
                ------------------------------------------------ */}
            <section id="room-permissions" className={styles.section}>
              <h2 className={styles.sectionTitle}>Room Permissions</h2>
              <p className={styles.sectionDescription}>
                Rooms support three roles that control what each participant can do.
              </p>

              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Admin</h3>
                  <ul className={styles.comparisonList}>
                    <li>Full control over the room</li>
                    <li>Approve or reject join requests</li>
                    <li>Promote members or revoke access</li>
                    <li>Send and receive files</li>
                    <li>Close or delete the room</li>
                  </ul>
                </div>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Member</h3>
                  <ul className={styles.comparisonList}>
                    <li>Send files to any participant</li>
                    <li>Receive files from any participant</li>
                    <li>See the device list of all members</li>
                    <li>Cannot approve join requests</li>
                    <li>Cannot modify room settings</li>
                  </ul>
                </div>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Guest</h3>
                  <ul className={styles.comparisonList}>
                    <li>Receive files only</li>
                    <li>Cannot send files to others</li>
                    <li>Cannot see the full member list</li>
                    <li>Automatically removed when room closes</li>
                    <li>Ideal for one-way distribution</li>
                  </ul>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Default Role</p>
                  <p className={styles.calloutText}>
                    The room creator is always an Admin. Everyone who joins starts as a Member
                    unless the Admin explicitly assigns the Guest role.
                  </p>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------
                Section 5: Group Transfers
                ------------------------------------------------ */}
            <section id="group-transfers" className={styles.section}>
              <h2 className={styles.sectionTitle}>Group Transfers</h2>
              <p className={styles.sectionDescription}>
                Rooms are not limited to two devices. You can transfer files to every member
                of a room simultaneously using broadcast mode.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Add Files</h3>
                    <p className={styles.stepText}>
                      Drag and drop files into the transfer area or click the file picker to
                      select what you want to share.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Choose Recipients</h3>
                    <p className={styles.stepText}>
                      Select individual members from the device list, or toggle{' '}
                      <strong>Broadcast Mode</strong> to send to everyone in the room at once.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Send</h3>
                    <p className={styles.stepText}>
                      Click <strong>Send</strong>. Each recipient gets an independent P2P
                      stream, so transfers happen in parallel without slowing each other down.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Bandwidth Consideration</p>
                  <p className={styles.calloutText}>
                    Broadcasting to many peers multiplies your upload bandwidth usage. If you
                    have a slow connection, consider sending to a few members at a time rather
                    than all at once.
                  </p>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------
                Section 6: Room Encryption
                ------------------------------------------------ */}
            <section id="room-encryption" className={styles.section}>
              <h2 className={styles.sectionTitle}>Room Encryption</h2>
              <p className={styles.sectionDescription}>
                Every connection within a room is individually end-to-end encrypted. Room
                encryption in Tallow goes further than standard WebRTC DTLS by adding
                post-quantum protection.
              </p>

              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>E2E per Peer</h3>
                  <ul className={styles.comparisonList}>
                    <li>Each pair of devices negotiates its own session key</li>
                    <li>Compromising one link does not affect others</li>
                    <li>Keys are ephemeral and never reused</li>
                  </ul>
                </div>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Post-Quantum Security</h3>
                  <ul className={styles.comparisonList}>
                    <li>ML-KEM (Kyber) key encapsulation protects handshake</li>
                    <li>Resistant to harvest-now-decrypt-later attacks</li>
                    <li>Hybrid classical + PQ key exchange for defense in depth</li>
                  </ul>
                </div>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>SAS Verification</h3>
                  <ul className={styles.comparisonList}>
                    <li>Short Authentication String displayed on both devices</li>
                    <li>Verbal or visual comparison confirms no MITM</li>
                    <li>Available per-peer inside the room</li>
                  </ul>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Forward Secrecy</p>
                  <p className={styles.calloutText}>
                    Session keys are derived using a ratchet protocol. Even if a future key is
                    compromised, past sessions remain secure because old keys are
                    cryptographically erased.
                  </p>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------
                Section 7: Persistent Rooms
                ------------------------------------------------ */}
            <section id="persistent-rooms" className={styles.section}>
              <h2 className={styles.sectionTitle}>Persistent Rooms</h2>
              <p className={styles.sectionDescription}>
                By default, rooms are temporary and disappear when everyone leaves. Persistent
                rooms let you keep a room alive across sessions so you can reconnect without
                creating a new code each time.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Enable Persistence</h3>
                    <p className={styles.stepText}>
                      When creating a room, toggle <strong>Keep Room Open</strong>. The room
                      will remain registered on the signaling server even after you disconnect.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Set a Password (Optional)</h3>
                    <p className={styles.stepText}>
                      For recurring rooms, add a password. Anyone joining will need both the
                      room code and the password, adding a second layer of access control.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Reconnect Any Time</h3>
                    <p className={styles.stepText}>
                      Use the same room code to rejoin later. Your role and permissions are
                      preserved. The room stays active until the Admin explicitly deletes it.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Storage Limits</p>
                  <p className={styles.calloutText}>
                    Persistent rooms are subject to plan limits. Free accounts can maintain up
                    to 2 persistent rooms. Pro and Team plans support unlimited persistent
                    rooms.
                  </p>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------
                Section 8: Best Practices
                ------------------------------------------------ */}
            <section id="best-practices" className={styles.section}>
              <h2 className={styles.sectionTitle}>Best Practices</h2>
              <p className={styles.sectionDescription}>
                Follow these guidelines to keep your room transfers fast, reliable, and
                secure.
              </p>

              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Secure Code Sharing</h3>
                  <ul className={styles.comparisonList}>
                    <li>Never post room codes in public channels</li>
                    <li>Use encrypted messaging apps to share codes</li>
                    <li>Verbally share codes in-person when possible</li>
                    <li>Delete codes from chat history after the session</li>
                  </ul>
                </div>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Room Hygiene</h3>
                  <ul className={styles.comparisonList}>
                    <li>Close rooms when you are done transferring</li>
                    <li>Remove unknown devices immediately</li>
                    <li>Use SAS verification for sensitive transfers</li>
                    <li>Rotate persistent room codes periodically</li>
                  </ul>
                </div>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Performance Tips</h3>
                  <ul className={styles.comparisonList}>
                    <li>Keep room size under 10 peers for best speed</li>
                    <li>Use Ethernet for large broadcasts</li>
                    <li>Stagger large file sends to avoid upload saturation</li>
                    <li>Enable compression in Settings for slower networks</li>
                  </ul>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Pro Tip</p>
                  <p className={styles.calloutText}>
                    Combine persistent rooms with the Friends list for a seamless team
                    workflow. Friends auto-approve on join, so recurring collaborators never
                    have to wait for manual approval.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div>
            <Link href="/docs/guides/internet-transfer" className={styles.navLink}>
              <span className={styles.navLabel}>
                <ArrowLeft />
                Previous
              </span>
              <span className={styles.navTitle}>Internet Transfer</span>
            </Link>
            <Link href="/docs/guides/security" className={styles.navLink} style={{ textAlign: 'right' }}>
              <span className={styles.navLabel} style={{ justifyContent: 'flex-end' }}>
                Next
                <ArrowRight />
              </span>
              <span className={styles.navTitle}>Security Guide</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
