import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(({ context, request }: any, callback: any) => {
        if (/^@prisma\/|^.prisma\/|better-sqlite3/.test(request)) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      });
    }
    return config;
  }
};

export default nextConfig;
