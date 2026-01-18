 
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import RegisterSW from "@/app/components/RegisterSW" 

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
  // TÍTULO: Usamos una promesa de valor clara
  title: {
    default: "Apuntes UTN Mendoza | Tu carrera organizada en un solo lugar", 
    template: "%s | Apuntes UTN Mendoza"
  },

  // DESCRIPCIÓN: Enfocada en la utilidad real para el estudiante
  description: "Accedé de forma simple a los apuntes, parciales y finales de la UTN FRM Mendoza. Una herramienta pensada para optimizar tu tiempo de estudio con todo el material organizado por carrera.",

  metadataBase: new URL(siteUrl),

  // CANONICAL: Clave para que Google no te penalice por tener www
  alternates: {
    canonical: "/",
  },

  // ROBOTS: Para que Google te trate como una app de alta prioridad
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },

  // ICONS: Aquí es donde tu icono de 144x144 brilla
  icons: {
    icon: "./icon.png",
    apple: "/icon.png",
  },

  // OPENGRAPH: Lo que verán los alumnos cuando compartan el link por WhatsApp
  openGraph: {
    title: "Apuntes UTN Mendoza - La App de la comunidad",
    description: "Simplificá tu cursada. Encontrá parciales, finales y guías de todas las ingenierías en un solo lugar.",
    url: siteUrl,
    siteName: "Apuntes UTN Mendoza",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Plataforma Apuntes UTN" }],
    locale: "es_AR",
    type: "website",
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
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RegisterSW />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
