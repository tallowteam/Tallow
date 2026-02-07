/**
 * Hook for handling duplicate file detection and resolution
 *
 * Provides a simple interface for showing the duplicate file dialog
 * and processing the user's choice.
 *
 * @module use-duplicate-file-handler
 */

'use client';

import { useState, useCallback } from 'react';
import {
  handleDuplicateFile,
  getNextAvailableFileName,
  DuplicateAction,
  type DuplicateFileResult,
} from '@/lib/utils/duplicate-file-handler';

export interface UseDuplicateFileHandlerResult {
  /** Show the duplicate file dialog */
  showDialog: (fileName: string) => Promise<DuplicateFileResult>;
  /** Check if dialog is currently open */
  isDialogOpen: boolean;
  /** Current file name being processed */
  currentFileName: string | null;
  /** Suggested new name for rename action */
  suggestedName: string | null;
  /** Handle the user's choice from the dialog */
  handleChoice: (action: DuplicateAction, applyToAll: boolean) => void;
  /** Close the dialog */
  closeDialog: () => void;
}

/**
 * Hook for managing duplicate file detection and dialog
 *
 * @example
 * ```tsx
 * function FileReceiver() {
 *   const {
 *     showDialog,
 *     isDialogOpen,
 *     currentFileName,
 *     suggestedName,
 *     handleChoice,
 *     closeDialog
 *   } = useDuplicateFileHandler();
 *
 *   const handleFileReceived = async (fileName: string) => {
 *     const result = await showDialog(fileName);
 *     if (result.action === 'skip') {
 *       // Skip this file
 *       return;
 *     }
 *     const finalName = result.newName || fileName;
 *     // Save file with finalName
 *   };
 *
 *   return (
 *     <>
 *       <DuplicateFileDialog
 *         open={isDialogOpen}
 *         onClose={closeDialog}
 *         onConfirm={handleChoice}
 *         fileName={currentFileName || ''}
 *         suggestedName={suggestedName || undefined}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function useDuplicateFileHandler(): UseDuplicateFileHandlerResult {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [resolvePromise, setResolvePromise] = useState<
    ((result: DuplicateFileResult) => void) | null
  >(null);

  const showDialog = useCallback((fileName: string): Promise<DuplicateFileResult> => {
    return new Promise<DuplicateFileResult>((resolve) => {
      setCurrentFileName(fileName);
      setSuggestedName(getNextAvailableFileName(fileName));
      setIsDialogOpen(true);
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleChoice = useCallback(
    async (action: DuplicateAction, applyToAll: boolean) => {
      if (!currentFileName || !resolvePromise) {
        return;
      }

      const result = await handleDuplicateFile({
        fileName: currentFileName,
        applyToAll,
        preselectedAction: action,
      });

      resolvePromise(result);
      setIsDialogOpen(false);
      setCurrentFileName(null);
      setSuggestedName(null);
      setResolvePromise(null);
    },
    [currentFileName, resolvePromise]
  );

  const closeDialog = useCallback(() => {
    if (resolvePromise) {
      // User cancelled - skip the file
      resolvePromise({ action: 'skip' });
    }
    setIsDialogOpen(false);
    setCurrentFileName(null);
    setSuggestedName(null);
    setResolvePromise(null);
  }, [resolvePromise]);

  return {
    showDialog,
    isDialogOpen,
    currentFileName,
    suggestedName,
    handleChoice,
    closeDialog,
  };
}

/**
 * Simpler hook for automatic duplicate handling without dialog
 *
 * Automatically renames duplicate files without user interaction.
 *
 * @example
 * ```tsx
 * function AutoFileReceiver() {
 *   const { processFile } = useAutoDuplicateHandler();
 *
 *   const handleFileReceived = async (fileName: string) => {
 *     const finalName = await processFile(fileName);
 *     // Save file with finalName
 *   };
 * }
 * ```
 */
export function useAutoDuplicateHandler() {
  const processFile = useCallback(async (fileName: string): Promise<string> => {
    const result = await handleDuplicateFile({
      fileName,
      applyToAll: false,
      preselectedAction: 'rename', // Always rename on duplicate
    });

    return result.newName || fileName;
  }, []);

  return { processFile };
}
