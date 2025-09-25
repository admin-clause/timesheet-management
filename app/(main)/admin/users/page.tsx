import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// The actual page content is a client component
import { UserManagementClient } from './UserManagementClient';

// This is the main page component, which is a Server Component.
// It handles authorization before rendering the client component.
export default async function UserManagementPage() {
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

  // Render the client component for admin users
  return <UserManagementClient />;
}