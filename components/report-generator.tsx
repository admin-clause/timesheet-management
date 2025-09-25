'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

// --- Type Definitions for Report Data ---
interface Project {
  id: number;
  name: string;
}

interface UserReport {
  name: string;
  totalHours: number;
  hoursByProject: { [key: string]: number };
}

interface PivotData {
  projects: Project[];
  users: UserReport[];
  projectTotals: { [key: string]: number };
  grandTotal: number;
}

interface ReportData {
  reportPeriod: {
    year: number;
    month: number;
  };
  pivotData: PivotData;
}

// Helper to get the current month in YYYY-MM format
const getCurrentMonthString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export function ReportGenerator() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchReport = async () => {
    setIsLoading(true);
    setReportData(null);
    try {
      const response = await fetch(`/api/admin/report?month=${selectedMonth}`);
      if (response.ok) {
        setReportData(await response.json());
      } else {
        const errorData = await response.text();
        alert(`Failed to fetch report: ${errorData}`);
      }
    } catch (error) {
      console.error("Failed to fetch report:", error);
      alert("An unexpected error occurred.");
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4">
        <div>
          <label htmlFor="month-select" className="text-sm font-medium">Select Month</label>
          <Input
            id="month-select"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-[200px]"
          />
        </div>
        <Button onClick={handleFetchReport} disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      {reportData && reportData.pivotData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Report for {reportData.reportPeriod.year}-{String(reportData.reportPeriod.month).padStart(2, '0')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">User</TableHead>
                  {reportData.pivotData.projects.map((project) => (
                    <TableHead key={project.id} className="text-right">{project.name}</TableHead>
                  ))}
                  <TableHead className="text-right font-bold">User Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.pivotData.users.map((user) => (
                  <TableRow key={user.name}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    {reportData.pivotData.projects.map((project) => (
                      <TableCell key={project.id} className="text-right">
                        {(user.hoursByProject[project.id] || 0).toFixed(1)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-bold">{user.totalHours.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Project Total</TableCell>
                  {reportData.pivotData.projects.map((project) => (
                    <TableCell key={project.id} className="text-right font-bold">
                      {(reportData.pivotData.projectTotals[project.id] || 0).toFixed(1)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-lg">
                    {reportData.pivotData.grandTotal.toFixed(1)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}