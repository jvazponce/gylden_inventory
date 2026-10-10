'use client';

import { useState } from 'react';
import { completeAndBottleBatchAction } from '@/app/actions/batches';
import { PackageCheck, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BottleBatchModal({
  batchId,
  batchNumber,
  volumeLiters,
  recipeName,
  isOpen,
  onClose,
}: {
  batchId: string;
  batchNumber: string;
  volumeLiters: number;
  recipeName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  // Estimated bottles: volume * 1000 / 330 ~ volume * 3 (approx)
  const estimatedBottles = Math.floor((volumeLiters * 1000) / 330 * 0.95);
  const [actualBottles, setActualBottles] = useState<number>(estimatedBottles);
  const [finalGravity, setFinalGravity] = useState<string>('1.006');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('batchId', batchId);

    const res = await completeAndBottleBatchAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Error al completar el embotellado.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-950">Finalizar y Embotellar Lote</h3>
              <p className="text-xs text-emerald-700 font-mono">{batchNumber} &bull; {volumeLiters} Litros</p>
            </div>
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
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-800">Efectos automáticos en el Inventario:</div>
            <ul className="space-y-1 text-slate-600">
              <li className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Se sumarán <strong>{actualBottles} botellas</strong> a Producto Terminado.
              </li>
              <li className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                Se descontarán <strong>{actualBottles} botellas vacías 330ml</strong> del stock de empaque.
              </li>
              <li className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                Se descontarán <strong>{actualBottles} chapas doradas</strong> del stock de empaque.
              </li>
              <li className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                Se descontarán <strong>{actualBottles} etiquetas</strong> del stock de empaque.
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Botellas Obtenidas (330ml) *
              </label>
              <input
                type="number"
                name="actualBottles"
                required
                min="1"
                value={actualBottles}
                onChange={(e) => setActualBottles(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Estimado teórico: ~{estimatedBottles} botellas</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Densidad Final (FG)
              </label>
              <input
                type="number"
                step="0.001"
                name="finalGravity"
                value={finalGravity}
                onChange={(e) => setFinalGravity(e.target.value)}
                placeholder="1.006"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas de Cierre y Cata
            </label>
            <textarea
              name="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Claridad cristalina, gasificación perfecta, dulzor balanceado..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              disabled={isSubmitting || actualBottles <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Finalizando...' : 'Finalizar y Sumar a Inventario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
