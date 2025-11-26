import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, MessageSquare, Compass, User, Plane } from "lucide-react";

const menuItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
    testId: "link-home",
  },
  {
    title: "AI Chat",
    url: "/chat",
    icon: MessageSquare,
    testId: "link-chat",
  },
  {
    title: "Discover",
    url: "/discover",
    icon: Compass,
    testId: "link-discover",
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
    testId: "link-profile",
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" onClick={handleLinkClick}>
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
            <div className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden">
              <img src="/favicon.jpg" alt="VIVOT Logo" className="h-8 w-8 object-cover" />
            </div>
            <div>
              <h2 className="text-lg font-bold">VIVOT</h2>
              <p className="text-xs text-muted-foreground">Travel OS</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url} onClick={handleLinkClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground">
          © 2025 VIVOT. AI-powered travel planning.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
