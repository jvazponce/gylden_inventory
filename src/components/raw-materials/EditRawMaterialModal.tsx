'use client';

import { useState } from 'react';
import { updateRawMaterialAction } from '@/app/actions/raw-materials';
import { Edit3, X, AlertCircle } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number | null;
}

export default function EditRawMaterialModal({
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

  if (!isOpen || !material) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('id', material!.id);

    const res = await updateRawMaterialAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Error al actualizar la materia prima.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-zinc-900 rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-zinc-700">
        <div className="px-5 py-4 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-yellow-950 text-yellow-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100">Editar Materia Prima</h3>
              <p className="text-[11px] text-zinc-400 font-mono">{material.name}</p>
            </div>
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
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nombre de la Materia Prima *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={material.name}
              className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Categoría *
              </label>
              <select
                name="category"
                required
                defaultValue={material.category}
                className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
              >
                <option value="HONEY">Miel</option>
                <option value="YEAST">Levadura</option>
                <option value="NUTRIENT">Nutriente</option>
                <option value="FRUIT">Fruta / Melomel</option>
                <option value="WATER">Agua</option>
                <option value="PACKAGING">Empaque (Botellas, Chapas, Etiquetas)</option>
                <option value="OTHER">Otro Insumo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Unidad de Medida *
              </label>
              <select
                name="unit"
                required
                defaultValue={material.unit}
                className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="L">Litros (L)</option>
                <option value="units">Unidades (u)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Precio / Costo Unitario ($ por {material.unit}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="costPerUnit"
                required
                defaultValue={material.costPerUnit || 0}
                className="w-full px-3 py-2 text-sm font-bold text-zinc-50 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Stock Mínimo (Alerta de Seguridad) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                name="minStock"
                required
                defaultValue={material.minStock}
                className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100"
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-400 flex justify-between items-center">
            <span>Stock actual en bodega:</span>
            <span className="font-bold text-zinc-50">{material.stock} {material.unit}</span>
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
              className="px-5 py-2 text-xs font-bold text-white bg-yellow-500 hover:bg-yellow-400 text-zinc-950 rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando cambios...' : 'Actualizar Insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
