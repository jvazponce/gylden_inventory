'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  AlertCircle,
  MapPin,
  ClipboardList,
  Package,
  Send
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { markShipmentDeliveredAction, dispatchShipmentAction } from '@/app/actions/shipments';
import RegisterPaymentModal from './RegisterPaymentModal';

interface ShipmentItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  finishedGood: {
    id: string;
    name: string;
  };
}

interface Shipment {
  id: string;
  shipmentNumber: string;
  shipmentDate: Date | string;
  deliveryStatus: string;
  deliveredAt: Date | string | null;
  totalExpected: number;
  totalPaid: number;
  paymentStatus: string;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    address: string | null;
  };
  items: ShipmentItem[];
}

export default function ShipmentsListClient({
  shipments,
}: {
  shipments: Shipment[];
}) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING_SHIPMENT' | 'IN_TRANSIT' | 'DELIVERED' | 'UNPAID'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModalShipment, setPaymentModalShipment] = useState<{
    id: string;
    shipmentNumber: string;
    customerName: string;
    totalExpected: number;
    totalPaid: number;
  } | null>(null);

  const pendingShipmentCount = shipments.filter(
    (s) => s.deliveryStatus === 'PENDING_SHIPMENT' || s.deliveryStatus === 'PENDING'
  ).length;

  const inTransitCount = shipments.filter((s) => s.deliveryStatus === 'IN_TRANSIT').length;
  const deliveredCount = shipments.filter((s) => s.deliveryStatus === 'DELIVERED').length;

  const totalPendingBalance = shipments.reduce(
    (acc, s) => acc + Math.max(0, s.totalExpected - s.totalPaid),
    0
  );

  const filtered = shipments.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.shipmentNumber.toLowerCase().includes(q) ||
      s.customer.name.toLowerCase().includes(q) ||
      (s.customer.address && s.customer.address.toLowerCase().includes(q));

    let matchesFilter = true;
    if (filter === 'PENDING_SHIPMENT') {
      matchesFilter = s.deliveryStatus === 'PENDING_SHIPMENT' || s.deliveryStatus === 'PENDING';
    } else if (filter === 'IN_TRANSIT') {
      matchesFilter = s.deliveryStatus === 'IN_TRANSIT';
    } else if (filter === 'DELIVERED') {
      matchesFilter = s.deliveryStatus === 'DELIVERED';
    } else if (filter === 'UNPAID') {
      matchesFilter = s.totalPaid < s.totalExpected;
    }

    return matchesSearch && matchesFilter;
  });

  async function handleDispatch(shipmentId: string) {
    if (confirm('¿Confirmas que este pedido ha salido de bodega y va en camino al cliente?')) {
      await dispatchShipmentAction(shipmentId);
    }
  }

  async function handleMarkDelivered(shipmentId: string) {
    if (confirm('¿Confirmas que este pedido ha sido entregado al cliente?')) {
      await markShipmentDeliveredAction(shipmentId);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" />
            Pedidos y Envíos a Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de pedidos pendientes por enviar, despachos en tránsito, entregas y cobros.
          </p>
        </div>

        <div>
          <Link
            href="/shipments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Pedido / Envío
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Pedidos Pendientes por Despachar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Por Despachar</span>
            <div className="text-2xl font-bold text-amber-900 mt-1">
              {pendingShipmentCount} <span className="text-sm font-normal text-slate-500">pedidos</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Pedidos hechos por enviar</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* En Tránsito */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">En Reparto</span>
            <div className="text-2xl font-bold text-sky-800 mt-1">
              {inTransitCount} <span className="text-sm font-normal text-slate-500">en camino</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Despachos activos</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Entregados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Entregados</span>
            <div className="text-2xl font-bold text-emerald-800 mt-1">
              {deliveredCount} <span className="text-sm font-normal text-slate-500">completados</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Pedidos recibidos</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Por Cobrar</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalPendingBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Saldo pendiente total</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, cliente o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { id: 'ALL', label: 'Todos los Registros' },
            { id: 'PENDING_SHIPMENT', label: `Pedidos por Enviar (${pendingShipmentCount})` },
            { id: 'IN_TRANSIT', label: `En Camino (${inTransitCount})` },
            { id: 'DELIVERED', label: 'Entregados' },
            { id: 'UNPAID', label: 'Con Saldo Pendiente' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Código / Cliente</th>
                <th className="px-4 py-3.5">Fecha</th>
                <th className="px-4 py-3.5">Sabores y Botellas</th>
                <th className="px-4 py-3.5 text-center">Estado del Pedido</th>
                <th className="px-4 py-3.5 text-right">Cobranza</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No se encontraron pedidos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isPendingShipment = s.deliveryStatus === 'PENDING_SHIPMENT' || s.deliveryStatus === 'PENDING';
                  const isInTransit = s.deliveryStatus === 'IN_TRANSIT';
                  const isDelivered = s.deliveryStatus === 'DELIVERED';
                  const pendingBalance = Math.max(0, s.totalExpected - s.totalPaid);
                  const isPaid = pendingBalance === 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {s.shipmentNumber}
                        </span>
                        <div className="font-bold text-slate-900 mt-1">{s.customer.name}</div>
                        {s.customer.address && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 max-w-xs truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                            <span>{s.customer.address}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                        {formatDate(s.shipmentDate)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {s.items.map((it) => (
                            <div key={it.id} className="text-slate-800 text-[11px]">
                              <strong>{it.quantity}x</strong> {it.finishedGood.name}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {isPendingShipment && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" /> Pedido Pendiente (Por Enviar)
                          </span>
                        )}
                        {isInTransit && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-300">
                            <Truck className="w-3 h-3 text-sky-600" /> En Reparto / Despachado
                          </span>
                        )}
                        {isDelivered && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Entregado al Cliente
                          </span>
                        )}
                      </td>

                      {/* Financial */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(s.totalExpected)}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {isPaid ? (
                            <span className="text-emerald-700 font-semibold">● Liquidado</span>
                          ) : (
                            <span className="text-amber-800 font-semibold">
                              Resta: {formatCurrency(pendingBalance)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPendingShipment && (
                            <button
                              onClick={() => handleDispatch(s.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
                            >
                              <Send className="w-3 h-3 text-sky-600" />
                              Despachar
                            </button>
                          )}

                          {isInTransit && (
                            <button
                              onClick={() => handleMarkDelivered(s.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Marcar Entregado
                            </button>
                          )}

                          {!isPaid && (
                            <button
                              onClick={() =>
                                setPaymentModalShipment({
                                  id: s.id,
                                  shipmentNumber: s.shipmentNumber,
                                  customerName: s.customer.name,
                                  totalExpected: s.totalExpected,
                                  totalPaid: s.totalPaid,
                                })
                              }
                              className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                            >
                              Abonar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Pago */}
      <RegisterPaymentModal
        shipment={paymentModalShipment}
        isOpen={!!paymentModalShipment}
        onClose={() => setPaymentModalShipment(null)}
      />
    </div>
  );
}
