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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ApprovalStatus } from '@prisma/client'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const STATUS_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
] as const

type StatusValue = (typeof STATUS_OPTIONS)[number]['value']

type AdminTimeOffRequest = {
  id: number
  status: ApprovalStatus
  submittedAt: string
  decidedAt: string | null
  requesterNote: string | null
  approverNote: string | null
  requestedById: number
  reviewedById: number | null
  timeOffDetails: {
    requestedType: string
    storedType: string
    periodStart: string
    periodEnd: string
    totalDays: string
    overrideBalance: boolean
  } | null
  requestedBy: {
    name: string
  }
}

const LEAVE_LABELS: Record<string, string> = {
  SICK: 'Sick',
  VACATION: 'Vacation',
  BEREAVEMENT: 'Bereavement',
  UNPAID: 'Time Off Without Pay',
  MILITARY: 'Military / Reservist',
  JURY_DUTY: 'Jury Duty',
  PARENTAL: 'Maternity / Paternity',
  OTHER: 'Other',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

const formatLeaveLabel = (value: string | undefined) => {
  if (!value) return 'Unknown'
  return LEAVE_LABELS[value] ?? value.replace(/_/g, ' ')
}

const formatDate = (value: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

type Props = {
  refreshTrigger?: number
  onActionCompleted?: () => void
}

export function AdminRequestQueue({ refreshTrigger = 0, onActionCompleted }: Props) {
  const [requests, setRequests] = useState<AdminTimeOffRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusValue>('PENDING')
  const [isLoading, setIsLoading] = useState(false)
  const [approverNote, setApproverNote] = useState('')

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', statusFilter)
      const response = await fetch(`/api/admin/time-off/requests?${params.toString()}`)
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to load requests')
      }
      const data: AdminTimeOffRequest[] = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Failed to load admin time-off requests:', error)
      toast.error('Failed to load requests. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void fetchRequests()
  }, [fetchRequests, refreshTrigger])

  const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      const endpoint = `/api/admin/time-off/requests/${requestId}/${action}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverNote: approverNote || undefined }),
      })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || `Failed to ${action} request`)
      }
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}.`)
      setApproverNote('')
      void fetchRequests()
      onActionCompleted?.()
    } catch (error) {
      console.error(`Failed to ${action} request:`, error)
      toast.error(`Unable to ${action} request. Please try again later.`)
    }
  }

  const visibleRequests = useMemo(() => requests, [requests])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Approval Queue</CardTitle>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={value => setStatusFilter(value as StatusValue)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void fetchRequests()} disabled={isLoading}>
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Optional approver note (applied to next action)"
            value={approverNote}
            onChange={event => setApproverNote(event.target.value)}
            rows={2}
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead>Override</TableHead>
                <TableHead>Requester Note</TableHead>
                <TableHead>Approver Note</TableHead>
                <TableHead className="w-48"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : visibleRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    No requests for the selected status.
                  </TableCell>
                </TableRow>
              ) : (
                visibleRequests.map(request => {
                  const details = request.timeOffDetails
                  const isPending = request.status === ApprovalStatus.PENDING
                  const period = details
                    ? `${formatDate(details.periodStart)} → ${formatDate(details.periodEnd)}`
                    : '—'
                  const days = details ? Number(details.totalDays).toFixed(2) : '—'
                  const overrideLabel = details?.overrideBalance ? 'Yes' : 'No'

                  return (
                    <TableRow key={request.id}>
                      <TableCell>{request.requestedBy.name}</TableCell>
                      <TableCell>{formatLeaveLabel(details?.requestedType)}</TableCell>
                      <TableCell>{STATUS_LABELS[request.status]}</TableCell>
                      <TableCell>{period}</TableCell>
                      <TableCell className="text-right font-mono">{days}</TableCell>
                      <TableCell>{overrideLabel}</TableCell>
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
                      <TableCell className="space-x-2 text-right">
                        {isPending ? (
                          <Fragment>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction(request.id, 'reject')}
                            >
                              Reject
                            </Button>
                            <Button size="sm" onClick={() => handleAction(request.id, 'approve')}>
                              Approve
                            </Button>
                          </Fragment>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
