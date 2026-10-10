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
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 antialiased font-sans">
        <RoleProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="border-t border-zinc-800/80 bg-zinc-950 py-5 text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-zinc-400 font-medium">Gylden Brewing Co. &bull; Sistema Operativo v1.0</span>
              </div>
              <p className="text-zinc-500 text-[11px] text-center sm:text-right">
                Control artesanal de hidromiel &bull; Trazabilidad y escalado de producción
              </p>
            </div>
          </footer>
        </RoleProvider>
      </body>
    </html>
  );
}
