'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Project, ProjectStatus, ProjectType } from '@prisma/client'
import { useEffect, useState } from 'react'

// Helper to format date for input[type='date']
const formatDateForInput = (date: Date | string | null | undefined) => {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

interface ProjectFormProps {
  project?: Project | null
  onSave: (data: Partial<Project>) => void
  onCancel: () => void
  isSaving: boolean
}

interface ProjectFormData {
  name: string
  description: string
  projectCode: string
  clientName: string
  status: string
  projectType: string
  startDate: string
  endDate: string
}

export function ProjectForm({ project, onSave, onCancel, isSaving }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    projectCode: '',
    clientName: '',
    status: ProjectStatus.ACTIVE,
    projectType: ProjectType.GENERAL,
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    if (project) {
      const newFormData = {
        name: project.name || '',
        description: project.description || '',
        projectCode: project.projectCode || '',
        clientName: project.clientName || '',
        status: project.status || ProjectStatus.ACTIVE,
        projectType: project.projectType || ProjectType.GENERAL,
        startDate: formatDateForInput(project.startDate),
        endDate: formatDateForInput(project.endDate),
      }
      setFormData(newFormData)
    } else {
      // Reset for new project form
      setFormData({
        name: '',
        description: '',
        projectCode: '',
        clientName: '',
        status: ProjectStatus.ACTIVE,
        projectType: ProjectType.GENERAL,
        startDate: '',
        endDate: '',
      })
    }
  }, [project])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSave = {
      ...formData,
      status: formData.status as ProjectStatus, // Cast to correct enum type
      projectType: formData.projectType as ProjectType, // Cast to correct enum type
      description: formData.description || null,
      projectCode: formData.projectCode || null,
      clientName: formData.clientName || null,
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      endDate: formData.endDate ? new Date(formData.endDate) : null,
    }
    onSave(dataToSave)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" key={project?.id || 'new'}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectCode">Project Code</Label>
          <Input
            id="projectCode"
            name="projectCode"
            value={formData.projectCode}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name</Label>
          <Input
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            key={formData.status} // Force re-render
            name="status"
            value={formData.status}
            onValueChange={value => handleSelectChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ProjectStatus).map(s => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectType">Project Type</Label>
          <Select
            key={formData.projectType}
            name="projectType"
            value={formData.projectType}
            onValueChange={value => handleSelectChange('projectType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ProjectType).map(pt => (
                <SelectItem key={pt} value={pt}>
                  {pt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"></div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="col-span-2 space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Project'}
        </Button>
      </div>
    </form>
  )
}
