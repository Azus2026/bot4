import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar de Clientes | Hik · Jose Rivas",
  description:
    "Estación de prospección y telemetría comercial para negocios locales. Auditoría web, PageSpeed Insights, análisis con Gemini Flash y outreach personalizado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased bg-radar-bg text-radar-textLight min-h-screen">
        {children}
      </body>
    </html>
  );
}
