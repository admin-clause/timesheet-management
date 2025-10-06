'use client'

import { TimeOffSummary } from '@/components/time-off-summary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function TimeOffClient() {
  return (
    <div className="space-y-8">
      <TimeOffSummary />

      <Card>
        <CardHeader>
          <CardTitle>Need to Request Time Off?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Submit new requests and review their status from the dedicated Requests page.
          </p>
          <Button asChild>
            <a href="/requests">Open Requests Portal</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
