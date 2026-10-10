'use client';

import { useState } from 'react';
import { adjustRawMaterialStock } from '@/app/actions/raw-materials';
import { PlusCircle, MinusCircle, X } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  unit: string;
  stock: number;
}

export default function AdjustStockModal({
  material,
  isOpen,
  onClose,
}: {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT'>('ADD');

  if (!isOpen || !material) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const rawQuantity = parseFloat(formData.get('quantity') as string) || 0;
    const finalQuantity = adjustmentType === 'ADD' ? rawQuantity : -rawQuantity;
    
    formData.set('id', material!.id);
    formData.set('quantity', finalQuantity.toString());
    formData.set('type', adjustmentType === 'ADD' ? 'PURCHASE' : 'ADJUSTMENT');

    const res = await adjustRawMaterialStock(formData);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Ocurrió un error al actualizar el stock.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-zinc-900 rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-zinc-700">
        <div className="px-5 py-4 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-zinc-100">Ajustar Stock / Entrada</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{material.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-2 p-1 bg-zinc-800 rounded-lg">
            <button
              type="button"
              onClick={() => setAdjustmentType('ADD')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                adjustmentType === 'ADD'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Entrada / Compra (+)
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('SUBTRACT')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                adjustmentType === 'SUBTRACT'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              Salida / Ajuste (-)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Cantidad a {adjustmentType === 'ADD' ? 'añadir' : 'descontar'} ({material.unit})
            </label>
            <input
              type="number"
              name="quantity"
              step="any"
              min="0.001"
              required
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Stock actual registrado: <strong className="text-zinc-100">{material.stock} {material.unit}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Notas / Motivo del movimiento
            </label>
            <input
              type="text"
              name="notes"
              placeholder={adjustmentType === 'ADD' ? 'Ej. Factura proveedor #4892' : 'Ej. Merma / Insumo dañado'}
              className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-yellow-500 hover:bg-yellow-400 text-zinc-950 rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
