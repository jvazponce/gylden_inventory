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
  ALL: { label: 'Todos', color: 'bg-slate-100 text-slate-800' },
  HONEY: { label: 'Miel', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  YEAST: { label: 'Levadura', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  NUTRIENT: { label: 'Nutriente', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  FRUIT: { label: 'Fruta', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  WATER: { label: 'Agua', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  PACKAGING: { label: 'Empaque', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  OTHER: { label: 'Otros', color: 'bg-slate-100 text-slate-800 border-slate-300' },
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-600" />
            Materia Prima y Órdenes de Compra
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de insumos de fermentación y empaque, precios unitarios y solicitudes de compra para administración.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewPOModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-lg text-xs shadow-sm transition-all"
          >
            <ShoppingCart className="w-4 h-4 text-amber-700" />
            Solicitar Compra (Requisición)
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Insumo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Total Insumos</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {materials.length} <span className="text-sm font-normal text-slate-500">artículos</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Mieles, levaduras, frutas, empaque</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Valor de Materias Primas</span>
            <div className="text-2xl font-bold text-amber-900 mt-1">
              {formatCurrency(totalRawMaterialsValue)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Calculado según precio unitario de cada insumo</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Órdenes de Compra</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {pendingOrdersCount} <span className="text-sm font-normal text-slate-500">pendientes</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {pendingOrdersCount > 0 ? 'Requieren aprobación del Administrador' : 'Sin solicitudes pendientes'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'INVENTORY'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventario de Insumos</span>
        </button>

        <button
          onClick={() => setActiveTab('PURCHASE_ORDERS')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'PURCHASE_ORDERS'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
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
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    Atención: Insumos con Stock Bajo ({lowStockCount})
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    Hay insumos en niveles mínimos de seguridad. Puedes generar una orden de compra directa para reponerlos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewPOModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Solicitar Compra &rarr;
              </button>
            </div>
          )}

          {/* Buscador y Filtros */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar insumo por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
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
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla de Materias Primas */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
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
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                        No se encontraron materias primas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((mat) => {
                      const isLow = mat.stock <= mat.minStock;
                      const categoryInfo = CATEGORY_MAP[mat.category] || CATEGORY_MAP.OTHER;
                      const totalMatVal = mat.stock * (mat.costPerUnit || 0);

                      return (
                        <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            <div className="font-bold text-slate-900">{mat.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Unidad: {mat.unit}</div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                          </td>

                          {/* Precio / Costo Unitario */}
                          <td className="px-4 py-3.5 text-right font-bold text-slate-800 text-sm">
                            {mat.costPerUnit ? formatCurrency(mat.costPerUnit) : '$0.00'}
                            <span className="text-[10px] font-normal text-slate-400 block">/ {mat.unit}</span>
                          </td>

                          <td className="px-4 py-3.5 text-right font-bold text-slate-900 text-sm">
                            {mat.stock} <span className="text-xs font-normal text-slate-500">{mat.unit}</span>
                          </td>

                          <td className="px-4 py-3.5 text-right text-slate-500">
                            {mat.minStock} {mat.unit}
                          </td>

                          {/* Valor monetario total del insumo */}
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-800">
                            {formatCurrency(totalMatVal)}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> Bajo Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Óptimo
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Editar */}
                              <button
                                onClick={() => setSelectedForEdit(mat)}
                                title="Editar nombre, precio o stock mínimo"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Editar
                              </button>

                              {/* Botón Ajustar/Entrada */}
                              <button
                                onClick={() => setSelectedForAdjustment(mat)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Flujo de Órdenes de Compra</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Producción solicita los insumos necesarios &rarr; El Administrador autoriza &rarr; Al llegar a bodega, se marcan como <strong>Recibida</strong> y se <strong>suman automáticamente al inventario</strong>.
              </p>
            </div>
            <button
              onClick={() => setIsNewPOModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Nueva Solicitud de Compra
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Código / Solicitante</th>
                    <th className="px-4 py-3.5">Fecha</th>
                    <th className="px-4 py-3.5">Insumos Solicitados</th>
                    <th className="px-4 py-3.5 text-right">Costo Estimado</th>
                    <th className="px-4 py-3.5 text-center">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
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
                        <tr key={po.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                              {po.orderNumber}
                            </span>
                            <div className="text-xs text-slate-500 mt-1">
                              Por: <strong className="text-slate-800">{po.requestedBy}</strong>
                            </div>
                            {po.notes && (
                              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">{po.notes}</p>
                            )}
                          </td>

                          <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                            {formatDate(po.createdAt)}
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {po.items.map((it) => (
                                <div key={it.id} className="text-slate-800 text-[11px]">
                                  <strong>{it.quantity} {it.rawMaterial.unit}</strong> de {it.rawMaterial.name}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrency(totalEstimated)}
                          </td>

                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
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
                                <span className="text-[11px] text-slate-400 italic">
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
