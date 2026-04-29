import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PawPrint } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { AUTH_COOKIE_NAME, isAuthenticatedCookie } from "@/lib/auth";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (isAuthenticatedCookie(authCookie)) {
    redirect("/");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(74,159,110,0.18),_transparent_35%),linear-gradient(180deg,_#f7f5ef_0%,_#f0ece2_100%)] px-4 py-10">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(74,159,110,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(74,159,110,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 lg:flex-row lg:items-stretch lg:justify-between">
        <section className="max-w-lg space-y-5 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-medium text-primary shadow-sm">
            <PawPrint className="h-4 w-4" />
            Pet Grooming Management
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              ระบบจัดการร้านอาบน้ำ ตัดขน และโรงแรมสัตว์เลี้ยง
            </h2>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              เข้าสู่ระบบด้วยรหัสผ่านเดียวเพื่อใช้งานแดชบอร์ด, POS, การจอง
              และประวัติการใช้บริการ
            </p>
          </div>
        </section>
        <LoginForm />
      </div>
    </main>
  );
}
