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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-emerald-600" />
            Inventario de Producto Terminado
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Botellas de 330ml embotelladas, listas para despacho y venta con valorización en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/shipments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Truck className="w-4 h-4" />
            Crear Envío
          </Link>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Total Botellas Listas</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {totalBottles} <span className="text-sm font-normal text-slate-500">botellas 330ml</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Valor de Inventario</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(totalValue)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Variedades Registradas</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {items.length} <span className="text-sm font-normal text-slate-500">estilos</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Beer className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
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
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                    {item.name}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {item.style || 'Hidromiel'}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                      {item.format}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-slate-900">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-base text-slate-900">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${
                      item.stock > 24
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : item.stock > 0
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {item.stock} botellas
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-900">
                    {formatCurrency(item.stock * item.unitPrice)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedForAdjustment(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
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
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Ajustar Stock de Botellas</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedForAdjustment.name}</p>
              </div>
              <button
                onClick={() => setSelectedForAdjustment(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjust} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cantidad a añadir (+) o restar (-)
                </label>
                <input
                  type="number"
                  name="quantity"
                  required
                  placeholder="Ej. +12 o -4"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Stock actual: {selectedForAdjustment.stock} botellas
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo / Observación
                </label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Ej. Rotura en almacén, degustación en feria..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedForAdjustment(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Registrar Nuevo Producto Terminado</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej. Hidromiel Especiada de Invierno"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estilo
                  </label>
                  <input
                    type="text"
                    name="style"
                    placeholder="Ej. Metheglin, Melomel..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Formato
                  </label>
                  <input
                    type="text"
                    name="format"
                    defaultValue="Botella 330ml"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio Unitario ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="unitPrice"
                    defaultValue="4.50"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Inicial (Botellas)
                  </label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue="0"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
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
