/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(({ context, request }, callback) => {
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
