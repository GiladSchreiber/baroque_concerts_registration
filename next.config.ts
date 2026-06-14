import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage
      { protocol: "https", hostname: "*.supabase.co" },
      // Common image hosts
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
    ],
    // Allow local /uploads/ folder in dev
    localPatterns: [{ pathname: "/uploads/**" }, { pathname: "/logo.png" }],
  },
};

export default nextConfig;
