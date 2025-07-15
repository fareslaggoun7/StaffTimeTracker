import { useState, useEffect } from 'react';
import { Play, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatsCards } from './stats-cards';
import { ResultsTable } from './results-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ProcessingStats, ProcessingProgress } from '@shared/schema';
import { useWebSocket } from '@/hooks/use-websocket';

interface ProcessingSectionProps {
  sessionId: string;
  stats: ProcessingStats | null;
  onProcessingComplete: (stats: ProcessingStats) => void;
}

export function ProcessingSection({ sessionId, stats, onProcessingComplete }: ProcessingSectionProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ws = useWebSocket(sessionId);

  const processDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/process', { sessionId });
      return res.json();
    },
    onSuccess: (data: { stats: ProcessingStats }) => {
      onProcessingComplete(data.stats);
      queryClient.invalidateQueries({ queryKey: ['/api/processed-records', sessionId] });
      setProcessing(false);
      toast({
        title: "Processing completed!",
        description: `Processed ${data.stats.total} records successfully.`,
      });
    },
    onError: (error) => {
      setProcessing(false);
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Listen for WebSocket progress updates
  useEffect(() => {
    if (!ws) return;

    const handleProgress = (progressData: ProcessingProgress) => {
      setProgress(progressData);
    };

    ws.on('progress', handleProgress);

    return () => {
      ws.off('progress', handleProgress);
    };
  }, [ws]);

  const handleProcessData = () => {
    setProcessing(true);
    setProgress(null);
    processDataMutation.mutate();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing & Review</h3>
            <p className="text-sm text-gray-600">
              Review matched punch data and make adjustments as needed.
            </p>
          </div>
          <Button
            onClick={handleProcessData}
            disabled={processing}
            className="flex items-center space-x-2"
          >
            {processing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{processing ? 'Processing...' : 'Process Data'}</span>
          </Button>
        </div>

        {/* Processing Progress */}
        {processing && progress && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm font-medium text-gray-900">
                  {progress.message}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {progress.current} / {progress.total} records
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            <p className="text-xs text-gray-600 mt-2">
              Matching punch-ins to shifts and handling overnight shifts...
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {stats && <StatsCards stats={stats} />}

        {/* Results Table */}
        {stats && <ResultsTable sessionId={sessionId} />}
      </div>
    </div>
  );
}
