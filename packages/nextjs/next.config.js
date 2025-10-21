// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React's Strict Mode for better compatibility with some Web3 libraries
  reactStrictMode: false,
  
  // Required for static export
  trailingSlash: true,
  
  // Image optimization configuration
  images: {
    // Enable image optimization
    domains: ['*'], // Allow images from all domains
  },
  
  // Disable server-side features that don't work with static export
  // Note: exportPathMap is not compatible with the app/ directory
  // We'll use generateStaticParams() in page files instead
  
  // Environment variables configuration
  env: {
    NEXT_PUBLIC_LISK_RPC_URL: process.env.NEXT_PUBLIC_LISK_RPC_URL || 'https://rpc.sepolia-api.lisk.com',
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '',
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
  },
  
  // TypeScript and ESLint configurations
  typescript: {
    ignoreBuildErrors: true, // Set to true to ignore TypeScript errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Set to true to ignore ESLint errors during build
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      fs: false, 
      net: false, 
      tls: false,
      dns: false,
      child_process: false,
      http2: false,
      process: false,
    };
    
    // Add polyfills for Node.js modules
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "isomorphic-ws": false,
        isows: false,
        "pino-pretty": false,
        lokijs: false,
        encoding: false,
      };
    }
    
    return config;
  },
  
  // Enable CORS for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
