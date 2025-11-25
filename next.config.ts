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

export default nextConfig;
