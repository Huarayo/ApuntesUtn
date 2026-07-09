// ✅ Usar import en lugar de require
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^\/data\/drive-tree-.*\.json$/,
      handler: "CacheFirst",
      options: {
        cacheName: "tree-cache",
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: /^https:\/\/dhfonqeb4oz4dngj\.public\.blob\.vercel-storage\.com\/.*\.json$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "blob-tree-cache",
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 60 * 60 * 24 * 30,
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
        source: "/data/drive-tree-:version.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default pwaConfig(nextConfig);