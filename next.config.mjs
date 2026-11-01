/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Cutover: proxy all /api/* to the Java (Spring Boot) backend. Same-origin from the
  // browser's view, so the bbp_auth cookie + CSRF work with no per-fetch changes.
  // beforeFiles runs before app/api route handlers, so those legacy handlers are bypassed
  // (kept for now; can be deleted once the Java backend is fully validated).
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://localhost:8080";
    return {
      beforeFiles: [
        { source: "/api/:path*", destination: `${backend}/api/:path*` },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/(.*)\\.(html)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      // ชั่วคราว (dev เท่านั้น): สั่งให้เบราว์เซอร์ล้างแคช HTTP ทุกครั้งที่โหลดหน้า HTML เพื่อกวาด JS/CSS เก่า
      // ที่เคยถูกเก็บด้วย immutable ไว้ครั้งเดียวให้หมด (Chrome/Edge รองรับ Safari ไม่รองรับ)
      // ลบบล็อกนี้ได้เมื่อหน้าแสดงผลถูกต้องแล้ว
      ...(process.env.NODE_ENV !== "production"
        ? [
            {
              source: "/:path*",
              has: [{ type: "header", key: "accept", value: ".*text/html.*" }],
              headers: [{ key: "Clear-Site-Data", value: '"cache"' }],
            },
          ]
        : []),
      // immutable ใช้ได้เฉพาะ production ที่ชื่อไฟล์มี hash ตามเนื้อหา; ใน dev ชื่อ chunk เดิมแต่เนื้อหา
      // เปลี่ยนทุกครั้งที่แก้โค้ด ถ้า cache 1 ปีเบราว์เซอร์จะค้างโค้ด/CSS เก่า (hydration mismatch, สไตล์ไม่อัปเดต)
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source:
                "/(.*)\\.(css|js|woff|woff2|eot|ttf|otf|svg|png|jpg|jpeg|gif|ico|webp)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
