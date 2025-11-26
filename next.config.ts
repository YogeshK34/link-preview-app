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
