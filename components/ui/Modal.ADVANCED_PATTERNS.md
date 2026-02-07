# Modal & ConfirmDialog - Advanced Patterns

## Multi-Step Form Wizard

```tsx
import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/ui';

function WizardModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    console.log('Wizard completed');
    setOpen(false);
    setStep(1);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="md">
      <ModalHeader>
        <h2>Setup Wizard - Step {step} of {totalSteps}</h2>
        <div style={{
          width: '100%',
          height: '4px',
          background: 'var(--color-surface-elevated)',
          borderRadius: '2px',
          marginTop: '1rem'
        }}>
          <div style={{
            width: `${(step / totalSteps) * 100}%`,
            height: '100%',
            background: 'var(--color-accent)',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </ModalHeader>
      <ModalBody>
        {step === 1 && <div>Step 1 Content</div>}
        {step === 2 && <div>Step 2 Content</div>}
        {step === 3 && <div>Step 3 Content</div>}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
        >
          Back
        </Button>
        <Button onClick={handleNext}>
          {step === totalSteps ? 'Complete' : 'Next'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

## Confirmation with Reason

```tsx
import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, TextArea } from '@/components/ui';

function ReasonConfirmModal() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      console.log('Confirmed with reason:', reason);
      setOpen(false);
      setReason('');
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="sm">
      <ModalHeader>
        <h2>Confirm Deletion</h2>
      </ModalHeader>
      <ModalBody>
        <p style={{ marginBottom: '1rem' }}>
          Please provide a reason for deleting this item:
        </p>
        <TextArea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason..."
          rows={4}
          required
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={!reason.trim()}
        >
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

## Async Validation Dialog

```tsx
import { useState } from 'react';
import { ConfirmDialog, WarningIcon } from '@/components/ui';

function ValidationDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      // Simulate API validation
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate validation failure
          if (Math.random() > 0.5) {
            reject(new Error('Validation failed: insufficient permissions'));
          } else {
            resolve(true);
          }
        }, 2000);
      });

      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={() => setOpen(false)}
      onConfirm={handleConfirm}
      title="Confirm Action"
      description={
        <div>
          <p>This action requires validation.</p>
          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'var(--color-error-subtle)',
              border: '1px solid var(--color-error)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-error)',
              fontSize: 'var(--font-size-sm)'
            }}>
              {error}
            </div>
          )}
        </div>
      }
      loading={loading}
      icon={<WarningIcon />}
    />
  );
}
```

## Conditional Confirmation

```tsx
import { useState } from 'react';
import { ConfirmDialog, DeleteIcon, Checkbox } from '@/components/ui';

function ConditionalConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const handleConfirm = () => {
    if (understood) {
      console.log('Confirmed with understanding');
      setOpen(false);
      setUnderstood(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={() => {
        setOpen(false);
        setUnderstood(false);
      }}
      onConfirm={handleConfirm}
      title="Permanent Deletion"
      description={
        <div>
          <p style={{ marginBottom: '1rem' }}>
            This will permanently delete all data. This action cannot be undone.
          </p>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer'
          }}>
            <Checkbox
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
            />
            <span>I understand this action is permanent</span>
          </label>
        </div>
      }
      confirmText="Delete Permanently"
      destructive
      icon={<DeleteIcon />}
      // Disable confirm until checkbox is checked
      loading={!understood}
    />
  );
}
```

## Custom Hook for Modal State

```tsx
import { useState, useCallback } from 'react';

interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

function useModal(defaultOpen = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}

// Usage
function Component() {
  const modal = useModal();

  return (
    <>
      <Button onClick={modal.open}>Open Modal</Button>
      <Modal open={modal.isOpen} onClose={modal.close}>
        <p>Content</p>
      </Modal>
    </>
  );
}
```

## Confirmation Chain

```tsx
import { useState } from 'react';
import { ConfirmDialog, WarningIcon, DeleteIcon } from '@/components/ui';

function ConfirmationChain() {
  const [step, setStep] = useState<'initial' | 'final' | 'closed'>('closed');

  const handleInitialConfirm = () => {
    setStep('final');
  };

  const handleFinalConfirm = () => {
    console.log('Action confirmed');
    setStep('closed');
  };

  const handleClose = () => {
    setStep('closed');
  };

  return (
    <>
      <Button onClick={() => setStep('initial')}>Delete Account</Button>

      {/* First confirmation */}
      <ConfirmDialog
        open={step === 'initial'}
        onClose={handleClose}
        onConfirm={handleInitialConfirm}
        title="Are you sure?"
        description="This will delete your account and all associated data."
        confirmText="Continue"
        icon={<WarningIcon />}
      />

      {/* Final confirmation */}
      <ConfirmDialog
        open={step === 'final'}
        onClose={handleClose}
        onConfirm={handleFinalConfirm}
        title="Final Confirmation"
        description="This is your last chance to cancel. This action cannot be undone."
        confirmText="Delete Account"
        destructive
        icon={<DeleteIcon />}
      />
    </>
  );
}
```

## Modal with Dynamic Content Loading

```tsx
import { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, Spinner } from '@/components/ui';

function DynamicContentModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (open && !data) {
      setLoading(true);
      fetch(`/api/users/${userId}`)
        .then((res) => res.json())
        .then((json) => {
          setData(json);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [open, userId, data]);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      size="md"
    >
      <ModalHeader>
        <h2>User Details</h2>
      </ModalHeader>
      <ModalBody>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner />
            <p>Loading user data...</p>
          </div>
        ) : data ? (
          <div>
            <h3>{data.name}</h3>
            <p>{data.email}</p>
            {/* More user data */}
          </div>
        ) : (
          <p>Failed to load data</p>
        )}
      </ModalBody>
    </Modal>
  );
}
```

## Modal Manager Context

```tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal } from '@/components/ui';

interface ModalContextValue {
  openModal: (content: ReactNode, options?: ModalOptions) => void;
  closeModal: () => void;
}

interface ModalOptions {
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdropClick?: boolean;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  const [options, setOptions] = useState<ModalOptions>({});

  const openModal = useCallback((
    newContent: ReactNode,
    newOptions?: ModalOptions
  ) => {
    setContent(newContent);
    setOptions(newOptions || {});
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Clear content after animation
    setTimeout(() => {
      setContent(null);
      setOptions({});
    }, 200);
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <Modal
        open={isOpen}
        onClose={closeModal}
        title={options.title}
        size={options.size}
        closeOnBackdropClick={options.closeOnBackdropClick}
      >
        {content}
      </Modal>
    </ModalContext.Provider>
  );
}

export function useModalManager() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalManager must be used within ModalProvider');
  }
  return context;
}

// Usage
function SomeComponent() {
  const { openModal, closeModal } = useModalManager();

  const handleClick = () => {
    openModal(
      <div>
        <p>Dynamic content</p>
        <Button onClick={closeModal}>Close</Button>
      </div>,
      { title: 'Dynamic Modal', size: 'md' }
    );
  };

  return <Button onClick={handleClick}>Open Modal</Button>;
}
```

## Stacked Modals (Careful!)

```tsx
import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/ui';

function StackedModals() {
  const [modal1Open, setModal1Open] = useState(false);
  const [modal2Open, setModal2Open] = useState(false);

  return (
    <>
      <Button onClick={() => setModal1Open(true)}>Open First Modal</Button>

      <Modal
        open={modal1Open}
        onClose={() => setModal1Open(false)}
        zIndex={500}
      >
        <ModalHeader><h2>First Modal</h2></ModalHeader>
        <ModalBody>
          <p>This opens another modal</p>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setModal2Open(true)}>
            Open Second Modal
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        open={modal2Open}
        onClose={() => setModal2Open(false)}
        zIndex={600}
        size="sm"
      >
        <ModalHeader><h2>Second Modal</h2></ModalHeader>
        <ModalBody>
          <p>Stacked on top of first modal</p>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => {
            setModal2Open(false);
            setModal1Open(false);
          }}>
            Close Both
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
```

## Responsive Modal Content

```tsx
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Modal, ModalHeader, ModalBody } from '@/components/ui';

function ResponsiveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={isMobile ? 'full' : 'lg'}
    >
      <ModalHeader>
        <h2>{isMobile ? 'Mobile View' : 'Desktop View'}</h2>
      </ModalHeader>
      <ModalBody>
        {isMobile ? (
          <div>
            {/* Mobile-optimized content */}
            <p>Optimized for mobile devices</p>
          </div>
        ) : (
          <div>
            {/* Desktop-optimized content */}
            <p>Optimized for desktop</p>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
```

## Modal with Tabs

```tsx
import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, Tabs } from '@/components/ui';

function TabbedModal() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="lg">
      <ModalHeader>
        <h2>User Profile</h2>
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { value: 'details', label: 'Details' },
            { value: 'settings', label: 'Settings' },
            { value: 'activity', label: 'Activity' },
          ]}
        />
      </ModalHeader>
      <ModalBody>
        {activeTab === 'details' && <div>Details Content</div>}
        {activeTab === 'settings' && <div>Settings Content</div>}
        {activeTab === 'activity' && <div>Activity Content</div>}
      </ModalBody>
    </Modal>
  );
}
```

## Best Practices Summary

### Do's ✅

1. **Use appropriate size for content**
   ```tsx
   <Modal size="sm"> // For confirmations
   <Modal size="md"> // For forms (default)
   <Modal size="lg"> // For complex content
   ```

2. **Provide clear titles**
   ```tsx
   <Modal title="Edit Profile"> // Clear action
   <Modal title="Delete Account"> // Clear consequence
   ```

3. **Handle loading states**
   ```tsx
   <ConfirmDialog loading={isLoading} />
   ```

4. **Use destructive variant for dangerous actions**
   ```tsx
   <ConfirmDialog destructive icon={<DeleteIcon />} />
   ```

5. **Implement proper error handling**
   ```tsx
   const handleConfirm = async () => {
     try {
       await action();
     } catch (error) {
       showError(error);
     }
   };
   ```

### Don'ts ❌

1. **Don't nest too many modals**
   ```tsx
   // Avoid: Modal → Modal → Modal
   // Instead: Use wizard/stepper pattern
   ```

2. **Don't forget cleanup**
   ```tsx
   // Bad: Modal closes but state remains
   // Good: Reset state on close
   useEffect(() => {
     if (!open) setFormData({});
   }, [open]);
   ```

3. **Don't block critical exits**
   ```tsx
   // Bad: closeOnEscape={false} for non-critical
   // Good: Always allow escape except during loading
   ```

4. **Don't overuse modals**
   ```tsx
   // Consider: Inline editing, tooltips, popovers
   // Use modals for: Critical actions, complex forms
   ```

5. **Don't ignore mobile UX**
   ```tsx
   // Use appropriate sizes for mobile
   // Test touch interactions
   // Consider drawer pattern for mobile
   ```

## Performance Tips

1. **Lazy load modal content**
2. **Memoize expensive renders**
3. **Defer non-critical animations**
4. **Use portal rendering**
5. **Clean up event listeners**

## Accessibility Tips

1. **Always provide titles**
2. **Use semantic HTML**
3. **Test with keyboard only**
4. **Test with screen readers**
5. **Ensure focus management**

---

These patterns cover 90% of real-world modal use cases while maintaining best practices for performance, accessibility, and user experience.
