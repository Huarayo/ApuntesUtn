/* eslint-disable @typescript-eslint/no-require-imports */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^\/data\/drive-tree\.json$/,
      handler: "CacheFirst",
      options: {
        cacheName: "tree-cache",
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/data/drive-tree.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
