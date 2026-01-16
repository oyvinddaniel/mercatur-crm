import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  // Disable source maps in production to prevent information disclosure
  productionBrowserSourceMaps: false,

  // Remove X-Powered-By header to prevent framework fingerprinting
  poweredByHeader: false,

  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'], // Keep error and warn logs
    } : false,
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains", // 1 year HSTS
          },
          {
            key: "X-Frame-Options",
            value: "DENY", // Prevent clickjacking - no iframes allowed
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Prevent MIME-type sniffing
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block", // Legacy XSS protection
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // More secure referrer policy
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()", // Restrict browser features
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Note: unsafe-inline/eval needed for Next.js dev mode
              "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Tailwind
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co", // Allow Supabase API calls
              "frame-ancestors 'none'", // Equivalent to X-Frame-Options: DENY
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
