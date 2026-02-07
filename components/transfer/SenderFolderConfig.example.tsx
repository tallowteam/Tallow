'use client';

/**
 * Sender Folder Configuration - Example & Integration Guide
 *
 * This example demonstrates how to:
 * 1. Use the SenderFolderConfig component
 * 2. Integrate with file receiving logic
 * 3. Apply folder organization to downloads
 */

import { useState } from 'react';
import SenderFolderConfig from './SenderFolderConfig';
import { getSenderFolderManager } from '@/lib/storage/sender-folders';

export default function SenderFolderConfigExample() {
  const [selectedTab, setSelectedTab] = useState<'settings' | 'integration'>('settings');

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
        Sender Folder Configuration
      </h1>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '1rem'
      }}>
        <button
          type="button"
          onClick={() => setSelectedTab('settings')}
          style={{
            padding: '0.5rem 1rem',
            background: selectedTab === 'settings' ? 'var(--primary-500)' : 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            borderRadius: '6px',
          }}
        >
          Settings UI
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab('integration')}
          style={{
            padding: '0.5rem 1rem',
            background: selectedTab === 'integration' ? 'var(--primary-500)' : 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            borderRadius: '6px',
          }}
        >
          Integration Guide
        </button>
      </div>

      {/* Content */}
      {selectedTab === 'settings' ? (
        <SenderFolderConfig />
      ) : (
        <IntegrationGuide />
      )}
    </div>
  );
}

function IntegrationGuide() {
  const [simulatedSender] = useState({
    id: 'sender_123',
    name: 'John Doe',
  });

  const handleSimulateReceive = () => {
    const manager = getSenderFolderManager();
    const folder = manager.getOrCreateFolder(simulatedSender.id, simulatedSender.name);
    alert(`File would be saved to: ${folder}/filename.txt`);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      color: 'rgba(255, 255, 255, 0.9)'
    }}>
      <section>
        <h2 style={{ marginBottom: '1rem' }}>Integration Steps</h2>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginBottom: '0.75rem' }}>1. Import the Manager</h3>
          <pre style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
          }}>
{`import { getSenderFolderManager } from '@/lib/storage/sender-folders';

const manager = getSenderFolderManager();`}
          </pre>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginBottom: '0.75rem' }}>2. Get Folder on File Receipt</h3>
          <pre style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
          }}>
{`// When receiving a file
async function handleIncomingFile(
  senderId: string,
  senderName: string,
  file: File
) {
  // Get or create folder for this sender
  const folder = manager.getOrCreateFolder(senderId, senderName);

  // Construct full path
  const savePath = \`\${folder}/\${file.name}\`;

  // Save file to the folder
  await saveFile(savePath, file);

  console.log(\`File saved to: \${savePath}\`);
}`}
          </pre>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginBottom: '0.75rem' }}>3. Handle Folder Updates</h3>
          <pre style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
          }}>
{`// Listen for folder changes (if using React state)
useEffect(() => {
  const checkInterval = setInterval(() => {
    const currentFolder = manager.getSenderFolder(senderId);
    setFolder(currentFolder);
  }, 1000);

  return () => clearInterval(checkInterval);
}, [senderId]);`}
          </pre>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '1rem' }}>Usage Examples</h2>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Check if Sender Has Custom Folder</h3>
          <pre style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
          }}>
{`const hasCustomFolder = manager.hasSenderFolder(senderId);
if (hasCustomFolder) {
  const folder = manager.getSenderFolder(senderId);
  console.log(\`Custom folder: \${folder}\`);
}`}
          </pre>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Manually Set Folder</h3>
          <pre style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
          }}>
{`// Set custom folder for a sender
manager.setSenderFolder(
  'sender_123',
  'John Doe',
  'Work Documents'
);`}
          </pre>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Get All Folder Mappings</h3>
          <pre style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
          }}>
{`const allFolders = manager.getAllSenderFolders();
allFolders.forEach((folder, senderId) => {
  console.log(\`\${senderId} -> \${folder}\`);
});`}
          </pre>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '1rem' }}>Live Demo</h2>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <p style={{ marginBottom: '1rem' }}>
            Simulate receiving a file from: <strong>{simulatedSender.name}</strong>
          </p>
          <button
            type="button"
            onClick={handleSimulateReceive}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary-500)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              fontWeight: 500,
            }}
          >
            Simulate File Receipt
          </button>
          <p style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            This will show where the file would be saved based on current settings.
          </p>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '1rem' }}>API Reference</h2>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Method</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                  getOrCreateFolder(id, name)
                </td>
                <td style={{ padding: '0.75rem' }}>Get existing or create new folder</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                  setSenderFolder(id, name, folder)
                </td>
                <td style={{ padding: '0.75rem' }}>Set custom folder for sender</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                  getSenderFolder(id)
                </td>
                <td style={{ padding: '0.75rem' }}>Get folder name for sender</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                  removeSenderFolder(id)
                </td>
                <td style={{ padding: '0.75rem' }}>Remove folder assignment</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                  getAllSenderFolders()
                </td>
                <td style={{ padding: '0.75rem' }}>Get all folder mappings</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                  setAutoCreateSetting(enabled)
                </td>
                <td style={{ padding: '0.75rem' }}>Enable/disable auto-creation</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                  setFolderTemplate(template)
                </td>
                <td style={{ padding: '0.75rem' }}>Set naming template</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
