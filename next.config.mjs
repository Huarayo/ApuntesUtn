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
      // Tus reglas de caché actuales
      {
        source: "/data/drive-tree-:version.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Nuevas cabeceras de seguridad globales
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }
        ],
      }
    ];
  },
};

export default pwaConfig(nextConfig);