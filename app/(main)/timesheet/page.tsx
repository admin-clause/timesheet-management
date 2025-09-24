import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LogoutButton } from '@/components/ui/logout-button';
import { TimesheetLoader } from '@/components/timesheet-loader';

export default async function TimesheetPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Weekly Timesheet</CardTitle>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Welcome, {session.user?.name || session.user?.email}!
            </p>
            <LogoutButton />
          </div>
        </CardHeader>
        <CardContent>
          <TimesheetLoader />
        </CardContent>
      </Card>
    </div>
  );
}
