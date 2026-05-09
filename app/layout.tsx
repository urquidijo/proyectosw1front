import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SynData',
  description: 'Plataforma web para generar datos sintéticos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}