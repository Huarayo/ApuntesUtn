 
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";
 
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
 

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  // CONFIGURACIÓN DINÁMICA DE TÍTULOS
  title: {
    default: "Apuntes UTN FRM Mendoza", // Título si la página no tiene uno propio
    template: "%s | Apuntes UTN"      // El %s será reemplazado por el nombre de la materia
  },
  description: "Apuntes, parciales y finales organizados por carrera y materia. UTN Mendoza.",
  metadataBase: new URL(siteUrl),
  
  // ÍCONOS PARA NAVEGADORES (Asegurá que icon.png exista en /public)
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },

  openGraph: {
    title: "Apuntes UTN Mendoza",
    description: "Apuntes y exámenes organizados por carrera y materia.",
    url: siteUrl,
    siteName: "Apuntes UTN Mendoza",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "es_AR",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Apuntes UTN",
  },
  formatDetection: {
    telephone: false,
  },
};

// NUEVO: Esto ayuda a que en móviles la barra de arriba sea verde como tu app
export const viewport = {
  themeColor: "#2e7d32", // Usá el verde exacto de tu logo
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
 

  return (
    <html lang="es-AR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
 
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
