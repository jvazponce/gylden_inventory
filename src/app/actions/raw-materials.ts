'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createRawMaterial(formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim();
    const category = formData.get('category') as string;
    const unit = formData.get('unit') as string;
    const stock = parseFloat(formData.get('stock') as string) || 0;
    const minStock = parseFloat(formData.get('minStock') as string) || 0;
    const costPerUnit = parseFloat(formData.get('costPerUnit') as string) || 0;

    if (!name || !category || !unit) {
      return { success: false, error: 'Nombre, categoría y unidad son obligatorios.' };
    }

    const material = await prisma.rawMaterial.create({
      data: {
        name,
        category,
        unit,
        stock,
        minStock,
        costPerUnit,
      },
    });

    if (stock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          itemType: 'RAW_MATERIAL',
          rawMaterialId: material.id,
          movementType: 'INITIAL',
          quantity: stock,
          previousStock: 0,
          newStock: stock,
          notes: 'Inventario inicial registrado',
        },
      });
    }

    revalidatePath('/inventory/raw-materials');
    revalidatePath('/recipes');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error creating raw material:', error);
    return { success: false, error: 'Error al registrar el insumo.' };
  }
}

export async function updateRawMaterialAction(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();
    const category = formData.get('category') as string;
    const unit = formData.get('unit') as string;
    const minStock = parseFloat(formData.get('minStock') as string) || 0;
    const costPerUnit = parseFloat(formData.get('costPerUnit') as string) || 0;

    if (!id || !name || !category || !unit) {
      return { success: false, error: 'Todos los campos obligatorios deben completarse.' };
    }

    await prisma.rawMaterial.update({
      where: { id },
      data: {
        name,
        category,
        unit,
        minStock,
        costPerUnit,
      },
    });

    revalidatePath('/inventory/raw-materials');
    revalidatePath('/recipes');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating raw material:', error);
    return { success: false, error: 'Error al actualizar la materia prima.' };
  }
}

export async function adjustRawMaterialStock(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const type = (formData.get('type') as string) || 'PURCHASE'; // PURCHASE, ADJUSTMENT
    const quantity = parseFloat(formData.get('quantity') as string) || 0;
    const notes = (formData.get('notes') as string) || '';

    if (!id || quantity === 0) {
      return { success: false, error: 'Cantidad inválida o insumo no encontrado.' };
    }

    const material = await prisma.rawMaterial.findUnique({ where: { id } });
    if (!material) {
      return { success: false, error: 'Insumo no encontrado.' };
    }

    const previousStock = material.stock;
    const newStock = Math.max(0, previousStock + quantity);

    await prisma.$transaction([
      prisma.rawMaterial.update({
        where: { id },
        data: { stock: newStock },
      }),
      prisma.inventoryMovement.create({
        data: {
          itemType: 'RAW_MATERIAL',
          rawMaterialId: id,
          movementType: type,
          quantity,
          previousStock,
          newStock,
          notes: notes || (quantity > 0 ? 'Entrada / Compra de insumo' : 'Ajuste de inventario'),
        },
      }),
    ]);

    revalidatePath('/inventory/raw-materials');
    revalidatePath('/recipes');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return { success: false, error: 'Error al actualizar el stock.' };
  }
}
