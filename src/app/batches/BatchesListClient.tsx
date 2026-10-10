'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Beer, 
  Plus, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { PRODUCTION_STAGES, getStageByNumber } from '@/lib/batch-constants';
import { formatDate } from '@/lib/utils';

interface BatchItem {
  id: string;
  batchNumber: string;
  volumeLiters: number;
  currentStage: number;
  status: string;
  startDate: Date | string;
  stageTargetDate: Date | string | null;
  estimatedEndDate: Date | string | null;
  actualBottlesProduced: number | null;
  recipe: {
    id: string;
    name: string;
  };
}

export default function BatchesListClient({
  batches,
}: {
  batches: BatchItem[];
}) {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const now = new Date();

  const activeBatches = batches.filter((b) => b.status === 'IN_PROGRESS');
  const completedBatches = batches.filter((b) => b.status === 'COMPLETED');

  const displayed = activeTab === 'ACTIVE' ? activeBatches : completedBatches;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Beer className="w-6 h-6 text-amber-600" />
            Lotes y Fermentación en Proceso
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Seguimiento de las 6 etapas de producción, control de fechas de trasvase y cálculo de embotellado.
          </p>
        </div>

        <div>
          <Link
            href="/batches/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Iniciar Nuevo Batch
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'ACTIVE'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Batches en Curso</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900">
            {activeBatches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'COMPLETED'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Historial Completados</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {completedBatches.length}
          </span>
        </button>
      </div>

      {/* Batch cards list */}
      {displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Beer className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {activeTab === 'ACTIVE' ? 'No hay batches activos en este momento' : 'No hay historial de lotes completados aún'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'ACTIVE'
              ? 'Selecciona una de tus recetas para iniciar un nuevo lote de hidromiel con escalado automático.'
              : 'Los lotes terminados se archivarán aquí una vez embotellados.'}
          </p>
          {activeTab === 'ACTIVE' && (
            <Link
              href="/batches/new"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Lanzar Primer Batch
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((b) => {
            const isCompleted = b.status === 'COMPLETED';
            const targetDate = b.stageTargetDate ? new Date(b.stageTargetDate) : null;
            const isOverdue = !isCompleted && targetDate && targetDate <= now;
            const stageDef = getStageByNumber(b.currentStage);

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {b.batchNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isOverdue
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isCompleted ? '✓ Completado' : isOverdue ? '¡Tiempo Cumplido!' : `Etapa ${b.currentStage}/6`}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{b.recipe.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {b.volumeLiters} Litros &bull; Inicio: {formatDate(b.startDate)}
                  </p>

                  {/* Stage card */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      {isCompleted ? 'Resultado Final' : 'Etapa Actual'}
                    </span>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {isCompleted
                        ? `${b.actualBottlesProduced} botellas producidas`
                        : `${b.currentStage}. ${stageDef?.name}`}
                    </div>

                    {!isCompleted && (
                      <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Mover al siguiente paso:</span>
                        <span className={`font-semibold ${isOverdue ? 'text-amber-800' : 'text-slate-700'}`}>
                          {formatDate(b.stageTargetDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {isCompleted ? 'Archivado' : `Término: ${formatDate(b.estimatedEndDate)}`}
                  </span>

                  <Link
                    href={`/batches/${b.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                  >
                    <span>Ver Proceso</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
