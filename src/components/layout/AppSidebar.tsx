import { 
  LayoutDashboard, 
  Tag, 
  Receipt, 
  Briefcase, 
  CreditCard, 
  FileText, 
  User, 
  LogOut,
  TrendingUp
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Categories", url: "/categories", icon: Tag },
  { title: "Transactions", url: "/transactions", icon: Receipt },
  { title: "Assets", url: "/assets", icon: Briefcase },
  { title: "Bank Accounts", url: "/bank-accounts", icon: CreditCard },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const collapsed = state === "collapsed";

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/80";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
                Fintrack M7
              </h1>
            </div>
          </div>
        )}
        {collapsed && <TrendingUp className="h-8 w-8 text-primary mx-auto" />}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="hover:bg-danger/10 hover:text-danger">
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
