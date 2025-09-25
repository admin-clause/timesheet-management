import { Home, Inbox, Settings } from "lucide-react";
import { getServerSession } from "next-auth";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authOptions } from "@/lib/auth";
import { LogoutButton } from "./ui/logout-button";
import { Separator } from "./ui/separator";

// Menu items.
const items = [
  {
    title: "Timesheet",
    url: "/timesheet",
    icon: Home,
    roles: ["ADMIN", "USER"],
  },
  {
    title: "Report",
    url: "/admin/reports",
    icon: Inbox,
    roles: ["ADMIN"],
  },
  {
    title: "Projects",
    url: "/admin/projects",
    icon: Inbox,
    roles: ["ADMIN"],
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Inbox, // Replace with a more appropriate icon if available
    roles: ["ADMIN"],
  },
];

export async function AppSidebar() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  const filteredItems = items.filter((item) => {
    if (!item.roles) {
      return true;
    }
    if (!userRole) {
      return false;
    }
    return item.roles.includes(userRole);
  });

  return (
    <Sidebar>
      <SidebarContent>
        {/* Application Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
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
                                <Settings />
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
  );
}
