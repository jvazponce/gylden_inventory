'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  PackageCheck, 
  Plus, 
  ArrowUpDown, 
  DollarSign, 
  Beer, 
  Sparkles, 
  X,
  Truck
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { createFinishedGood, adjustFinishedGoodStock } from '@/app/actions/finished-goods';

interface FinishedGood {
  id: string;
  name: string;
  style: string | null;
  format: string;
  stock: number;
  unitPrice: number;
}

export default function FinishedGoodsClient({
  items,
}: {
  items: FinishedGood[];
}) {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedForAdjustment, setSelectedForAdjustment] = useState<FinishedGood | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalBottles = items.reduce((acc, it) => acc + it.stock, 0);
  const totalValue = items.reduce((acc, it) => acc + it.stock * it.unitPrice, 0);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createFinishedGood(formData);
    setIsSubmitting(false);

    if (res.success) {
      setIsNewModalOpen(false);
    } else {
      setError(res.error || 'Error al guardar.');
    }
  }

  async function handleAdjust(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('id', selectedForAdjustment!.id);
    const res = await adjustFinishedGoodStock(formData);
    setIsSubmitting(false);

    if (res.success) {
      setSelectedForAdjustment(null);
    } else {
      setError(res.error || 'Error al ajustar stock.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-emerald-600" />
            Inventario de Producto Terminado
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Botellas de 330ml embotelladas, listas para despacho y venta con valorización en tiempo real.
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
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-500">Total Botellas Listas</span>
            <div className="text-2xl font-bold text-zinc-50 mt-1">
              {totalBottles} <span className="text-sm font-normal text-zinc-400">botellas 330ml</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-500">Valor de Inventario</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(totalValue)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-500">Variedades Registradas</span>
            <div className="text-2xl font-bold text-zinc-50 mt-1">
              {items.length} <span className="text-sm font-normal text-zinc-400">estilos</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-950 text-yellow-500 flex items-center justify-center">
            <Beer className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-800 border-b border-zinc-700 text-zinc-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Producto / Hidromiel</th>
                <th className="px-4 py-3.5">Estilo</th>
                <th className="px-4 py-3.5">Formato</th>
                <th className="px-4 py-3.5 text-right">Precio Unitario</th>
                <th className="px-4 py-3.5 text-right">Stock Disponible</th>
                <th className="px-4 py-3.5 text-right">Valor Total</th>
                <th className="px-5 py-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/50">
                  <td className="px-5 py-4 font-bold text-zinc-50 text-sm">
                    {item.name}
                  </td>
                  <td className="px-4 py-4 text-zinc-400">
                    {item.style || 'Hidromiel'}
                  </td>
                  <td className="px-4 py-4 text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 font-mono text-[11px] text-zinc-300">
                      {item.format}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-zinc-50">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="font-bold text-base text-zinc-50 font-mono">
                      {item.stock} <span className="text-xs font-normal text-zinc-400">botellas</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.stock > 24
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : item.stock > 0
                          ? 'bg-yellow-950/80 text-yellow-300 border border-yellow-800'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.stock > 24 ? 'bg-emerald-400' : item.stock > 0 ? 'bg-yellow-400' : 'bg-rose-500'
                        }`} />
                        <span>{item.stock > 24 ? 'Óptimo' : item.stock > 0 ? 'Stock Bajo' : 'Agotado'}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-zinc-50">
                    {formatCurrency(item.stock * item.unitPrice)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedForAdjustment(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      Ajustar Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajustar Stock */}
      {selectedForAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-zinc-900 rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-zinc-700">
            <div className="px-5 py-4 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-100">Ajustar Stock de Botellas</h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">{selectedForAdjustment.name}</p>
              </div>
              <button
                onClick={() => setSelectedForAdjustment(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjust} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Cantidad a añadir (+) o restar (-)
                </label>
                <input
                  type="number"
                  name="quantity"
                  required
                  placeholder="Ej. +12 o -4"
                  className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-800 text-zinc-100"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Stock actual: {selectedForAdjustment.stock} botellas
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Motivo / Observación
                </label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Ej. Rotura en almacén, degustación en feria..."
                  className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-800 text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedForAdjustment(null)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-zinc-700 hover:bg-zinc-600 text-zinc-50 rounded-lg"
                >
                  {isSubmitting ? 'Guardando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Producto */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-zinc-900 rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-zinc-700">
            <div className="px-5 py-4 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-100">Registrar Nuevo Producto Terminado</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej. Hidromiel Especiada de Invierno"
                  className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-800 text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Estilo
                  </label>
                  <input
                    type="text"
                    name="style"
                    placeholder="Ej. Metheglin, Melomel..."
                    className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-800 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Formato
                  </label>
                  <input
                    type="text"
                    name="format"
                    defaultValue="Botella 330ml"
                    className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-800 text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Precio Unitario ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="unitPrice"
                    defaultValue="4.50"
                    className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-800 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Stock Inicial (Botellas)
                  </label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue="0"
                    className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-800 text-zinc-100"
                  />
                </div>
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
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
