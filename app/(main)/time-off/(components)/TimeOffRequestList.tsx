'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApprovalStatus } from '@prisma/client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const statusOptions = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: ApprovalStatus.PENDING },
  { label: 'Approved', value: ApprovalStatus.APPROVED },
  { label: 'Rejected', value: ApprovalStatus.REJECTED },
  { label: 'Cancelled', value: ApprovalStatus.CANCELLED },
] as const

type StatusValue = (typeof statusOptions)[number]['value']

type TimeOffRequest = {
  id: number
  requestType: string
  status: ApprovalStatus
  submittedAt: string
  decidedAt: string | null
  requesterNote: string | null
  approverNote: string | null
  timeOffDetails: {
    requestedType: string
    storedType: string
    periodStart: string
    periodEnd: string
    totalDays: string
    partialStartDays: string | null
    partialEndDays: string | null
  } | null
}

const leaveLabels: Record<string, string> = {
  SICK: 'Sick',
  VACATION: 'Vacation',
  BEREAVEMENT: 'Bereavement',
  UNPAID: 'Time Off Without Pay',
  MILITARY: 'Military / Reservist',
  JURY_DUTY: 'Jury Duty',
  PARENTAL: 'Maternity / Paternity',
  OTHER: 'Other',
}

const statusLabels: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: 'Pending',
  [ApprovalStatus.APPROVED]: 'Approved',
  [ApprovalStatus.REJECTED]: 'Rejected',
  [ApprovalStatus.CANCELLED]: 'Cancelled',
}

const formatLeaveLabel = (value: string | undefined) => {
  if (!value) return 'Unknown'
  return leaveLabels[value] ?? value.replace(/_/g, ' ')
}

const formatDate = (value: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

type Props = {
  refreshTrigger?: number
}

export function TimeOffRequestList({ refreshTrigger }: Props) {
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusValue>('PENDING')
  const [isLoading, setIsLoading] = useState(false)

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter)
      }

      const response = await fetch(`/api/time-off/requests?${params.toString()}`)
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to load requests')
      }

      const data: TimeOffRequest[] = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Failed to load time-off requests:', error)
      toast.error('Failed to load requests. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void fetchRequests()
  }, [fetchRequests, refreshTrigger])

  const handleCancel = async (requestId: number) => {
    try {
      const response = await fetch(`/api/time-off/requests/${requestId}/cancel`, { method: 'POST' })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to cancel request')
      }
      toast.success('Request cancelled.')
      void fetchRequests()
    } catch (error) {
      console.error('Failed to cancel request:', error)
      toast.error('Unable to cancel request. Please try again later.')
    }
  }

  const visibleRequests = useMemo(() => {
    if (statusFilter === 'ALL') return requests
    return requests.filter(request => request.status === statusFilter)
  }, [requests, statusFilter])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Requests</CardTitle>
        <Select value={statusFilter} onValueChange={value => setStatusFilter(value as StatusValue)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading requests…</p>
        ) : visibleRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No requests found for the selected filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Period</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Requester Note</TableHead>
                  <TableHead>Approver Note</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRequests.map(request => {
                  const details = request.timeOffDetails
                  const isPending = request.status === ApprovalStatus.PENDING
                  const submitted = formatDate(request.submittedAt)
                  const period = details
                    ? `${formatDate(details.periodStart)} → ${formatDate(details.periodEnd)}`
                    : '—'
                  const days = details ? Number(details.totalDays).toFixed(2) : '—'
                  return (
                    <TableRow key={request.id}>
                      <TableCell>{submitted}</TableCell>
                      <TableCell>{formatLeaveLabel(details?.requestedType)}</TableCell>
                      <TableCell>{statusLabels[request.status]}</TableCell>
                      <TableCell>{period}</TableCell>
                      <TableCell className="text-right font-mono">{days}</TableCell>
                      <TableCell
                        className="max-w-[200px] truncate"
                        title={request.requesterNote ?? undefined}
                      >
                        {request.requesterNote ?? '—'}
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate"
                        title={request.approverNote ?? undefined}
                      >
                        {request.approverNote ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {isPending ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(request.id)}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
