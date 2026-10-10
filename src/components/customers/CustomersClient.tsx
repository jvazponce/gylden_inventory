'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Search, 
  Truck, 
  X,
  FileText
} from 'lucide-react';
import { createCustomer } from '@/app/actions/customers';

interface Customer {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  shipments: {
    id: string;
    shipmentNumber: string;
    totalExpected: number;
    deliveryStatus: string;
  }[];
}

export default function CustomersClient({
  customers,
}: {
  customers: Customer[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = customers.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contactName && c.contactName.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createCustomer(formData);
    setIsSubmitting(false);

    if (res.success) {
      setIsNewModalOpen(false);
    } else {
      setError(res.error || 'Error al guardar cliente.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
            <Users className="w-6 h-6 text-yellow-500" />
            Catálogo de Clientes y Puntos de Envío
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Administración de clientes regulares, bares, tiendas y direcciones de despacho.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/shipments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Truck className="w-4 h-4" />
            Crear Envío
          </Link>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-50 font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-700 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, contacto o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-zinc-900 rounded-2xl border border-zinc-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-zinc-50 text-base">{c.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                  {c.shipments.length} despacho(s)
                </span>
              </div>

              {c.contactName && (
                <p className="text-xs text-zinc-400 mt-1">
                  Contacto: <strong className="text-zinc-300">{c.contactName}</strong>
                </p>
              )}

              <div className="mt-4 space-y-2 text-xs text-zinc-400">
                {c.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">{c.address}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.notes && (
                  <div className="p-2.5 bg-zinc-800 rounded-lg text-[10px] text-zinc-400 mt-2">
                    {c.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between">
              <Link
                href={`/shipments/new?customerId=${c.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400 hover:text-yellow-300"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Despachar a este cliente</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nuevo Cliente */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-zinc-900 rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-zinc-700">
            <div className="px-5 py-4 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-100">Registrar Cliente / Destino</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {error && (
                <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nombre Comercial / Razón Social *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej. Taberna El Roble, Cervecería Viking..."
                  className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    placeholder="Ej. Laura Martínez"
                    className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+52 55 1234 5678"
                    className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="compras@cliente.com"
                  className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Dirección de Entrega / Punto de Envío
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Calle, número, colonia, ciudad y referencias de entrega"
                  className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Notas / Horario de Recepción
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Horarios de entrega, persona autorizada para recibir..."
                  className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-yellow-500 hover:bg-yellow-400 text-zinc-950 rounded-lg"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
