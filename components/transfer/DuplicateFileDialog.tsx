'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DuplicateAction } from '@/lib/utils/duplicate-file-handler';
import { AlertCircle } from '@/components/icons';
import styles from './DuplicateFileDialog.module.css';

export interface DuplicateFileDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when user makes a choice */
  onConfirm: (action: DuplicateAction, applyToAll: boolean) => void;
  /** Filename that is duplicated */
  fileName: string;
  /** New filename if renamed */
  suggestedName?: string;
}

export function DuplicateFileDialog({
  open,
  onClose,
  onConfirm,
  fileName,
  suggestedName,
}: DuplicateFileDialogProps) {
  const [selectedAction, setSelectedAction] = useState<DuplicateAction>('rename');
  const [applyToAll, setApplyToAll] = useState(false);

  const handleConfirm = () => {
    onConfirm(selectedAction, applyToAll);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      closeOnBackdropClick={false}
      closeOnEscape={true}
      showCloseButton={false}
      className={styles.dialog ?? ''}
    >
      <div className={styles.container}>
        <div className={styles.icon}>
          <AlertCircle />
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>File already exists</h2>
          <p className={styles.description}>
            A file with the name <strong>{fileName}</strong> has already been received.
            What would you like to do?
          </p>
        </div>

        <div className={styles.options}>
          <label className={styles.option}>
            <input
              type="radio"
              name="duplicate-action"
              value="rename"
              checked={selectedAction === 'rename'}
              onChange={() => setSelectedAction('rename')}
              className={styles.radio}
            />
            <div className={styles.optionContent}>
              <span className={styles.optionTitle}>Rename</span>
              <span className={styles.optionDescription}>
                Save as {suggestedName || 'renamed file'}
              </span>
            </div>
          </label>

          <label className={styles.option}>
            <input
              type="radio"
              name="duplicate-action"
              value="overwrite"
              checked={selectedAction === 'overwrite'}
              onChange={() => setSelectedAction('overwrite')}
              className={styles.radio}
            />
            <div className={styles.optionContent}>
              <span className={styles.optionTitle}>Overwrite</span>
              <span className={styles.optionDescription}>
                Replace the existing file
              </span>
            </div>
          </label>

          <label className={styles.option}>
            <input
              type="radio"
              name="duplicate-action"
              value="skip"
              checked={selectedAction === 'skip'}
              onChange={() => setSelectedAction('skip')}
              className={styles.radio}
            />
            <div className={styles.optionContent}>
              <span className={styles.optionTitle}>Skip</span>
              <span className={styles.optionDescription}>
                Do not save this file
              </span>
            </div>
          </label>
        </div>

        <label className={styles.applyToAll}>
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            className={styles.checkbox}
          />
          <span>Apply to all duplicate files</span>
        </label>

        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={onClose}
            size="md"
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            size="md"
            fullWidth
          >
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
}
