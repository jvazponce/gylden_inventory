const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDemoBatches() {
  const recipe1 = await prisma.recipe.findFirst({ where: { name: 'Gylden Tradicional 20L' } });
  const recipe2 = await prisma.recipe.findFirst({ where: { name: { contains: 'Frutos' } } });
  const customer = await prisma.customer.findFirst();
  const fg1 = await prisma.finishedGood.findFirst({ where: { id: 'fg-tradicional' } });

  const now = new Date();

  // 1. Lote que requiere cambio HOY
  const existingBatch1 = await prisma.batch.findUnique({ where: { batchNumber: 'LOTE-2026-001' } });
  if (!existingBatch1 && recipe1) {
    const todayTarget = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago today
    await prisma.batch.create({
      data: {
        batchNumber: 'LOTE-2026-001',
        recipeId: recipe1.id,
        finishedGoodId: fg1 ? fg1.id : null,
        volumeLiters: 20,
        currentStage: 1, // Base y 1ra fermentación
        status: 'IN_PROGRESS',
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        stageTargetDate: todayTarget,
        estimatedEndDate: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
        notes: 'Fermentación vigorosa, listo para verificar densidad y pasar a Etapa 2.',
        logs: {
          create: {
            stageNumber: 1,
            stageName: 'Preparación de base y 1ra fermentación',
            startedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            densityOG: 1.110,
            temperature: 18.0,
            notes: 'Inoculación limpia con Lalvin D-47.',
          },
        },
      },
    });
    console.log('Batch 1 (needs change TODAY) created.');
  }

  // 2. Lote que requiere cambio MAÑANA (1 día de antelación)
  const existingBatch2 = await prisma.batch.findUnique({ where: { batchNumber: 'LOTE-2026-002' } });
  if (!existingBatch2 && recipe2) {
    const tomorrowTarget = new Date(now.getTime() + 20 * 60 * 60 * 1000); // in 20 hours (tomorrow)
    await prisma.batch.create({
      data: {
        batchNumber: 'LOTE-2026-002',
        recipeId: recipe2.id,
        volumeLiters: 40,
        currentStage: 2, // Agregado de frutas y 2da fermentación
        status: 'IN_PROGRESS',
        startDate: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
        stageTargetDate: tomorrowTarget,
        estimatedEndDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        notes: 'Segunda fermentación con frutos rojos en curso, mañana corresponde clarificar.',
        logs: {
          create: [
            {
              stageNumber: 1,
              stageName: 'Preparación de base y 1ra fermentación',
              startedAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
              completedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
              densityOG: 1.115,
              densityFG: 1.025,
              temperature: 18.5,
              notes: 'Primera etapa completada sin contratiempos.',
            },
            {
              stageNumber: 2,
              stageName: 'Agregado de frutas y 2da fermentación',
              startedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
              densityOG: 1.025,
              temperature: 19.0,
              notes: 'Frutas incorporadas en maceración.',
            },
          ],
        },
      },
    });
    console.log('Batch 2 (needs change TOMORROW) created.');
  }

  // 3. Envío de muestra
  const existingShipment = await prisma.shipment.findFirst();
  if (!existingShipment && customer && fg1) {
    await prisma.shipment.create({
      data: {
        shipmentNumber: 'ENV-2026-001',
        customerId: customer.id,
        shipmentDate: new Date(),
        deliveryStatus: 'PENDING',
        totalExpected: 108.0,
        totalPaid: 50.0,
        paymentStatus: 'PARTIAL',
        notes: 'Entregar antes de las 13:00 hrs. Cobrar resto contra entrega.',
        items: {
          create: {
            finishedGoodId: fg1.id,
            quantity: 24,
            unitPrice: 4.5,
            subtotal: 108.0,
          },
        },
      },
    });
    console.log('Sample shipment created.');
  }

  console.log('Demo batches and shipment populated!');
}

seedDemoBatches()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
