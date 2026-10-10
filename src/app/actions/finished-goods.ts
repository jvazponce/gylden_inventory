'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createFinishedGood(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const style = (formData.get('style') as string) || '';
    const format = (formData.get('format') as string) || 'Botella 330ml';
    const stock = parseInt(formData.get('stock') as string, 10) || 0;
    const unitPrice = parseFloat(formData.get('unitPrice') as string) || 0;
    const recipeId = (formData.get('recipeId') as string) || null;

    if (!name) {
      return { success: false, error: 'El nombre del producto es obligatorio.' };
    }

    const fg = await prisma.finishedGood.create({
      data: {
        name,
        style,
        format,
        stock,
        unitPrice,
        recipeId: recipeId || null,
      },
    });

    if (stock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          itemType: 'FINISHED_GOOD',
          finishedGoodId: fg.id,
          movementType: 'INITIAL',
          quantity: stock,
          previousStock: 0,
          newStock: stock,
          notes: 'Stock inicial registrado de producto terminado',
        },
      });
    }

    revalidatePath('/inventory/finished-goods');
    revalidatePath('/shipments/new');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error creating finished good:', error);
    return { success: false, error: 'Error al registrar el producto terminado.' };
  }
}

export async function adjustFinishedGoodStock(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const quantity = parseInt(formData.get('quantity') as string, 10) || 0;
    const notes = (formData.get('notes') as string) || '';

    if (!id || quantity === 0) {
      return { success: false, error: 'Cantidad inválida o producto no encontrado.' };
    }

    const item = await prisma.finishedGood.findUnique({ where: { id } });
    if (!item) {
      return { success: false, error: 'Producto no encontrado.' };
    }

    const previousStock = item.stock;
    const newStock = Math.max(0, previousStock + quantity);

    await prisma.$transaction([
      prisma.finishedGood.update({
        where: { id },
        data: { stock: newStock },
      }),
      prisma.inventoryMovement.create({
        data: {
          itemType: 'FINISHED_GOOD',
          finishedGoodId: id,
          movementType: quantity > 0 ? 'ADJUSTMENT' : 'ADJUSTMENT',
          quantity,
          previousStock,
          newStock,
          notes: notes || 'Ajuste manual de stock de botellas',
        },
      }),
    ]);

    revalidatePath('/inventory/finished-goods');
    revalidatePath('/shipments/new');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error adjusting finished good stock:', error);
    return { success: false, error: 'Error al actualizar el stock.' };
  }
}
