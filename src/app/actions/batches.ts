'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PRODUCTION_STAGES, getStageByNumber } from '@/lib/batch-constants';

export async function createBatchAction(formData: FormData) {
  try {
    const recipeId = formData.get('recipeId') as string;
    const batchNumber = (formData.get('batchNumber') as string)?.trim();
    const volumeLiters = parseFloat(formData.get('volumeLiters') as string) || 20;
    const notes = (formData.get('notes') as string) || '';
    const densityOG = parseFloat(formData.get('densityOG') as string) || null;
    const temperature = parseFloat(formData.get('temperature') as string) || null;

    if (!recipeId) {
      return { success: false, error: 'Debes seleccionar una receta.' };
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        items: {
          include: { rawMaterial: true },
        },
        finishedGoods: true,
      },
    });

    if (!recipe) {
      return { success: false, error: 'Receta no encontrada.' };
    }

    // Auto-generate batch number if not provided
    let finalBatchNumber = batchNumber;
    if (!finalBatchNumber) {
      const year = new Date().getFullYear();
      const count = await prisma.batch.count();
      finalBatchNumber = `LOTE-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    // Check duplicate
    const existing = await prisma.batch.findUnique({ where: { batchNumber: finalBatchNumber } });
    if (existing) {
      return { success: false, error: `El número de lote ${finalBatchNumber} ya existe.` };
    }

    // Scaling factor
    const scale = volumeLiters / (recipe.baseVolumeLiters || 20);

    // Verify stock availability
    for (const item of recipe.items) {
      const needed = item.quantity * scale;
      if (item.rawMaterial.stock < needed) {
        return {
          success: false,
          error: `Stock insuficiente para ${item.rawMaterial.name}. Se necesitan ${needed.toFixed(2)} ${item.rawMaterial.unit} y solo hay ${item.rawMaterial.stock}.`,
        };
      }
    }

    // Calculate dates
    const startDate = new Date();
    // Stage 1 duration: 7 days
    const stageTargetDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    // Total duration: 20 days
    const estimatedEndDate = new Date(startDate.getTime() + 20 * 24 * 60 * 60 * 1000);

    // Associate with finished good if recipe is linked to one
    const associatedFinishedGood = recipe.finishedGoods[0] || null;

    // Execute atomic transaction
    const createdBatch = await prisma.$transaction(async (tx) => {
      // 1. Create Batch
      const batch = await tx.batch.create({
        data: {
          batchNumber: finalBatchNumber,
          recipeId: recipe.id,
          finishedGoodId: associatedFinishedGood ? associatedFinishedGood.id : null,
          volumeLiters,
          currentStage: 1,
          status: 'IN_PROGRESS',
          startDate,
          stageTargetDate,
          estimatedEndDate,
          notes,
        },
      });

      // 2. Create Initial Stage 1 Log
      await tx.batchLog.create({
        data: {
          batchId: batch.id,
          stageNumber: 1,
          stageName: PRODUCTION_STAGES[0].name,
          startedAt: startDate,
          densityOG,
          temperature,
          notes: notes || 'Inicio de fermentación primaria.',
        },
      });

      // 3. Deduct raw materials and record inventory movements
      for (const item of recipe.items) {
        const consumed = item.quantity * scale;
        const currentMat = await tx.rawMaterial.findUnique({ where: { id: item.rawMaterialId } });
        if (currentMat) {
          const previousStock = currentMat.stock;
          const newStock = Math.max(0, previousStock - consumed);

          await tx.rawMaterial.update({
            where: { id: currentMat.id },
            data: { stock: newStock },
          });

          await tx.inventoryMovement.create({
            data: {
              itemType: 'RAW_MATERIAL',
              rawMaterialId: currentMat.id,
              movementType: 'PRODUCTION_USE',
              quantity: -consumed,
              previousStock,
              newStock,
              referenceId: batch.id,
              notes: `Consumo para ${batch.batchNumber} (${volumeLiters}L de ${recipe.name})`,
            },
          });
        }
      }

      return batch;
    });

    revalidatePath('/batches');
    revalidatePath('/inventory/raw-materials');
    revalidatePath('/inventory/finished-goods');
    revalidatePath('/');
    return { success: true, batchId: createdBatch.id };
  } catch (error) {
    console.error('Error creating batch:', error);
    return { success: false, error: 'Ocurrió un error al crear el lote de producción.' };
  }
}

export async function advanceBatchStageAction(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const notes = (formData.get('notes') as string)?.trim() || '';

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { logs: true },
    });

    if (!batch) {
      return { success: false, error: 'Lote no encontrado.' };
    }

    if (batch.currentStage >= 6) {
      return { success: false, error: 'El lote ya está en la etapa final de embotellado.' };
    }

    const nextStageNum = batch.currentStage + 1;
    const nextStageDef = getStageByNumber(nextStageNum);
    const now = new Date();

    // Calculate next stage target date
    const durationDays = nextStageDef?.durationDays || 1;
    const newTargetDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // Complete current stage log
      const currentLog = await tx.batchLog.findFirst({
        where: { batchId: batch.id, stageNumber: batch.currentStage, completedAt: null },
      });

      if (currentLog) {
        await tx.batchLog.update({
          where: { id: currentLog.id },
          data: {
            completedAt: now,
            notes: notes ? `${currentLog.notes || ''} | Cierre: ${notes}` : currentLog.notes,
          },
        });
      }

      // Create next stage log
      await tx.batchLog.create({
        data: {
          batchId: batch.id,
          stageNumber: nextStageNum,
          stageName: nextStageDef?.name || `Etapa ${nextStageNum}`,
          startedAt: now,
          notes: notes || null,
        },
      });

      // Update batch
      await tx.batch.update({
        where: { id: batch.id },
        data: {
          currentStage: nextStageNum,
          stageTargetDate: newTargetDate,
        },
      });
    });

    revalidatePath(`/batches/${batchId}`);
    revalidatePath('/batches');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error advancing batch stage:', error);
    return { success: false, error: 'Error al avanzar la etapa del lote.' };
  }
}

export async function completeAndBottleBatchAction(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const actualBottles = parseInt(formData.get('actualBottles') as string, 10);
    const finalGravity = parseFloat(formData.get('finalGravity') as string) || null;
    const notes = (formData.get('notes') as string) || '';

    if (!batchId || isNaN(actualBottles) || actualBottles <= 0) {
      return { success: false, error: 'Debes ingresar un número válido de botellas producidas.' };
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        recipe: {
          include: { finishedGoods: true },
        },
        finishedGood: true,
      },
    });

    if (!batch) {
      return { success: false, error: 'Lote no encontrado.' };
    }

    // Determine target finished good
    let finishedGood = batch.finishedGood;
    if (!finishedGood && batch.recipe.finishedGoods.length > 0) {
      finishedGood = batch.recipe.finishedGoods[0];
    }

    // If still no finished good exists for this recipe, find or create one based on recipe name
    if (!finishedGood) {
      finishedGood = await prisma.finishedGood.findFirst({
        where: { name: { contains: batch.recipe.name.replace('20L', '').trim() } },
      });
    }

    if (!finishedGood) {
      finishedGood = await prisma.finishedGood.create({
        data: {
          name: batch.recipe.name.replace('20L', '').trim() || 'Hidromiel Artesanal',
          format: 'Botella 330ml',
          stock: 0,
          unitPrice: 4.50,
          recipeId: batch.recipeId,
        },
      });
    }

    // Packaging materials to deduct:
    // 1. Botellas de 330ml
    // 2. Chapas Corona
    // 3. Etiquetas
    const packagingBottles = await prisma.rawMaterial.findFirst({
      where: {
        category: 'PACKAGING',
        name: { contains: 'Botella' },
      },
    });

    const packagingCaps = await prisma.rawMaterial.findFirst({
      where: {
        category: 'PACKAGING',
        name: { contains: 'Chapa' },
      },
    });

    // Try finding specific label or general label
    const recipeKeywords = batch.recipe.name.toLowerCase();
    let packagingLabels = await prisma.rawMaterial.findFirst({
      where: {
        category: 'PACKAGING',
        name: { contains: 'Etiqueta' },
        AND: recipeKeywords.includes('fruto')
          ? { name: { contains: 'Frutos' } }
          : { name: { contains: 'Tradicional' } },
      },
    });

    if (!packagingLabels) {
      packagingLabels = await prisma.rawMaterial.findFirst({
        where: {
          category: 'PACKAGING',
          name: { contains: 'Etiqueta' },
        },
      });
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Mark batch completed
      await tx.batch.update({
        where: { id: batch.id },
        data: {
          status: 'COMPLETED',
          currentStage: 6,
          actualBottlesProduced: actualBottles,
          finishedGoodId: finishedGood.id,
          stageTargetDate: null,
          notes: notes ? `${batch.notes || ''} | Embotellado: ${notes}` : batch.notes,
        },
      });

      // 2. Close final stage log
      const lastLog = await tx.batchLog.findFirst({
        where: { batchId: batch.id, stageNumber: 6, completedAt: null },
      });
      if (lastLog) {
        await tx.batchLog.update({
          where: { id: lastLog.id },
          data: {
            completedAt: now,
            densityFG: finalGravity,
            notes: `Embotellado finalizado: ${actualBottles} botellas obtenidas. ${notes}`,
          },
        });
      }

      // 3. Add to Finished Goods Inventory
      const prevFgStock = finishedGood.stock;
      const newFgStock = prevFgStock + actualBottles;

      await tx.finishedGood.update({
        where: { id: finishedGood.id },
        data: { stock: newFgStock },
      });

      await tx.inventoryMovement.create({
        data: {
          itemType: 'FINISHED_GOOD',
          finishedGoodId: finishedGood.id,
          movementType: 'PRODUCTION_YIELD',
          quantity: actualBottles,
          previousStock: prevFgStock,
          newStock: newFgStock,
          referenceId: batch.id,
          notes: `Lote ${batch.batchNumber} completado (${actualBottles} botellas 330ml)`,
        },
      });

      // 4. Deduct packaging materials (bottles, caps, labels)
      const packagingItemsToDeduct = [
        { item: packagingBottles, name: 'botellas vacías' },
        { item: packagingCaps, name: 'chapas' },
        { item: packagingLabels, name: 'etiquetas' },
      ];

      for (const pkg of packagingItemsToDeduct) {
        if (pkg.item) {
          const prevStock = pkg.item.stock;
          const newStock = Math.max(0, prevStock - actualBottles);

          await tx.rawMaterial.update({
            where: { id: pkg.item.id },
            data: { stock: newStock },
          });

          await tx.inventoryMovement.create({
            data: {
              itemType: 'RAW_MATERIAL',
              rawMaterialId: pkg.item.id,
              movementType: 'PACKAGING_USE',
              quantity: -actualBottles,
              previousStock: prevStock,
              newStock,
              referenceId: batch.id,
              notes: `Empaque consumido para ${actualBottles} botellas del lote ${batch.batchNumber}`,
            },
          });
        }
      }
    });

    revalidatePath(`/batches/${batchId}`);
    revalidatePath('/batches');
    revalidatePath('/inventory/finished-goods');
    revalidatePath('/inventory/raw-materials');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error completing and bottling batch:', error);
    return { success: false, error: 'Ocurrió un error al registrar el embotellado.' };
  }
}
