'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Beer, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  PackageCheck,
  Thermometer,
  Layers
} from 'lucide-react';
import { PRODUCTION_STAGES, getStageByNumber } from '@/lib/batch-constants';
import { formatDate, formatDateTime } from '@/lib/utils';
import AdvanceStageModal from '@/components/batches/AdvanceStageModal';
import BottleBatchModal from '@/components/batches/BottleBatchModal';

interface BatchLog {
  id: string;
  stageNumber: number;
  stageName: string;
  startedAt: Date | string;
  completedAt: Date | string | null;
  densityOG: number | null;
  densityFG: number | null;
  temperature: number | null;
  notes: string | null;
}

interface Batch {
  id: string;
  batchNumber: string;
  volumeLiters: number;
  currentStage: number;
  status: string;
  startDate: Date | string;
  stageTargetDate: Date | string | null;
  estimatedEndDate: Date | string | null;
  actualBottlesProduced: number | null;
  notes: string | null;
  recipe: {
    id: string;
    name: string;
    baseVolumeLiters: number;
  };
  logs: BatchLog[];
}

export default function BatchDetailClient({
  batch,
}: {
  batch: Batch;
}) {
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isBottleModalOpen, setIsBottleModalOpen] = useState(false);

  const isCompleted = batch.status === 'COMPLETED';
  const now = new Date();
  const targetDate = batch.stageTargetDate ? new Date(batch.stageTargetDate) : null;
  const isOverdueForTransition = !isCompleted && targetDate && targetDate <= now;

  const currentStageDef = getStageByNumber(batch.currentStage);

  return (
    <div className="space-y-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/batches"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Batches
        </Link>

        {/* Action Button */}
        {!isCompleted && (
          <div>
            {batch.currentStage < 6 ? (
              <button
                onClick={() => setIsAdvanceModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-all ${
                  isOverdueForTransition
                    ? 'bg-amber-600 hover:bg-amber-500 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <span>Avanzar a Etapa {batch.currentStage + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsBottleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
              >
                <PackageCheck className="w-4 h-4" />
                Embotellar y Finalizar Lote
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                {batch.batchNumber}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {isCompleted ? 'Lote Completado' : `En Producción: Etapa ${batch.currentStage}/6`}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{batch.recipe.name}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Volumen elaborado: <strong className="text-slate-800">{batch.volumeLiters} Litros</strong> &bull; Inicio: {formatDate(batch.startDate)}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-[130px]">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Fecha Próximo Paso</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {isCompleted ? 'Finalizado' : formatDate(batch.stageTargetDate)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-[130px]">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Término Estimado</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {formatDate(batch.estimatedEndDate)}
              </div>
            </div>

            {isCompleted && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 min-w-[130px]">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold">Botellas Obtenidas</span>
                <div className="text-sm font-bold text-emerald-900 mt-0.5">
                  {batch.actualBottlesProduced} botellas 330ml
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transition Alert */}
        {isOverdueForTransition && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-950">
                  ¡Tiempo cumplido para la {currentStageDef?.name}!
                </h4>
                <p className="text-[11px] text-amber-800">
                  La fecha programada era el {formatDate(batch.stageTargetDate)}. El lote está listo para registrar lecturas y avanzar al siguiente proceso.
                </p>
              </div>
            </div>
            {batch.currentStage < 6 ? (
              <button
                onClick={() => setIsAdvanceModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Avanzar Ahora
              </button>
            ) : (
              <button
                onClick={() => setIsBottleModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Embotellar Ahora
              </button>
            )}
          </div>
        )}

        {/* 6-Stage Progress Stepper */}
        <div className="mt-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Línea de Proceso (6 Etapas de Fermentación)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {PRODUCTION_STAGES.map((stg) => {
              const isPast = isCompleted || stg.number < batch.currentStage;
              const isCurrent = !isCompleted && stg.number === batch.currentStage;
              const isFuture = !isCompleted && stg.number > batch.currentStage;

              return (
                <div
                  key={stg.number}
                  className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-400/20'
                      : isPast
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-amber-600 text-white'
                          : isPast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isPast ? '✓' : stg.number}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {stg.durationDays}d
                      </span>
                    </div>

                    <h4 className={`font-bold leading-tight ${
                      isCurrent ? 'text-amber-950' : isPast ? 'text-slate-900' : 'text-slate-500'
                    }`}>
                      {stg.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/50">
                    <span className={`text-[10px] font-semibold ${
                      isCurrent
                        ? 'text-amber-700'
                        : isPast
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}>
                      {isCurrent ? '● En curso' : isPast ? 'Completada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bitácora de Lecturas y Registros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          Bitácora y Trazabilidad de Etapas
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Etapa</th>
                <th className="px-4 py-2.5">Fecha Inicio</th>
                <th className="px-4 py-2.5">Fecha Fin</th>
                <th className="px-3 py-2.5 text-center">Densidad (SG)</th>
                <th className="px-3 py-2.5 text-center">Temp (°C)</th>
                <th className="px-4 py-2.5">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batch.logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                        {log.stageNumber}
                      </span>
                      <span>{log.stageName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDateTime(log.startedAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.completedAt ? formatDateTime(log.completedAt) : (
                      <span className="text-amber-700 font-medium">En proceso...</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center font-mono">
                    {log.densityOG ? `OG: ${log.densityOG}` : ''}
                    {log.densityFG ? ` / FG: ${log.densityFG}` : ''}
                    {!log.densityOG && !log.densityFG ? '-' : ''}
                  </td>
                  <td className="px-3 py-3 text-center font-mono">
                    {log.temperature ? `${log.temperature}°C` : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                    {log.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <AdvanceStageModal
        batchId={batch.id}
        batchNumber={batch.batchNumber}
        currentStage={batch.currentStage}
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
      />

      <BottleBatchModal
        batchId={batch.id}
        batchNumber={batch.batchNumber}
        volumeLiters={batch.volumeLiters}
        recipeName={batch.recipe.name}
        isOpen={isBottleModalOpen}
        onClose={() => setIsBottleModalOpen(false)}
      />
    </div>
  );
}
