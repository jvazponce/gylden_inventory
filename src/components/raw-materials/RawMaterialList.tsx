'use client';

import { useState } from 'react';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  Plus, 
  ArrowUpDown, 
  CheckCircle2, 
  Edit3,
  ShoppingCart,
  DollarSign,
  Clock,
  Check,
  XCircle,
  PackagePlus
} from 'lucide-react';
import AdjustStockModal from './AdjustStockModal';
import NewRawMaterialModal from './NewRawMaterialModal';
import EditRawMaterialModal from './EditRawMaterialModal';
import NewPurchaseOrderModal from './NewPurchaseOrderModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRole } from '@/context/RoleContext';
import { 
  approvePurchaseOrderAction, 
  receivePurchaseOrderAction, 
  rejectPurchaseOrderAction 
} from '@/app/actions/purchase-orders';

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number | null;
  updatedAt: Date | string;
}

interface PurchaseOrderItem {
  id: string;
  quantity: number;
  estimatedCost: number | null;
  rawMaterial: {
    name: string;
    unit: string;
  };
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  requestedBy: string;
  status: string;
  notes: string | null;
  createdAt: Date | string;
  receivedAt: Date | string | null;
  items: PurchaseOrderItem[];
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  ALL: { label: 'Todos', color: 'bg-zinc-800 text-zinc-200' },
  HONEY: { label: 'Miel', color: 'bg-yellow-900 text-yellow-300 border-yellow-700' },
  YEAST: { label: 'Levadura', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  NUTRIENT: { label: 'Nutriente', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  FRUIT: { label: 'Fruta', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  WATER: { label: 'Agua', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  PACKAGING: { label: 'Empaque', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  OTHER: { label: 'Otros', color: 'bg-zinc-800 text-zinc-200 border-zinc-700' },
};

export default function RawMaterialList({
  materials,
  purchaseOrders,
}: {
  materials: Material[];
  purchaseOrders: PurchaseOrder[];
}) {
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'PURCHASE_ORDERS'>('INVENTORY');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [selectedForAdjustment, setSelectedForAdjustment] = useState<Material | null>(null);
  const [selectedForEdit, setSelectedForEdit] = useState<Material | null>(null);

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = materials.filter((m) => m.stock <= m.minStock).length;
  const totalRawMaterialsValue = materials.reduce(
    (acc, m) => acc + m.stock * (m.costPerUnit || 0),
    0
  );
  const pendingOrdersCount = purchaseOrders.filter((po) => po.status === 'PENDING').length;

  async function handleApprovePO(orderId: string) {
    if (confirm('¿Aprobar esta orden de compra para adquisición?')) {
      await approvePurchaseOrderAction(orderId);
    }
  }

  async function handleReceivePO(orderId: string) {
    if (confirm('¿Confirmas que los insumos llegaron y deseas sumarlos automáticamente al inventario?')) {
      await receivePurchaseOrderAction(orderId);
    }
  }

  async function handleRejectPO(orderId: string) {
    if (confirm('¿Rechazar esta solicitud de compra?')) {
      await rejectPurchaseOrderAction(orderId);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-yellow-500" />
            Materia Prima y Órdenes de Compra
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gestión de insumos de fermentación y empaque, precios unitarios y solicitudes de compra para administración.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewPOModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-yellow-950 hover:bg-yellow-900 text-yellow-300 border border-yellow-800 font-bold rounded-lg text-xs shadow-sm transition-all"
          >
            <ShoppingCart className="w-4 h-4 text-yellow-400" />
            Solicitar Compra (Requisición)
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-50 font-bold rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Insumo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-500">Total Insumos</span>
            <div className="text-2xl font-bold text-zinc-50 mt-1">
              {materials.length} <span className="text-sm font-normal text-zinc-400">artículos</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Mieles, levaduras, frutas, empaque</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-500">Valor de Materias Primas</span>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {formatCurrency(totalRawMaterialsValue)}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Calculado según precio unitario de cada insumo</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-950 text-yellow-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-500">Órdenes de Compra</span>
            <div className="text-2xl font-bold text-zinc-50 mt-1">
              {pendingOrdersCount} <span className="text-sm font-normal text-zinc-400">pendientes</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {pendingOrdersCount > 0 ? 'Requieren aprobación del Administrador' : 'Sin solicitudes pendientes'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-950 text-yellow-500 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-700">
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'INVENTORY'
              ? 'border-yellow-500 text-yellow-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventario de Insumos</span>
        </button>

        <button
          onClick={() => setActiveTab('PURCHASE_ORDERS')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'PURCHASE_ORDERS'
              ? 'border-yellow-500 text-yellow-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Órdenes de Compra</span>
          {pendingOrdersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
              {pendingOrdersCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: INVENTARIO DE INSUMOS */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-6">
          {/* Alerta de Stock Bajo */}
          {lowStockCount > 0 && (
            <div className="p-4 bg-yellow-950 border border-yellow-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-900 text-yellow-300 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-yellow-400">
                    Atención: Insumos con Stock Bajo ({lowStockCount})
                  </h4>
                  <p className="text-[11px] text-yellow-400">
                    Hay insumos en niveles mínimos de seguridad. Puedes generar una orden de compra directa para reponerlos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewPOModalOpen(true)}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 rounded-lg text-xs font-bold shadow-sm"
              >
                Solicitar Compra &rarr;
              </button>
            </div>
          )}

          {/* Buscador y Filtros */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar insumo por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.entries(CATEGORY_MAP).map(([key, config]) => {
                const isSelected = selectedCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-yellow-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla de Materias Primas */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-400">
                <thead className="bg-zinc-800 border-b border-zinc-700 text-zinc-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Materia Prima</th>
                    <th className="px-4 py-3.5">Categoría</th>
                    <th className="px-4 py-3.5 text-right">Precio Unitario ($)</th>
                    <th className="px-4 py-3.5 text-right">Stock Actual</th>
                    <th className="px-4 py-3.5 text-right">Stock Mínimo</th>
                    <th className="px-4 py-3.5 text-right">Valor Total</th>
                    <th className="px-4 py-3.5 text-center">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-zinc-500">
                        No se encontraron materias primas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((mat) => {
                      const isLow = mat.stock <= mat.minStock;
                      const categoryInfo = CATEGORY_MAP[mat.category] || CATEGORY_MAP.OTHER;
                      const totalMatVal = mat.stock * (mat.costPerUnit || 0);

                      return (
                        <tr key={mat.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-zinc-50">
                            <div className="font-bold text-zinc-50">{mat.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">Unidad: {mat.unit}</div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                          </td>

                          {/* Precio / Costo Unitario */}
                          <td className="px-4 py-3.5 text-right font-bold text-zinc-100 text-sm">
                            {mat.costPerUnit ? formatCurrency(mat.costPerUnit) : '$0.00'}
                            <span className="text-[10px] font-normal text-zinc-500 block">/ {mat.unit}</span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="font-bold text-zinc-50 text-sm">
                              {mat.stock} <span className="text-xs font-normal text-zinc-400">{mat.unit}</span>
                            </div>
                            <div className="w-20 ml-auto mt-1.5 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/60">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isLow ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, Math.max(8, (mat.stock / Math.max(mat.minStock * 2, 1)) * 100))}%`
                                }}
                              />
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-right text-zinc-400 text-xs font-mono">
                            {mat.minStock} {mat.unit}
                          </td>

                          {/* Valor monetario total del insumo */}
                          <td className="px-4 py-3.5 text-right font-semibold text-zinc-100 font-mono">
                            {formatCurrency(totalMatVal)}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                <span>Reordenar</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Saludable</span>
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Editar */}
                              <button
                                onClick={() => setSelectedForEdit(mat)}
                                title="Editar nombre, precio o stock mínimo"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Editar
                              </button>

                              {/* Botón Ajustar/Entrada */}
                              <button
                                onClick={() => setSelectedForAdjustment(mat)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-yellow-400 bg-yellow-950 hover:bg-yellow-900 border border-yellow-800 transition-colors"
                              >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                Ajustar
                              </button>
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
        </div>
      )}

      {/* TAB 2: ÓRDENES DE COMPRA (REQUISICIONES) */}
      {activeTab === 'PURCHASE_ORDERS' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-700 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-50">Flujo de Órdenes de Compra</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Producción solicita los insumos necesarios &rarr; El Administrador autoriza &rarr; Al llegar a bodega, se marcan como <strong>Recibida</strong> y se <strong>suman automáticamente al inventario</strong>.
              </p>
            </div>
            <button
              onClick={() => setIsNewPOModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-lg text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Nueva Solicitud de Compra
            </button>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800 border-b border-zinc-700 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Código / Solicitante</th>
                    <th className="px-4 py-3.5">Fecha</th>
                    <th className="px-4 py-3.5">Insumos Solicitados</th>
                    <th className="px-4 py-3.5 text-right">Costo Estimado</th>
                    <th className="px-4 py-3.5 text-center">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                        No hay solicitudes de orden de compra registradas aún.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => {
                      const totalEstimated = po.items.reduce((sum, it) => sum + (it.estimatedCost || 0), 0);
                      const isPending = po.status === 'PENDING';
                      const isApproved = po.status === 'APPROVED';
                      const isReceived = po.status === 'RECEIVED';
                      const isRejected = po.status === 'REJECTED';

                      return (
                        <tr key={po.id} className="hover:bg-zinc-800/50">
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">
                              {po.orderNumber}
                            </span>
                            <div className="text-xs text-zinc-400 mt-1">
                              Por: <strong className="text-zinc-100">{po.requestedBy}</strong>
                            </div>
                            {po.notes && (
                              <p className="text-[11px] text-zinc-500 mt-0.5 max-w-xs">{po.notes}</p>
                            )}
                          </td>

                          <td className="px-4 py-4 text-zinc-400 whitespace-nowrap">
                            {formatDate(po.createdAt)}
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {po.items.map((it) => (
                                <div key={it.id} className="text-zinc-100 text-[11px]">
                                  <strong>{it.quantity} {it.rawMaterial.unit}</strong> de {it.rawMaterial.name}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-right font-bold text-zinc-50 whitespace-nowrap">
                            {formatCurrency(totalEstimated)}
                          </td>

                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-950 text-yellow-500 border border-yellow-800">
                                <Clock className="w-3 h-3" /> Solicitada (Pendiente)
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                <Check className="w-3 h-3" /> Aprobada / Comprada
                              </span>
                            )}
                            {isReceived && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Recibida en Almacén
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3" /> Rechazada
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleApprovePO(po.id)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
                                  >
                                    Aprobar
                                  </button>
                                  <button
                                    onClick={() => handleRejectPO(po.id)}
                                    className="px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                                  >
                                    Rechazar
                                  </button>
                                </>
                              )}

                              {(isPending || isApproved) && (
                                <button
                                  onClick={() => handleReceivePO(po.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                                >
                                  <PackagePlus className="w-3.5 h-3.5" />
                                  Ingresar a Stock
                                </button>
                              )}

                              {isReceived && (
                                <span className="text-[11px] text-zinc-500 italic">
                                  Ingresado el {formatDate(po.receivedAt)}
                                </span>
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
        </div>
      )}

      {/* Modales */}
      <AdjustStockModal
        material={selectedForAdjustment}
        isOpen={!!selectedForAdjustment}
        onClose={() => setSelectedForAdjustment(null)}
      />

      <EditRawMaterialModal
        material={selectedForEdit}
        isOpen={!!selectedForEdit}
        onClose={() => setSelectedForEdit(null)}
      />

      <NewRawMaterialModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      <NewPurchaseOrderModal
        materials={materials}
        isOpen={isNewPOModalOpen}
        onClose={() => setIsNewPOModalOpen(false)}
      />
    </div>
  );
}
