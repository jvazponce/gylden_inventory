'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  FlaskConical, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { createRecipeAction } from '@/app/actions/recipes';
import { PRODUCTION_STAGES } from '@/lib/batch-constants';

interface MaterialOption {
  id: string;
  name: string;
  unit: string;
  category: string;
}

interface ItemRow {
  rawMaterialId: string;
  quantity: number;
  stage: number;
  notes: string;
}

export default function RecipeFormClient({
  materials,
}: {
  materials: MaterialOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseVolumeLiters, setBaseVolumeLiters] = useState(20);
  const [estimatedDays, setEstimatedDays] = useState(19);
  const [items, setItems] = useState<ItemRow[]>([
    { rawMaterialId: materials[0]?.id || '', quantity: 6, stage: 1, notes: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addItemRow() {
    setItems((prev) => [
      ...prev,
      { rawMaterialId: materials[0]?.id || '', quantity: 1, stage: 1, notes: '' },
    ]);
  }

  function removeItemRow(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof ItemRow, value: any) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor ingresa un nombre para la receta.');
      return;
    }

    if (items.some((it) => !it.rawMaterialId || it.quantity <= 0)) {
      setError('Cada ingrediente debe tener una materia prima seleccionada y cantidad mayor a cero.');
      return;
    }

    setIsSubmitting(true);
    const res = await createRecipeAction({
      name,
      description,
      baseVolumeLiters,
      estimatedDays,
      items,
    });
    setIsSubmitting(false);

    if (res.success && res.recipeId) {
      router.push(`/recipes/${res.recipeId}`);
    } else {
      setError(res.error || 'Ocurrió un error al guardar la receta.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Recetas
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Crear Nueva Receta de Hidromiel</h1>
            <p className="text-xs text-slate-500">
              Configura los ingredientes para un lote base de 20 L y asigna la etapa en que se añaden.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* General info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de la Receta *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Hidromiel Especiada de Invierno (Metheglin)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Volumen Base Estándar (L) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={baseVolumeLiters}
                onChange={(e) => setBaseVolumeLiters(parseFloat(e.target.value) || 20)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción / Notas de Fermentación
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas sobre el perfil de sabor, tipo de miel recomendada, temperatura de fermentación..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Bill of materials table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ingredientes de la Receta (BOM)</h3>
                <p className="text-[11px] text-slate-500">
                  Cantidades calculadas para los {baseVolumeLiters} Litros base.
                </p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir Ingrediente
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Materia Prima</th>
                      <th className="px-3 py-2.5 w-32">Cantidad</th>
                      <th className="px-3 py-2.5 w-52">Etapa de Incorporación</th>
                      <th className="px-3 py-2.5">Instrucciones / Notas</th>
                      <th className="px-2 py-2.5 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((row, idx) => {
                      const selectedMat = materials.find((m) => m.id === row.rawMaterialId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2">
                            <select
                              value={row.rawMaterialId}
                              onChange={(e) => updateItem(idx, 'rawMaterialId', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-amber-500 bg-white"
                            >
                              {materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.unit})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="any"
                                min="0.001"
                                required
                                value={row.quantity}
                                onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1.5 text-xs font-medium border border-slate-200 rounded-md focus:ring-1 focus:ring-amber-500"
                              />
                              <span className="text-[11px] text-slate-500 font-mono">
                                {selectedMat?.unit}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={row.stage}
                              onChange={(e) => updateItem(idx, 'stage', parseInt(e.target.value, 10))}
                              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-amber-500 bg-white"
                            >
                              {PRODUCTION_STAGES.map((stg) => (
                                <option key={stg.number} value={stg.number}>
                                  Etapa {stg.number}: {stg.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.notes}
                              onChange={(e) => updateItem(idx, 'notes', e.target.value)}
                              placeholder="Ej. Agregar frío, macerar..."
                              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              disabled={items.length <= 1}
                              className="text-slate-400 hover:text-rose-600 p-1 disabled:opacity-20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/recipes"
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar Receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
