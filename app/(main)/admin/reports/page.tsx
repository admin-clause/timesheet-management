import { type Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ReportGenerator } from '@/components/report-generator';

// Helper to check for admin role from the session object
const isAdmin = (session: Session | null): boolean => {
  return session?.user?.role === 'ADMIN';
};

export default async function AdminReportPage() {
  const session = await getServerSession(authOptions);

  // Server-side check for admin role
  if (!isAdmin(session)) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the page for admin users, with the interactive part delegated to a client component
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportGenerator />
        </CardContent>
      </Card>
    </div>
  );
}
