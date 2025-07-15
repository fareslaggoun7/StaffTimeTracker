import { useState, useEffect } from 'react';
import { Clock, Shield, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressIndicator } from '@/components/progress-indicator';
import { FileUpload } from '@/components/file-upload';
import { ShiftManagement } from '@/components/shift-management';
import { ProcessingSection } from '@/components/processing-section';
import { DownloadSection } from '@/components/download-section';
import { ProcessingStats } from '@shared/schema';

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);

  const handleUploadComplete = (data: any) => {
    setUploadedData(data);
    setCurrentStep(2);
  };

  const handleProcessingComplete = (stats: ProcessingStats) => {
    setProcessingStats(stats);
    setCurrentStep(4);
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Clock className="text-primary w-8 h-8" />
              <h1 className="text-xl font-semibold text-gray-900">
                Staff Punch Data Processor
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Secure Processing</span>
              </div>
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* Step 1: Upload Data */}
        {currentStep >= 1 && (
          <FileUpload
            sessionId={sessionId}
            onUploadComplete={handleUploadComplete}
          />
        )}

        {/* Step 2: Configure Shifts */}
        {currentStep >= 2 && (
          <ShiftManagement sessionId={sessionId} />
        )}

        {/* Step 3: Process & Review */}
        {currentStep >= 3 && uploadedData && (
          <ProcessingSection
            sessionId={sessionId}
            stats={processingStats}
            onProcessingComplete={handleProcessingComplete}
          />
        )}

        {/* Step 4: Download Results */}
        {currentStep >= 4 && processingStats && (
          <DownloadSection
            sessionId={sessionId}
            stats={processingStats}
          />
        )}
      </main>

      {/* Floating Help */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="rounded-full w-12 h-12 shadow-lg"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
