'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --- Type Definitions ---
type Project = {
  id: number;
  name: string;
};

type TaskEntry = {
  id: number;
  date: string; // Dates will be strings from the API
  hours: number;
  taskName: string;
  projectId: number;
  userId: number;
};

// --- Helper Functions ---
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getWeekDays = (date: Date) => {
  const dayOfWeek = date.getDay();
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(date);
  monday.setDate(date.getDate() - distanceToMonday);

  return Array.from({ length: 5 }).map((_, i) => {
    const weekDay = new Date(monday);
    weekDay.setDate(monday.getDate() + i);
    return weekDay;
  });
};

export function TimesheetForm() {
  // --- State Management ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskEntries, setTaskEntries] = useState<TaskEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // --- Data Fetching ---
  useEffect(() => {
    // Fetch projects only once on component mount
    const fetchProjects = async () => {
      const response = await fetch('/api/projects');
      if (response.ok) {
        setProjects(await response.json());
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    // Fetch task entries whenever the week changes
    const fetchTaskEntries = async () => {
      setIsLoading(true);
      const dateStr = formatDate(currentDate);
      const response = await fetch(`/api/task-entries?date=${dateStr}`);
      if (response.ok) {
        setTaskEntries(await response.json());
      }
      setIsLoading(false);
    };
    fetchTaskEntries();
  }, [currentDate]);

  // --- Event Handlers ---
  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // --- Render Logic ---
  if (isLoading && projects.length === 0) {
    return <p>Loading initial data...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex justify-center items-center gap-4">
        <Button onClick={handlePrevWeek}>Previous Week</Button>
        <p className="text-lg font-medium">
          Week of {weekDays[0].toLocaleDateString()} - {weekDays[4].toLocaleDateString()}
        </p>
        <Button onClick={handleNextWeek}>Next Week</Button>
      </div>

      {/* Main Timesheet Table */}
      <Table>
        <TableHeader>
          <TableRow><TableHead className="w-[200px]">Project</TableHead><TableHead>Task</TableHead>{weekDays.map(day => (<TableHead key={day.toISOString()} className="text-right">{day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</TableHead>))}<TableHead className="text-right font-bold">Billable Hours</TableHead><TableHead className="w-[50px]"></TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {/* This part will be made dynamic in the next step */}
          <TableRow>
            <TableCell>Project dropdown here</TableCell>
            <TableCell>Task input here</TableCell>
            <TableCell>Hours input</TableCell>
            <TableCell>Hours input</TableCell>
            <TableCell>Hours input</TableCell>
            <TableCell>Hours input</TableCell>
            <TableCell>Hours input</TableCell>
            <TableCell className="text-right font-medium">0.0</TableCell>
            <TableCell><Button variant="ghost" size="icon">X</Button></TableCell>
          </TableRow>
        </TableBody>
        {/* Footer and Summary will be updated later */}
      </Table>
      <Button>Add Row</Button>

      <div className="flex justify-between items-start gap-6">
        <Card className="w-1/3">
          <CardHeader><CardTitle>Project Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {/* Summary will be dynamic */}
          </CardContent>
        </Card>

        <div className="flex flex-col items-end">
          <p className="text-2xl font-bold">Total: 0.0 hours</p>
          <Button size="lg" className="mt-4">Save Timesheet</Button>
        </div>
      </div>
    </div>
  );
}