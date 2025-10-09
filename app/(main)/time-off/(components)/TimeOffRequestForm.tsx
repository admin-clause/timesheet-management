'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useState } from 'react'
import { toast } from 'sonner'

const leaveTypeOptions = [
  { label: 'Sick Leave', value: 'SICK' },
  { label: 'Vacation Leave', value: 'VACATION' },
  { label: 'Bereavement', value: 'BEREAVEMENT' },
  { label: 'Time Off Without Pay', value: 'UNPAID' },
  { label: 'Military / Reservist', value: 'MILITARY' },
  { label: 'Jury Duty', value: 'JURY_DUTY' },
  { label: 'Maternity / Paternity', value: 'PARENTAL' },
  { label: 'Other', value: 'OTHER' },
] as const

type LeaveTypeValue = (typeof leaveTypeOptions)[number]['value']

type Props = {
  onSubmitted?: () => void
}

export function TimeOffRequestForm({ onSubmitted }: Props) {
  const [requestedType, setRequestedType] = useState<LeaveTypeValue>('VACATION')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [totalDays, setTotalDays] = useState('1')
  const [partialStartDays, setPartialStartDays] = useState('')
  const [partialEndDays, setPartialEndDays] = useState('')
  const [requesterNote, setRequesterNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setRequestedType('VACATION')
    setPeriodStart('')
    setPeriodEnd('')
    setTotalDays('1')
    setPartialStartDays('')
    setPartialEndDays('')
    setRequesterNote('')
  }

  const handleSubmit = async () => {
    if (!periodStart || !periodEnd) {
      toast.error('Please select a period start and end date.')
      return
    }
    const parsedTotal = parseFloat(totalDays)
    if (Number.isNaN(parsedTotal) || parsedTotal <= 0) {
      toast.error('Total days must be a positive number.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/time-off/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedType,
          periodStart,
          periodEnd,
          totalDays: parsedTotal,
          partialStartDays: partialStartDays ? parseFloat(partialStartDays) : null,
          partialEndDays: partialEndDays ? parseFloat(partialEndDays) : null,
          requesterNote: requesterNote || null,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to submit request')
      }

      toast.success('Time-off request submitted.')
      resetForm()
      onSubmitted?.()
    } catch (error) {
      console.error('Failed to submit time-off request:', error)
      toast.error('Failed to submit request. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Time Off</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="leave-type">Leave Type</Label>
            <Select
              value={requestedType}
              onValueChange={value => setRequestedType(value as LeaveTypeValue)}
            >
              <SelectTrigger id="leave-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leaveTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total-days">Total Days</Label>
            <Input
              id="total-days"
              type="number"
              step={0.5}
              min={0.5}
              value={totalDays}
              onChange={event => setTotalDays(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Include partial days; the total must be positive.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period-start">Start Date</Label>
            <Input
              id="period-start"
              type="date"
              value={periodStart}
              onChange={event => setPeriodStart(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period-end">End Date</Label>
            <Input
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={event => setPeriodEnd(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partial-start">Partial Start (hours in days)</Label>
            <Input
              id="partial-start"
              type="number"
              step={0.5}
              min={0}
              value={partialStartDays}
              onChange={event => setPartialStartDays(event.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partial-end">Partial End (hours in days)</Label>
            <Input
              id="partial-end"
              type="number"
              step={0.5}
              min={0}
              value={partialEndDays}
              onChange={event => setPartialEndDays(event.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="requester-note">Reason / Notes</Label>
          <Textarea
            id="requester-note"
            value={requesterNote}
            onChange={event => setRequesterNote(event.target.value)}
            placeholder="Add context for your manager (e.g., vacation details)."
            rows={3}
          />
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit Request'}
        </Button>
      </CardContent>
    </Card>
  )
}
