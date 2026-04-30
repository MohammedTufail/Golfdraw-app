/** @type {import('next').NextConfig} */

/**
 * next.config.js
 *
 * WHY: Configures Next.js for production deployment on Vercel.
 * - Allows Supabase Storage image domains
 * - Enables React strict mode for catching side-effect bugs early
 * - Security headers prevent common web attacks (XSS, clickjacking)
 */

const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        // Supabase Storage — for charity logos, winner proof uploads
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // LemonSqueezy assets (if any)
        protocol: "https",
        hostname: "assets.lemonsqueezy.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // WHY: Prevents clickjacking — stops our site being embedded in iframes
          { key: "X-Frame-Options", value: "DENY" },
          // WHY: Stops browser MIME-sniffing which can lead to XSS
          { key: "X-Content-Type-Options", value: "nosniff" },
          // WHY: Forces HTTPS — no mixed content
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // WHY: Controls what browser features our app can use
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // WHY: Tells browsers to send full referrer within site, short outside
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
