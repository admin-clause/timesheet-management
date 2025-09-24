import { Home, Inbox } from "lucide-react";
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
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
];

export async function AppSidebar() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  const filteredItems = items.filter((item) => {
    if (!item.roles) {
      return true;
    }
    return item.roles.includes(userRole);
  });

  return (
    <Sidebar>
      <SidebarContent>
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
    </Sidebar>
  );
}