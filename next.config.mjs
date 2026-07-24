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
    ];
  },
};

export default nextConfig;
