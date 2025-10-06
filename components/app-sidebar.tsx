import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { authOptions } from '@/lib/auth'
import { BarChart3, BadgeCheck, Briefcase, ClipboardList, Clock, FileEdit, KeyRound, Umbrella, Users } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { LogoutButton } from './ui/logout-button'
import { Separator } from './ui/separator'

// Menu items.
const items = [
  {
    title: 'Timesheet',
    url: '/timesheet',
    icon: Clock,
    roles: ['ADMIN', 'USER'],
    order: 1,
  },
  {
    title: 'Requests',
    url: '/requests',
    icon: FileEdit,
    roles: ['ADMIN', 'USER'],
    order: 2,
  },
  {
    title: 'Team Timesheets',
    url: '/admin/timesheets',
    icon: ClipboardList,
    roles: ['ADMIN'],
    order: 3,
  },
  {
    title: 'Time Off',
    url: '/time-off',
    icon: Umbrella,
    roles: ['ADMIN', 'USER'],
    order: 4,
  },
  {
    title: 'Team Time Off',
    url: '/admin/time-off',
    icon: ClipboardList,
    roles: ['ADMIN'],
    order: 5,
  },
  {
    title: 'Approvals',
    url: '/admin/approvals',
    icon: BadgeCheck,
    roles: ['ADMIN'],
    order: 6,
  },
  {
    title: 'Report',
    url: '/admin/reports',
    icon: BarChart3,
    roles: ['ADMIN'],
    order: 7,
  },
  {
    title: 'Projects',
    url: '/admin/projects',
    icon: Briefcase,
    roles: ['ADMIN'],
    order: 8,
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
    order: 9,
  },
]

export async function AppSidebar() {
  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role

  const filteredItems = items
    .filter(item => {
      if (!item.roles) {
        return true
      }
      if (!userRole) {
        return false
      }
      return item.roles.includes(userRole)
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <Sidebar>
      <SidebarContent>
        {/* Application Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Account Section */}
      <div className="mt-auto">
        <Separator />
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 text-sm font-medium">
              <p>{session?.user?.name || session?.user?.email}</p>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/account/password">
                    <KeyRound />
                    <span>Change Password</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <LogoutButton />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    </Sidebar>
  )
}
