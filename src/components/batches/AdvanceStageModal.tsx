'use client';

import { useState } from 'react';
import { advanceBatchStageAction } from '@/app/actions/batches';
import { PRODUCTION_STAGES, getStageByNumber } from '@/lib/batch-constants';
import { ArrowRight, X, AlertCircle } from 'lucide-react';

export default function AdvanceStageModal({
  batchId,
  batchNumber,
  currentStage,
  isOpen,
  onClose,
}: {
  batchId: string;
  batchNumber: string;
  currentStage: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStageDef = getStageByNumber(currentStage);
  const nextStageNum = currentStage + 1;
  const nextStageDef = getStageByNumber(nextStageNum);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('batchId', batchId);

    const res = await advanceBatchStageAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Error al avanzar de etapa.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Avanzar a Siguiente Etapa</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{batchNumber}</p>
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

          {/* Current and Next Stage info */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-amber-700 uppercase font-semibold">Etapa Actual</span>
              <p className="font-bold text-slate-900">{currentStageDef?.name}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div className="text-right">
              <span className="text-[10px] text-amber-700 uppercase font-semibold">Nueva Etapa</span>
              <p className="font-bold text-slate-900">{nextStageDef?.name}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas / Observaciones del Paso (Opcional)
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Ej. Trasvase realizado limpio, aromas florales intensos, sin sedimentos..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600">
            Tiempo programado para la nueva etapa: <strong>{nextStageDef?.durationDays} día(s)</strong>.
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
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Avanzando...' : 'Confirmar Avance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
