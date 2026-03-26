"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PawPrint, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { useRegister } from "@/lib/hooks/use-register";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { registerShop, loading } = useRegister();
  const [form, setForm] = useState({
    shopName: "",
    subdomain: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.shopName || !form.ownerName || !form.email || !form.password) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (form.password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      await registerShop({
        shopName: form.shopName,
        subdomain:
          form.subdomain ||
          form.shopName
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
        ownerName: form.ownerName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      toast.success("สมัครใช้งานสำเร็จ!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถสมัครใช้งานได้");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <PawPrint className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pet Grooming</h1>
          <p className="text-sm text-muted-foreground">
            สมัครใช้งานระบบจัดการร้าน
          </p>
        </div>

        {/* Register Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">
              สร้างบัญชีร้านค้า
            </CardTitle>
            <CardDescription className="text-center">
              กรอกข้อมูลเพื่อเริ่มใช้งานระบบ
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Shop Info */}
              <div className="space-y-2">
                <Label htmlFor="shopName">ชื่อร้าน *</Label>
                <Input
                  id="shopName"
                  placeholder="เช่น BBP Pet Grooming"
                  value={form.shopName}
                  onChange={(e) => updateField("shopName", e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">ชื่อเจ้าของร้าน *</Label>
                  <Input
                    id="ownerName"
                    placeholder="ชื่อ-นามสกุล"
                    value={form.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทร</Label>
                  <Input
                    id="phone"
                    placeholder="0812345678"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <hr className="my-2" />

              {/* Account Info */}
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="อย่างน้อย 6 ตัว"
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน *</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="กรอกอีกครั้ง"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังสร้างบัญชี...
                  </>
                ) : (
                  "สมัครใช้งาน"
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                มีบัญชีอยู่แล้ว?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
