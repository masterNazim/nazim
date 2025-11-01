/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { 
    domains: ['images.pexels.com', 'supabase.co', 'cwpwushsxgnyzfcsdace.supabase.co'],
    formats: ['image/webp', 'image/avif']
  },
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    
    // Ignore warnings from Supabase realtime
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
    ];
    
    return config;
  },
};

module.exports = nextConfig;
