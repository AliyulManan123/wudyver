const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");
const { GenerateSW } = require('workbox-webpack-plugin');

const {
  createSecureHeaders
} = require("next-secure-headers");
const securityHeaders = [...createSecureHeaders({
  frameGuard: "sameorigin",
  xssProtection: "block-rendering",
  referrerPolicy: "no-referrer-when-downgrade"
}), {
  key: "Content-Security-Policy",
  value: "upgrade-insecure-requests"
}, {
  key: "Permissions-Policy",
  value: "camera=(), microphone=(), geolocation=(), Browse-topics=()"
}];
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
    serverActions: {
      bodySizeLimit: "5gb"
    },
    amp: {
      skipValidation: true
    }
  },
  compress: true,
  images: {
    domains: ["wudysoft.xyz", "cdn.weatherapi.com", "tile.openstreetmap.org", "www.chess.com", "deckofcardsapi.com", "raw.githubusercontent.com"],
    minimumCacheTTL: 60
  },
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
    runtimeCaching: runtimeCaching
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: securityHeaders
    }];
  },
  plugins: [
    new GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
    }),
  ],
  webpack: (config, {
    buildId,
    dev,
    isServer,
    defaultLoaders,
    webpack
  }) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil"
    });
    return config;
  }
};
module.exports = withPWA(nextConfig);