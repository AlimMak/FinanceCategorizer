'use client';

import { useState, useRef, useCallback } from 'react';

type DetectedType = 'csv' | 'pdf' | null;

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectFileType(name: string): DetectedType {
  const lower = name.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.pdf')) return 'pdf';
  return null;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: DetectedType;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const type = detectFileType(file.name);
      if (!type) {
        setFileError('Please select a .csv or .pdf file');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(
          `File is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`
        );
        return;
      }
      setFileError(null);
      setSelectedFile({ name: file.name, size: file.size, type });
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const zoneClasses = [
    'relative flex flex-col items-center justify-center w-full py-16 px-8',
    'border-2 border-dashed rounded-2xl transition-all duration-200',
    isDragOver && 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/20 scale-[1.01]',
    isLoading && 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 cursor-wait',
    !isDragOver && !isLoading && 'border-stone-300 dark:border-stone-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-stone-50/50 dark:hover:bg-stone-900/50 cursor-pointer',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload CSV or PDF file"
      aria-busy={isLoading}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !isLoading && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={zoneClasses}
    >
      {isLoading ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-[3px] border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-700 dark:text-stone-300 text-lg font-medium">
            Processing your file...
          </p>
          {selectedFile && (
            <div className="flex items-center gap-2 text-stone-400 text-sm">
              <FileTypeBadge type={selectedFile.type} />
              <span>{selectedFile.name}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-5">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isDragOver
                ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-600'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'
            }`}
          >
            <svg
              aria-hidden="true"
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>

          <div className="text-center space-y-1">
            <p className="text-stone-700 dark:text-stone-300 text-lg font-medium">
              {isDragOver
                ? 'Drop your file here'
                : 'Drop your bank statement (CSV or PDF)'}
            </p>
            <p className="text-stone-400 dark:text-stone-500 text-sm">or</p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="bg-teal-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 active:bg-teal-800 transition-colors"
          >
            Browse files
          </button>

          <p className="text-stone-400 dark:text-stone-500 text-xs">
            Supports .csv and .pdf files
          </p>

          {selectedFile && !fileError && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-2 rounded-lg">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <FileTypeBadge type={selectedFile.type} />
              {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          )}

          {fileError && (
            <div role="alert" className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <svg
                aria-hidden="true"
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              {fileError}
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.pdf,application/pdf,text/csv"
        className="hidden"
        onChange={handleChange}
        disabled={isLoading}
      />
    </div>
  );
}

function FileTypeBadge({ type }: { type: DetectedType }) {
  if (!type) return null;

  const label = type.toUpperCase();
  const colorClass =
    type === 'pdf'
      ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
      : 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400';

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${colorClass}`}
    >
      {label}
    </span>
  );
}
