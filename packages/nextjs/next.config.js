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
    unoptimized: true, // Disable default image optimization
  },
  
  // Disable server-side features that don't work with static export
  output: 'export',
  
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
    // Fixes npm packages that depend on `node:` protocol (not available in browser)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
    };

    // Add polyfills for Node.js core modules
    if (!isServer) {
      // Add polyfills
      const fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        assert: require.resolve('assert/'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        url: require.resolve('url/'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser'),
      };

      config.resolve.fallback = fallback;

      // Add plugin to provide Buffer globally
      config.plugins = (config.plugins || []).concat([
        new (require('webpack').ProvidePlugin)({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
      ]);

      // Fix for bigint-buffer
      config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false, // disable the behavior
        },
      });

      // Exclude node_modules from being processed by babel-loader
      config.module.rules.push({
        test: /\.m?js$/,
        exclude: /node_modules\/(?!@walletconnect|@web3modal|@web3-react|@web3modal|@walletconnect\/.*|@walletconnect\/.*\/.*|@walletconnect\/.*\/.*\/.*|@walletconnect\/.*\/.*\/.*\/.*)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime'],
          },
        },
      });
    }

    // Add a rule to handle .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Force pure JavaScript implementation of bigint-buffer
    config.resolve.alias = {
      ...config.resolve.alias,
      'bigint-buffer': 'bigint-buffer/umd.js',
      'web3-eth-abi': 'web3-eth-abi/lib/index.js',
      // Add other problematic native modules here
      'secp256k1': 'secp256k1/elliptic.js',
      'keccak': 'keccak/js',
    };

    // Add fallback for Node.js core modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
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
    };

    // Provide global Buffer
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    return config;
  },
  
  // Add experimental features
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['@toruslabs/solana-embed', '@solana/web3.js', 'bufferutil', 'utf-8-validate'],
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
