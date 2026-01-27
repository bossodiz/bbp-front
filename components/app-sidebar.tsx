"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Scissors,
  Tag,
  Calendar,
  ShoppingCart,
  PawPrint,
  History,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "ลูกค้าและสัตว์เลี้ยง",
    url: "/customers",
    icon: Users,
  },
  {
    title: "บริการและราคา",
    url: "/services",
    icon: Scissors,
  },
  {
    title: "โปรโมชั่น",
    url: "/promotions",
    icon: Tag,
  },
  {
    title: "นัดหมาย",
    url: "/bookings",
    icon: Calendar,
  },
  {
    title: "ประวัติการใช้บริการ",
    url: "/history",
    icon: History,
  },
  {
    title: "ขายหน้าร้าน (POS)",
    url: "/pos",
    icon: ShoppingCart,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={handleLinkClick}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <PawPrint className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-sidebar-foreground">
              Pet Grooming
            </span>
            <span className="text-xs text-muted-foreground">
              ระบบจัดการร้าน
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>เมนูหลัก</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "transition-colors",
                        isActive && "bg-sidebar-accent font-medium",
                      )}
                    >
                      <Link href={item.url} onClick={handleLinkClick}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-muted-foreground text-center">
          Pet Grooming Management v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
