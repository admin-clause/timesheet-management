import React from 'react';
import { ProjectManagementClient } from './(components)/ProjectManagementClient';

export default function AdminProjectsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Project Management</h1>
      <ProjectManagementClient />
    </div>
  );
}