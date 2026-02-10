/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      if (!config.externals) {
        config.externals = [];
      }
      
      config.externals.push('date-fns-tz');
    }
    return config;
  },
};

export default nextConfig;