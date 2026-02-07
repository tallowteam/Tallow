'use client';

import { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmDialog,
  DeleteIcon,
  WarningIcon,
  InfoIcon,
  SuccessIcon,
  Button,
  Input,
} from '@/components/ui';

/**
 * Modal Examples
 * Demonstrates all Modal and ConfirmDialog features
 */
export function ModalExamples() {
  // Basic modal
  const [basicOpen, setBasicOpen] = useState(false);

  // Size variants
  const [smallOpen, setSmallOpen] = useState(false);
  const [mediumOpen, setMediumOpen] = useState(false);
  const [largeOpen, setLargeOpen] = useState(false);
  const [xlOpen, setXlOpen] = useState(false);

  // With form
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  // With custom content
  const [customOpen, setCustomOpen] = useState(false);

  // Confirm dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [loadingDialogOpen, setLoadingDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.info('Form submitted:', formData);
    setFormOpen(false);
  };

  // Handle async confirm
  const handleAsyncConfirm = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    setLoadingDialogOpen(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Modal & ConfirmDialog Examples</h1>

      {/* Basic Modal Examples */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Basic Modal</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button onClick={() => setBasicOpen(true)}>Open Basic Modal</Button>
        </div>

        <Modal open={basicOpen} onClose={() => setBasicOpen(false)} title="Basic Modal">
          <p>This is a basic modal with a title and content.</p>
          <p>Click outside, press Escape, or click the X button to close.</p>
        </Modal>
      </section>

      {/* Size Variants */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Size Variants</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button onClick={() => setSmallOpen(true)}>Small</Button>
          <Button onClick={() => setMediumOpen(true)}>Medium</Button>
          <Button onClick={() => setLargeOpen(true)}>Large</Button>
          <Button onClick={() => setXlOpen(true)}>Extra Large</Button>
        </div>

        <Modal open={smallOpen} onClose={() => setSmallOpen(false)} title="Small Modal" size="sm">
          <p>This is a small modal (480px max width).</p>
        </Modal>

        <Modal open={mediumOpen} onClose={() => setMediumOpen(false)} title="Medium Modal" size="md">
          <p>This is a medium modal (640px max width). This is the default size.</p>
        </Modal>

        <Modal open={largeOpen} onClose={() => setLargeOpen(false)} title="Large Modal" size="lg">
          <p>This is a large modal (768px max width). Perfect for forms and detailed content.</p>
        </Modal>

        <Modal open={xlOpen} onClose={() => setXlOpen(false)} title="Extra Large Modal" size="xl">
          <p>This is an extra large modal (1024px max width). Great for complex interfaces.</p>
        </Modal>
      </section>

      {/* Compositional API */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Compositional API</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button onClick={() => setCustomOpen(true)}>Open Composed Modal</Button>
        </div>

        <Modal
          open={customOpen}
          onClose={() => setCustomOpen(false)}
          size="md"
          showCloseButton={false}
        >
          <ModalHeader>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Custom Header</h2>
          </ModalHeader>
          <ModalBody>
            <p>Using the compositional API gives you more control over the layout.</p>
            <p>You can use ModalHeader, ModalBody, and ModalFooter components.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setCustomOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCustomOpen(false)}>Save Changes</Button>
          </ModalFooter>
        </Modal>
      </section>

      {/* Form Modal */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Form Modal</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button onClick={() => setFormOpen(true)}>Open Form Modal</Button>
        </div>

        <Modal open={formOpen} onClose={() => setFormOpen(false)} size="md" showCloseButton={false}>
          <ModalHeader>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Profile</h2>
          </ModalHeader>
          <form onSubmit={handleFormSubmit}>
            <ModalBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Name
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)} type="button">
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </ModalFooter>
          </form>
        </Modal>
      </section>

      {/* Confirm Dialogs */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Confirm Dialogs</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button variant="danger" onClick={() => setDeleteDialogOpen(true)}>
            Delete Item
          </Button>
          <Button variant="outline" onClick={() => setWarningDialogOpen(true)}>
            Show Warning
          </Button>
          <Button variant="outline" onClick={() => setInfoDialogOpen(true)}>
            Show Info
          </Button>
          <Button variant="outline" onClick={() => setSuccessDialogOpen(true)}>
            Show Success
          </Button>
          <Button variant="outline" onClick={() => setLoadingDialogOpen(true)}>
            Async Action
          </Button>
        </div>

        {/* Delete Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            console.info('Item deleted');
          }}
          title="Delete Item"
          description="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          destructive
          icon={<DeleteIcon />}
        />

        {/* Warning Dialog */}
        <ConfirmDialog
          open={warningDialogOpen}
          onClose={() => setWarningDialogOpen(false)}
          onConfirm={() => {
            console.info('Warning confirmed');
          }}
          title="Unsaved Changes"
          description="You have unsaved changes. Are you sure you want to leave?"
          confirmText="Leave"
          cancelText="Stay"
          destructive
          icon={<WarningIcon />}
        />

        {/* Info Dialog */}
        <ConfirmDialog
          open={infoDialogOpen}
          onClose={() => setInfoDialogOpen(false)}
          onConfirm={() => {
            console.info('Info acknowledged');
          }}
          title="Important Information"
          description={
            <div>
              <p>This feature will be updated in the next release.</p>
              <p>
                <strong>New features include:</strong>
              </p>
              <ul>
                <li>Improved performance</li>
                <li>Better accessibility</li>
                <li>Dark mode support</li>
              </ul>
            </div>
          }
          confirmText="Got it"
          cancelText="Learn More"
          icon={<InfoIcon />}
        />

        {/* Success Dialog */}
        <ConfirmDialog
          open={successDialogOpen}
          onClose={() => setSuccessDialogOpen(false)}
          onConfirm={() => {
            console.info('Success acknowledged');
          }}
          title="Success!"
          description="Your changes have been saved successfully."
          confirmText="Continue"
          cancelText="Close"
          icon={<SuccessIcon />}
        />

        {/* Loading Dialog */}
        <ConfirmDialog
          open={loadingDialogOpen}
          onClose={() => setLoadingDialogOpen(false)}
          onConfirm={handleAsyncConfirm}
          title="Confirm Action"
          description="This action will take a few seconds to complete."
          confirmText="Confirm"
          cancelText="Cancel"
          loading={loading}
          icon={<InfoIcon />}
        />
      </section>

      {/* Features List */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Features</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>✅ Portal rendering (renders at document root)</li>
          <li>✅ Focus trap (keyboard navigation stays within modal)</li>
          <li>✅ Focus restoration (returns focus to trigger element)</li>
          <li>✅ Escape to close (customizable)</li>
          <li>✅ Click outside to close (customizable)</li>
          <li>✅ Body scroll lock (prevents background scrolling)</li>
          <li>✅ Smooth animations (fade + scale)</li>
          <li>✅ Respects reduced motion preference</li>
          <li>✅ Multiple size variants</li>
          <li>✅ Compositional API (Header, Body, Footer)</li>
          <li>✅ Fully accessible (ARIA attributes, keyboard support)</li>
          <li>✅ TypeScript support</li>
          <li>✅ Mobile responsive (slides up on mobile)</li>
          <li>✅ Vercel dark theme styling</li>
          <li>✅ ConfirmDialog with preset icons</li>
          <li>✅ Destructive variant (red confirm button)</li>
          <li>✅ Loading state support</li>
        </ul>
      </section>
    </div>
  );
}

export default ModalExamples;
