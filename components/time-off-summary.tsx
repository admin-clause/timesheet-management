'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
type Balance = {
  id: number
  type: string
  balance: string
}

type Transaction = {
  id: number
  type: string
  requestedType: string
  kind: string
  days: string
  effectiveDate: string
  note: string | null
}

type SummaryResponse = {
  balances: Balance[]
  transactions: Transaction[]
}

const DEFAULT_LIMIT = 10

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

const kindLabels: Record<string, string> = {
  ACCRUAL: 'Accrual',
  USAGE: 'Usage',
  ADJUSTMENT: 'Adjustment',
}

const formatLeaveLabel = (value: string | undefined) => {
  if (!value) return 'Unknown'
  return leaveLabels[value] ?? value.replace(/_/g, ' ')
}

const formatKindLabel = (value: string | undefined) => {
  if (!value) return 'Unknown'
  return kindLabels[value] ?? value.replace(/_/g, ' ')
}

export function TimeOffSummary() {
  const [data, setData] = useState<SummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = async (limit = DEFAULT_LIMIT) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/time-off/me?limit=${limit}`)
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to load balances')
      }
      const result: SummaryResponse = await response.json()
      setData(result)
    } catch (err) {
      console.error('Failed to fetch time-off summary:', err)
      setError('Unable to load time-off summary. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSummary()
  }, [])

  const renderBalances = () => {
    if (!data || data.balances.length === 0) {
      return <p className="text-sm text-muted-foreground">No balance data available.</p>
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">Leave Type</TableHead>
            <TableHead className="text-right">Balance (days)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.balances.map(balance => (
            <TableRow key={balance.id}>
              <TableCell>{balance.type.replace(/_/g, ' ')}</TableCell>
              <TableCell className="text-right font-mono">{Number(balance.balance).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  const renderTransactions = () => {
    if (!data || data.transactions.length === 0) {
      return <p className="text-sm text-muted-foreground">No recent transactions.</p>
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Type</TableHead>
            <TableHead className="w-32">Kind</TableHead>
            <TableHead className="text-right">Days</TableHead>
            <TableHead className="w-36">Effective</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.transactions.map(tx => (
            <TableRow key={tx.id}>
              <TableCell>{formatLeaveLabel(tx.requestedType)}</TableCell>
              <TableCell>{formatKindLabel(tx.kind)}</TableCell>
              <TableCell className="text-right font-mono">{Number(tx.days).toFixed(2)}</TableCell>
              <TableCell>{new Date(tx.effectiveDate).toLocaleDateString()}</TableCell>
              <TableCell className="max-w-[260px] truncate" title={tx.note ?? undefined}>
                {tx.note ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Time-Off Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading balances…</p>
          ) : error ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="secondary" onClick={() => void loadSummary()}>
                Retry
              </Button>
            </div>
          ) : (
            renderBalances()
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent Time-Off Activity</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void loadSummary(25)} disabled={isLoading}>
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <p className="text-sm text-muted-foreground">Loading transactions…</p>
          ) : error ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="secondary" onClick={() => void loadSummary()}>
                Retry
              </Button>
            </div>
          ) : (
            renderTransactions()
          )}
        </CardContent>
      </Card>
    </div>
  )
}
