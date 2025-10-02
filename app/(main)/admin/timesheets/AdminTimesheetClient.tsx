'use client';

import { useEffect, useMemo, useState } from 'react';
import { TimesheetLoader } from '@/components/timesheet-loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

type ManagedUser = {
  id: number;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'USER';
};

export function AdminTimesheetClient() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoadingUsers(true);
      setLoadError(null);
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to load users');
        }
        const data: ManagedUser[] = await response.json();
        const sorted = [...data].sort((a, b) => {
          const aName = a.name ?? a.email;
          const bName = b.name ?? b.email;
          return aName.localeCompare(bName);
        });
        setUsers(sorted);
        setSelectedUserId(prev => {
          if (prev !== null && sorted.some(user => user.id === prev)) {
            return prev;
          }
          const regularUsers = sorted.filter(user => user.role === 'USER');
          const fallbackPool = regularUsers.length > 0 ? regularUsers : sorted;
          return fallbackPool[0]?.id ?? null;
        });
      } catch (error) {
        console.error('Failed to fetch users for admin timesheets:', error);
        setLoadError('Failed to load users. Please try again later.');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    void loadUsers();
  }, []);

  const selectableUsers = useMemo(() => {
    if (users.length === 0) return [];
    const regularUsers = users.filter(user => user.role === 'USER');
    return regularUsers.length > 0 ? regularUsers : users;
  }, [users]);

  const selectedUser = useMemo(
    () => selectableUsers.find(user => user.id === selectedUserId) ?? null,
    [selectableUsers, selectedUserId]
  );

  return (
    <div className="container mx-auto flex flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Timesheets</CardTitle>
          <CardDescription>View and edit weekly entries on behalf of another user.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timesheet-user-select">Target User</Label>
            {isLoadingUsers ? (
              <Skeleton className="h-10 w-[280px]" />
            ) : selectableUsers.length > 0 ? (
              <Select
                value={selectedUserId !== null ? String(selectedUserId) : ''}
                onValueChange={value => setSelectedUserId(Number(value))}
              >
                <SelectTrigger id="timesheet-user-select" className="w-[280px]">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {selectableUsers.map(user => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name ? `${user.name} (${user.email})` : user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No managed users available.</p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Add or edit weekly hours on behalf of the selected user. Saved entries count toward their reports.
          </p>
          {loadError && <p className="text-sm text-destructive">{loadError}</p>}
        </CardContent>
      </Card>

      {selectedUserId ? (
        <div className="space-y-3">
          {selectedUser && (
            <p className="text-sm font-medium text-muted-foreground">
              Editing as: {selectedUser.name ?? selectedUser.email}
            </p>
          )}
          <TimesheetLoader targetUserId={selectedUserId} />
        </div>
      ) : (
        !isLoadingUsers && (
          <p className="text-sm text-muted-foreground">Select a user to get started.</p>
        )
      )}
    </div>
  );
}
