'use client';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
      <span className="text-gray-500 text-sm">
        {isLoading
          ? 'Processing...'
          : 'Drop CSV file here or click to upload'}
      </span>
      <input
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
        disabled={isLoading}
      />
    </label>
  );
}
