/**
 * FileDropZone Component Unit Tests
 * Tests for drag-drop file selection, file validation, click to browse, and multiple files
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileDropZone } from '@/components/transfer/FileDropZone';

// Mock DropZoneLoading component
vi.mock('@/components/transfer/LoadingStates', () => ({
  DropZoneLoading: () => <div>Loading...</div>,
}));

describe('FileDropZone Component', () => {
  const mockOnFilesSelected = vi.fn();

  beforeEach(() => {
    mockOnFilesSelected.mockClear();
  });

  const createFile = (name: string, size: number, type: string): File => {
    const file = new File(['a'.repeat(size)], name, { type });
    return file;
  };

  describe('Rendering', () => {
    it('renders drop zone', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);
      expect(screen.getByRole('button', { name: /drop files here or click to select/i })).toBeInTheDocument();
    });

    it('shows default text when no files', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);
      expect(screen.getByText(/drop files or folders here/i)).toBeInTheDocument();
      expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
    });

    it('shows add more text when has files', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} hasFiles={true} />);
      expect(screen.getByText(/add more files/i)).toBeInTheDocument();
    });

    it('shows max file size hint', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);
      expect(screen.getByText(/max file size:/i)).toBeInTheDocument();
    });
  });

  describe('Click to Browse', () => {
    it('opens file picker when clicked', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);

      const dropZone = screen.getByRole('button');
      const fileInput = dropZone.querySelector('input[type="file"]') as HTMLInputElement;

      const clickSpy = vi.spyOn(fileInput, 'click');

      fireEvent.click(dropZone);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('opens file picker on Enter key', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);

      const dropZone = screen.getByRole('button');
      const fileInput = dropZone.querySelector('input[type="file"]') as HTMLInputElement;

      const clickSpy = vi.spyOn(fileInput, 'click');

      fireEvent.keyDown(dropZone, { key: 'Enter' });

      expect(clickSpy).toHaveBeenCalled();
    });

    it('opens file picker on Space key', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);

      const dropZone = screen.getByRole('button');
      const fileInput = dropZone.querySelector('input[type="file"]') as HTMLInputElement;

      const clickSpy = vi.spyOn(fileInput, 'click');

      fireEvent.keyDown(dropZone, { key: ' ' });

      expect(clickSpy).toHaveBeenCalled();
    });

    it('does not open file picker when disabled', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} disabled />);

      const dropZone = screen.getByRole('button');
      const fileInput = dropZone.querySelector('input[type="file"]') as HTMLInputElement;

      const clickSpy = vi.spyOn(fileInput, 'click');

      fireEvent.click(dropZone);

      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe('File Selection via Input', () => {
    it('calls onFilesSelected when files are selected', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile('test.txt', 1000, 'text/plain');

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(mockOnFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('handles multiple files', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const files = [
        createFile('file1.txt', 1000, 'text/plain'),
        createFile('file2.jpg', 2000, 'image/jpeg'),
      ];

      fireEvent.change(fileInput, { target: { files } });

      expect(mockOnFilesSelected).toHaveBeenCalledWith(files);
    });

    it('resets input value after selection', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile('test.txt', 1000, 'text/plain');

      fileInput.value = 'test.txt';
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(fileInput.value).toBe('');
    });
  });

  describe('Drag and Drop', () => {
    it('applies dragging style on drag over', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);

      const dropZone = screen.getByRole('button');

      fireEvent.dragOver(dropZone);

      expect(dropZone).toHaveClass('dragging');
    });

    it('removes dragging style on drag leave', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);

      const dropZone = screen.getByRole('button');

      fireEvent.dragOver(dropZone);
      expect(dropZone).toHaveClass('dragging');

      fireEvent.dragLeave(dropZone);
      expect(dropZone).not.toHaveClass('dragging');
    });

    it('shows drop hint during drag', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);

      const dropZone = screen.getByRole('button');

      fireEvent.dragOver(dropZone);

      expect(screen.getByText(/drop files or folders here/i)).toBeInTheDocument();
    });

    it('handles file drop', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);

      const dropZone = screen.getByRole('button');
      const file = createFile('dropped.txt', 1000, 'text/plain');

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
          items: [],
        },
      });

      expect(mockOnFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('does not handle drop when disabled', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} disabled />);

      const dropZone = screen.getByRole('button');
      const file = createFile('dropped.txt', 1000, 'text/plain');

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    });
  });

  describe('File Validation', () => {
    it('rejects files exceeding max size', async () => {
      const maxSize = 1000; // 1KB
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} maxSize={maxSize} />);

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createFile('large.txt', 2000, 'text/plain');

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    });

    it('accepts files within max size', () => {
      const maxSize = 5000;
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} maxSize={maxSize} />);

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const smallFile = createFile('small.txt', 1000, 'text/plain');

      fireEvent.change(fileInput, { target: { files: [smallFile] } });

      expect(mockOnFilesSelected).toHaveBeenCalledWith([smallFile]);
    });

    it('validates file types when specified', async () => {
      render(
        <FileDropZone
          onFilesSelected={mockOnFilesSelected}
          acceptedFileTypes={['image/jpeg', 'image/png']}
        />
      );

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = createFile('doc.txt', 1000, 'text/plain');

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    });

    it('accepts valid file types', () => {
      render(
        <FileDropZone
          onFilesSelected={mockOnFilesSelected}
          acceptedFileTypes={['image/jpeg']}
        />
      );

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createFile('photo.jpg', 1000, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      expect(mockOnFilesSelected).toHaveBeenCalledWith([validFile]);
    });

    it('supports wildcard file types', () => {
      render(
        <FileDropZone
          onFilesSelected={mockOnFilesSelected}
          acceptedFileTypes={['image/*']}
        />
      );

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = createFile('photo.png', 1000, 'image/png');

      fireEvent.change(fileInput, { target: { files: [imageFile] } });

      expect(mockOnFilesSelected).toHaveBeenCalledWith([imageFile]);
    });

    it('shows error message for validation failures', async () => {
      const maxSize = 1000;
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} maxSize={maxSize} />);

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createFile('large.txt', 2000, 'text/plain');

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        const error = screen.getByRole('alert');
        expect(error).toHaveTextContent(/exceeds maximum size/i);
      });
    });

    it('clears error after timeout', async () => {
      vi.useFakeTimers();
      const maxSize = 1000;
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} maxSize={maxSize} />);

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createFile('large.txt', 2000, 'text/plain');

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled style', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} disabled />);

      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveClass('disabled');
      expect(dropZone).toHaveAttribute('aria-disabled', 'true');
    });

    it('has tabIndex -1 when disabled', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} disabled />);

      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveAttribute('tabIndex', '-1');
    });

    it('file input is disabled', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} disabled />);

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} loading />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('disables interaction when loading', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} loading />);

      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveClass('disabled');
      expect(dropZone).toHaveAttribute('aria-busy', 'true');
    });

    it('does not open file picker when loading', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} loading />);

      const dropZone = screen.getByRole('button');
      const fileInput = dropZone.querySelector('input[type="file"]') as HTMLInputElement;

      const clickSpy = vi.spyOn(fileInput, 'click');

      fireEvent.click(dropZone);

      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has button role', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has descriptive aria-label', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Drop files here or click to select');
    });

    it('file input has aria-hidden', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);
      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('aria-hidden', 'true');
    });

    it('file input has tabIndex -1', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);
      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('tabIndex', '-1');
    });

    it('is keyboard accessible', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);
      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveAttribute('tabIndex', '0');
    });

    it('error has alert role', async () => {
      const maxSize = 1000;
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} maxSize={maxSize} />);

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createFile('large.txt', 2000, 'text/plain');

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('File Input Attributes', () => {
    it('supports multiple file selection', () => {
      render(<FileDropZone onFilesSelected={mockOnFilesSelected} />);
      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('multiple');
    });
  });
});
