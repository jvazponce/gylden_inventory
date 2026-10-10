'use client';

import { useState } from 'react';
import Link from 'next/link';
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
    <header className="bg-amber-950 text-amber-50 border-b border-amber-900 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/30 transition-colors">
                <Beer className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  GYLDEN <span className="text-xs font-normal text-amber-400 px-1.5 py-0.5 rounded bg-amber-900/60 border border-amber-800">MEADERY</span>
                </span>
                <p className="text-[10px] text-amber-300/80 -mt-0.5">Control de Inventario y Producción</p>
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
                      ? 'bg-amber-500 text-amber-950 font-semibold shadow-sm'
                      : 'text-amber-200/80 hover:bg-amber-900 hover:text-white'
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
              className="flex items-center gap-1.5 bg-amber-900/80 hover:bg-amber-900 border border-amber-700 px-3 py-1.5 rounded-full text-xs text-amber-100 transition-colors"
            >
              {role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
              {role === 'PRODUCTION' && <Hammer className="w-3.5 h-3.5 text-amber-400" />}
              {role === 'SALES' && <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />}
              <span className="font-semibold">{roleName}</span>
              <ChevronDown className="w-3 h-3 text-amber-400 opacity-80" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                  Cambiar Rol Activo
                </div>

                <button
                  onClick={() => {
                    setRole('ADMIN');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                    role === 'ADMIN' ? 'font-bold text-amber-900 bg-amber-50/50' : 'text-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <div>
                    <div>Administrador</div>
                    <div className="text-[10px] text-slate-400 font-normal">Acceso total</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setRole('PRODUCTION');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                    role === 'PRODUCTION' ? 'font-bold text-amber-900 bg-amber-50/50' : 'text-slate-700'
                  }`}
                >
                  <Hammer className="w-4 h-4 text-amber-600" />
                  <div>
                    <div>Producción / Cervecero</div>
                    <div className="text-[10px] text-slate-400 font-normal">Recetas, insumos y batches</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setRole('SALES');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                    role === 'SALES' ? 'font-bold text-amber-900 bg-amber-50/50' : 'text-slate-700'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <div>
                    <div>Ventas / Despachos</div>
                    <div className="text-[10px] text-slate-400 font-normal">Botellas, clientes y cobros</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="md:hidden flex overflow-x-auto px-3 py-2 space-x-1 border-t border-amber-900/50 bg-amber-950/90 scrollbar-none">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-amber-950 font-semibold'
                  : 'text-amber-200/70 hover:bg-amber-900'
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
