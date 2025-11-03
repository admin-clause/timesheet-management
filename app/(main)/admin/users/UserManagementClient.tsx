'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Role, EmploymentType, EmployeeStatus } from '@prisma/client';

// User type definition matching the new schema
type User = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  companyEmail: string | null;
  personalEmail: string | null;
  phoneNumber: string | null;
  employmentType: EmploymentType | null;
  employeeStatus: EmployeeStatus | null;
  fobNumber: string | null;
  startDate: string | null; // Dates are strings for form inputs
  endDate: string | null;
  midProbationDate: string | null;
  role: Role;
};

type UserSaveBody = {
  firstName?: string;
  lastName?: string;
  companyEmail?: string;
  personalEmail?: string;
  phoneNumber?: string;
  employmentType?: EmploymentType | null;
  employeeStatus?: EmployeeStatus | null;
  fobNumber?: string;
  startDate?: string | null;
  endDate?: string | null;
  midProbationDate?: string | null;
  role?: Role;
  password?: string;
};

export function UserManagementClient() {
  // --- State Management ---
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state consolidated into a single object
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    companyEmail: string;
    personalEmail: string;
    phoneNumber: string;
    employmentType: EmploymentType | null;
    employeeStatus: EmployeeStatus | null;
    fobNumber: string;
    startDate: string;
    endDate: string;
    midProbationDate: string;
    password: string;
    role: Role;
  }>({
    firstName: '',
    lastName: '',
    companyEmail: '',
    personalEmail: '',
    phoneNumber: '',
    employmentType: null,
    employeeStatus: null,
    fobNumber: '',
    startDate: '',
    endDate: '',
    midProbationDate: '',
    password: '',
    role: Role.USER,
  });

  // --- Data Fetching ---
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Event Handlers ---
  const openFormDialog = (user: User | null) => {
    setEditingUser(user);
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        companyEmail: user.companyEmail || '',
        personalEmail: user.personalEmail || '',
        phoneNumber: user.phoneNumber || '',
        employmentType: user.employmentType || null,
        employeeStatus: user.employeeStatus || null,
        fobNumber: user.fobNumber || '',
        startDate: user.startDate || '',
        endDate: user.endDate || '',
        midProbationDate: user.midProbationDate || '',
        password: '',
        role: user.role,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        companyEmail: '',
        personalEmail: '',
        phoneNumber: '',
        employmentType: null,
        employeeStatus: null,
        fobNumber: '',
        startDate: '',
        endDate: '',
        midProbationDate: '',
        password: '',
        role: Role.USER,
      });
    }
    setIsFormDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      if (name === 'role') {
        return { ...prev, [name]: value as Role };
      }
      return { ...prev, [name]: value };
    });
  };

  const openDeleteDialog = (user: User) => {
    setEditingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    const isUpdating = !!editingUser;
    const url = isUpdating ? `/api/users/${editingUser!.id}` : '/api/users';
    const method = isUpdating ? 'PUT' : 'POST';

    const body: UserSaveBody = { ...formData };
    if (isUpdating) {
      delete body.password;
    } else {
      if (!body.password) {
        toast.error('Password is required for new users.');
        return;
      }
    }

    // Convert empty date strings to null
    if (body.startDate === '') body.startDate = null;
    if (body.endDate === '') body.endDate = null;
    if (body.midProbationDate === '') body.midProbationDate = null;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to save user');
      }

      toast.success(`User successfully ${isUpdating ? 'updated' : 'created'}!`);
      setIsFormDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete user');
      }

      toast.success('User successfully deleted!');
      setIsDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return <p>Loading users...</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Button onClick={() => openFormDialog(null)}>Add New User</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Company Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.firstName}</TableCell>
                  <TableCell>{user.lastName}</TableCell>
                  <TableCell>{user.companyEmail}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openFormDialog(user)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(user)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">First Name</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">Last Name</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="companyEmail" className="text-right">Company Email</Label>
              <Input id="companyEmail" name="companyEmail" type="email" value={formData.companyEmail} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="personalEmail" className="text-right">Personal Email</Label>
              <Input id="personalEmail" name="personalEmail" type="email" value={formData.personalEmail} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">Phone</Label>
              <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fobNumber" className="text-right">FOB Number</Label>
              <Input id="fobNumber" name="fobNumber" value={formData.fobNumber} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">End Date</Label>
              <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="midProbationDate" className="text-right">Mid Probation</Label>
              <Input id="midProbationDate" name="midProbationDate" type="date" value={formData.midProbationDate} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employmentType" className="text-right">Emp. Type</Label>
              <Select value={formData.employmentType || ''} onValueChange={(value) => handleSelectChange('employmentType', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EmploymentType).map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employeeStatus" className="text-right">Emp. Status</Label>
              <Select value={formData.employeeStatus || ''} onValueChange={(value) => handleSelectChange('employeeStatus', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EmployeeStatus).map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!editingUser && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Password</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className="col-span-3" />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange('role', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.USER}>User</SelectItem>
                  <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <p>You are about to delete the user &quot;<strong>{`${editingUser?.firstName || ''} ${editingUser?.lastName || ''}`.trim() || editingUser?.companyEmail}</strong>&quot;.</p>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
