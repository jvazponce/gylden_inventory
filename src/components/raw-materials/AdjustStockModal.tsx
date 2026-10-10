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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Ajustar Stock / Entrada</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{material.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
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

          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setAdjustmentType('ADD')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                adjustmentType === 'ADD'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
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
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              Salida / Ajuste (-)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cantidad a {adjustmentType === 'ADD' ? 'añadir' : 'descontar'} ({material.unit})
            </label>
            <input
              type="number"
              name="quantity"
              step="any"
              min="0.001"
              required
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Stock actual registrado: <strong className="text-slate-800">{material.stock} {material.unit}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas / Motivo del movimiento
            </label>
            <input
              type="text"
              name="notes"
              placeholder={adjustmentType === 'ADD' ? 'Ej. Factura proveedor #4892' : 'Ej. Merma / Insumo dañado'}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
