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
  BedDouble,
  Package,
  LogOut,
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
    title: "ภาพรวม",
    url: "/",
    icon: LayoutDashboard,
  },
];

const managementItems = [
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
    title: "สินค้า",
    url: "/products",
    icon: Package,
  },
  {
    title: "โปรโมชั่น",
    url: "/promotions",
    icon: Tag,
  },
];

const operationItems = [
  {
    title: "นัดหมาย",
    url: "/bookings",
    icon: Calendar,
  },
  {
    title: "โรงแรมสัตว์เลี้ยง",
    url: "/hotel",
    icon: BedDouble,
  },
  {
    title: "ขายหน้าร้าน (POS)",
    url: "/pos",
    icon: ShoppingCart,
  },
];

const reportItems = [
  {
    title: "ประวัติการใช้บริการ",
    url: "/history",
    icon: History,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    window.location.href = "/login";
  };

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
        {/* ภาพรวม */}
        <SidebarGroup>
          <SidebarGroupLabel>ภาพรวม</SidebarGroupLabel>
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
                        "h-12 transition-colors",
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

        {/* การจัดการ */}
        <SidebarGroup>
          <SidebarGroupLabel>การจัดการ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "h-12 transition-colors",
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

        {/* การทำงาน */}
        <SidebarGroup>
          <SidebarGroupLabel>การทำงาน</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "h-12 transition-colors",
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

        {/* รายงาน */}
        <SidebarGroup>
          <SidebarGroupLabel>รายงาน</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "h-12 transition-colors",
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
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/40 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
          <div className="text-center text-xs text-muted-foreground">
            Pet Grooming Management v1.0
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
