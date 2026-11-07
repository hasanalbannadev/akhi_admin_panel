import type { NextConfig } from "next";

// Next.js সেটিংস। ইমেজ আমরা সাধারণ <img> দিয়ে দেখাই, তাই আলাদা domain config লাগে না।
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
