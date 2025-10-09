'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Textarea } from '@/components/ui/textarea'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
const leaveTypeOptions = [
  { label: 'Sick', value: 'SICK' },
  { label: 'Vacation', value: 'VACATION' },
  { label: 'Bereavement', value: 'BEREAVEMENT' },
  { label: 'Time Off Without Pay', value: 'UNPAID' },
  { label: 'Military / Reservist', value: 'MILITARY' },
  { label: 'Jury Duty', value: 'JURY_DUTY' },
  { label: 'Maternity / Paternity', value: 'PARENTAL' },
  { label: 'Other', value: 'OTHER' },
] as const

type LeaveTypeValue = (typeof leaveTypeOptions)[number]['value']
type StoredLeaveType = 'SICK' | 'VACATION'

const entryKindOptions = [
  { label: 'Usage', value: 'USAGE' },
  { label: 'Adjustment', value: 'ADJUSTMENT' },
] as const

type EntryKindValue = (typeof entryKindOptions)[number]['value']

type AdminTransaction = {
  id: number
  userId: number
  recordedById: number | null
  type: StoredLeaveType
  requestedType: LeaveTypeValue
  kind: EntryKindValue | 'ACCRUAL'
  days: string
  effectiveDate: string
  periodStart: string | null
  periodEnd: string | null
  note: string | null
  createdAt: string
}

type ManagedUser = {
  id: number
  name: string | null
  email: string
  role: 'ADMIN' | 'USER'
}

const defaultMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const leaveLabelMap = leaveTypeOptions.reduce<Record<string, string>>((map, option) => {
  map[option.value] = option.label
  return map
}, {})

const formatLeaveLabel = (value: string | undefined) => {
  if (!value) return 'Unknown'
  return leaveLabelMap[value] ?? value.replace(/_/g, ' ')
}

const kindLabelMap: Record<string, string> = {
  ACCRUAL: 'Accrual',
  USAGE: 'Usage',
  ADJUSTMENT: 'Adjustment',
}

const formatKindLabel = (value: string | undefined) => {
  if (!value) return 'Unknown'
  return kindLabelMap[value] ?? value.replace(/_/g, ' ')
}

export function TimeOffAdminClient() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [accrualMonth, setAccrualMonth] = useState(defaultMonth)
  const [accrualAmount, setAccrualAmount] = useState(1)
  const [isAccruing, setIsAccruing] = useState(false)

  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveTypeValue>('SICK')
  const [entryKind, setEntryKind] = useState<EntryKindValue>('USAGE')
  const [daysValue, setDaysValue] = useState('1')
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0])
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [note, setNote] = useState('')
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false)

  const [historyScope, setHistoryScope] = useState<'selected' | 'all'>('selected')
  const [historyLeaveType, setHistoryLeaveType] = useState<'ALL' | LeaveTypeValue>('ALL')
  const [historyKind, setHistoryKind] = useState<'ALL' | EntryKindValue | 'ACCRUAL'>('ALL')
  const [historyLimit, setHistoryLimit] = useState(20)
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [transactionsError, setTransactionsError] = useState<string | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoadingUsers(true)
      setLoadError(null)
      try {
        const response = await fetch('/api/users')
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to load users')
        }
        const data: ManagedUser[] = await response.json()
        const sorted = [...data].sort((a, b) => {
          const aName = a.name ?? a.email
          const bName = b.name ?? b.email
          return aName.localeCompare(bName)
        })
        setUsers(sorted)
        setSelectedUserId(prev => {
          if (prev !== null && sorted.some(user => user.id === prev)) {
            return prev
          }
          const regularUsers = sorted.filter(user => user.role === 'USER')
          const fallbackPool = regularUsers.length > 0 ? regularUsers : sorted
          return fallbackPool[0]?.id ?? null
        })
      } catch (error) {
        console.error('Failed to fetch users for time off admin:', error)
        setLoadError('Failed to load users. Please try again later.')
      } finally {
        setIsLoadingUsers(false)
      }
    }

    void loadUsers()
  }, [])

  const selectableUsers = useMemo(() => {
    if (users.length === 0) return []
    const regularUsers = users.filter(user => user.role === 'USER')
    return regularUsers.length > 0 ? regularUsers : users
  }, [users])

  const userNameById = useMemo(() => {
    const map = new Map<number, string>()
    users.forEach(user => {
      const label = user.name ? `${user.name} (${user.email})` : user.email
      map.set(user.id, label)
    })
    return map
  }, [users])

  const fetchTransactions = useCallback(async () => {
    if (historyScope === 'selected' && !selectedUserId) {
      setTransactions([])
      return
    }
    setIsLoadingTransactions(true)
    setTransactionsError(null)
    try {
      const params = new URLSearchParams()
      if (historyLimit) {
        params.set('limit', String(historyLimit))
      }
      if (historyScope === 'selected' && selectedUserId) {
        params.set('userId', String(selectedUserId))
      }
      if (historyLeaveType !== 'ALL') {
        params.set('type', historyLeaveType)
      }
      if (historyKind !== 'ALL') {
        params.set('kind', historyKind)
      }

      const response = await fetch(`/api/admin/time-off/transactions?${params.toString()}`)
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to load transactions')
      }
      const data: AdminTransaction[] = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error('Failed to load time-off transactions:', error)
      setTransactionsError('Failed to load transaction history. Please try again later.')
    } finally {
      setIsLoadingTransactions(false)
    }
  }, [historyScope, historyLimit, historyKind, historyLeaveType, selectedUserId])

  useEffect(() => {
    if (historyScope === 'selected' && !selectedUserId) {
      return
    }
    void fetchTransactions()
  }, [fetchTransactions, historyScope, selectedUserId])

  const handleAccrualTrigger = async () => {
    setIsAccruing(true)
    try {
      const response = await fetch('/api/admin/time-off/accrual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: accrualMonth,
          amountPerType: accrualAmount,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to run accrual')
      }

      const result: { month: string; created: number; skipped: number } = await response.json()
      toast.success(
        `Accrual complete for ${result.month.slice(0, 7)}: created ${result.created}, skipped ${
          result.skipped
        }`
      )
      await fetchTransactions()
    } catch (error) {
      console.error('Accrual trigger failed:', error)
      toast.error('Failed to run monthly accrual. See console for details.')
    } finally {
      setIsAccruing(false)
    }
  }

  const handleSubmitEntry = async () => {
    if (!selectedUserId) {
      toast.error('Select a user before recording a transaction.')
      return
    }

    const parsedDays = parseFloat(daysValue)
    if (Number.isNaN(parsedDays) || parsedDays === 0) {
      toast.error('Provide a non-zero day amount.')
      return
    }

    if (!effectiveDate) {
      toast.error('Effective date is required.')
      return
    }

    setIsSubmittingEntry(true)
    try {
      const response = await fetch('/api/admin/time-off/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          requestedType: selectedLeaveType,
          kind: entryKind,
          days: parsedDays,
          effectiveDate,
          periodStart: periodStart || undefined,
          periodEnd: periodEnd || undefined,
          note: note || undefined,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to record transaction')
      }

      toast.success('Time off transaction recorded successfully.')
      setDaysValue('1')
      setPeriodStart('')
      setPeriodEnd('')
      setNote('')
      await fetchTransactions()
    } catch (error) {
      console.error('Failed to record time off transaction:', error)
      toast.error('Failed to record time off transaction. See console for details.')
    } finally {
      setIsSubmittingEntry(false)
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Accrual</CardTitle>
          <CardDescription>
            Run the automatic sick/vacation credit for a specific month.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="accrual-month">Month</Label>
            <Input
              id="accrual-month"
              type="month"
              value={accrualMonth}
              onChange={event => setAccrualMonth(event.target.value)}
              max="9999-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accrual-amount">Days per leave type</Label>
            <Input
              id="accrual-amount"
              type="number"
              min={0.25}
              step={0.5}
              value={accrualAmount}
              onChange={event => setAccrualAmount(Number(event.target.value))}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAccrualTrigger}
              disabled={isAccruing}
              className="w-full md:w-auto"
            >
              {isAccruing ? 'Running...' : 'Run Accrual'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record Time Off</CardTitle>
          <CardDescription>Debit or credit an employee&apos;s leave balance.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="user-select">Employee</Label>
            {isLoadingUsers ? (
              <p>Loading users...</p>
            ) : selectableUsers.length > 0 ? (
              <Select
                value={selectedUserId ? String(selectedUserId) : ''}
                onValueChange={value => setSelectedUserId(Number(value))}
              >
                <SelectTrigger id="user-select">
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
              <p className="text-sm text-muted-foreground">No users available.</p>
            )}
            {loadError && <p className="text-sm text-destructive">{loadError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-type-select">Leave Type</Label>
            <Select
              value={selectedLeaveType}
              onValueChange={value => setSelectedLeaveType(value as LeaveTypeValue)}
            >
              <SelectTrigger id="leave-type-select">
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
            <Label htmlFor="entry-kind-select">Entry Kind</Label>
            <Select
              value={entryKind}
              onValueChange={value => setEntryKind(value as EntryKindValue)}
            >
              <SelectTrigger id="entry-kind-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entryKindOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="days-input">Days</Label>
            <Input
              id="days-input"
              type="number"
              step={0.5}
              value={daysValue}
              onChange={event => setDaysValue(event.target.value)}
              placeholder="Enter days (positive or negative)"
            />
            <p className="text-xs text-muted-foreground">
              Usage entries should be positive (system subtracts automatically). Adjustments accept
              positive or negative values.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="effective-date">Effective Date</Label>
            <Input
              id="effective-date"
              type="date"
              value={effectiveDate}
              onChange={event => setEffectiveDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period-start">Period Start (optional)</Label>
            <Input
              id="period-start"
              type="date"
              value={periodStart}
              onChange={event => setPeriodStart(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period-end">Period End (optional)</Label>
            <Input
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={event => setPeriodEnd(event.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="Add context (e.g., doctor appointment, manual correction)."
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <Button onClick={handleSubmitEntry} disabled={isSubmittingEntry}>
              {isSubmittingEntry ? 'Recording...' : 'Record Transaction'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Review time-off ledger entries with optional filters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="history-scope">Scope</Label>
              <Select
                value={historyScope}
                onValueChange={value => setHistoryScope(value as 'selected' | 'all')}
              >
                <SelectTrigger id="history-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selected" disabled={!selectedUserId}>
                    Selected user
                  </SelectItem>
                  <SelectItem value="all">All users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="history-leave-type">Leave Type</Label>
              <Select
                value={historyLeaveType}
                onValueChange={value => setHistoryLeaveType(value as 'ALL' | LeaveTypeValue)}
              >
                <SelectTrigger id="history-leave-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {leaveTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="history-kind">Kind</Label>
              <Select
                value={historyKind}
                onValueChange={value => setHistoryKind(value as 'ALL' | EntryKindValue | 'ACCRUAL')}
              >
                <SelectTrigger id="history-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="ACCRUAL">Accrual</SelectItem>
                  {entryKindOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="history-limit">Limit</Label>
              <Input
                id="history-limit"
                type="number"
                min={5}
                max={100}
                step={5}
                value={historyLimit}
                onChange={event => setHistoryLimit(Number(event.target.value) || 20)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => void fetchTransactions()}
                disabled={isLoadingTransactions}
                className="w-full"
              >
                {isLoadingTransactions ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {transactionsError && <p className="text-sm text-destructive">{transactionsError}</p>}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Requested Type</TableHead>
                  <TableHead>Stored Type</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Recorded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTransactions ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      No transactions found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map(tx => {
                    const userLabel = userNameById.get(tx.userId) ?? `User ${tx.userId}`
                    const effective = new Date(tx.effectiveDate).toLocaleDateString()
                    const period = tx.periodStart
                      ? `${new Date(tx.periodStart).toLocaleDateString()} → ${
                          tx.periodEnd ? new Date(tx.periodEnd).toLocaleDateString() : ''
                        }`
                      : '-'
                    const recorded = new Date(tx.createdAt).toLocaleString()
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>{userLabel}</TableCell>
                        <TableCell>{formatLeaveLabel(tx.requestedType)}</TableCell>
                        <TableCell>{formatLeaveLabel(tx.type)}</TableCell>
                        <TableCell>{formatKindLabel(tx.kind)}</TableCell>
                        <TableCell className="text-right font-mono">{tx.days}</TableCell>
                        <TableCell>{effective}</TableCell>
                        <TableCell>{period}</TableCell>
                        <TableCell className="max-w-[220px] truncate" title={tx.note ?? undefined}>
                          {tx.note ?? '—'}
                        </TableCell>
                        <TableCell>{recorded}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
