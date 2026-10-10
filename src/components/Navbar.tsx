'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Beer, 
  Boxes, 
  FlaskConical, 
  PackageCheck, 
  Truck, 
  Users, 
  LayoutDashboard,
  ShieldCheck,
  ChevronDown,
  Hammer,
  ShoppingBag
} from 'lucide-react';
import { useRole, UserRole } from '@/context/RoleContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'PRODUCTION', 'SALES'] },
  { name: 'Materia Prima', href: '/inventory/raw-materials', icon: Boxes, roles: ['ADMIN', 'PRODUCTION'] },
  { name: 'Producto Terminado', href: '/inventory/finished-goods', icon: PackageCheck, roles: ['ADMIN', 'SALES'] },
  { name: 'Recetas', href: '/recipes', icon: FlaskConical, roles: ['ADMIN', 'PRODUCTION'] },
  { name: 'Batches en Proceso', href: '/batches', icon: Beer, roles: ['ADMIN', 'PRODUCTION'] },
  { name: 'Clientes / Destinos', href: '/customers', icon: Users, roles: ['ADMIN', 'SALES'] },
  { name: 'Envíos y Salidas', href: '/shipments', icon: Truck, roles: ['ADMIN', 'SALES'] },
];

export default function Navbar() {
  const pathname = usePathname();
  const { role, setRole, roleName } = useRole();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredNavigation = navigation.filter((item) => item.roles.includes(role));

  return (
    <header className="bg-zinc-950 text-zinc-50 border-b border-zinc-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-8 h-10 flex-shrink-0 group-hover:scale-105 transition-transform drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]">
                <Image
                  src="/logo-g.png"
                  alt="Gylden Logo"
                  width={32}
                  height={40}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-brand font-black text-2xl tracking-widest text-yellow-400 group-hover:text-yellow-300 transition-colors leading-none">
                  GYLDEN
                </span>
                <span className="font-sans text-[8px] font-semibold tracking-[0.25em] text-yellow-500/90 uppercase mt-1">
                  BREWING CO.
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-yellow-500 text-zinc-950 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-full text-xs text-zinc-100 transition-colors"
            >
              {role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />}
              {role === 'PRODUCTION' && <Hammer className="w-3.5 h-3.5 text-yellow-400" />}
              {role === 'SALES' && <ShoppingBag className="w-3.5 h-3.5 text-yellow-400" />}
              <span className="font-semibold">{roleName}</span>
              <ChevronDown className="w-3 h-3 text-yellow-400 opacity-80" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 py-1.5 z-50 text-zinc-100">
                <div className="px-3 py-1.5 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500">
                  Cambiar Rol Activo
                </div>

                <button
                  onClick={() => {
                    setRole('ADMIN');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-zinc-800 transition-colors ${
                    role === 'ADMIN' ? 'font-bold text-yellow-400 bg-zinc-800/60' : 'text-zinc-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div>Administrador</div>
                    <div className="text-[10px] text-zinc-500 font-normal">Acceso total</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setRole('PRODUCTION');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-zinc-800 transition-colors ${
                    role === 'PRODUCTION' ? 'font-bold text-yellow-400 bg-zinc-800/60' : 'text-zinc-300'
                  }`}
                >
                  <Hammer className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div>Producción / Cervecero</div>
                    <div className="text-[10px] text-zinc-500 font-normal">Recetas, insumos y batches</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setRole('SALES');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-zinc-800 transition-colors ${
                    role === 'SALES' ? 'font-bold text-yellow-400 bg-zinc-800/60' : 'text-zinc-300'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div>Ventas / Despachos</div>
                    <div className="text-[10px] text-zinc-500 font-normal">Botellas, clientes y cobros</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="md:hidden flex overflow-x-auto px-3 py-2 space-x-1 border-t border-zinc-800 bg-zinc-950/90 scrollbar-none">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs whitespace-nowrap ${
                isActive
                  ? 'bg-yellow-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
