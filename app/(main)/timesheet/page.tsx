import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TimesheetLoader } from '@/components/timesheet-loader';

export default async function TimesheetPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Timesheet</CardTitle>
        </CardHeader>
        <CardContent>
          <TimesheetLoader />
        </CardContent>
      </Card>
    </div>
  );
}
