'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface CreateRecipeItemInput {
  rawMaterialId: string;
  quantity: number;
  stage: number;
  notes?: string;
}

export async function createRecipeAction(data: {
  name: string;
  description?: string;
  baseVolumeLiters: number;
  estimatedDays: number;
  items: CreateRecipeItemInput[];
}) {
  try {
    if (!data.name || !data.items || data.items.length === 0) {
      return { success: false, error: 'El nombre y al menos un ingrediente son requeridos.' };
    }

    const recipe = await prisma.recipe.create({
      data: {
        name: data.name,
        description: data.description,
        baseVolumeLiters: data.baseVolumeLiters || 20,
        estimatedDays: data.estimatedDays || 19,
        items: {
          create: data.items.map((item) => ({
            rawMaterialId: item.rawMaterialId,
            quantity: Number(item.quantity),
            stage: Number(item.stage) || 1,
            notes: item.notes || null,
          })),
        },
      },
    });

    revalidatePath('/recipes');
    revalidatePath('/');
    return { success: true, recipeId: recipe.id };
  } catch (error) {
    console.error('Error creating recipe:', error);
    return { success: false, error: 'Error al guardar la receta.' };
  }
}

export async function deleteRecipeAction(recipeId: string) {
  try {
    const batches = await prisma.batch.count({ where: { recipeId } });
    if (batches > 0) {
      return {
        success: false,
        error: `No se puede eliminar la receta porque tiene ${batches} lote(s) asociado(s).`,
      };
    }

    await prisma.recipe.delete({ where: { id: recipeId } });
    revalidatePath('/recipes');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return { success: false, error: 'Error al eliminar la receta.' };
  }
}
