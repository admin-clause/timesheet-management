'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
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
type Project = { id: number; name: string };
type TaskEntry = {
  id: number | string; // Use string for new, temporary IDs
  date: string;
  hours: number;
  taskName: string;
  projectId: number;
};

// --- Helper Functions ---
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const getWeekDays = (date: Date) => {
  const dayOfWeek = date.getDay();
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
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
  const [isSaving, setIsSaving] = useState(false);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // --- Data Fetching ---
  useEffect(() => {
    fetch('/api/projects').then(res => res.json()).then(setProjects);
  }, []);

  useEffect(() => {
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
  function handlePrevWeek() {
    setCurrentDate(d => {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  }

  function handleNextWeek() {
    setCurrentDate(d => {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  }

  const handleUpdateEntry = (id: number | string, field: keyof TaskEntry, value: any) => {
    setTaskEntries(currentEntries =>
      currentEntries.map(entry => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  const handleHoursChange = (id: number | string, day: Date, hours: number) => {
    setTaskEntries(currentEntries =>
      currentEntries.map(entry => {
        if (entry.id === id) {
          return { ...entry, date: formatDate(day), hours: hours };
        }
        return entry;
      })
    );
  };

  const handleAddRow = () => {
    const newEntry: TaskEntry = {
      id: `new-${Date.now()}`,
      projectId: projects[0]?.id,
      taskName: '',
      date: formatDate(weekDays[0]),
      hours: 0,
    };
    setTaskEntries(current => [...current, newEntry]);
  };

  const handleDeleteRow = async (id: number | string) => {
    setTaskEntries(current => current.filter(entry => entry.id !== id));
    if (typeof id === 'number') { // Only call API for existing entries
      await fetch(`/api/task-entries/${id}`, { method: 'DELETE' });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const entriesToSave = taskEntries.filter(entry => entry.hours > 0 && entry.taskName && entry.projectId);
    
    const response = await fetch('/api/task-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entriesToSave),
    });

    if (response.ok) {
      toast.success("Timesheet saved successfully!");
    } else {
      toast.error("Failed to save timesheet. Please try again.");
    }

    // Refetch data after saving to get new IDs and confirm changes
    const dateStr = formatDate(currentDate);
    const refetchResponse = await fetch(`/api/task-entries?date=${dateStr}`);
    if (refetchResponse.ok) setTaskEntries(await refetchResponse.json());

    setIsSaving(false);
  };

  // --- Calculations for UI ---
  const { columnTotals, grandTotal, projectSummary } = useMemo(() => {
    const totals = weekDays.map(day =>
      taskEntries
        .filter(entry => formatDate(new Date(entry.date)) === formatDate(day))
        .reduce((acc, entry) => acc + (Number(entry.hours) || 0), 0)
    );
    const grand = totals.reduce((acc, total) => acc + total, 0);
    const summary: { [key: string]: number } = {};
    taskEntries.forEach(entry => {
      const project = projects.find(p => p.id === entry.projectId);
      if (project) {
        summary[project.name] = (summary[project.name] || 0) + (Number(entry.hours) || 0);
      }
    });
    return { columnTotals: totals, grandTotal: grand, projectSummary: summary };
  }, [taskEntries, projects, weekDays]);

  // --- Render Logic ---
  return (
    <div className="space-y-6">
      <div className="flex justify-center items-center gap-4">
        <Button onClick={handlePrevWeek}>Previous Week</Button>
        <p className="text-lg font-medium">Week of {weekDays[0].toLocaleDateString()}</p>
        <Button onClick={handleNextWeek}>Next Week</Button>
      </div>

      {isLoading ? <p>Loading...</p> : (
        <Table>
          <TableHeader>
            <TableRow><TableHead className="w-[200px]">Project</TableHead><TableHead>Task</TableHead>{weekDays.map(day => (<TableHead key={day.toISOString()} className="text-right">{day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</TableHead>))}<TableHead className="text-right font-bold">Billable Hours</TableHead><TableHead className="w-[50px]"></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {taskEntries.map(entry => (
              <TableRow key={entry.id}>
                <TableCell>
                  <Select value={String(entry.projectId)} onValueChange={value => handleUpdateEntry(entry.id, 'projectId', Number(value))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input type="text" value={entry.taskName} onChange={e => handleUpdateEntry(entry.id, 'taskName', e.target.value)} /></TableCell>
                {weekDays.map(day => (
                  <TableCell key={formatDate(day)}>
                    <Input
                      className="text-right"
                      type="number"
                      value={formatDate(new Date(entry.date)) === formatDate(day) ? entry.hours : ''}
                      onChange={e => handleHoursChange(entry.id, day, Number(e.target.value))}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">{entry.hours.toFixed(1)}</TableCell>
                <TableCell><Button variant="destructive" size="icon" onClick={() => handleDeleteRow(entry.id)}>X</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-bold">Total Hours</TableCell>
              {columnTotals.map((total, i) => (<TableCell key={i} className="text-right font-bold">{total > 0 ? total.toFixed(1) : '-'}</TableCell>))}
              <TableCell className="text-right font-bold text-lg">{grandTotal.toFixed(1)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}

      <Button onClick={handleAddRow}>Add Row</Button>

      <div className="flex justify-between items-start gap-6 pt-6">
        <Card className="w-1/3">
          <CardHeader><CardTitle>Project Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(projectSummary).map(([name, hours]) => (
              <div key={name} className="flex justify-between"><p>{name}:</p> <p className="font-medium">{hours.toFixed(1)} hours</p></div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col items-end">
          <p className="text-2xl font-bold">Total: {grandTotal.toFixed(1)} hours</p>
          <Button size="lg" className="mt-4" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Timesheet'}
          </Button>
        </div>
      </div>
    </div>
  );
}
