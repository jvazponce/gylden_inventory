'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Beer, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Sparkles,
  Info
} from 'lucide-react';
import { createBatchAction } from '@/app/actions/batches';
import { PRODUCTION_STAGES } from '@/lib/batch-constants';

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  stock: number;
}

interface RecipeItem {
  id: string;
  quantity: number;
  stage: number;
  rawMaterial: RawMaterial;
}

interface RecipeOption {
  id: string;
  name: string;
  baseVolumeLiters: number;
  estimatedDays: number;
  items: RecipeItem[];
}

export default function NewBatchClient({
  recipes,
  suggestedBatchNumber,
}: {
  recipes: RecipeOption[];
  suggestedBatchNumber: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRecipeId = searchParams.get('recipeId') || recipes[0]?.id || '';
  const defaultVolume = parseFloat(searchParams.get('volume') || '20');

  const [recipeId, setRecipeId] = useState(defaultRecipeId);
  const [volumeLiters, setVolumeLiters] = useState(defaultVolume);
  const [batchNumber, setBatchNumber] = useState(suggestedBatchNumber);
  const [densityOG, setDensityOG] = useState('1.110');
  const [temperature, setTemperature] = useState('18');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRecipe = recipes.find((r) => r.id === recipeId) || recipes[0];
  const scale = selectedRecipe ? volumeLiters / (selectedRecipe.baseVolumeLiters || 20) : 1;

  // Check inventory stock sufficiency
  const stockIssues: { material: string; required: number; stock: number; unit: string }[] = [];
  if (selectedRecipe) {
    selectedRecipe.items.forEach((item) => {
      const needed = item.quantity * scale;
      if (item.rawMaterial.stock < needed) {
        stockIssues.push({
          material: item.rawMaterial.name,
          required: needed,
          stock: item.rawMaterial.stock,
          unit: item.rawMaterial.unit,
        });
      }
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (stockIssues.length > 0) {
      setError('No hay suficiente materia prima en stock para este volumen de lote.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await createBatchAction(formData);
    setIsSubmitting(false);

    if (res.success && res.batchId) {
      router.push(`/batches/${res.batchId}`);
    } else {
      setError(res.error || 'Ocurrió un error al lanzar el lote.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/batches"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Batches
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Beer className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Iniciar Nuevo Lote de Producción</h1>
            <p className="text-xs text-slate-500">
              Al confirmar, el sistema descontará automáticamente las materias primas del inventario e iniciará la Etapa 1.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Receta */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receta a Elaborar *
              </label>
              <select
                name="recipeId"
                value={recipeId}
                onChange={(e) => setRecipeId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Base {r.baseVolumeLiters}L)
                  </option>
                ))}
              </select>
            </div>

            {/* Código de lote */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código de Lote *
              </label>
              <input
                type="text"
                name="batchNumber"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Volumen del lote */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Volumen Objetivo (Litros) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="volumeLiters"
                  required
                  min="1"
                  step="1"
                  value={volumeLiters}
                  onChange={(e) => setVolumeLiters(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  L
                </span>
              </div>
            </div>

            {/* Lectura inicial de densidad */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Densidad Inicial (OG / Gravedad)
              </label>
              <input
                type="number"
                step="0.001"
                name="densityOG"
                value={densityOG}
                onChange={(e) => setDensityOG(e.target.value)}
                placeholder="1.110"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Temperatura */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Temperatura de Inoculación (°C)
              </label>
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="18"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observaciones / Notas Iniciales
            </label>
            <input
              type="text"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Levadura hidratada con Go-Ferm a 35°C por 20 min..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Materias primas a descontar */}
          {selectedRecipe && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>Materias Primas que se descontarán del inventario:</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Escalado para {volumeLiters} Litros
                </span>
              </h3>

              <div className="divide-y divide-slate-200 text-xs">
                {selectedRecipe.items.map((item) => {
                  const needed = item.quantity * scale;
                  const hasStock = item.rawMaterial.stock >= needed;

                  return (
                    <div key={item.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{item.rawMaterial.name}</span>
                        <span className="text-[10px] text-slate-400">
                          (Etapa {item.stage})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">
                          {needed.toFixed(needed % 1 === 0 ? 0 : 2)} {item.rawMaterial.unit}
                        </span>
                        {hasStock ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Stock OK ({item.rawMaterial.stock} disp.)
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Insuficiente (hay {item.rawMaterial.stock})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline preview */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80">
            <h4 className="text-xs font-bold text-amber-950 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-700" />
              Línea de Tiempo Estimada del Lote
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              <div>
                <strong>Etapa 1:</strong> Base y 1ra fermentación (~7 días) &rarr; cambio estimado en <strong>7 días</strong>.
              </div>
              <div>
                <strong>Embotellado estimado:</strong> en ~20 días totales.
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/batches"
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || stockIssues.length > 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-all"
            >
              <Beer className="w-4 h-4" />
              {isSubmitting ? 'Iniciando lote...' : 'Confirmar e Iniciar Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
