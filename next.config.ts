import type { NextConfig } from "next";

function supabaseAvatarPatterns() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return [];
  }
  const { protocol, hostname, port } = new URL(url);
  return [
    {
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
      port,
      pathname: "/storage/v1/object/public/avatars/**",
    },
  ];
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseAvatarPatterns(),
  },
};

export default nextConfig;
