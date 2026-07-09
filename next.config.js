/* eslint-disable @typescript-eslint/no-require-imports */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    // ✅ Cache para el árbol de Drive (archivo local en /data/)
    {
      urlPattern: /^\/data\/drive-tree-.*\.json$/, 
      handler: "CacheFirst",
      options: {
        cacheName: "tree-cache",
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
        },
      },
    },
    // ✅ NUEVO: Cache para Vercel Blob (el archivo que se actualiza con el webhook)
    {
      urlPattern: /^https:\/\/dhfonqeb4oz4dngj\.public\.blob\.vercel-storage\.com\/.*\.json$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "blob-tree-cache",
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
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

module.exports = withPWA(nextConfig);