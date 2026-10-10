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
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-100"
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
                    ? 'bg-yellow-500 hover:bg-yellow-400 text-zinc-950 animate-pulse'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
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
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                {batch.batchNumber}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-yellow-950 text-yellow-300 border border-yellow-700'
              }`}>
                {isCompleted ? 'Lote Completado' : `En Producción: Etapa ${batch.currentStage}/6`}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-50">{batch.recipe.name}</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Volumen elaborado: <strong className="text-zinc-100">{batch.volumeLiters} Litros</strong> &bull; Inicio: {formatDate(batch.startDate)}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <div className="p-3 bg-zinc-800 rounded-xl border border-zinc-700 min-w-[130px]">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Fecha Próximo Paso</span>
              <div className="text-sm font-bold text-zinc-50 mt-0.5">
                {isCompleted ? 'Finalizado' : formatDate(batch.stageTargetDate)}
              </div>
            </div>

            <div className="p-3 bg-zinc-800 rounded-xl border border-zinc-700 min-w-[130px]">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Término Estimado</span>
              <div className="text-sm font-bold text-zinc-50 mt-0.5">
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
          <div className="mt-4 p-4 bg-yellow-950 border border-yellow-700 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-yellow-900 text-yellow-300 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-yellow-300">
                  ¡Tiempo cumplido para la {currentStageDef?.name}!
                </h4>
                <p className="text-[11px] text-yellow-400">
                  La fecha programada era el {formatDate(batch.stageTargetDate)}. El lote está listo para registrar lecturas y avanzar al siguiente proceso.
                </p>
              </div>
            </div>
            {batch.currentStage < 6 ? (
              <button
                onClick={() => setIsAdvanceModalOpen(true)}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-xs rounded-lg shadow-sm"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Línea de Proceso (6 Etapas de Fermentación)
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {isCompleted
                  ? 'Ciclo de elaboración 100% completado y embotellado.'
                  : `Etapa ${batch.currentStage} de 6 en progreso &bull; Ciclo estimado total: 20 días`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-yellow-400">
                {isCompleted ? '100%' : `${Math.round(((batch.currentStage - 0.5) / 6) * 100)}%`}
              </span>
              <div className="w-28 sm:w-36 h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${isCompleted ? 100 : Math.round(((batch.currentStage - 0.5) / 6) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {PRODUCTION_STAGES.map((stg) => {
              const isPast = isCompleted || stg.number < batch.currentStage;
              const isCurrent = !isCompleted && stg.number === batch.currentStage;
              const isFuture = !isCompleted && stg.number > batch.currentStage;

              return (
                <div
                  key={stg.number}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between transition-all relative ${
                    isCurrent
                      ? 'bg-yellow-950/70 border-yellow-500 shadow-lg shadow-yellow-500/10 ring-1 ring-yellow-500/40'
                      : isPast
                      ? 'bg-emerald-950/30 border-emerald-800/70 text-emerald-300'
                      : 'bg-zinc-800/30 border-zinc-800 text-zinc-500 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-yellow-500 text-zinc-950 ring-2 ring-yellow-400/30'
                          : isPast
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {isPast ? '✓' : stg.number}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {stg.durationDays}d
                      </span>
                    </div>

                    <h4 className={`font-bold leading-tight ${
                      isCurrent ? 'text-yellow-300' : isPast ? 'text-zinc-100' : 'text-zinc-400'
                    }`}>
                      {stg.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-700/50">
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                      isCurrent
                        ? 'text-yellow-400'
                        : isPast
                        ? 'text-emerald-400'
                        : 'text-zinc-500'
                    }`}>
                      {isCurrent ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
                          <span>En curso</span>
                        </>
                      ) : isPast ? (
                        '✓ Completada'
                      ) : (
                        'Pendiente'
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bitácora de Lecturas y Registros */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-sm p-6">
        <h3 className="text-sm font-bold text-zinc-50 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-500" />
          Bitácora y Trazabilidad de Etapas
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-800 border-b border-zinc-700 text-zinc-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Etapa</th>
                <th className="px-4 py-2.5">Fecha Inicio</th>
                <th className="px-4 py-2.5">Fecha Fin</th>
                <th className="px-3 py-2.5 text-center">Densidad (SG)</th>
                <th className="px-3 py-2.5 text-center">Temp (°C)</th>
                <th className="px-4 py-2.5">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {batch.logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-semibold text-zinc-50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold flex items-center justify-center">
                        {log.stageNumber}
                      </span>
                      <span>{log.stageName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {formatDateTime(log.startedAt)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {log.completedAt ? formatDateTime(log.completedAt) : (
                      <span className="text-yellow-400 font-medium">En proceso...</span>
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
                  <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
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
