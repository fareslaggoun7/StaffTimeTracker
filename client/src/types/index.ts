export interface FileUploadState {
  file: File | null;
  uploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  message: string;
  completed: boolean;
}

export type FilterStatus = 'all' | 'matched' | 'late' | 'unmatched';
