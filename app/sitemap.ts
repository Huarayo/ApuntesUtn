import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, priority: 1 },
    { url: `${siteUrl}/browse`, priority: 0.9 },

    { url: `${siteUrl}/browse/basicas--10jUr-_e95BC10ZWm6cz8dpyAIFJOyg3N`, priority: 0.8 },
    { url: `${siteUrl}/browse/ingenieria-en-sistemas-de-informacion--1LtMSiIc5pdSGJ8a4alUs-HmoDOWsAM_H`, priority: 0.8 },
    { url: `${siteUrl}/browse/ingreso--1pLDPGOGQgrS900XdrCki6gsodIEnkzdP`, priority: 0.8 },
  ];
}
