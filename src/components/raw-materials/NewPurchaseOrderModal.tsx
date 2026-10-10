'use client';

import { useState } from 'react';
import { createPurchaseOrderAction, PurchaseOrderItemInput } from '@/app/actions/purchase-orders';
import { ShoppingCart, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useRole } from '@/context/RoleContext';

interface MaterialOption {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number | null;
}

interface OrderItemRow {
  rawMaterialId: string;
  quantity: number;
}

export default function NewPurchaseOrderModal({
  materials,
  isOpen,
  onClose,
}: {
  materials: MaterialOption[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const { roleName } = useRole();
  const [items, setItems] = useState<OrderItemRow[]>([
    { rawMaterialId: materials[0]?.id || '', quantity: 10 },
  ]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function addItemRow() {
    setItems((prev) => [
      ...prev,
      { rawMaterialId: materials[0]?.id || '', quantity: 5 },
    ]);
  }

  function removeItemRow(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItemRow, value: any) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  const estimatedTotal = items.reduce((sum, it) => {
    const mat = materials.find((m) => m.id === it.rawMaterialId);
    return sum + (it.quantity * (mat?.costPerUnit || 0));
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.some((it) => !it.rawMaterialId || it.quantity <= 0)) {
      setError('Todos los insumos solicitados deben tener una cantidad mayor a cero.');
      return;
    }

    setIsSubmitting(true);
    const orderItems: PurchaseOrderItemInput[] = items.map((it) => {
      const mat = materials.find((m) => m.id === it.rawMaterialId);
      return {
        rawMaterialId: it.rawMaterialId,
        quantity: Number(it.quantity),
        estimatedCost: it.quantity * (mat?.costPerUnit || 0),
      };
    });

    const res = await createPurchaseOrderAction({
      requestedBy: roleName || 'Producción',
      notes,
      items: orderItems,
    });
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Error al enviar la solicitud de compra.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-950">Solicitar Orden de Compra de Insumos</h3>
              <p className="text-xs text-amber-800">
                Petición del productor al administrador para autorizar y adquirir materias primas.
              </p>
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
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Materias Primas Necesarias *
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs text-amber-800 font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir otro insumo
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2">Materia Prima</th>
                    <th className="px-3 py-2 w-28 text-right">Stock Actual</th>
                    <th className="px-3 py-2 w-32">Cant. Solicitada</th>
                    <th className="px-3 py-2 w-28 text-right">Costo Est.</th>
                    <th className="px-2 py-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row, idx) => {
                    const selectedMat = materials.find((m) => m.id === row.rawMaterialId);
                    const subtotal = row.quantity * (selectedMat?.costPerUnit || 0);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2">
                          <select
                            value={row.rawMaterialId}
                            onChange={(e) => updateItem(idx, 'rawMaterialId', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-amber-500 bg-white"
                          >
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.unit})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-500">
                          {selectedMat?.stock} {selectedMat?.unit}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              required
                              value={row.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-xs font-bold border border-slate-200 rounded-md focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="text-[10px] text-slate-400 font-mono">
                              {selectedMat?.unit}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">
                          {formatCurrency(subtotal)}
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

            <div className="mt-2 text-right text-xs text-slate-600">
              Total estimado de la orden: <strong className="text-slate-900">{formatCurrency(estimatedTotal)}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo o Justificación del Pedido
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Para elaborar lote especial de temporada de 60L la próxima semana..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
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
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud al Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
