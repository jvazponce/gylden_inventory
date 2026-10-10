import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { RoleProvider } from '@/context/RoleContext';

export const metadata: Metadata = {
  title: 'Gylden Meadery — Inventario y Producción',
  description: 'Sistema integral de gestión de inventarios, recetas, batches y envíos de hidromiel.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        <RoleProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
            Gylden Meadery Management System &bull; Control artesanal de lotes y materias primas
          </footer>
        </RoleProvider>
      </body>
    </html>
  );
}
