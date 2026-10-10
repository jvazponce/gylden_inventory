'use client';

import { useState } from 'react';
import { registerShipmentPaymentAction } from '@/app/actions/shipments';
import { DollarSign, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Shipment {
  id: string;
  shipmentNumber: string;
  customerName: string;
  totalExpected: number;
  totalPaid: number;
}

export default function RegisterPaymentModal({
  shipment,
  isOpen,
  onClose,
}: {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !shipment) return null;

  const pending = Math.max(0, shipment.totalExpected - shipment.totalPaid);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('shipmentId', shipment!.id);

    const res = await registerShipmentPaymentAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Error al registrar el pago.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-zinc-900 rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-zinc-700">
        <div className="px-5 py-4 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-zinc-100">Registrar Cobro / Abono</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {shipment.shipmentNumber} &bull; {shipment.customerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-3 bg-zinc-800 rounded-xl border border-zinc-700 space-y-1 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Total del pedido:</span>
              <span className="font-bold text-zinc-100">{formatCurrency(shipment.totalExpected)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Ya pagado:</span>
              <span className="font-bold text-emerald-700">{formatCurrency(shipment.totalPaid)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-700 pt-1 font-bold text-zinc-50">
              <span>Saldo pendiente:</span>
              <span className="text-yellow-400">{formatCurrency(pending)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Monto a Abonar ($) *
            </label>
            <input
              type="number"
              step="0.01"
              name="amount"
              min="0.01"
              max={pending}
              defaultValue={pending}
              required
              className="w-full px-3 py-2 text-base font-bold text-zinc-50 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-800 text-zinc-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar Cobro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
