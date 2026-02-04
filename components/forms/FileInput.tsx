'use client';

import {
  forwardRef,
  InputHTMLAttributes,
  useState,
  useRef,
  DragEvent,
} from 'react';
import styles from './FileInput.module.css';

export interface FileInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  showPreview?: boolean;
  onChange?: (files: File[]) => void;
  fullWidth?: boolean;
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      label,
      error,
      helperText,
      accept,
      multiple = false,
      maxSize,
      maxFiles,
      showPreview = true,
      onChange,
      fullWidth = false,
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    const fileInputId =
      id || `file-input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error || localError);
    const displayError = error || localError;

    const validateFiles = (fileList: File[]): File[] => {
      setLocalError('');

      if (maxFiles && fileList.length > maxFiles) {
        setLocalError(`Maximum ${maxFiles} files allowed`);
        return [];
      }

      const validFiles = fileList.filter((file) => {
        if (maxSize && file.size > maxSize) {
          setLocalError(
            `File "${file.name}" exceeds maximum size of ${formatFileSize(
              maxSize
            )}`
          );
          return false;
        }

        if (accept) {
          const acceptedTypes = accept.split(',').map((t) => t.trim());
          const fileType = file.type;
          const fileName = file.name;
          const fileExt = '.' + fileName.split('.').pop();

          const isAccepted = acceptedTypes.some((type) => {
            if (type.startsWith('.')) {
              return fileExt === type;
            }
            if (type.endsWith('/*')) {
              return fileType.startsWith(type.slice(0, -1));
            }
            return fileType === type;
          });

          if (!isAccepted) {
            setLocalError(`File type "${fileType}" is not accepted`);
            return false;
          }
        }

        return true;
      });

      return validFiles;
    };

    const handleFiles = (fileList: FileList | null) => {
      if (!fileList || disabled) return;

      const newFiles = Array.from(fileList);
      const validFiles = validateFiles(newFiles);

      if (validFiles.length > 0) {
        const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
        setFiles(updatedFiles);
        onChange?.(updatedFiles);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (!disabled) {
        handleFiles(e.dataTransfer.files);
      }
    };

    const handleRemoveFile = (index: number) => {
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      onChange?.(updatedFiles);

      // Reset input value
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getFilePreview = (file: File): string | null => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    };

    const wrapperClasses = [
      styles.wrapper,
      fullWidth ? styles.fullWidth : '',
    ]
      .filter(Boolean)
      .join(' ');

    const dropzoneClasses = [
      styles.dropzone,
      isDragging ? styles.dragging : '',
      hasError ? styles.error : '',
      disabled ? styles.disabled : '',
      files.length > 0 ? styles.hasFiles : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={fileInputId} className={styles.label}>
            {label}
          </label>
        )}

        <div
          className={dropzoneClasses}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            type="file"
            id={fileInputId}
            className={styles.input}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={handleChange}
            aria-invalid={hasError}
            aria-describedby={
              displayError
                ? `${fileInputId}-error`
                : helperText
                ? `${fileInputId}-helper`
                : undefined
            }
            {...props}
          />

          <div className={styles.dropzoneContent}>
            <svg
              className={styles.uploadIcon}
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M24 32V16M24 16L16 24M24 16L32 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M40 32V38C40 39.1046 39.1046 40 38 40H10C8.89543 40 8 39.1046 8 38V32"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className={styles.dropzoneText}>
              <p className={styles.primaryText}>
                {isDragging
                  ? 'Drop files here'
                  : 'Drag and drop files here, or click to browse'}
              </p>
              {(accept || maxSize || maxFiles) && (
                <p className={styles.secondaryText}>
                  {accept && `Accepted: ${accept.replace(/,/g, ', ')}`}
                  {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
                  {maxFiles && ` • Max files: ${maxFiles}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {showPreview && files.length > 0 && (
          <div className={styles.fileList}>
            {files.map((file, index) => {
              const preview = getFilePreview(file);

              return (
                <div key={`${file.name}-${index}`} className={styles.fileItem}>
                  {preview ? (
                    <img
                      src={preview}
                      alt={file.name}
                      className={styles.filePreview}
                    />
                  ) : (
                    <div className={styles.fileIcon}>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2V8H20"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M12 4L4 12M4 4L12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {displayError && (
          <p
            id={`${fileInputId}-error`}
            className={styles.errorText}
            role="alert"
          >
            {displayError}
          </p>
        )}
        {helperText && !displayError && (
          <p id={`${fileInputId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';
