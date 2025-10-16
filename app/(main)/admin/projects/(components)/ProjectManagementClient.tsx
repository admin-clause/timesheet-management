'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Project } from '@prisma/client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ProjectForm } from './ProjectForm'

export function ProjectManagementClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/projects?status=ALL')
      if (response.ok) {
        setProjects(await response.json())
      } else {
        toast.error('Failed to fetch projects.')
        setProjects([])
      }
    } catch (error) {
      toast.error('An unexpected error occurred while fetching projects.')
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateClick = () => {
    setSelectedProject(null)
    setIsDialogOpen(true)
  }

  const handleEditClick = (project: Project) => {
    setSelectedProject(project)
    setIsDialogOpen(true)
  }

  const handleSave = async (data: Partial<Project>) => {
    setIsSaving(true)
    const method = selectedProject ? 'PUT' : 'POST'
    const url = selectedProject ? `/api/projects/${selectedProject.id}` : '/api/projects'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success(`Project ${selectedProject ? 'updated' : 'created'} successfully!`)
        setIsDialogOpen(false)
        fetchProjects() // Refresh the list
      } else {
        const errorData = await response.text()
        toast.error(`Failed to save project: ${errorData}`)
      }
    } catch (error) {
      toast.error('An unexpected error occurred while saving.')
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreateClick}>Create Project</Button>
      </div>
      {isLoading ? (
        <p>Loading projects...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map(project => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.clientName || 'N/A'}</TableCell>
                <TableCell>{project.status}</TableCell>
                <TableCell>{project.projectType}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(project)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={selectedProject}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
