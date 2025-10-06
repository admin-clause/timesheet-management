import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestsPageClient } from './RequestsPageClient'

export default async function RequestsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Submit new requests and track approvals. Additional request types will appear here as they become available.
        </CardContent>
      </Card>

      <RequestsPageClient />
    </div>
  )
}
