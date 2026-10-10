'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface PurchaseOrderItemInput {
  rawMaterialId: string;
  quantity: number;
  estimatedCost?: number;
}

export async function createPurchaseOrderAction(data: {
  requestedBy?: string;
  notes?: string;
  items: PurchaseOrderItemInput[];
}) {
  try {
    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'Debes incluir al menos un insumo en la solicitud de compra.' };
    }

    const year = new Date().getFullYear();
    const count = await prisma.purchaseOrder.count();
    const orderNumber = `OC-${year}-${String(count + 1).padStart(3, '0')}`;

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        requestedBy: data.requestedBy || 'Producción',
        status: 'PENDING',
        notes: data.notes || null,
        items: {
          create: data.items.map((it) => ({
            rawMaterialId: it.rawMaterialId,
            quantity: Number(it.quantity),
            estimatedCost: Number(it.estimatedCost) || 0,
          })),
        },
      },
    });

    revalidatePath('/inventory/raw-materials');
    revalidatePath('/');
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return { success: false, error: 'Error al registrar la solicitud de compra.' };
  }
}

export async function approvePurchaseOrderAction(orderId: string) {
  try {
    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: 'APPROVED' },
    });

    revalidatePath('/inventory/raw-materials');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error approving purchase order:', error);
    return { success: false, error: 'Error al aprobar la orden de compra.' };
  }
}

export async function receivePurchaseOrderAction(orderId: string) {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { rawMaterial: true },
        },
      },
    });

    if (!order) {
      return { success: false, error: 'Orden de compra no encontrada.' };
    }

    if (order.status === 'RECEIVED') {
      return { success: false, error: 'Esta orden ya fue recibida previamente.' };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark order received
      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
        },
      });

      // 2. Increment raw material stock and create inventory movements
      for (const item of order.items) {
        const currentMat = await tx.rawMaterial.findUnique({ where: { id: item.rawMaterialId } });
        if (currentMat) {
          const prevStock = currentMat.stock;
          const newStock = prevStock + item.quantity;

          await tx.rawMaterial.update({
            where: { id: currentMat.id },
            data: { stock: newStock },
          });

          await tx.inventoryMovement.create({
            data: {
              itemType: 'RAW_MATERIAL',
              rawMaterialId: currentMat.id,
              movementType: 'PURCHASE',
              quantity: item.quantity,
              previousStock: prevStock,
              newStock,
              referenceId: order.id,
              notes: `Ingreso por Orden de Compra ${order.orderNumber} (+${item.quantity} ${currentMat.unit})`,
            },
          });
        }
      }
    });

    revalidatePath('/inventory/raw-materials');
    revalidatePath('/recipes');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error receiving purchase order:', error);
    return { success: false, error: 'Error al procesar la recepción de la orden.' };
  }
}

export async function rejectPurchaseOrderAction(orderId: string) {
  try {
    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: 'REJECTED' },
    });

    revalidatePath('/inventory/raw-materials');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting purchase order:', error);
    return { success: false, error: 'Error al rechazar la orden de compra.' };
  }
}
