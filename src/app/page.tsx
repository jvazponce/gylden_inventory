import prisma from '@/lib/prisma';
import Link from 'next/link';
import { 
  Boxes, 
  PackageCheck, 
  FlaskConical, 
  Beer, 
  Truck, 
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  Clock,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getStageByNumber } from '@/lib/batch-constants';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const now = new Date();
  
  // Start and end of today
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  // End of tomorrow (1 day ahead)
  const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

  const [
    rawMaterials,
    finishedGoods,
    recipesCount,
    activeBatches,
    shipments,
  ] = await Promise.all([
    prisma.rawMaterial.findMany(),
    prisma.finishedGood.findMany(),
    prisma.recipe.count(),
    prisma.batch.findMany({
      where: { status: 'IN_PROGRESS' },
      include: { recipe: true },
      orderBy: { stageTargetDate: 'asc' },
    }),
    prisma.shipment.findMany({
      include: {
        customer: true,
        items: { include: { finishedGood: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  // Calculations for KPI
  const rawMaterialsCount = rawMaterials.length;
  const lowStockMaterials = rawMaterials.filter((m) => m.stock <= m.minStock);
  const totalFinishedBottles = finishedGoods.reduce((sum, item) => sum + item.stock, 0);
  const totalInventoryValue = finishedGoods.reduce((sum, item) => sum + item.stock * item.unitPrice, 0);

  // Financial pending collection from shipments
  const totalReceivables = shipments.reduce(
    (sum, s) => sum + Math.max(0, s.totalExpected - s.totalPaid),
    0
  );
  const pendingOrdersToShip = shipments.filter(
    (s) => s.deliveryStatus === 'PENDING_SHIPMENT' || s.deliveryStatus === 'PENDING'
  ).length;
  const shipmentsInTransit = shipments.filter((s) => s.deliveryStatus === 'IN_TRANSIT').length;

  // Lotes que requieren cambio HOY (o atrasados)
  const batchesNeedChangeToday = activeBatches.filter((b) => {
    if (!b.stageTargetDate) return false;
    const target = new Date(b.stageTargetDate);
    return target <= endOfToday;
  });

  // Lotes que requieren cambio MAÑANA (1 día de antelación)
  const batchesNeedChangeTomorrow = activeBatches.filter((b) => {
    if (!b.stageTargetDate) return false;
    const target = new Date(b.stageTargetDate);
    return target > endOfToday && target <= endOfTomorrow;
  });

  return (
    <div className="space-y-8">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-medium mb-3">
            <Beer className="w-3.5 h-3.5" />
            <span>Sistema Operativo Gylden Meadery</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-amber-50">
            Control de Producción e Inventario
          </h1>
          <p className="mt-2 text-sm text-amber-200/90 leading-relaxed">
            Gestión artesanal de lotes, formulación de recetas, materias primas y logística de envíos en botellas de 330ml.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/batches/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-lg text-xs shadow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Lanzar Nuevo Batch
            </Link>
            <Link
              href="/shipments/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-xs border border-white/20 transition-all"
            >
              <Truck className="w-4 h-4" />
              Registrar Envío
            </Link>
            <Link
              href="/inventory/raw-materials"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-xs border border-white/20 transition-all"
            >
              <Boxes className="w-4 h-4" />
              Entrada de Insumos
            </Link>
          </div>
        </div>
      </div>

      {/* ALERT SECTION: Lotes que requieren cambio HOY y MAÑANA */}
      {(batchesNeedChangeToday.length > 0 || batchesNeedChangeTomorrow.length > 0) ? (
        <div className="bg-white rounded-2xl border border-amber-300 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-950">
                  Control de Fermentación: Lotes con Cambio de Etapa Próximo
                </h2>
                <p className="text-xs text-amber-800">
                  Monitoreo con 1 día de antelación para preparar adición de frutas, kegs de trasvase o insumos de empaque.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
              {batchesNeedChangeToday.length + batchesNeedChangeTomorrow.length} lote(s) en atención
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* HOY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  Requieren Cambio HOY ({batchesNeedChangeToday.length})
                </span>
                <span className="text-[10px] text-slate-400">Atención Inmediata</span>
              </div>

              {batchesNeedChangeToday.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
                  ✓ No hay lotes pendientes de cambio para el día de hoy.
                </p>
              ) : (
                batchesNeedChangeToday.map((batch) => {
                  const currentStageDef = getStageByNumber(batch.currentStage);
                  const nextStageDef = getStageByNumber(batch.currentStage + 1);

                  return (
                    <div
                      key={batch.id}
                      className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-rose-200">
                            {batch.batchNumber}
                          </span>
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            Hoy &bull; {formatDate(batch.stageTargetDate)}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1.5">{batch.recipe.name}</h4>
                        <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                          <span className="font-medium text-slate-800">{currentStageDef?.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          <span className="font-bold text-rose-900">{nextStageDef?.name || 'Embotellado'}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-rose-200/60 flex justify-end">
                        <Link
                          href={`/batches/${batch.id}`}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                        >
                          Avanzar Etapa Ahora &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* MAÑANA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Requieren Cambio MAÑANA ({batchesNeedChangeTomorrow.length})
                </span>
                <span className="text-[10px] text-slate-400">1 Día de Antelación</span>
              </div>

              {batchesNeedChangeTomorrow.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
                  No hay lotes programados para cambio mañana.
                </p>
              ) : (
                batchesNeedChangeTomorrow.map((batch) => {
                  const currentStageDef = getStageByNumber(batch.currentStage);
                  const nextStageDef = getStageByNumber(batch.currentStage + 1);

                  return (
                    <div
                      key={batch.id}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-amber-200">
                            {batch.batchNumber}
                          </span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            Mañana &bull; {formatDate(batch.stageTargetDate)}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1.5">{batch.recipe.name}</h4>
                        <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                          <span className="font-medium text-slate-800">{currentStageDef?.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span className="font-bold text-amber-950">{nextStageDef?.name || 'Embotellado'}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between">
                        <span className="text-[11px] text-amber-800">
                          Preparar insumos y sanitizado
                        </span>
                        <Link
                          href={`/batches/${batch.id}`}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                        >
                          Ver Detalle &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900">Todos los lotes en fermentación al día</h4>
              <p className="text-[11px] text-emerald-700">
                No hay lotes que requieran transición de etapa hoy ni mañana.
              </p>
            </div>
          </div>
          <Link
            href="/batches"
            className="text-xs font-bold text-emerald-900 hover:underline"
          >
            Ver batches activos &rarr;
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Producto Terminado */}
        <Link
          href="/inventory/finished-goods"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stock Terminado</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {totalFinishedBottles} <span className="text-sm font-normal text-slate-500">botellas</span>
            </div>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">
              Valor: {formatCurrency(totalInventoryValue)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-emerald-700">
            <span>Ver botellas disponibles</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Batches en Fermentación */}
        <Link
          href="/batches"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">En Fermentador</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Beer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {activeBatches.length} <span className="text-sm font-normal text-slate-500">lotes activos</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {batchesNeedChangeToday.length > 0 ? (
                <span className="text-rose-600 font-semibold">{batchesNeedChangeToday.length} requieren cambio hoy</span>
              ) : (
                'Trazabilidad en tiempo real'
              )}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-amber-700">
            <span>Ver línea de producción</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Materia Prima */}
        <Link
          href="/inventory/raw-materials"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Materia Prima</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{rawMaterialsCount} <span className="text-sm font-normal text-slate-500">insumos</span></div>
            <p className="text-xs mt-0.5">
              {lowStockMaterials.length > 0 ? (
                <span className="text-rose-600 font-semibold">{lowStockMaterials.length} con stock bajo</span>
              ) : (
                <span className="text-slate-500">Niveles de stock óptimos</span>
              )}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-indigo-700">
            <span>Gestionar insumos</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Cuentas por Cobrar / Envíos */}
        <Link
          href="/shipments"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Por Cobrar</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalReceivables)}</div>
            <p className="text-xs text-slate-500 mt-0.5">
              {pendingOrdersToShip > 0 ? (
                <span className="text-amber-800 font-semibold">{pendingOrdersToShip} pedido(s) por enviar</span>
              ) : (
                `${shipmentsInTransit} envío(s) en tránsito`
              )}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-amber-800">
            <span>Ver despachos y cobros</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Main Sections: Stock Breakdown & Recent Shipments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock de Producto Terminado */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Stock Disponible de Hidromiel (330ml)</h3>
              <p className="text-xs text-slate-500">Inventario disponible para despacho inmediato</p>
            </div>
            <Link
              href="/inventory/finished-goods"
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              Ver todo &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {finishedGoods.map((fg) => (
              <div key={fg.id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{fg.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{fg.style || 'Hidromiel'}</span>
                    <span>&bull;</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(fg.unitPrice)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                    fg.stock > 24
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {fg.stock} botellas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos Envíos Registrados */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Últimos Envíos / Despachos</h3>
              <p className="text-xs text-slate-500">Estado de entrega y cobranza de pedidos recientes</p>
            </div>
            <Link
              href="/shipments"
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              Ver todos &rarr;
            </Link>
          </div>

          {shipments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No se han registrado envíos aún.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {shipments.map((s) => {
                const pendingBalance = Math.max(0, s.totalExpected - s.totalPaid);
                return (
                  <div key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                          {s.shipmentNumber}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{s.customer.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatDate(s.shipmentDate)} &bull; {s.items.reduce((acc, it) => acc + it.quantity, 0)} botellas
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {formatCurrency(s.totalExpected)}
                      </div>
                      <span className={`inline-block text-[10px] font-semibold mt-0.5 ${
                        s.deliveryStatus === 'DELIVERED' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {s.deliveryStatus === 'DELIVERED' ? '✓ Entregado' : '● En camino'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
