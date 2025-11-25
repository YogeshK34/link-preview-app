import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
      }
    ]
  }
};

// Invalid src prop (https://i.scdn.co/image/ab67616d0000b27354e544672baa16145d67612b) on `next/image`, hostname "i.scdn.co" is not configured under images in your `next.config.js`
export default nextConfig;
