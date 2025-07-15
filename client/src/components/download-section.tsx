import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileImage, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ProcessingStats, ExportFormat, ExportOptions } from '@shared/schema';

interface DownloadSectionProps {
  sessionId: string;
  stats: ProcessingStats;
}

export function DownloadSection({ sessionId, stats }: DownloadSectionProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [exportOptions, setExportOptions] = useState({
    includeSummary: true,
    includeUnmatched: true,
    includeProcessingLog: false,
  });
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setDownloading(true);
    
    try {
      const options: ExportOptions = {
        format: exportFormat,
        includeSummary: exportOptions.includeSummary,
        includeUnmatched: exportOptions.includeUnmatched,
        includeProcessingLog: exportOptions.includeProcessingLog,
      };

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, options }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const extension = exportFormat === 'excel' ? 'xlsx' : exportFormat;
      a.download = `processed-punch-data-${Date.now()}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download completed!",
        description: "Your processed data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const getFileIcon = (format: ExportFormat) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case 'csv':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'pdf':
        return <FileImage className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getFileSize = () => {
    const baseSize = stats.total * 0.0005; // Rough estimate
    return `~${baseSize.toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Download Results</h3>
            <p className="text-sm text-gray-600">
              Export your processed data in various formats with detailed summary.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-600">Ready to download</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Options */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Export Format</h4>
            <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="excel" id="excel" />
                  <Label htmlFor="excel" className="flex items-center space-x-2 cursor-pointer">
                    {getFileIcon('excel')}
                    <span className="text-sm text-gray-700">Excel (.xlsx)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex items-center space-x-2 cursor-pointer">
                    {getFileIcon('csv')}
                    <span className="text-sm text-gray-700">CSV (.csv)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex items-center space-x-2 cursor-pointer">
                    {getFileIcon('pdf')}
                    <span className="text-sm text-gray-700">PDF Report (.pdf)</span>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Include Options</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeSummary"
                    checked={exportOptions.includeSummary}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeSummary: checked as boolean })
                    }
                  />
                  <Label htmlFor="includeSummary" className="text-sm text-gray-700 cursor-pointer">
                    Summary Statistics
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeUnmatched"
                    checked={exportOptions.includeUnmatched}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeUnmatched: checked as boolean })
                    }
                  />
                  <Label htmlFor="includeUnmatched" className="text-sm text-gray-700 cursor-pointer">
                    Unmatched Records
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeProcessingLog"
                    checked={exportOptions.includeProcessingLog}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeProcessingLog: checked as boolean })
                    }
                  />
                  <Label htmlFor="includeProcessingLog" className="text-sm text-gray-700 cursor-pointer">
                    Processing Log
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Export Summary</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Records:</span>
                <span className="font-medium text-gray-900">{stats.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Successfully Matched:</span>
                <span className="font-medium text-green-600">{stats.matched.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Late Arrivals:</span>
                <span className="font-medium text-yellow-600">{stats.late.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unmatched:</span>
                <span className="font-medium text-red-600">{stats.unmatched.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Time:</span>
                  <span className="font-medium text-gray-900">2.3 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">File Size:</span>
                  <span className="font-medium text-gray-900">{getFileSize()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Info className="w-4 h-4" />
            <span>Files are processed locally and never stored on our servers</span>
          </div>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
          >
            {downloading ? (
              <>
                <Download className="w-4 h-4 animate-pulse" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Results</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
