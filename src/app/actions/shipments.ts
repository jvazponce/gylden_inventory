'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface CreateShipmentItemInput {
  finishedGoodId: string;
  quantity: number;
  unitPrice: number;
}

export async function createShipmentAction(data: {
  customerId: string;
  shipmentNumber?: string;
  shipmentDate?: string;
  deliveryStatus?: string; // PENDING_SHIPMENT, IN_TRANSIT, DELIVERED
  totalPaid?: number;
  notes?: string;
  items: CreateShipmentItemInput[];
}) {
  try {
    if (!data.customerId) {
      return { success: false, error: 'Debes seleccionar un cliente / punto de envío.' };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'Debes incluir al menos un producto a enviar.' };
    }

    // Auto generate shipment number
    let shipmentNumber = data.shipmentNumber?.trim();
    if (!shipmentNumber) {
      const year = new Date().getFullYear();
      const count = await prisma.shipment.count();
      shipmentNumber = `PED-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    // Verify stock availability
    for (const item of data.items) {
      const fg = await prisma.finishedGood.findUnique({ where: { id: item.finishedGoodId } });
      if (!fg) {
        return { success: false, error: 'Uno de los productos seleccionados no existe.' };
      }
      if (fg.stock < item.quantity) {
        return {
          success: false,
          error: `Stock insuficiente para ${fg.name}. Se solicitaron ${item.quantity} botellas y solo hay ${fg.stock} en inventario.`,
        };
      }
    }

    // Calculate total expected
    let totalExpected = 0;
    data.items.forEach((item) => {
      totalExpected += item.quantity * item.unitPrice;
    });

    const totalPaid = Math.max(0, data.totalPaid || 0);
    let paymentStatus = 'PENDING';
    if (totalPaid >= totalExpected && totalExpected > 0) {
      paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      paymentStatus = 'PARTIAL';
    }

    const shipmentDate = data.shipmentDate ? new Date(data.shipmentDate) : new Date();
    const finalStatus = data.deliveryStatus || 'PENDING_SHIPMENT';
    const isDelivered = finalStatus === 'DELIVERED';

    const shipment = await prisma.$transaction(async (tx) => {
      // 1. Create Shipment
      const created = await tx.shipment.create({
        data: {
          shipmentNumber: shipmentNumber!,
          customerId: data.customerId,
          shipmentDate,
          deliveryStatus: finalStatus,
          deliveredAt: isDelivered ? new Date() : null,
          totalExpected,
          totalPaid,
          paymentStatus,
          notes: data.notes || null,
          items: {
            create: data.items.map((it) => ({
              finishedGoodId: it.finishedGoodId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              subtotal: it.quantity * it.unitPrice,
            })),
          },
        },
      });

      // 2. Immediately reserve/deduct finished goods inventory
      for (const item of data.items) {
        const currentFg = await tx.finishedGood.findUnique({ where: { id: item.finishedGoodId } });
        if (currentFg) {
          const prevStock = currentFg.stock;
          const newStock = Math.max(0, prevStock - item.quantity);

          await tx.finishedGood.update({
            where: { id: currentFg.id },
            data: { stock: newStock },
          });

          await tx.inventoryMovement.create({
            data: {
              itemType: 'FINISHED_GOOD',
              finishedGoodId: currentFg.id,
              movementType: 'SHIPMENT',
              quantity: -item.quantity,
              previousStock: prevStock,
              newStock,
              referenceId: created.id,
              notes: `Reserva para pedido/envío ${created.shipmentNumber} (${item.quantity} botellas)`,
            },
          });
        }
      }

      return created;
    });

    revalidatePath('/shipments');
    revalidatePath('/inventory/finished-goods');
    revalidatePath('/customers');
    revalidatePath('/');
    return { success: true, shipmentId: shipment.id };
  } catch (error) {
    console.error('Error creating shipment:', error);
    return { success: false, error: 'Ocurrió un error al registrar el pedido / envío.' };
  }
}

export async function dispatchShipmentAction(shipmentId: string) {
  try {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        deliveryStatus: 'IN_TRANSIT',
      },
    });

    revalidatePath('/shipments');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error dispatching shipment:', error);
    return { success: false, error: 'Error al marcar el pedido como despachado/en camino.' };
  }
}

export async function markShipmentDeliveredAction(shipmentId: string) {
  try {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        deliveryStatus: 'DELIVERED',
        deliveredAt: new Date(),
      },
    });

    revalidatePath('/shipments');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error marking shipment as delivered:', error);
    return { success: false, error: 'Error al actualizar el estado de entrega.' };
  }
}

export async function registerShipmentPaymentAction(formData: FormData) {
  try {
    const shipmentId = formData.get('shipmentId') as string;
    const additionalPayment = parseFloat(formData.get('amount') as string) || 0;

    if (!shipmentId || additionalPayment <= 0) {
      return { success: false, error: 'Monto de pago inválido.' };
    }

    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      return { success: false, error: 'Envío no encontrado.' };
    }

    const newTotalPaid = shipment.totalPaid + additionalPayment;
    let paymentStatus = 'PARTIAL';
    if (newTotalPaid >= shipment.totalExpected) {
      paymentStatus = 'PAID';
    }

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        totalPaid: newTotalPaid,
        paymentStatus,
      },
    });

    revalidatePath('/shipments');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error registering shipment payment:', error);
    return { success: false, error: 'Error al registrar el cobro.' };
  }
}
