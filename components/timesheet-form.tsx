'use client';

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

// This will eventually come from the API
const dummyProjects = [
  { id: 1, name: 'Ethereal' },
  { id: 2, name: 'Hava' },
  { id: 3, name: 'Building Code' },
];

export function TimesheetForm() {
  // Dummy data for static layout
  const weekDates = ['Sep 22', 'Sep 23', 'Sep 24', 'Sep 25', 'Sep 26'];
  const totalHours = [1.5, 8, 7.5, 0, 4];
  const billableHours = 21;

  return (
    <div className="space-y-6">
      {/* Main Timesheet Table */}
      <Table>
        <TableHeader>
          <TableRow><TableHead className="w-[200px]">Project</TableHead><TableHead>Task</TableHead><TableHead className="text-right">Monday ({weekDates[0]})</TableHead><TableHead className="text-right">Tuesday ({weekDates[1]})</TableHead><TableHead className="text-right">Wednesday ({weekDates[2]})</TableHead><TableHead className="text-right">Thursday ({weekDates[3]})</TableHead><TableHead className="text-right">Friday ({weekDates[4]})</TableHead><TableHead className="text-right font-bold">Billable Hours</TableHead><TableHead className="w-[50px]"></TableHead></TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <Select defaultValue="1">
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {dummyProjects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input type="text" placeholder="Task description" defaultValue="Frontend development" />
            </TableCell>
            <TableCell><Input className="text-right" type="number" defaultValue="1.5" /></TableCell>
            <TableCell><Input className="text-right" type="number" defaultValue="8" /></TableCell>
            <TableCell><Input className="text-right" type="number" defaultValue="4" /></TableCell>
            <TableCell><Input className="text-right" type="number" /></TableCell>
            <TableCell><Input className="text-right" type="number" /></TableCell>
            <TableCell className="text-right font-medium">13.5</TableCell>
            <TableCell><Button variant="ghost" size="icon">X</Button></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Select defaultValue="2">
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {dummyProjects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input type="text" placeholder="Task description" defaultValue="API Integration" />
            </TableCell>
            <TableCell><Input className="text-right" type="number" /></TableCell>
            <TableCell><Input className="text-right" type="number" /></TableCell>
            <TableCell><Input className="text-right" type="number" defaultValue="3.5" /></TableCell>
            <TableCell><Input className="text-right" type="number" /></TableCell>
            <TableCell><Input className="text-right" type="number" defaultValue="4" /></TableCell>
            <TableCell className="text-right font-medium">7.5</TableCell>
            <TableCell><Button variant="ghost" size="icon">X</Button></TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2} className="font-bold">Total Hours</TableCell>
            {totalHours.map((h, i) => (
              <TableCell key={i} className="text-right font-bold">{h > 0 ? h.toFixed(1) : '-'}</TableCell>
            ))}
            <TableCell className="text-right font-bold text-lg">{billableHours.toFixed(1)}</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <Button>Add Row</Button>

      <div className="flex justify-between items-start gap-6">
        {/* Project Summary */}
        <Card className="w-1/3">
          <CardHeader><CardTitle>Project Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><p>Ethereal:</p> <p className="font-medium">13.5 hours</p></div>
            <div className="flex justify-between"><p>Hava:</p> <p className="font-medium">7.5 hours</p></div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col items-end">
          <p className="text-2xl font-bold">Total: {billableHours.toFixed(1)} hours</p>
          <p className="text-muted-foreground">for week of Sep 22 - Sep 26</p>
          <Button size="lg" className="mt-4">Save Timesheet</Button>
        </div>
      </div>
    </div>
  );
}
