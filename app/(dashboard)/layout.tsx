import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { AUTH_COOKIE_NAME, isAuthenticatedCookie } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!isAuthenticatedCookie(authCookie)) {
    redirect("/login");
  }

  return (
    <SidebarProvider className="lg:h-svh lg:overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-h-0 min-w-0">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-3 lg:overflow-hidden lg:p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
