import { useState } from 'react';
import { RefreshCw, Download, Edit2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ProcessedRecord, Shift } from '@shared/schema';
import { FilterStatus } from '@/types';

interface ResultsTableProps {
  sessionId: string;
}

export function ResultsTable({ sessionId }: ResultsTableProps) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['/api/processed-records', sessionId],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['/api/shifts', sessionId],
  });

  const updateRecordMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<ProcessedRecord>) =>
      apiRequest('PUT', `/api/processed-records/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/processed-records', sessionId] });
    },
  });

  // Filter records
  const filteredRecords = records.filter((record: ProcessedRecord) => {
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'matched' && record.status === 'On-Time') ||
      (statusFilter === 'late' && record.status === 'Late') ||
      (statusFilter === 'unmatched' && record.status === 'Unmatched');
    
    const departmentMatch = departmentFilter === 'all' || 
      record.department === departmentFilter;
    
    return statusMatch && departmentMatch;
  });

  // Get unique departments
  const departments = [...new Set(records.map((record: ProcessedRecord) => record.department))];

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const getStatusBadge = (status: string) => {
    const configs = {
      'On-Time': {
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800',
        text: 'Matched',
      },
      'Late': {
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800',
        text: 'Late',
      },
      'Unmatched': {
        icon: AlertTriangle,
        className: 'bg-red-100 text-red-800',
        text: 'Unmatched',
      },
    };

    const config = configs[status as keyof typeof configs];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading records...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Department:</label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/processed-records', sessionId] })}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Employee</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Department</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Shift</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Check In</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Check Out</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedRecords.map((record: ProcessedRecord) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {getInitials(record.firstName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{record.firstName}</p>
                      <p className="text-gray-500">{record.employeeId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{record.department}</td>
                <td className="px-4 py-3 text-gray-700">{record.date}</td>
                <td className="px-4 py-3">
                  <Select
                    value={record.shiftCode || 'unmatched'}
                    onValueChange={(value) => {
                      if (value !== 'unmatched') {
                        updateRecordMutation.mutate({
                          id: record.id,
                          shiftCode: value,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unmatched">Unmatched</SelectItem>
                      {shifts.map((shift: Shift) => (
                        <SelectItem key={shift.id} value={shift.code}>
                          {shift.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {record.actualCheckIn?.split(' ')[1] || '--:--'}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {record.actualCheckOut?.split(' ')[1] || '--:--'}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(record.status)}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{(currentPage - 1) * recordsPerPage + 1}</span> to{' '}
          <span className="font-medium">
            {Math.min(currentPage * recordsPerPage, filteredRecords.length)}
          </span>{' '}
          of <span className="font-medium">{filteredRecords.length}</span> results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
