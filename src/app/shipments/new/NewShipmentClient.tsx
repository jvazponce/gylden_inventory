'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Truck, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  AlertCircle, 
  DollarSign, 
  PackageCheck,
  CheckCircle2,
  Calendar,
  Clock,
  ClipboardList
} from 'lucide-react';
import { createShipmentAction, CreateShipmentItemInput } from '@/app/actions/shipments';
import { formatCurrency } from '@/lib/utils';

interface CustomerOption {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface FinishedGoodOption {
  id: string;
  name: string;
  format: string;
  stock: number;
  unitPrice: number;
}

interface ShipmentItemRow {
  finishedGoodId: string;
  quantity: number;
  unitPrice: number;
}

export default function NewShipmentClient({
  customers,
  finishedGoods,
  suggestedShipmentNumber,
}: {
  customers: CustomerOption[];
  finishedGoods: FinishedGoodOption[];
  suggestedShipmentNumber: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCustomerId = searchParams.get('customerId') || customers[0]?.id || '';

  const [customerId, setCustomerId] = useState(defaultCustomerId);
  const [shipmentNumber, setShipmentNumber] = useState(suggestedShipmentNumber);
  const [shipmentDate, setShipmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryStatus, setDeliveryStatus] = useState<'PENDING_SHIPMENT' | 'IN_TRANSIT' | 'DELIVERED'>('PENDING_SHIPMENT');
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<ShipmentItemRow[]>([
    {
      finishedGoodId: finishedGoods[0]?.id || '',
      quantity: 12,
      unitPrice: finishedGoods[0]?.unitPrice || 4.5,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Calculations
  const totalExpected = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice || 0), 0);
  const balancePending = Math.max(0, totalExpected - totalPaid);

  // Check inventory stock sufficiency
  const stockErrors: string[] = [];
  items.forEach((it) => {
    const fg = finishedGoods.find((f) => f.id === it.finishedGoodId);
    if (fg && it.quantity > fg.stock) {
      stockErrors.push(`Stock insuficiente para ${fg.name}. Solicitado: ${it.quantity}, Disponible: ${fg.stock}.`);
    }
  });

  function addItemRow() {
    const firstFg = finishedGoods[0];
    setItems((prev) => [
      ...prev,
      {
        finishedGoodId: firstFg?.id || '',
        quantity: 12,
        unitPrice: firstFg?.unitPrice || 4.5,
      },
    ]);
  }

  function removeItemRow(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof ShipmentItemRow, value: any) {
    setItems((prev) => {
      const copy = [...prev];
      if (field === 'finishedGoodId') {
        const found = finishedGoods.find((f) => f.id === value);
        copy[index] = {
          ...copy[index],
          finishedGoodId: value,
          unitPrice: found ? found.unitPrice : copy[index].unitPrice,
        };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Debes seleccionar un cliente.');
      return;
    }

    if (stockErrors.length > 0) {
      setError('Hay productos que superan el stock disponible.');
      return;
    }

    if (items.some((it) => it.quantity <= 0)) {
      setError('Las cantidades deben ser mayores a cero.');
      return;
    }

    setIsSubmitting(true);
    const res = await createShipmentAction({
      customerId,
      shipmentNumber,
      shipmentDate,
      deliveryStatus,
      totalPaid,
      notes,
      items: items.map((it) => ({
        finishedGoodId: it.finishedGoodId,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      })),
    });
    setIsSubmitting(false);

    if (res.success) {
      router.push('/shipments');
    } else {
      setError(res.error || 'Error al registrar el pedido / envío.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/shipments"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Pedidos y Envíos
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Registrar Nuevo Pedido / Envío</h1>
            <p className="text-xs text-slate-500">
              Registra pedidos pendientes solicitados por clientes o despachos listos para reparto.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {stockErrors.length > 0 && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl space-y-1">
            {stockErrors.map((err, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Selector de Estado Inicial: Pedido Pendiente vs Envío Inmediato */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tipo de Registro *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                deliveryStatus === 'PENDING_SHIPMENT'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Pedido Pendiente
                  </span>
                  <input
                    type="radio"
                    name="deliveryStatus"
                    value="PENDING_SHIPMENT"
                    checked={deliveryStatus === 'PENDING_SHIPMENT'}
                    onChange={() => setDeliveryStatus('PENDING_SHIPMENT')}
                    className="text-amber-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nos hicieron el pedido. Queda guardado como pendiente por enviar.
                </p>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                deliveryStatus === 'IN_TRANSIT'
                  ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-400/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-sky-600" />
                    En Tránsito / Despachado
                  </span>
                  <input
                    type="radio"
                    name="deliveryStatus"
                    value="IN_TRANSIT"
                    checked={deliveryStatus === 'IN_TRANSIT'}
                    onChange={() => setDeliveryStatus('IN_TRANSIT')}
                    className="text-sky-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  El pedido ya salió de bodega y va en camino al cliente.
                </p>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                deliveryStatus === 'DELIVERED'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Ya Entregado
                  </span>
                  <input
                    type="radio"
                    name="deliveryStatus"
                    value="DELIVERED"
                    checked={deliveryStatus === 'DELIVERED'}
                    onChange={() => setDeliveryStatus('DELIVERED')}
                    className="text-emerald-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Venta completada y entregada al cliente.
                </p>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cliente */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente / Punto de Entrega *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.address ? `— ${c.address}` : ''}
                  </option>
                ))}
              </select>
              {selectedCustomer?.address && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Dirección: <strong>{selectedCustomer.address}</strong>
                </p>
              )}
            </div>

            {/* Código / Folio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código del Pedido / Envío *
              </label>
              <input
                type="text"
                required
                value={shipmentNumber}
                onChange={(e) => setShipmentNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha del Pedido / Envío *
              </label>
              <input
                type="date"
                required
                value={shipmentDate}
                onChange={(e) => setShipmentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Items a enviar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sabores y Botellas Solicitadas</h3>
                <p className="text-[11px] text-slate-500">
                  Selecciona la cantidad de botellas de 330ml para cada sabor.
                </p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir Sabor
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Sabor / Producto</th>
                    <th className="px-3 py-2.5 w-28 text-right">Stock Disp.</th>
                    <th className="px-3 py-2.5 w-28">Cant. Botellas</th>
                    <th className="px-3 py-2.5 w-28 text-right">Precio Unit.</th>
                    <th className="px-3 py-2.5 w-28 text-right">Subtotal</th>
                    <th className="px-2 py-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row, idx) => {
                    const selectedFg = finishedGoods.find((f) => f.id === row.finishedGoodId);
                    const isInsufficient = selectedFg && row.quantity > selectedFg.stock;
                    const subtotal = row.quantity * row.unitPrice;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2">
                          <select
                            value={row.finishedGoodId}
                            onChange={(e) => updateItem(idx, 'finishedGoodId', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-amber-500 bg-white"
                          >
                            {finishedGoods.map((fg) => (
                              <option key={fg.id} value={fg.id}>
                                {fg.name} ({fg.stock} disp.)
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`font-semibold ${isInsufficient ? 'text-rose-600' : 'text-slate-700'}`}>
                            {selectedFg?.stock || 0}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            required
                            value={row.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 0)}
                            className={`w-full px-2 py-1.5 text-xs font-bold border rounded-md focus:ring-1 focus:ring-amber-500 ${
                              isInsufficient ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-200'
                            }`}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={row.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1.5 text-xs font-medium border border-slate-200 rounded-md focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
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
          </div>

          {/* Control Financiero y Cobranza */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Control de Cobranza y Pago del Pedido
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total a Recibir</span>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatCurrency(totalExpected)}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <label className="text-[10px] uppercase font-semibold text-emerald-700 block mb-0.5">
                  Monto Ya Pagado / Anticipo ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalPaid}
                  onChange={(e) => setTotalPaid(parseFloat(e.target.value) || 0)}
                  className="w-full text-lg font-bold text-emerald-800 border-b border-emerald-300 focus:outline-none focus:border-emerald-600 bg-transparent py-0.5"
                />
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Saldo Pendiente</span>
                <div className={`text-xl font-bold mt-0.5 ${balancePending > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {formatCurrency(balancePending)}
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas / Instrucciones del Pedido
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Pedido programado para entrega el viernes, cobrar en efectivo..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/shipments"
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || stockErrors.length > 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-all"
            >
              <Truck className="w-4 h-4" />
              {isSubmitting
                ? 'Guardando...'
                : deliveryStatus === 'PENDING_SHIPMENT'
                ? 'Guardar Pedido Pendiente'
                : 'Crear y Despachar Envío'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
