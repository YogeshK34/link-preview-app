import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // XSS Protection: Content Security Policy Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Allow scripts from same origin and Next.js
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline needed for Next.js
              // Allow styles from same origin and inline styles
              "style-src 'self' 'unsafe-inline'",
              // Allow images from any HTTPS source (for link previews)
              "img-src 'self' data: https:",
              // Allow fonts from same origin
              "font-src 'self' data:",
              // Allow connections to same origin and Supabase
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              // Prevent framing (clickjacking protection)
              "frame-ancestors 'none'",
              // Only allow HTTPS for external resources
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME type sniffing
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Enable browser XSS protection
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Control referrer information
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()', // Restrict permissions
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'opengraph.githubassets.com',
        pathname: "**",
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: "**",
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: "**",
      }, {
        protocol: 'https',
        hostname: 'i.scdn.co',
        pathname: "**"
      }, {
        protocol: "https",
        hostname: "v0.app",
        pathname: "**"
      }, 
      {
        protocol: "https",
        hostname: "assets.vercel.com",
        pathname: "**"
      }, {
        protocol: "https",
        hostname: "miro.medium.com",
        pathname: "**"
      },  {
        protocol: "https",
        hostname: "vercel.com",
        pathname: "**"
      }, 
      {
        protocol: "https",
        hostname: "pdgvvgmkdvyeydso.public.blob.vercel-storage.com",
        pathname: "**"
      }
    ]
  }
};

export default nextConfig;
