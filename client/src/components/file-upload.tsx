import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  sessionId: string;
  onUploadComplete: (data: any) => void;
}

export function FileUpload({ sessionId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const { toast } = useToast();

  const detectColumns = useCallback(async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        setDetectedColumns(headers);
      }
    } catch (error) {
      console.error('Failed to detect columns:', error);
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadedFile(file);
    setUploading(true);
    setUploadProgress(0);
    setDetectedColumns([]); // Reset detected columns

    // Detect columns before upload
    await detectColumns(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      setUploadProgress(100);
      onUploadComplete(data);
      
      toast({
        title: "File uploaded successfully!",
        description: `Processed ${data.recordCount} records from ${file.name}`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [sessionId, onUploadComplete, toast, detectColumns]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Excel File</h3>
            <p className="text-sm text-gray-600">
              Drop your punch data file here or click to browse. Supports files up to 35,000+ rows.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="text-green-500 w-6 h-6" />
            <span className="text-sm text-gray-600">Excel format required</span>
          </div>
        </div>

        {/* File Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive
              ? 'border-primary bg-blue-50'
              : uploadedFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">
              {uploadedFile ? (
                <CheckCircle className="w-12 h-12 text-green-500" />
              ) : (
                <CloudUpload className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div>
              {uploadedFile ? (
                <>
                  <p className="text-lg font-medium text-green-700">File uploaded successfully!</p>
                  <p className="text-sm text-gray-600 mt-1">{uploadedFile.name}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragActive ? 'Drop the file here' : 'Drag and drop your Excel file here'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    or <span className="text-primary font-medium">click to browse</span>
                  </p>
                </>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Supported format: .xlsx, .xls • Max size: 50MB
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Expected Columns Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Expected Columns:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              'Employee ID',
              'First Name',
              'Department',
              'Date',
              'Time',
              'Punch State'
            ].map((column) => {
              const isDetected = detectedColumns.includes(column);
              return (
                <div key={column} className="flex items-center space-x-2">
                  {isDetected ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`${isDetected ? 'text-green-700' : 'text-gray-500'}`}>
                    {column}
                  </span>
                </div>
              );
            })}
          </div>
          {detectedColumns.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-600">
                <strong>Detected columns:</strong> {detectedColumns.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
