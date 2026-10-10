import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
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
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-zinc-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span>Gylden Brewing Co. &bull; Sistema Operativo</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-50 flex flex-wrap items-baseline gap-3">
              <span className="font-brand font-black text-4xl sm:text-6xl text-yellow-400 tracking-widest drop-shadow-[0_2px_14px_rgba(234,179,8,0.4)]">
                GYLDEN
              </span>
              <span className="text-xl sm:text-2xl font-light text-zinc-300 tracking-normal">
                Brewing Co.
              </span>
            </h1>

            <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
              Gestión artesanal de lotes, fermentación en 6 etapas, recetas maestras, stock de botellas de 330ml y distribución.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/batches/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-lg text-xs shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Lanzar Nuevo Batch
              </Link>
              <Link
                href="/shipments/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg text-xs border border-zinc-700 transition-all"
              >
                <Truck className="w-4 h-4" />
                Registrar Envío
              </Link>
              <Link
                href="/inventory/raw-materials"
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg text-xs border border-zinc-700 transition-all"
              >
                <Boxes className="w-4 h-4" />
                Entrada de Insumos
              </Link>
            </div>
          </div>

          {/* Logo Shield Hero Display */}
          <div className="flex-shrink-0 flex items-center justify-center md:pr-4">
            <div className="relative flex items-center justify-center">
              {/* Soft centered circular ambient halo */}
              <div className="absolute w-36 h-36 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative w-36 h-44 sm:w-44 sm:h-52">
                <Image
                  src="/logo.png"
                  alt="Gylden Brewing Co."
                  fill
                  className="object-contain drop-shadow-[0_6px_20px_rgba(234,179,8,0.22)]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALERT SECTION: Lotes que requieren cambio HOY y MAÑANA */}
      {(batchesNeedChangeToday.length > 0 || batchesNeedChangeTomorrow.length > 0) ? (
        <div className="bg-zinc-900 rounded-2xl border border-yellow-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-zinc-800/80 border-b border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-500 text-zinc-950 flex items-center justify-center shadow-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-50">
                  Control de Fermentación: Lotes con Cambio de Etapa Próximo
                </h2>
                <p className="text-xs text-zinc-400">
                  Monitoreo con 1 día de antelación para preparar adición de frutas, kegs de trasvase o insumos de empaque.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-950 text-yellow-300 border border-yellow-800">
              {batchesNeedChangeToday.length + batchesNeedChangeTomorrow.length} lote(s) en atención
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* HOY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                  Requieren Cambio HOY ({batchesNeedChangeToday.length})
                </span>
                <span className="text-[10px] text-zinc-500">Atención Inmediata</span>
              </div>

              {batchesNeedChangeToday.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3 text-center bg-zinc-800 rounded-xl">
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
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-rose-900">
                            {batch.batchNumber}
                          </span>
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            Hoy &bull; {formatDate(batch.stageTargetDate)}
                          </span>
                        </div>
                        <h4 className="font-bold text-zinc-50 text-sm mt-1.5">{batch.recipe.name}</h4>
                        <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
                          <span className="font-medium text-zinc-100">{currentStageDef?.name}</span>
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
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-yellow-500" />
                  Requieren Cambio MAÑANA ({batchesNeedChangeTomorrow.length})
                </span>
                <span className="text-[10px] text-zinc-500">1 Día de Antelación</span>
              </div>

              {batchesNeedChangeTomorrow.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3 text-center bg-zinc-800 rounded-xl">
                  No hay lotes programados para cambio mañana.
                </p>
              ) : (
                batchesNeedChangeTomorrow.map((batch) => {
                  const currentStageDef = getStageByNumber(batch.currentStage);
                  const nextStageDef = getStageByNumber(batch.currentStage + 1);

                  return (
                    <div
                      key={batch.id}
                      className="p-4 rounded-xl border border-yellow-900/60 bg-yellow-950/30 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-yellow-900">
                            {batch.batchNumber}
                          </span>
                          <span className="text-[10px] font-bold text-yellow-300 bg-yellow-950 px-2 py-0.5 rounded-full">
                            Mañana &bull; {formatDate(batch.stageTargetDate)}
                          </span>
                        </div>
                        <h4 className="font-bold text-zinc-50 text-sm mt-1.5">{batch.recipe.name}</h4>
                        <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
                          <span className="font-medium text-zinc-100">{currentStageDef?.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                          <span className="font-bold text-zinc-50">{nextStageDef?.name || 'Embotellado'}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-700/60 flex items-center justify-between">
                        <span className="text-[11px] text-yellow-400">
                          Preparar insumos y sanitizado
                        </span>
                        <Link
                          href={`/batches/${batch.id}`}
                          className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 rounded-lg text-xs font-bold shadow-sm transition-colors"
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
          className="bg-gradient-to-b from-zinc-900 to-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-zinc-700 transition-all duration-200 group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Stock Terminado</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-50 tracking-tight">
              {totalFinishedBottles} <span className="text-sm font-normal text-zinc-400">botellas 330ml</span>
            </div>
            <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1.5">
              <span>Valor comercial:</span>
              <span className="font-mono">{formatCurrency(totalInventoryValue)}</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-medium text-emerald-400 group-hover:text-emerald-300">
            <span>Ver inventario de botellas</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Batches en Fermentación */}
        <Link
          href="/batches"
          className="bg-gradient-to-b from-zinc-900 to-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-yellow-500/5 hover:border-zinc-700 transition-all duration-200 group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">En Fermentador</span>
            <div className="w-10 h-10 rounded-xl bg-yellow-950/80 border border-yellow-800/60 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Beer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-50 tracking-tight">
              {activeBatches.length} <span className="text-sm font-normal text-zinc-400">lotes activos</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {batchesNeedChangeToday.length > 0 ? (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-ping" />
                  {batchesNeedChangeToday.length} requieren cambio hoy
                </span>
              ) : (
                'Proceso de 6 etapas en curso'
              )}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-medium text-yellow-400 group-hover:text-yellow-300">
            <span>Ver línea de producción</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Materia Prima */}
        <Link
          href="/inventory/raw-materials"
          className="bg-gradient-to-b from-zinc-900 to-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-zinc-700 transition-all duration-200 group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Materia Prima</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-50 tracking-tight">
              {rawMaterialsCount} <span className="text-sm font-normal text-zinc-400">insumos base</span>
            </div>
            <p className="text-xs mt-1">
              {lowStockMaterials.length > 0 ? (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                  {lowStockMaterials.length} con stock bajo
                </span>
              ) : (
                <span className="text-zinc-400">Niveles de stock saludables</span>
              )}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-medium text-indigo-400 group-hover:text-indigo-300">
            <span>Gestionar inventario</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Cuentas por Cobrar / Envíos */}
        <Link
          href="/shipments"
          className="bg-gradient-to-b from-zinc-900 to-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-yellow-500/5 hover:border-zinc-700 transition-all duration-200 group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Por Cobrar</span>
            <div className="w-10 h-10 rounded-xl bg-yellow-950/80 border border-yellow-800/60 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-50 tracking-tight font-mono">
              {formatCurrency(totalReceivables)}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {pendingOrdersToShip > 0 ? (
                <span className="text-yellow-400 font-semibold">{pendingOrdersToShip} pedido(s) por enviar</span>
              ) : (
                `${shipmentsInTransit} envío(s) en tránsito`
              )}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-medium text-yellow-400 group-hover:text-yellow-300">
            <span>Ver despachos y cobros</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Main Sections: Stock Breakdown & Recent Shipments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock de Producto Terminado */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-50">Stock Disponible de Hidromiel (330ml)</h3>
              <p className="text-xs text-zinc-400">Inventario disponible para despacho inmediato</p>
            </div>
            <Link
              href="/inventory/finished-goods"
              className="text-xs font-semibold text-yellow-400 hover:underline"
            >
              Ver todo &rarr;
            </Link>
          </div>

          <div className="divide-y divide-zinc-800">
            {finishedGoods.map((fg) => (
              <div key={fg.id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">{fg.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>{fg.style || 'Hidromiel'}</span>
                    <span>&bull;</span>
                    <span className="font-semibold text-zinc-300">{formatCurrency(fg.unitPrice)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                    fg.stock > 24
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                  }`}>
                    {fg.stock} botellas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos Envíos Registrados */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-50">Últimos Envíos / Despachos</h3>
              <p className="text-xs text-zinc-400">Estado de entrega y cobranza de pedidos recientes</p>
            </div>
            <Link
              href="/shipments"
              className="text-xs font-semibold text-yellow-400 hover:underline"
            >
              Ver todos &rarr;
            </Link>
          </div>

          {shipments.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              No se han registrado envíos aún.
            </p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {shipments.map((s) => {
                const pendingBalance = Math.max(0, s.totalExpected - s.totalPaid);
                return (
                  <div key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">
                          {s.shipmentNumber}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-100">{s.customer.name}</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {formatDate(s.shipmentDate)} &bull; {s.items.reduce((acc, it) => acc + it.quantity, 0)} botellas
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-50">
                        {formatCurrency(s.totalExpected)}
                      </div>
                      <span className={`inline-block text-[10px] font-semibold mt-0.5 ${
                        s.deliveryStatus === 'DELIVERED' ? 'text-emerald-700' : 'text-yellow-400'
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
