'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FlaskConical, 
  Beer, 
  Scale, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Info
} from 'lucide-react';
import { PRODUCTION_STAGES, getStageByNumber } from '@/lib/batch-constants';

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  stock: number;
}

interface RecipeItem {
  id: string;
  rawMaterialId: string;
  quantity: number;
  stage: number;
  notes: string | null;
  rawMaterial: RawMaterial;
}

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  baseVolumeLiters: number;
  estimatedDays: number;
  items: RecipeItem[];
}

export default function RecipeDetailClient({
  recipe,
}: {
  recipe: Recipe;
}) {
  const [targetVolume, setTargetVolume] = useState<number>(recipe.baseVolumeLiters || 20);

  // Scaling factor
  const scalingFactor = recipe.baseVolumeLiters > 0 ? targetVolume / recipe.baseVolumeLiters : 1;

  // Group items by stage
  const itemsByStage: Record<number, RecipeItem[]> = {};
  recipe.items.forEach((item) => {
    const stage = item.stage || 1;
    if (!itemsByStage[stage]) itemsByStage[stage] = [];
    itemsByStage[stage].push(item);
  });

  // Calculate if all materials have enough stock
  let allStockAvailable = true;
  recipe.items.forEach((item) => {
    const required = item.quantity * scalingFactor;
    if (item.rawMaterial.stock < required) {
      allStockAvailable = false;
    }
  });

  return (
    <div className="space-y-6">
      {/* Navigation header */}
      <div className="flex items-center gap-2">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Recetas
        </Link>
      </div>

      {/* Hero Recipe Card */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-950 text-yellow-400 border border-yellow-800 text-xs font-semibold mb-2">
              <FlaskConical className="w-3.5 h-3.5" />
              Receta Base Formulación
            </div>
            <h1 className="text-2xl font-bold text-zinc-50">{recipe.name}</h1>
            {recipe.description && (
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{recipe.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/batches/new?recipeId=${recipe.id}&volume=${targetVolume}`}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold shadow transition-all ${
                allStockAvailable
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-zinc-950'
                  : 'bg-yellow-700/80 hover:bg-yellow-700 text-zinc-950'
              }`}
            >
              <Beer className="w-4 h-4" />
              Iniciar Batch de {targetVolume} L con esta Receta
            </Link>
          </div>
        </div>

        {/* Dynamic Scaling Calculator Controls */}
        <div className="mt-6 p-4 bg-yellow-950/40 rounded-xl border border-yellow-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-950 text-yellow-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-50">Calculadora Dinámica de Escalado</h3>
              <p className="text-[11px] text-zinc-400">
                La receta base está formulada para <strong>{recipe.baseVolumeLiters} Litros</strong>. Modifica el volumen deseado para ver los ingredientes exactos y disponibilidad de stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-300 whitespace-nowrap">
              Volumen del Lote:
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={targetVolume}
                onChange={(e) => setTargetVolume(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-24 px-3 py-1.5 text-sm font-bold text-zinc-50 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                L
              </span>
            </div>
            {/* Quick buttons */}
            <div className="flex gap-1">
              {[20, 40, 60, 100].map((liters) => (
                <button
                  key={liters}
                  onClick={() => setTargetVolume(liters)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded ${
                    targetVolume === liters
                      ? 'bg-yellow-500 text-zinc-950'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {liters}L
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stock status alert */}
        {!allStockAvailable && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>
              <strong>Atención:</strong> No hay suficiente materia prima en inventario para preparar un lote de <strong>{targetVolume} L</strong>. Revisa los ingredientes marcados en rojo a continuación.
            </span>
          </div>
        )}
      </div>

      {/* Bill of Materials by Stage */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-50 flex items-center gap-2">
          <span>Ingredientes Escalados para {targetVolume} Litros</span>
          <span className="text-xs font-normal text-zinc-400">
            (Factor de escala: {scalingFactor.toFixed(2)}x)
          </span>
        </h2>

        {Object.keys(itemsByStage).sort().map((stageStr) => {
          const stageNum = parseInt(stageStr, 10);
          const stageInfo = getStageByNumber(stageNum);
          const items = itemsByStage[stageNum];

          return (
            <div key={stageNum} className="bg-zinc-900 rounded-xl border border-zinc-700 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-yellow-500 text-zinc-950 text-xs font-bold flex items-center justify-center">
                    {stageNum}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-50">
                      {stageInfo ? stageInfo.name : `Etapa ${stageNum}`}
                    </h3>
                    <p className="text-[10px] text-zinc-400">{stageInfo?.description}</p>
                  </div>
                </div>
                {stageInfo && (
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Duración estimada: {stageInfo.durationDays} días
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-800/50 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-2.5">Materia Prima</th>
                      <th className="px-4 py-2.5 text-right">Cant. Base (20L)</th>
                      <th className="px-4 py-2.5 text-right">Cant. Requerida ({targetVolume}L)</th>
                      <th className="px-4 py-2.5 text-right">Stock Actual</th>
                      <th className="px-5 py-2.5 text-center">Disponibilidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {items.map((item) => {
                      const scaledQty = item.quantity * scalingFactor;
                      const hasEnough = item.rawMaterial.stock >= scaledQty;
                      const missing = scaledQty - item.rawMaterial.stock;

                      return (
                        <tr key={item.id} className="hover:bg-zinc-800/50">
                          <td className="px-5 py-3 font-medium text-zinc-50">
                            <div>{item.rawMaterial.name}</div>
                            {item.notes && (
                              <div className="text-[10px] text-zinc-500 font-normal">{item.notes}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-400">
                            {item.quantity} {item.rawMaterial.unit}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-zinc-50">
                            {scaledQty.toFixed(scaledQty % 1 === 0 ? 0 : 2)} {item.rawMaterial.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-400">
                            {item.rawMaterial.stock} {item.rawMaterial.unit}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {hasEnough ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Suficiente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertCircle className="w-3 h-3" /> Faltan {missing.toFixed(2)} {item.rawMaterial.unit}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
