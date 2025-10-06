'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TimeOffRequestForm } from '@/app/(main)/time-off/(components)/TimeOffRequestForm'
import { TimeOffRequestList } from '@/app/(main)/time-off/(components)/TimeOffRequestList'

const REQUEST_TYPES = [
  { label: 'Time Off', value: 'TIME_OFF' },
] as const

type RequestTypeValue = (typeof REQUEST_TYPES)[number]['value']

export function RequestsPageClient() {
  const [selectedType, setSelectedType] = useState<RequestTypeValue>('TIME_OFF')
  const [refreshKey, setRefreshKey] = useState(0)

  const renderRequestUI = () => {
    switch (selectedType) {
      case 'TIME_OFF':
      default:
        return (
          <div className="space-y-6">
            <TimeOffRequestForm onSubmitted={() => setRefreshKey(prev => prev + 1)} />
            <TimeOffRequestList refreshTrigger={refreshKey} />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request Type</CardTitle>
        </CardHeader>
        <CardContent className="max-w-sm">
          <Select value={selectedType} onValueChange={value => setSelectedType(value as RequestTypeValue)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_TYPES.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {renderRequestUI()}
    </div>
  )
}
