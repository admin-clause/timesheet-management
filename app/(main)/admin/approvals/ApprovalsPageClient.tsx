'use client'

import { useState } from 'react'
import { AdminRequestQueue } from '@/app/(main)/admin/(components)/AdminRequestQueue'

export function ApprovalsPageClient() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <AdminRequestQueue
      refreshTrigger={refreshTrigger}
      onActionCompleted={() => setRefreshTrigger(prev => prev + 1)}
    />
  )
}
