const {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} = require("next/constants");
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
  async headers() {
    return [{
      source: "/(.*)",
      headers: securityHeaders
    }];
  },
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
module.exports = (phase) => {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withPWA = require("@ducanh2912/next-pwa").default({
      dest: "public",
    });
    return withPWA(nextConfig);
  }
  return nextConfig;
};