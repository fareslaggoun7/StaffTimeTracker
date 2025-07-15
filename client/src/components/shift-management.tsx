import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Shift, InsertShift } from '@shared/schema';

interface ShiftManagementProps {
  sessionId: string;
}

export function ShiftManagement({ sessionId }: ShiftManagementProps) {
  const [gracePeriod, setGracePeriod] = useState(15);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [newShift, setNewShift] = useState<Partial<InsertShift>>({
    code: '',
    startTime: '',
    endTime: '',
    sessionId,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: shifts = [] } = useQuery({
    queryKey: ['/api/shifts', sessionId],
  });

  const { data: settings } = useQuery({
    queryKey: ['/api/settings', sessionId],
  });

  useEffect(() => {
    if (settings?.gracePeriodMinutes) {
      setGracePeriod(settings.gracePeriodMinutes);
    }
  }, [settings]);

  const createShiftMutation = useMutation({
    mutationFn: (shift: InsertShift) => apiRequest('POST', '/api/shifts', shift),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts', sessionId] });
      setNewShift({ code: '', startTime: '', endTime: '', sessionId });
      toast({ title: "Shift created successfully!" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create shift",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: ({ id, ...shift }: { id: number } & Partial<InsertShift>) =>
      apiRequest('PUT', `/api/shifts/${id}`, shift),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts', sessionId] });
      setEditingShift(null);
      toast({ title: "Shift updated successfully!" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update shift",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/shifts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts', sessionId] });
      toast({ title: "Shift deleted successfully!" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete shift",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (settings: { gracePeriodMinutes: number; sessionId: string }) =>
      apiRequest('POST', '/api/settings', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', sessionId] });
      toast({ title: "Settings saved successfully!" });
    },
  });

  const handleCreateShift = () => {
    if (!newShift.code || !newShift.startTime || !newShift.endTime) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createShiftMutation.mutate(newShift as InsertShift);
  };

  const handleUpdateShift = (shift: Shift) => {
    if (!editingShift) return;

    updateShiftMutation.mutate({
      id: editingShift.id,
      code: shift.code,
      startTime: shift.startTime,
      endTime: shift.endTime,
      sessionId,
    });
  };

  const handleDeleteShift = (id: number) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      deleteShiftMutation.mutate(id);
    }
  };

  const handleGracePeriodChange = (value: number) => {
    setGracePeriod(value);
    saveSettingsMutation.mutate({ gracePeriodMinutes: value, sessionId });
  };

  const isOvernightShift = (startTime: string, endTime: string) => {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    return end < start;
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Shift Configuration</h3>
            <p className="text-sm text-gray-600">
              Define your work shifts. System handles overnight shifts automatically.
            </p>
          </div>
          <Button
            onClick={() => setEditingShift({ id: -1, code: '', startTime: '', endTime: '', isOvernight: false, sessionId, createdAt: new Date() })}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Shift</span>
          </Button>
        </div>

        {/* Add/Edit Shift Form */}
        {editingShift && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-4">
              {editingShift.id === -1 ? 'Add New Shift' : 'Edit Shift'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="shiftCode">Shift Code</Label>
                <Input
                  id="shiftCode"
                  value={editingShift.code}
                  onChange={(e) => setEditingShift({ ...editingShift, code: e.target.value })}
                  placeholder="e.g., Day Shift"
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={editingShift.startTime}
                  onChange={(e) => setEditingShift({ ...editingShift, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={editingShift.endTime}
                  onChange={(e) => setEditingShift({ ...editingShift, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                {editingShift.startTime && editingShift.endTime && isOvernightShift(editingShift.startTime, editingShift.endTime) ? (
                  <>
                    <Moon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Overnight shift</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Day shift</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingShift(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingShift.id === -1) {
                      setNewShift({
                        code: editingShift.code,
                        startTime: editingShift.startTime,
                        endTime: editingShift.endTime,
                        sessionId,
                      });
                      handleCreateShift();
                    } else {
                      handleUpdateShift(editingShift);
                    }
                  }}
                >
                  {editingShift.id === -1 ? 'Create' : 'Update'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Shift List */}
        <div className="space-y-4">
          {shifts.map((shift: Shift) => (
            <div
              key={shift.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">{shift.code}</div>
                    <div className="text-xs text-gray-500">
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {shift.isOvernight ? (
                      <Moon className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Sun className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-xs text-gray-600">
                      {shift.isOvernight ? 'Overnight shift' : 'Day shift'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingShift(shift)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteShift(shift.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grace Period Setting */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Grace Period</h4>
              <p className="text-xs text-gray-600 mt-1">
                Punch-ins within this time after shift start are marked "On-Time"
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={gracePeriod}
                onChange={(e) => handleGracePeriodChange(Number(e.target.value))}
                min="0"
                max="60"
                className="w-16"
              />
              <span className="text-sm text-gray-600">minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
