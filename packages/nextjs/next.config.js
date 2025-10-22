// @ts-check
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React's Strict Mode for better compatibility with some Web3 libraries
  reactStrictMode: false,
  
  // Required for static export
  trailingSlash: true,
  
  // Image optimization configuration
  images: {
    domains: ['*'], // Allow images from all domains
  },
  
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
  webpack: (config, { isServer, webpack }) => {
    // Add fallback for Node.js core modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      // Polyfills for Node.js core modules
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      buffer: require.resolve('buffer/'),
      util: require.resolve('util/'),
      assert: require.resolve('assert/'),
      url: require.resolve('url/'),
      process: require.resolve('process/browser'),
    };

    // Add polyfills
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      })
    );

    // Ignore specific warnings
    config.ignoreWarnings = [
      { module: /node_modules[\\/]process[\\/]browser\.js/ },
      { module: /node_modules[\\/]@babel[\\/]runtime/ },
      { module: /node_modules[\\/]asynckit[\\/]/ },
      { module: /node_modules[\\/]consola[\\/]/ },
    ];

    // Suppress specific warnings
    config.stats = 'errors-only';
    
    // Fix for process/browser not found
    config.resolve.alias = {
      ...config.resolve.alias,
      'process/browser': require.resolve('process/browser'),
    };

    // Add a rule to handle .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    return config;
  },
  
  // Add experimental features
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: [
      '@toruslabs/solana-embed', 
      '@solana/web3.js', 
      'bufferutil', 
      'utf-8-validate',
      '@babel/runtime',
      '@babel/runtime-corejs3',
      'process/browser'
    ],
    fallbackNodePolyfills: false,
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
